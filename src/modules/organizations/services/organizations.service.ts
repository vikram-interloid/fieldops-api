import {
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
