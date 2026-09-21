import { Module } from '@nestjs/common';

import { TechniciansController } from './controllers/technicians.controller';
import { TechniciansService } from './services/technicians.service';
import { TechniciansRepository } from './repositories/technicians.repository';

@Module({
  controllers: [TechniciansController],
  providers: [TechniciansRepository, TechniciansService],
})
export class TechnicianModule {}
