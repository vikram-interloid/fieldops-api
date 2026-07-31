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

    findAll(userId: string) {
        return this.serviceCasesRepository.findAll(userId);
    }

    async findById(userId: string, id: string): Promise<ServiceCaseResponse> {
        const serviceCase = await this.serviceCasesRepository.findById(
            userId,
            id,
        );

        if (!serviceCase) {
            throw new NotFoundException(SERVICE_CASE_MESSAGES.NOT_FOUND);
        }

        return serviceCase;
    }

    async findDetail(userId: string, id: string) {
        const detail = await this.serviceCasesRepository.findDetail(userId, id);
        if (!detail) {
            throw new NotFoundException(SERVICE_CASE_MESSAGES.NOT_FOUND);
        }
        return detail;
    }

    create(userId: string, dto: CreateCaseDto, actor?: CaseActor) {
        return this.serviceCasesRepository.create(
            userId,
            { ...dto, status: dto.status ?? 'New' },
            actor,
        );
    }

    async update(
        userId: string,
        id: string,
        dto: UpdateCaseDto,
        actor?: CaseActor,
    ): Promise<ServiceCaseResponse> {
        await this.findById(userId, id);

        return this.serviceCasesRepository.update(id, dto, actor);
    }

    async setStatus(
        userId: string,
        id: string,
        dto: SetStatusDto,
        actor?: CaseActor,
    ): Promise<ServiceCaseResponse> {
        await this.findById(userId, id);

        return this.serviceCasesRepository.updateStatus(id, dto.status, actor);
    }

    async convert(userId: string, id: string) {
        await this.findById(userId, id);

        return this.serviceCasesRepository.convert(userId, id);
    }

    async delete(userId: string, id: string): Promise<void> {
        await this.findById(userId, id);

        await this.serviceCasesRepository.delete(id);
    }

    findAvailable(userId: string) {
        return this.serviceCasesRepository.findAvailable(userId);
    }

    findAssigned(userId: string) {
        return this.serviceCasesRepository.findAssigned(userId);
    }

    expressInterest(userId: string, id: string, actor?: CaseActor) {
        return this.serviceCasesRepository.addInterest(userId, id, actor);
    }

    async assignOperator(
        userId: string,
        id: string,
        operatorOrgId: string,
        actor?: CaseActor,
    ) {
        await this.assertPlatform(userId);
        return this.serviceCasesRepository.assignOperator(
            id,
            operatorOrgId,
            actor,
        );
    }

    async interestedOperators(userId: string, id: string) {
        await this.assertPlatform(userId);
        return this.serviceCasesRepository.interestedOperators(id);
    }

    async assignableOperators(userId: string, id: string) {
        await this.assertPlatform(userId);
        return this.serviceCasesRepository.assignableOperators(id);
    }

    private async assertPlatform(userId: string) {
        const isPlatform = await this.serviceCasesRepository.isPlatform(userId);
        if (!isPlatform) {
            throw new ForbiddenException(
                'Only platform dispatch can manage operator assignment.',
            );
        }
    }
}
