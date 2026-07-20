import { Injectable, NotFoundException } from '@nestjs/common';

import {
    WorkOrdersRepository,
    type WorkOrderActor,
} from '../repositories/work-orders.repository';
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

    findAll(userId: string) {
        return this.workOrdersRepository.findAll(userId);
    }

    async findById(userId: string, id: string): Promise<WorkOrderResponse> {
        const workOrder = await this.workOrdersRepository.findById(userId, id);

        if (!workOrder) {
            throw new NotFoundException(WORK_ORDER_MESSAGES.NOT_FOUND);
        }

        return workOrder;
    }

    async findDetail(userId: string, id: string) {
        const detail = await this.workOrdersRepository.findDetail(userId, id);

        if (!detail) {
            throw new NotFoundException(WORK_ORDER_MESSAGES.NOT_FOUND);
        }

        return detail;
    }

    create(userId: string, dto: CreateWorkOrderDto, actor?: WorkOrderActor) {
        return this.workOrdersRepository.create(userId, dto, actor);
    }

    async update(
        userId: string,
        id: string,
        dto: UpdateWorkOrderDto,
        actor?: WorkOrderActor,
    ): Promise<WorkOrderResponse> {
        await this.findById(userId, id);

        return this.workOrdersRepository.update(id, dto, actor);
    }

    async setStatus(
        userId: string,
        id: string,
        dto: SetStatusDto,
        actor?: WorkOrderActor,
    ): Promise<WorkOrderResponse> {
        await this.findById(userId, id);

        return this.workOrdersRepository.setStatus(id, dto.status, actor);
    }

    async assign(
        userId: string,
        id: string,
        dto: AssignDto,
        actor?: WorkOrderActor,
    ): Promise<WorkOrderResponse> {
        await this.findById(userId, id);

        return this.workOrdersRepository.assign(id, dto.technicianId, actor);
    }

    async accept(
        userId: string,
        id: string,
        actor?: WorkOrderActor,
    ): Promise<WorkOrderResponse> {
        await this.findById(userId, id);

        return this.workOrdersRepository.accept(id, actor);
    }

    async delete(userId: string, id: string): Promise<void> {
        await this.findById(userId, id);

        await this.workOrdersRepository.delete(id);
    }
}
