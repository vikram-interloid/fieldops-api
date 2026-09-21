import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CloudfrontSignedCookiesOutput,
  getSignedCookies,
  getSignedUrl,
} from '@aws-sdk/cloudfront-signer';
import * as fs from 'fs';

@Injectable()
export class CloudFrontSignerService {
  private readonly logger = new Logger(CloudFrontSignerService.name);

  private readonly domain?: string;
  private readonly keyPairId?: string;
  private readonly privateKey?: string;
  private readonly defaultExpiresIn: number;

  constructor(private readonly configService: ConfigService) {
    const rawDomain =
      this.configService.get<string>('CLOUDFRONT_DOMAIN') ??
      this.configService.get<string>('CLOUDFRONT_BASE_URL');
    this.domain = rawDomain?.replace(/^https?:\/\//, '').replace(/\/+$/, '');

    this.keyPairId = this.configService
      .get<string>('CLOUDFRONT_KEY_PAIR_ID')
      ?.trim();
    this.privateKey = this.resolvePrivateKey();

    const expires = Number(
      this.configService.get<string>('CLOUDFRONT_EXPIRES_IN_SECONDS'),
    );
    this.defaultExpiresIn =
      Number.isFinite(expires) && expires > 0 ? expires : 3600;

    if (this.isConfigured()) {
      this.logger.log(
        `CloudFront signer initialized for domain: ${this.domain} (keyPairId: ${this.keyPairId})`,
      );
    } else {
      this.logger.warn(
        'CloudFront signer is not fully configured (missing CLOUDFRONT_DOMAIN, CLOUDFRONT_KEY_PAIR_ID, or CLOUDFRONT_PRIVATE_KEY). Falling back to unsigned URLs.',
      );
    }
  }

  isConfigured(): boolean {
    return Boolean(this.domain && this.keyPairId && this.privateKey);
  }

  private resolvePrivateKey(): string | undefined {
    const keyPath = this.configService
      .get<string>('CLOUDFRONT_PRIVATE_KEY_PATH')
      ?.trim();
    if (keyPath && fs.existsSync(keyPath)) {
      try {
        return fs.readFileSync(keyPath, 'utf8');
      } catch (err) {
        this.logger.error(
          `Failed to read CloudFront private key from path: ${keyPath}`,
          err,
        );
      }
    }

    const rawKey = this.configService
      .get<string>('CLOUDFRONT_PRIVATE_KEY')
      ?.trim();
    if (!rawKey) return undefined;

    if (!rawKey.includes('-----BEGIN') && rawKey.length > 64) {
      try {
        const decoded = Buffer.from(rawKey, 'base64').toString('utf8');
        if (decoded.includes('-----BEGIN')) {
          return decoded;
        }
      } catch {
        // Not a base64 encoded PEM string, continue with rawKey
      }
    }

    return rawKey.replace(/\\n/g, '\n');
  }

  getSignedUrl(keyOrUrl: string, expiresInSeconds?: number): string {
    if (!keyOrUrl) return '';

    let key = keyOrUrl.trim();
    if (key.startsWith('http://') || key.startsWith('https://')) {
      try {
        const parsed = new URL(key);
        key = parsed.pathname.replace(/^\/+/, '');
      } catch {
        // Failed to parse as URL, treat as raw path key
      }
    } else {
      key = key.replace(/^\/+/, '');
    }

    const encodedKey = key
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');

    const baseUrl = this.domain
      ? `https://${this.domain}/${encodedKey}`
      : this.buildFallbackUrl(key);

    if (!this.isConfigured()) {
      return baseUrl;
    }

    const expirySec = expiresInSeconds ?? this.defaultExpiresIn;
    const dateLessThan = new Date(Date.now() + expirySec * 1000).toISOString();

    try {
      return getSignedUrl({
        url: baseUrl,
        keyPairId: this.keyPairId!,
        dateLessThan,
        privateKey: this.privateKey!,
      });
    } catch (error) {
      this.logger.error(`Failed to sign CloudFront URL for key: ${key}`, error);
      return baseUrl;
    }
  }

  signKey(key: string, expiresInSeconds?: number): string {
    return this.getSignedUrl(key, expiresInSeconds);
  }

  signAttachment<T extends { key: string }>(
    attachment: T,
    expiresInSeconds?: number,
  ): T & { signedUrl: string } {
    return {
      ...attachment,
      signedUrl: this.getSignedUrl(attachment.key, expiresInSeconds),
    };
  }

  signAttachments<T extends { key: string }>(
    attachments: T[],
    expiresInSeconds?: number,
  ): (T & { signedUrl: string })[] {
    return attachments.map((att) => this.signAttachment(att, expiresInSeconds));
  }

  /**
   * Generates CloudFront signed cookies for domain-wide authenticated access.
   */
  getSignedCookies(
    pathPattern: string = '*',
    expiresInSeconds?: number,
  ): CloudfrontSignedCookiesOutput | null {
    if (!this.isConfigured()) return null;

    const expirySec = expiresInSeconds ?? this.defaultExpiresIn;
    const dateLessThan = new Date(Date.now() + expirySec * 1000).toISOString();
    const url = `https://${this.domain}/${pathPattern.replace(/^\/+/, '')}`;

    try {
      return getSignedCookies({
        url,
        keyPairId: this.keyPairId!,
        dateLessThan,
        privateKey: this.privateKey!,
      });
    } catch (error) {
      this.logger.error('Failed to generate CloudFront signed cookies', error);
      return null;
    }
  }

  private buildFallbackUrl(key: string): string {
    const bucket = this.configService.get<string>('S3_BUCKET');
    const region = this.configService.get<string>('AWS_REGION') ?? 'ap-south-2';
    const publicBaseUrl = this.configService
      .get<string>('S3_PUBLIC_BASE_URL')
      ?.replace(/\/+$/, '');

    const encoded = key.split('/').map(encodeURIComponent).join('/');

    if (publicBaseUrl) {
      return `${publicBaseUrl}/${encoded}`;
    }
    if (bucket) {
      return `https://${bucket}.s3.${region}.amazonaws.com/${encoded}`;
    }
    return `/${encoded}`;
  }
}
