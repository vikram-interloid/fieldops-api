import { Injectable, NotFoundException } from '@nestjs/common';

import { WorkOrdersRepository } from '../repositories/work-orders.repository';
import { WorkOrderResponse } from '../responses/work-order.response';
import { CreateWorkOrderDto } from '../dto/create-work-order.dto';
import { UpdateWorkOrderDto } from '../dto/update-work-order.dto';
import { SetStatusDto } from '../dto/set-status.dto';
import { AssignDto } from '../dto/assign.dto';
import { WORK_ORDER_MESSAGES } from '../constants/work-order.constants';

@Injectable()
export class WorkOrdersService {
    constructor(
        private readonly workOrdersRepository: WorkOrdersRepository,
    ) {}

    findAll(userId: number) {
        return this.workOrdersRepository.findAll(userId);
    }

    async findById(userId: number, id: number): Promise<WorkOrderResponse> {
        const workOrder = await this.workOrdersRepository.findById(userId, id);

        if (!workOrder) {
            throw new NotFoundException(WORK_ORDER_MESSAGES.NOT_FOUND);
        }

        return workOrder;
    }

    create(userId: number, dto: CreateWorkOrderDto) {
        return this.workOrdersRepository.create(userId, dto);
    }

    async update(
        userId: number,
        id: number,
        dto: UpdateWorkOrderDto,
    ): Promise<WorkOrderResponse> {
        await this.findById(userId, id);

        return this.workOrdersRepository.update(id, dto);
    }

    async setStatus(
        userId: number,
        id: number,
        dto: SetStatusDto,
    ): Promise<WorkOrderResponse> {
        await this.findById(userId, id);

        return this.workOrdersRepository.setStatus(id, dto.status);
    }

    async assign(
        userId: number,
        id: number,
        dto: AssignDto,
    ): Promise<WorkOrderResponse> {
        await this.findById(userId, id);

        return this.workOrdersRepository.assign(id, dto.technicianId);
    }

    async accept(userId: number, id: number): Promise<WorkOrderResponse> {
        await this.findById(userId, id);

        return this.workOrdersRepository.accept(id);
    }

    async delete(userId: number, id: number): Promise<void> {
        await this.findById(userId, id);

        await this.workOrdersRepository.delete(id);
    }
}
