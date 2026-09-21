import { Module } from '@nestjs/common';

import { TableViewsController } from './controllers/table-views.controller';
import { TableViewsService } from './services/table-views.service';

@Module({
  controllers: [TableViewsController],
  providers: [TableViewsService],
  exports: [TableViewsService],
})
export class TableViewsModule {}
