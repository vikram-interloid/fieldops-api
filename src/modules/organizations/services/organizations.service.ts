import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";

import { OrganizationsRepository } from "../repositories/organizations.repository";
import { OrganizationResponse } from "../responses/organization.response";
import { CreateOrganizationDto } from "../dto/create-organization.dto";
import { UpdateOrganizationDto } from "../dto/update-organization.dto";
import { ORGANIZATION_MESSAGES } from "../constants/organization.constants";

@Injectable()
export class OrganizationsService {
    constructor(
        private readonly organizationsRepository: OrganizationsRepository,
    ) { }

    async findCurrent(
        userId: number,
    ): Promise<OrganizationResponse> {
        const organization = await this.organizationsRepository.findByUserId(
            userId,
        );

        if (!organization) {
            throw new NotFoundException(
                ORGANIZATION_MESSAGES.NOT_FOUND,
            );
        }

        return organization;
    }

    findAll() {
        return this.organizationsRepository.findAll();
    }

    /** Only platform (FieldOps) staff may review/verify tenants. */
    private async assertPlatform(userId: number): Promise<void> {
        const type = await this.organizationsRepository.orgTypeForUser(userId);
        if (type !== 'platform') {
            throw new ForbiddenException(
                'Only FieldOps platform staff can review organizations.',
            );
        }
    }

    /** Platform-only: list orgs for verification review, optionally by status. */
    async findForReview(actorUserId: number, status?: string) {
        await this.assertPlatform(actorUserId);
        return this.organizationsRepository.findAll(status);
    }

    /** Platform-only: mark an org verified/rejected/pending. */
    async setVerification(
        actorUserId: number,
        id: number,
        status: 'verified' | 'rejected' | 'pending',
        note?: string,
    ) {
        await this.assertPlatform(actorUserId);
        await this.findById(id);
        return this.organizationsRepository.setVerification(id, status, note);
    }

    async findById(
        id: number,
    ): Promise<OrganizationResponse> {
        const organization = await this.organizationsRepository.findById(id);

        if (!organization) {
            throw new NotFoundException(
                ORGANIZATION_MESSAGES.NOT_FOUND,
            );
        }

        return organization;
    }

    create(
        dto: CreateOrganizationDto,
    ) {
        return this.organizationsRepository.create(dto);
    }

    async update(
        id: number,
        dto: UpdateOrganizationDto,
    ): Promise<OrganizationResponse> {
        await this.findById(id);

        return this.organizationsRepository.update(id, dto);
    }

    async delete(
        id: number,
    ): Promise<void> {
        await this.findById(id);

        await this.organizationsRepository.delete(id);
    }
}
