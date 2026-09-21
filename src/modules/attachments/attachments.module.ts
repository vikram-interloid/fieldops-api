import { Module } from '@nestjs/common';

import { StorageModule } from 'src/core/storage/storage.module';
import { UploadModule } from 'src/modules/uploads/uploads.module';

import { AttachmentsController } from './controllers/attachments.controller';
import { AttachmentsService } from './services/attachments.service';

@Module({
  imports: [StorageModule, UploadModule],
  controllers: [AttachmentsController],
  providers: [AttachmentsService],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}
