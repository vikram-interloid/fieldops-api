import { Injectable, NotFoundException } from '@nestjs/common';

import { ServiceCasesRepository } from '../repositories/service-cases.repository';
import { ServiceCaseResponse } from '../responses/service-case.response';
import { CreateCaseDto } from '../dto/create-case.dto';
import { UpdateCaseDto } from '../dto/update-case.dto';
import { SetStatusDto } from '../dto/set-status.dto';
import { SERVICE_CASE_MESSAGES } from '../constants/service-case.constants';

@Injectable()
export class ServiceCasesService {
    constructor(
        private readonly serviceCasesRepository: ServiceCasesRepository,
    ) {}

    findAll(userId: number) {
        return this.serviceCasesRepository.findAll(userId);
    }

    async findById(userId: number, id: number): Promise<ServiceCaseResponse> {
        const serviceCase = await this.serviceCasesRepository.findById(
            userId,
            id,
        );

        if (!serviceCase) {
            throw new NotFoundException(SERVICE_CASE_MESSAGES.NOT_FOUND);
        }

        return serviceCase;
    }

    create(userId: number, dto: CreateCaseDto) {
        return this.serviceCasesRepository.create(userId, {
            ...dto,
            status: dto.status ?? 'New',
        });
    }

    async update(
        userId: number,
        id: number,
        dto: UpdateCaseDto,
    ): Promise<ServiceCaseResponse> {
        await this.findById(userId, id);

        return this.serviceCasesRepository.update(id, dto);
    }

    async setStatus(
        userId: number,
        id: number,
        dto: SetStatusDto,
    ): Promise<ServiceCaseResponse> {
        await this.findById(userId, id);

        return this.serviceCasesRepository.updateStatus(id, dto.status);
    }

    async convert(userId: number, id: number) {
        await this.findById(userId, id);

        return this.serviceCasesRepository.convert(userId, id);
    }

    async delete(userId: number, id: number): Promise<void> {
        await this.findById(userId, id);

        await this.serviceCasesRepository.delete(id);
    }
}
