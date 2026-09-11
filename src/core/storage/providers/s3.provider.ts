import {
    DeleteObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PutObjectOptions } from '../interfaces/put-object-options.interface';
import { StorageProvider } from '../interfaces/storage-provider.interface';

const DEFAULT_CACHE_CONTROL = 'public, max-age=31536000, immutable';

@Injectable()
export class S3Provider implements StorageProvider {
    private readonly logger = new Logger(S3Provider.name);

    private readonly client: S3Client;

    private readonly bucket: string;

    private readonly region: string;

    /**
     * Optional CDN / custom-domain origin the objects are served from. When
     * unset we fall back to the virtual-hosted-style S3 URL.
     */
    private readonly publicBaseUrl?: string;

    constructor(private readonly configService: ConfigService) {
        this.bucket = this.requireConfig('S3_BUCKET');
        this.region = this.requireConfig('AWS_REGION');

        this.publicBaseUrl = this.configService
            .get<string>('S3_PUBLIC_BASE_URL')
            ?.replace(/\/+$/, '');

        // Static keys are only used when they are actually configured, so the
        // same code runs under an IAM task role / instance profile in prod.
        const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
        const secretAccessKey = this.configService.get<string>(
            'AWS_SECRET_ACCESS_KEY',
        );

        this.client = new S3Client({
            region: this.region,
            credentials:
                accessKeyId && secretAccessKey
                    ? { accessKeyId, secretAccessKey }
                    : undefined,
        });
    }

    async put(options: PutObjectOptions): Promise<string> {
        await this.client.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: options.key,
                Body: options.body,
                ContentType: options.contentType,
                CacheControl: options.cacheControl ?? DEFAULT_CACHE_CONTROL,
            }),
        );

        this.logger.log(`Stored object ${options.key}`);

        return this.buildUrl(options.key);
    }

    async delete(key: string): Promise<void> {
        await this.client.send(
            new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: key,
            }),
        );

        this.logger.log(`Deleted object ${key}`);
    }

    /**
     * `getOrThrow` only rejects `undefined`, so a present-but-blank key (a very
     * easy .env mistake) would sail through and fail later as a confusing
     * AWS error. Fail at boot instead.
     */
    private requireConfig(key: string): string {
        const value = this.configService.get<string>(key)?.trim();

        if (!value) {
            throw new Error(`Missing required configuration: ${key}`);
        }

        return value;
    }

    private buildUrl(key: string): string {
        const encoded = key.split('/').map(encodeURIComponent).join('/');

        if (this.publicBaseUrl) {
            return `${this.publicBaseUrl}/${encoded}`;
        }

        return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${encoded}`;
    }
}
