import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import type { AuthUser } from 'src/modules/auth/interfaces/auth-user.interface';

import { AttachmentsService } from '../services/attachments.service';
import { UploadAttachmentDto } from '../dto/upload-attachment.dto';
import { QueryAttachmentsDto } from '../dto/query-attachments.dto';

@Controller('attachments')
@UseGuards(JwtAuthGuard)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  /**
   * Upload an attachment file for a case, work order, asset, or user.
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadAttachmentDto,
  ) {
    return this.attachmentsService.uploadAttachment(user.userId, file, dto);
  }

  /**
   * List attachments for a given entity (case, work order, asset, user) with CloudFront signed URLs.
   */
  @Get()
  find(@CurrentUser() user: AuthUser, @Query() query: QueryAttachmentsDto) {
    return this.attachmentsService.findAttachments(user.userId, query);
  }

  /**
   * Get a specific attachment by ID.
   */
  @Get(':id')
  getById(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.attachmentsService.getAttachmentById(user.userId, id);
  }

  /**
   * Delete an attachment from S3 and database.
   */
  @Delete(':id')
  delete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.attachmentsService.deleteAttachment(user.userId, id);
  }
}
