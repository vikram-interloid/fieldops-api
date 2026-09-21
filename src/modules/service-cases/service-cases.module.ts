import { Module } from '@nestjs/common';

import { ServiceCasesController } from './controllers/service-cases.controller';
import { ServiceCasesService } from './services/service-cases.service';
import { ServiceCasesRepository } from './repositories/service-cases.repository';

import { StorageModule } from 'src/core/storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [ServiceCasesController],
  providers: [ServiceCasesRepository, ServiceCasesService],
})
export class ServiceCaseModule {}
