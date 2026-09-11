import { randomUUID } from 'node:crypto';

import {
    BadRequestException,
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

import { UploadImageDto } from '../dto/upload-image.dto';
import { UploadedImageResponse } from '../responses/uploaded-image.response';
import { detectImageType } from '../utils/detect-image-type';
import {
    DEFAULT_UPLOAD_FOLDER,
    MAX_IMAGE_BYTES,
    UPLOAD_MESSAGES,
} from '../constants/upload.constants';

/** `data:image/png;base64,<payload>` — the prefix is advisory, not trusted. */
const DATA_URL_PATTERN = /^data:[^;,]*;base64,/i;

const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

@Injectable()
export class UploadsService {
    private readonly logger = new Logger(UploadsService.name);

    constructor(
        @Inject(STORAGE_PROVIDER)
        private readonly storageProvider: StorageProvider,
        private readonly prisma: PrismaService,
    ) {}

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
            const url = await this.storageProvider.put({
                key,
                body: buffer,
                contentType: imageType.mime,
            });

            return {
                url,
                key,
                contentType: imageType.mime,
                size: buffer.length,
            };
        } catch (error) {
            // The bucket being unreachable or misconfigured is our problem, not
            // the caller's — don't leak the AWS error to the client.
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
     * Strips an optional `data:` prefix and decodes. `Buffer.from(…, 'base64')`
     * silently drops invalid characters, so the payload is checked first —
     * otherwise garbage would decode into a short buffer and fail later with a
     * confusing "unsupported format".
     */
    private decode(content: string): Buffer {
        const payload = content
            .replace(DATA_URL_PATTERN, '')
            .replace(/\s/g, '');

        if (
            !payload ||
            payload.length % 4 !== 0 ||
            !BASE64_PATTERN.test(payload)
        ) {
            throw new BadRequestException(UPLOAD_MESSAGES.INVALID_BASE64);
        }

        return Buffer.from(payload, 'base64');
    }

    /**
     * Uploads are filed under the caller's organization so the bucket mirrors
     * how the rest of the data is partitioned.
     */
    private async resolveOrganizationId(userId: string): Promise<string> {
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
