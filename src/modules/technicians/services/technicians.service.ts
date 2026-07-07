import { Injectable, NotFoundException } from '@nestjs/common';

import { TechniciansRepository } from '../repositories/technicians.repository';
import { TechnicianResponse } from '../responses/technician.response';
import { CreateTechnicianDto } from '../dto/create-technician.dto';
import { UpdateTechnicianDto } from '../dto/update-technician.dto';
import { TECHNICIAN_MESSAGES } from '../constants/technician.constants';

@Injectable()
export class TechniciansService {
    constructor(
        private readonly techniciansRepository: TechniciansRepository,
    ) {}

    findAll(userId: number) {
        return this.techniciansRepository.findAll(userId);
    }

    async findById(userId: number, id: number): Promise<TechnicianResponse> {
        const technician = await this.techniciansRepository.findById(
            userId,
            id,
        );

        if (!technician) {
            throw new NotFoundException(TECHNICIAN_MESSAGES.NOT_FOUND);
        }

        return technician;
    }

    create(userId: number, dto: CreateTechnicianDto) {
        return this.techniciansRepository.create(userId, dto);
    }

    async update(
        userId: number,
        id: number,
        dto: UpdateTechnicianDto,
    ): Promise<TechnicianResponse> {
        await this.findById(userId, id);

        return this.techniciansRepository.update(id, dto);
    }

    async delete(userId: number, id: number): Promise<void> {
        await this.findById(userId, id);

        await this.techniciansRepository.delete(id);
    }
}
