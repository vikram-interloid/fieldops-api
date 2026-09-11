import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import type { AuthUser } from 'src/modules/auth/interfaces/auth-user.interface';

import { UploadsService } from '../services/uploads.service';
import { UploadImageDto } from '../dto/upload-image.dto';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
    constructor(private readonly uploadsService: UploadsService) {}

    @Post('image')
    uploadImage(
        @CurrentUser() user: AuthUser,
        @Body() dto: UploadImageDto,
    ) {
        return this.uploadsService.uploadImage(user.userId, dto);
    }
}
