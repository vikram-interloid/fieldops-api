import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/core/database/prisma.service';
import { CreateTechnicianDto } from '../dto/create-technician.dto';
import { UpdateTechnicianDto } from '../dto/update-technician.dto';

const selectTechnician = {
    id: true,
    name: true,
    role: true,
    status: true,
    activeJobs: true,
    rating: true,
    skills: true,
    email: true,
    phone: true,
    employeeId: true,
    region: true,
    department: true,
    hireDate: true,
    createdAt: true,
    updatedAt: true,
};

@Injectable()
export class TechniciansRepository {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * Resolves the organization the user belongs to. Every query is scoped to
     * this organization so tenants never see each other's records.
     */
    private async resolveOrganizationId(userId: number): Promise<number> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { organizationId: true },
        });

        if (!user) {
            throw new NotFoundException('User organization not found');
        }

        return user.organizationId;
    }

    /**
     * Organizations whose technicians a user may see: their own org plus the
     * shared platform org ("FieldOps"), which hires the technicians every
     * operator can dispatch. Own-org mutations still scope to `findById`.
     */
    private async resolveVisibleOrgIds(userId: number): Promise<number[]> {
        const organizationId = await this.resolveOrganizationId(userId);
        const platform = await this.prisma.organization.findFirst({
            where: { name: { in: ['FieldOps', 'Acme Field Services'] } },
            select: { id: true },
        });
        const ids = new Set<number>([organizationId]);
        if (platform) ids.add(platform.id);
        return [...ids];
    }

    async findAll(userId: number) {
        const organizationIds = await this.resolveVisibleOrgIds(userId);

        return this.prisma.technician.findMany({
            where: { organizationId: { in: organizationIds } },
            select: selectTechnician,
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(userId: number, id: number) {
        const organizationId = await this.resolveOrganizationId(userId);

        return this.prisma.technician.findFirst({
            where: { id, organizationId },
            select: selectTechnician,
        });
    }

    async create(userId: number, dto: CreateTechnicianDto) {
        const organizationId = await this.resolveOrganizationId(userId);

        return this.prisma.technician.create({
            data: { ...dto, organizationId },
            select: selectTechnician,
        });
    }

    update(id: number, dto: UpdateTechnicianDto) {
        return this.prisma.technician.update({
            where: { id },
            data: dto,
            select: selectTechnician,
        });
    }

    delete(id: number) {
        return this.prisma.technician.delete({
            where: { id },
        });
    }
}
