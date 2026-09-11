import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import {
    MAX_IMAGE_CONTENT_LENGTH,
    UPLOAD_FOLDERS,
} from '../constants/upload.constants';
import type { UploadFolder } from '../constants/upload.constants';

export class UploadImageDto {
    /**
     * The image as a base64 `data:` URL (what `canvas.toDataURL()` produces)
     * or as a bare base64 string.
     */
    @IsString()
    @IsNotEmpty()
    @MaxLength(MAX_IMAGE_CONTENT_LENGTH)
    content: string;

    @IsOptional()
    @IsString()
    @IsIn(UPLOAD_FOLDERS)
    folder?: UploadFolder;
}
