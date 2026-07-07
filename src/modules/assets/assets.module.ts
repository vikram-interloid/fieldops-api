import { Module } from '@nestjs/common';

import { AssetsController } from './controllers/assets.controller';
import { AssetsService } from './services/assets.service';
import { AssetsRepository } from './repositories/assets.repository';

@Module({
    controllers: [AssetsController],
    providers: [AssetsRepository, AssetsService],
})
export class AssetModule {}
