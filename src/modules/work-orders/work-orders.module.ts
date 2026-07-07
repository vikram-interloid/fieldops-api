import { Module } from '@nestjs/common';

import { WorkOrdersController } from './controllers/work-orders.controller';
import { WorkOrdersService } from './services/work-orders.service';
import { WorkOrdersRepository } from './repositories/work-orders.repository';

@Module({
    controllers: [WorkOrdersController],
    providers: [WorkOrdersRepository, WorkOrdersService],
})
export class WorkOrderModule {}
