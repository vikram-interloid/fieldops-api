import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PutObjectOptions } from '../interfaces/put-object-options.interface';
import { StorageProvider } from '../interfaces/storage-provider.interface';

const DEFAULT_CACHE_CONTROL = 'public, max-age=31536000, immutable';

@Injectable()
export class S3Provider implements StorageProvider {
  private readonly logger = new Logger(S3Provider.name);

  private readonly client?: S3Client;

  private readonly bucket: string;

  private readonly region: string;

  private readonly publicBaseUrl?: string;

  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('S3_BUCKET')?.trim() ?? '';
    this.region =
      this.configService.get<string>('AWS_REGION')?.trim() ?? 'ap-south-2';

    this.publicBaseUrl = this.configService
      .get<string>('S3_PUBLIC_BASE_URL')
      ?.replace(/\/+$/, '');

    const accessKeyId = this.configService
      .get<string>('AWS_ACCESS_KEY_ID')
      ?.trim();
    const secretAccessKey = this.configService
      .get<string>('AWS_SECRET_ACCESS_KEY')
      ?.trim();

    this.isConfigured = Boolean(this.bucket);

    if (this.isConfigured) {
      this.client = new S3Client({
        region: this.region,
        credentials:
          accessKeyId && secretAccessKey
            ? { accessKeyId, secretAccessKey }
            : undefined,
      });
      this.logger.log(
        `S3Provider initialized with bucket: ${this.bucket}, region: ${this.region}`,
      );
    } else {
      this.logger.warn(
        'S3Provider: S3_BUCKET is not set in environment. Upload operations will be disabled until configured.',
      );
    }
  }

  async put(options: PutObjectOptions): Promise<string> {
    this.assertConfigured();

    await this.client!.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: options.key,
        Body: options.body,
        ContentType: options.contentType,
        CacheControl: options.cacheControl ?? DEFAULT_CACHE_CONTROL,
        ContentDisposition: options.contentDisposition,
      }),
    );

    this.logger.log(`Stored object ${options.key}`);

    return this.buildUrl(options.key);
  }

  async delete(key: string): Promise<void> {
    this.assertConfigured();

    await this.client!.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    this.logger.log(`Deleted object ${key}`);
  }

  private assertConfigured(): void {
    if (!this.isConfigured || !this.client) {
      throw new ServiceUnavailableException(
        'S3 storage is not configured. Please set S3_BUCKET in your environment variables.',
      );
    }
  }

  private buildUrl(key: string): string {
    const encoded = key.split('/').map(encodeURIComponent).join('/');

    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl}/${encoded}`;
    }

    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${encoded}`;
  }
}
