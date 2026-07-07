import { Module } from '@nestjs/common';

import { SlaController } from './controllers/sla.controller';
import { SlaService } from './services/sla.service';
import { SlaRepository } from './repositories/sla.repository';

@Module({
    controllers: [SlaController],
    providers: [SlaRepository, SlaService],
})
export class SlaModule {}
