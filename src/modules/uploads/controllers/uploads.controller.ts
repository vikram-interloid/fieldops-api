import {
  Body,
  Controller,
  Get,
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

import { UploadsService } from '../services/uploads.service';
import { UploadImageDto } from '../dto/upload-image.dto';
import { SignBatchDto } from '../dto/sign-batch.dto';
import type { UploadFolder } from '../constants/upload.constants';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  /**
   * Upload base64 encoded image (e.g. from canvas or profile photo crop).
   */
  @Post('image')
  uploadImage(@CurrentUser() user: AuthUser, @Body() dto: UploadImageDto) {
    return this.uploadsService.uploadImage(user.userId, dto);
  }

  /**
   * Upload standard file (image or attachment document) via multipart/form-data.
   */
  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: UploadFolder,
  ) {
    return this.uploadsService.uploadFile(user.userId, file, folder);
  }

  /**
   * Get CloudFront signed URL for an S3 key after verifying tenant access.
   */
  @Get('signed-url')
  getSignedUrl(
    @CurrentUser() user: AuthUser,
    @Query('key') key: string,
    @Query('expiresIn') expiresIn?: string,
  ) {
    const expiresInSec = expiresIn ? parseInt(expiresIn, 10) : undefined;
    return this.uploadsService.getSignedUrl(user.userId, key, expiresInSec);
  }

  /**
   * Batch sign multiple S3 keys at once after verifying tenant access.
   */
  @Post('signed-urls')
  signBatch(
    @CurrentUser() user: AuthUser,
    @Body() dto: SignBatchDto,
  ) {
    return this.uploadsService.signBatch(user.userId, dto.keys, dto.expiresInSeconds);
  }
}
