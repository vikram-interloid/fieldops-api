import { Module } from '@nestjs/common';

import { STORAGE_PROVIDER } from './constants/storage.constants';
import { S3Provider } from './providers/s3.provider';

@Module({
    providers: [
        {
            provide: STORAGE_PROVIDER,
            useClass: S3Provider,
        },
    ],
    exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
