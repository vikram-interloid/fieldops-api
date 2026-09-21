import { Module } from '@nestjs/common';

import { StorageModule } from 'src/core/storage/storage.module';
import { UploadsController } from './controllers/uploads.controller';
import { UploadsService } from './services/uploads.service';

@Module({
  imports: [StorageModule],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadModule {}
