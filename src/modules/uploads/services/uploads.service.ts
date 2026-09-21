import { randomUUID } from 'node:crypto';
import * as path from 'node:path';

import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';

import { PrismaService } from 'src/core/database/prisma.service';
import { STORAGE_PROVIDER } from 'src/core/storage/constants/storage.constants';
import type { StorageProvider } from 'src/core/storage/interfaces/storage-provider.interface';
import { CloudFrontSignerService } from 'src/core/storage/services/cloudfront-signer.service';

import { UploadImageDto } from '../dto/upload-image.dto';
import { UploadedImageResponse } from '../responses/uploaded-image.response';
import { detectImageType } from '../utils/detect-image-type';
import {
  DEFAULT_UPLOAD_FOLDER,
  MAX_ATTACHMENT_BYTES,
  MAX_IMAGE_BYTES,
  UPLOAD_MESSAGES,
  UploadFolder,
} from '../constants/upload.constants';

const DATA_URL_PATTERN = /^data:[^;,]*;base64,/i;
const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

const DISALLOWED_EXTENSIONS = new Set([
  'exe', 'bat', 'cmd', 'sh', 'php', 'cgi', 'py', 'rb', 'pl', 'jsp', 'asp', 'aspx',
  'html', 'htm', 'js', 'mjs', 'vbs', 'com', 'scr', 'msi', 'jar',
]);

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: StorageProvider,
    private readonly cloudFrontSigner: CloudFrontSignerService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Uploads a base64 encoded image (e.g. from canvas or photo upload).
   * Returns the S3 key and the CloudFront signed URL.
   */
  async uploadImage(
    userId: string,
    dto: UploadImageDto,
  ): Promise<UploadedImageResponse> {
    const buffer = this.decode(dto.content);

    if (buffer.length > MAX_IMAGE_BYTES) {
      throw new PayloadTooLargeException(UPLOAD_MESSAGES.TOO_LARGE);
    }

    const imageType = detectImageType(buffer);

    if (!imageType) {
      throw new UnsupportedMediaTypeException(
        UPLOAD_MESSAGES.UNSUPPORTED_TYPE,
      );
    }

    const organizationId = await this.resolveOrganizationId(userId);
    const folder = dto.folder ?? DEFAULT_UPLOAD_FOLDER;
    const key = `${folder}/${organizationId}/${randomUUID()}.${imageType.extension}`;

    try {
      await this.storageProvider.put({
        key,
        body: buffer,
        contentType: imageType.mime,
        contentDisposition: 'inline',
      });

      // CloudFront signed URL
      const url = this.cloudFrontSigner.getSignedUrl(key);

      return {
        url,
        key,
        contentType: imageType.mime,
        size: buffer.length,
      };
    } catch (error) {
      this.logger.error(
        `Failed to store ${key}`,
        error instanceof Error ? error.stack : String(error),
      );

      throw new InternalServerErrorException(
        UPLOAD_MESSAGES.UPLOAD_FAILED,
      );
    }
  }

  /**
   * Uploads a multipart/form-data file directly with strict type validation.
   * Safe images are served inline; documents/spreadsheets/zips are served as forced attachment downloads.
   */
  async uploadFile(
    userId: string,
    file: Express.Multer.File,
    folder: UploadFolder = DEFAULT_UPLOAD_FOLDER,
  ): Promise<{
    url: string;
    key: string;
    fileName: string;
    contentType: string;
    size: number;
  }> {
    if (!file || !file.buffer) {
      throw new BadRequestException(UPLOAD_MESSAGES.FILE_REQUIRED);
    }

    if (file.size > MAX_ATTACHMENT_BYTES) {
      throw new PayloadTooLargeException(
        `File exceeds the ${MAX_ATTACHMENT_BYTES / (1024 * 1024)}MB limit`,
      );
    }

    const ext =
      path.extname(file.originalname).toLowerCase().replace(/^\./, '') || 'bin';

    if (DISALLOWED_EXTENSIONS.has(ext)) {
      throw new BadRequestException(
        `Uploading executable or script files (.${ext}) is prohibited for security reasons`,
      );
    }

    const organizationId = await this.resolveOrganizationId(userId);
    const safeBaseName = path
      .basename(file.originalname, `.${ext}`)
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 60);

    const key = `${folder}/${organizationId}/${randomUUID()}_${safeBaseName}.${ext}`;
    const contentType = file.mimetype || 'application/octet-stream';

    const isInlineImage = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(contentType);
    const contentDisposition = isInlineImage
      ? 'inline'
      : `attachment; filename="${safeBaseName}.${ext}"`;

    try {
      await this.storageProvider.put({
        key,
        body: file.buffer,
        contentType,
        contentDisposition,
      });

      const url = this.cloudFrontSigner.getSignedUrl(key);

      return {
        url,
        key,
        fileName: file.originalname,
        contentType,
        size: file.size,
      };
    } catch (error) {
      this.logger.error(
        `Failed to store file ${key}`,
        error instanceof Error ? error.stack : String(error),
      );

      throw new InternalServerErrorException(UPLOAD_MESSAGES.UPLOAD_FAILED);
    }
  }

  /**
   * Generates a CloudFront signed URL after verifying caller's tenant ownership.
   */
  async getSignedUrl(
    userId: string,
    key: string,
    expiresInSeconds?: number,
  ): Promise<{ key: string; signedUrl: string }> {
    if (!key) {
      throw new BadRequestException('Key parameter is required');
    }

    const organizationId = await this.resolveOrganizationId(userId);
    await this.assertKeyBelongsToOrg(organizationId, key);

    const signedUrl = this.cloudFrontSigner.getSignedUrl(key, expiresInSeconds);
    return { key, signedUrl };
  }

  /**
   * Signs multiple keys in batch, enforcing tenant isolation on every key.
   */
  async signBatch(
    userId: string,
    keys: string[],
    expiresInSeconds?: number,
  ): Promise<Record<string, string>> {
    const organizationId = await this.resolveOrganizationId(userId);
    const result: Record<string, string> = {};

    for (const key of keys) {
      if (key) {
        await this.assertKeyBelongsToOrg(organizationId, key);
        result[key] = this.cloudFrontSigner.getSignedUrl(key, expiresInSeconds);
      }
    }
    return result;
  }

  /**
   * Deletes an object from S3.
   */
  async deleteObject(key: string): Promise<void> {
    if (!key) return;
    try {
      await this.storageProvider.delete(key);
    } catch (error) {
      this.logger.error(`Failed to delete S3 object: ${key}`, error);
    }
  }

  private async assertKeyBelongsToOrg(
    organizationId: string,
    key: string,
  ): Promise<void> {
    const normalizedKey = key.replace(/^\/+/, '');
    const segments = normalizedKey.split('/');

    // Keys generated by this platform are folder/organizationId/...
    if (segments.length >= 2 && segments[1] === organizationId) {
      return;
    }

    // Also check Attachment records
    const attachment = await this.prisma.attachment.findFirst({
      where: { key: normalizedKey, organizationId },
      select: { id: true },
    });

    if (attachment) {
      return;
    }

    throw new ForbiddenException(
      'You do not have permission to generate signed URLs for this resource',
    );
  }

  private decode(content: string): Buffer {
    const payload = content.replace(DATA_URL_PATTERN, '').replace(/\s/g, '');

    if (
      !payload ||
      payload.length % 4 !== 0 ||
      !BASE64_PATTERN.test(payload)
    ) {
      throw new BadRequestException(UPLOAD_MESSAGES.INVALID_BASE64);
    }

    return Buffer.from(payload, 'base64');
  }

  async resolveOrganizationId(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (!user) {
      throw new NotFoundException(
        UPLOAD_MESSAGES.ORGANIZATION_NOT_FOUND,
      );
    }

    return user.organizationId;
  }
}
