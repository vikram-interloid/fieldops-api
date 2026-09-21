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
import { CloudFrontSignerService } from 'src/core/storage/services/cloudfront-signer.service';

@Injectable()
export class ServiceCasesService {
  constructor(
    private readonly serviceCasesRepository: ServiceCasesRepository,
    private readonly cloudFrontSigner: CloudFrontSignerService,
  ) {}

  private signCase<T extends { attachments?: any[] }>(sc: T): T {
    if (!sc.attachments?.length) return sc;
    return {
      ...sc,
      attachments: this.cloudFrontSigner.signAttachments(sc.attachments),
    };
  }

  async findAll(userId: string, includes?: string[]) {
    const cases = await this.serviceCasesRepository.findAll(userId, includes);
    return cases.map((c) => this.signCase(c));
  }

  async findById(
    userId: string,
    id: string,
    includes?: string[],
  ): Promise<ServiceCaseResponse> {
    const serviceCase = await this.serviceCasesRepository.findById(
      userId,
      id,
      includes,
    );

    if (!serviceCase) {
      throw new NotFoundException(SERVICE_CASE_MESSAGES.NOT_FOUND);
    }

    return this.signCase(serviceCase as any);
  }

  async findDetail(userId: string, id: string) {
    const detail = await this.serviceCasesRepository.findDetail(userId, id);
    if (!detail) {
      throw new NotFoundException(SERVICE_CASE_MESSAGES.NOT_FOUND);
    }
    return this.signCase(detail);
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

  async findAvailable(userId: string, includes?: string[]) {
    const cases = await this.serviceCasesRepository.findAvailable(userId, includes);
    return cases.map((c) => this.signCase(c));
  }

  async findAssigned(userId: string, includes?: string[]) {
    const cases = await this.serviceCasesRepository.findAssigned(userId, includes);
    return cases.map((c) => this.signCase(c));
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
    return this.serviceCasesRepository.assignOperator(id, operatorOrgId, actor);
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
