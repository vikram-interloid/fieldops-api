import { Module } from '@nestjs/common';

import { OperatorsController } from './controllers/operators.controller';
import { OperatorsService } from './services/operators.service';
import { OperatorsRepository } from './repositories/operators.repository';

@Module({
    controllers: [OperatorsController],
    providers: [OperatorsRepository, OperatorsService],
})
export class OperatorModule {}
