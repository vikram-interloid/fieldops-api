import { Injectable, NotFoundException } from '@nestjs/common';

import { OperatorsRepository } from '../repositories/operators.repository';
import { CreateOperatorDto } from '../dto/create-operator.dto';
import { UpdateOperatorDto } from '../dto/update-operator.dto';
import { CreateServiceAreaDto } from '../dto/create-service-area.dto';
import { OPERATOR_MESSAGES } from '../constants/operator.constants';

@Injectable()
export class OperatorsService {
    constructor(private readonly operatorsRepository: OperatorsRepository) {}

    findAll(userId: number) {
        return this.operatorsRepository.findAll(userId);
    }

    async findById(userId: number, id: number) {
        const operator = await this.operatorsRepository.findById(userId, id);
        if (!operator) {
            throw new NotFoundException(OPERATOR_MESSAGES.NOT_FOUND);
        }
        return operator;
    }

    create(userId: number, dto: CreateOperatorDto) {
        return this.operatorsRepository.create(userId, dto);
    }

    async update(userId: number, id: number, dto: UpdateOperatorDto) {
        await this.findById(userId, id);
        return this.operatorsRepository.update(id, dto);
    }

    async delete(userId: number, id: number): Promise<void> {
        await this.findById(userId, id);
        await this.operatorsRepository.delete(id);
    }

    async addServiceArea(
        userId: number,
        operatorId: number,
        dto: CreateServiceAreaDto,
    ) {
        const operator = await this.operatorsRepository.findOperatorInOrg(
            userId,
            operatorId,
        );
        if (!operator) {
            throw new NotFoundException(OPERATOR_MESSAGES.NOT_FOUND);
        }
        return this.operatorsRepository.createServiceArea(
            operator.organizationId,
            operatorId,
            dto,
        );
    }

    async removeServiceArea(userId: number, areaId: number): Promise<void> {
        const area = await this.operatorsRepository.findServiceAreaInOrg(
            userId,
            areaId,
        );
        if (!area) {
            throw new NotFoundException(OPERATOR_MESSAGES.AREA_NOT_FOUND);
        }
        await this.operatorsRepository.deleteServiceArea(areaId);
    }
}
