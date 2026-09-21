import { Module } from '@nestjs/common';

import { AssetsController } from './controllers/assets.controller';
import { AssetsService } from './services/assets.service';
import { AssetsRepository } from './repositories/assets.repository';

import { StorageModule } from 'src/core/storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [AssetsController],
  providers: [AssetsRepository, AssetsService],
})
export class AssetModule {}
