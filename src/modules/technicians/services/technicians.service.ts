import { Injectable, NotFoundException } from '@nestjs/common';

import {
    TechniciansRepository,
    type TechnicianActor,
} from '../repositories/technicians.repository';
import { TechnicianResponse } from '../responses/technician.response';
import { CreateTechnicianDto } from '../dto/create-technician.dto';
import { UpdateTechnicianDto } from '../dto/update-technician.dto';
import { TECHNICIAN_MESSAGES } from '../constants/technician.constants';

@Injectable()
export class TechniciansService {
    constructor(
        private readonly techniciansRepository: TechniciansRepository,
    ) {}

    findAll(userId: string) {
        return this.techniciansRepository.findAll(userId);
    }

    async findById(userId: string, id: string): Promise<TechnicianResponse> {
        const technician = await this.techniciansRepository.findById(
            userId,
            id,
        );

        if (!technician) {
            throw new NotFoundException(TECHNICIAN_MESSAGES.NOT_FOUND);
        }

        return technician;
    }

    async findDetail(userId: string, id: string) {
        const detail = await this.techniciansRepository.findDetail(userId, id);

        if (!detail) {
            throw new NotFoundException(TECHNICIAN_MESSAGES.NOT_FOUND);
        }

        return detail;
    }

    create(userId: string, dto: CreateTechnicianDto, actor?: TechnicianActor) {
        return this.techniciansRepository.create(userId, dto, actor);
    }

    async update(
        userId: string,
        id: string,
        dto: UpdateTechnicianDto,
        actor?: TechnicianActor,
    ): Promise<TechnicianResponse> {
        await this.findById(userId, id);

        return this.techniciansRepository.update(id, dto, actor);
    }

    async delete(userId: string, id: string): Promise<void> {
        await this.findById(userId, id);

        await this.techniciansRepository.delete(id);
    }
}
