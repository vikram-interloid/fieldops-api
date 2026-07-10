import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import {
    ServiceCasesRepository,
    type CaseActor,
} from '../repositories/service-cases.repository';
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

    async findDetail(userId: number, id: number) {
        const detail = await this.serviceCasesRepository.findDetail(userId, id);
        if (!detail) {
            throw new NotFoundException(SERVICE_CASE_MESSAGES.NOT_FOUND);
        }
        return detail;
    }

    create(userId: number, dto: CreateCaseDto, actor?: CaseActor) {
        return this.serviceCasesRepository.create(
            userId,
            { ...dto, status: dto.status ?? 'New' },
            actor,
        );
    }

    async update(
        userId: number,
        id: number,
        dto: UpdateCaseDto,
        actor?: CaseActor,
    ): Promise<ServiceCaseResponse> {
        await this.findById(userId, id);

        return this.serviceCasesRepository.update(id, dto, actor);
    }

    async setStatus(
        userId: number,
        id: number,
        dto: SetStatusDto,
        actor?: CaseActor,
    ): Promise<ServiceCaseResponse> {
        await this.findById(userId, id);

        return this.serviceCasesRepository.updateStatus(id, dto.status, actor);
    }

    async convert(userId: number, id: number) {
        await this.findById(userId, id);

        return this.serviceCasesRepository.convert(userId, id);
    }

    async delete(userId: number, id: number): Promise<void> {
        await this.findById(userId, id);

        await this.serviceCasesRepository.delete(id);
    }

    // ---- Operator marketplace ---------------------------------------------

    findAvailable(userId: number) {
        return this.serviceCasesRepository.findAvailable(userId);
    }

    findAssigned(userId: number) {
        return this.serviceCasesRepository.findAssigned(userId);
    }

    expressInterest(userId: number, id: number, actor?: CaseActor) {
        return this.serviceCasesRepository.addInterest(userId, id, actor);
    }

    async assignOperator(
        userId: number,
        id: number,
        operatorOrgId: number,
        actor?: CaseActor,
    ) {
        await this.assertPlatform(userId);
        return this.serviceCasesRepository.assignOperator(
            id,
            operatorOrgId,
            actor,
        );
    }

    async interestedOperators(userId: number, id: number) {
        await this.assertPlatform(userId);
        return this.serviceCasesRepository.interestedOperators(id);
    }

    async assignableOperators(userId: number, id: number) {
        await this.assertPlatform(userId);
        return this.serviceCasesRepository.assignableOperators(id);
    }

    private async assertPlatform(userId: number) {
        const isPlatform = await this.serviceCasesRepository.isPlatform(userId);
        if (!isPlatform) {
            throw new ForbiddenException(
                'Only platform dispatch can manage operator assignment.',
            );
        }
    }
}
