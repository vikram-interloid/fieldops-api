import { Module } from '@nestjs/common';

import { PartsController } from './controllers/parts.controller';
import { PartsService } from './services/parts.service';
import { PartsRepository } from './repositories/parts.repository';

@Module({
  controllers: [PartsController],
  providers: [PartsRepository, PartsService],
})
export class InventoryModule {}
