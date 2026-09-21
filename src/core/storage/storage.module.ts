import { Module } from '@nestjs/common';

import { STORAGE_PROVIDER } from './constants/storage.constants';
import { S3Provider } from './providers/s3.provider';
import { CloudFrontSignerService } from './services/cloudfront-signer.service';

@Module({
  providers: [
    {
      provide: STORAGE_PROVIDER,
      useClass: S3Provider,
    },
    CloudFrontSignerService,
  ],
  exports: [STORAGE_PROVIDER, CloudFrontSignerService],
})
export class StorageModule {}
