import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/core/database/prisma.service';
import { CloudFrontSignerService } from 'src/core/storage/services/cloudfront-signer.service';
import { UploadsService } from 'src/modules/uploads/services/uploads.service';
import { UploadFolder } from 'src/modules/uploads/constants/upload.constants';

import { QueryAttachmentsDto } from '../dto/query-attachments.dto';
import { UploadAttachmentDto } from '../dto/upload-attachment.dto';

@Injectable()
export class AttachmentsService {
  private readonly logger = new Logger(AttachmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
    private readonly cloudFrontSigner: CloudFrontSignerService,
  ) {}

  private async resolveUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, organizationId: true, isOrgAdmin: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Uploads a file and registers it as an attachment for a case, work order, asset, or user.
   */
  async uploadAttachment(
    userId: string,
    file: Express.Multer.File,
    dto: UploadAttachmentDto,
  ) {
    const user = await this.resolveUser(userId);

    // Validate that target entity exists within the user's organization
    await this.validateEntityBelongsToOrg(
      user.organizationId,
      dto.entityType,
      dto.entityId,
    );

    let folder: UploadFolder = 'attachments';
    let defaultType = 'attachment';

    switch (dto.entityType) {
      case 'case':
        folder = 'service-cases';
        defaultType = 'case_attachment';
        break;
      case 'work_order':
        folder = 'work-orders';
        defaultType = 'work_order_attachment';
        break;
      case 'asset':
        folder = 'assets';
        defaultType = 'asset_image';
        break;
      case 'user':
        folder = 'avatars';
        defaultType = 'avatar';
        break;
    }

    const uploadResult = await this.uploadsService.uploadFile(
      userId,
      file,
      folder,
    );

    const type = dto.type || defaultType;

    const attachment = await this.prisma.attachment.create({
      data: {
        organizationId: user.organizationId,
        key: uploadResult.key,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.size,
        mimeType: uploadResult.contentType,
        type,
        uploadedById: userId,
        ...(dto.entityType === 'case' && { serviceCaseId: dto.entityId }),
        ...(dto.entityType === 'work_order' && { workOrderId: dto.entityId }),
        ...(dto.entityType === 'asset' && { assetId: dto.entityId }),
        ...(dto.entityType === 'user' && { userId: dto.entityId }),
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // If it's a user avatar, sync user record
    if (
      dto.entityType === 'user' &&
      (type === 'avatar' || type === 'user_avatar')
    ) {
      await this.prisma.user.update({
        where: { id: dto.entityId },
        data: {
          avatarKey: uploadResult.key,
          avatarUrl: uploadResult.url,
        },
      });
    }

    // If it's an asset photo, sync asset record
    if (
      dto.entityType === 'asset' &&
      (type === 'photo' || type === 'asset_image')
    ) {
      await this.prisma.asset.update({
        where: { id: dto.entityId },
        data: {
          photoKey: uploadResult.key,
          photoUrl: uploadResult.url,
        },
      });
    }

    return this.cloudFrontSigner.signAttachment(attachment);
  }

  /**
   * Lists attachments with CloudFront signed URLs for an entity.
   */
  async findAttachments(userId: string, query: QueryAttachmentsDto) {
    const user = await this.resolveUser(userId);

    const where: Record<string, unknown> = {
      organizationId: user.organizationId,
    };

    if (query.serviceCaseId) where.serviceCaseId = query.serviceCaseId;
    if (query.workOrderId) where.workOrderId = query.workOrderId;
    if (query.assetId) where.assetId = query.assetId;
    if (query.userId) where.userId = query.userId;
    if (query.type) where.type = query.type;

    const attachments = await this.prisma.attachment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return this.cloudFrontSigner.signAttachments(attachments);
  }

  /**
   * Gets a single attachment by ID with fresh CloudFront signed URL.
   */
  async getAttachmentById(userId: string, id: string) {
    const user = await this.resolveUser(userId);

    const attachment = await this.prisma.attachment.findFirst({
      where: { id, organizationId: user.organizationId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!attachment) {
      throw new NotFoundException(`Attachment with id ${id} not found`);
    }

    return this.cloudFrontSigner.signAttachment(attachment);
  }

  /**
   * Deletes an attachment from S3 and DB.
   */
  async deleteAttachment(userId: string, id: string) {
    const user = await this.resolveUser(userId);

    const attachment = await this.prisma.attachment.findFirst({
      where: { id, organizationId: user.organizationId },
    });

    if (!attachment) {
      throw new NotFoundException(`Attachment with id ${id} not found`);
    }

    // Delete from S3
    await this.uploadsService.deleteObject(attachment.key);

    // Delete from DB
    await this.prisma.attachment.delete({
      where: { id },
    });

    // Clean up entity key pointers if needed
    if (attachment.userId) {
      await this.prisma.user.updateMany({
        where: { id: attachment.userId, avatarKey: attachment.key },
        data: { avatarKey: null, avatarUrl: null },
      });
    }

    if (attachment.assetId) {
      await this.prisma.asset.updateMany({
        where: { id: attachment.assetId, photoKey: attachment.key },
        data: { photoKey: null, photoUrl: null },
      });
    }

    return { message: 'Attachment deleted successfully', id };
  }

  private async validateEntityBelongsToOrg(
    organizationId: string,
    entityType: string,
    entityId: string,
  ): Promise<void> {
    let exists = false;

    switch (entityType) {
      case 'case': {
        const caseRecord = await this.prisma.serviceCase.findFirst({
          where: { id: entityId, organizationId },
          select: { id: true },
        });
        exists = Boolean(caseRecord);
        break;
      }
      case 'work_order': {
        const woRecord = await this.prisma.workOrder.findFirst({
          where: { id: entityId, organizationId },
          select: { id: true },
        });
        exists = Boolean(woRecord);
        break;
      }
      case 'asset': {
        const assetRecord = await this.prisma.asset.findFirst({
          where: { id: entityId, organizationId },
          select: { id: true },
        });
        exists = Boolean(assetRecord);
        break;
      }
      case 'user': {
        const userRecord = await this.prisma.user.findFirst({
          where: { id: entityId, organizationId },
          select: { id: true },
        });
        exists = Boolean(userRecord);
        break;
      }
      default:
        throw new BadRequestException(`Invalid entityType: ${entityType}`);
    }

    if (!exists) {
      throw new NotFoundException(
        `Entity of type ${entityType} with id ${entityId} does not exist in your organization`,
      );
    }
  }
}
