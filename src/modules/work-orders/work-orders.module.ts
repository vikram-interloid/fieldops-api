import { Module } from '@nestjs/common';

import { WorkOrdersController } from './controllers/work-orders.controller';
import { WorkOrdersService } from './services/work-orders.service';
import { WorkOrdersRepository } from './repositories/work-orders.repository';

import { StorageModule } from 'src/core/storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersRepository, WorkOrdersService],
})
export class WorkOrderModule {}
