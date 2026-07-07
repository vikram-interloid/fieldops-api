import { Module } from '@nestjs/common';

import { ServiceCasesController } from './controllers/service-cases.controller';
import { ServiceCasesService } from './services/service-cases.service';
import { ServiceCasesRepository } from './repositories/service-cases.repository';

@Module({
    controllers: [ServiceCasesController],
    providers: [ServiceCasesRepository, ServiceCasesService],
})
export class ServiceCaseModule {}
