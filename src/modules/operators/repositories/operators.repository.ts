import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/core/database/prisma.service';
import { CreateOperatorDto } from '../dto/create-operator.dto';
import { UpdateOperatorDto } from '../dto/update-operator.dto';
import { CreateServiceAreaDto } from '../dto/create-service-area.dto';

const selectServiceArea = {
    id: true,
    operatorId: true,
    category: true,
    region: true,
    postalPrefix: true,
    lat: true,
    lng: true,
    radiusKm: true,
};

const selectOperator = {
    id: true,
    name: true,
    categories: true,
    status: true,
    contactName: true,
    email: true,
    phone: true,
    rating: true,
    region: true,
    tenantOrganizationId: true,
    serviceAreas: {
        select: selectServiceArea,
        orderBy: { id: 'asc' as const },
    },
    createdAt: true,
    updatedAt: true,
};

@Injectable()
export class OperatorsRepository {
    constructor(private readonly prisma: PrismaService) {}

    /** Resolves the caller's organization so every query stays tenant-scoped. */
    private async resolveOrganizationId(userId: number): Promise<number> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { organizationId: true },
        });
        if (!user) throw new NotFoundException('User organization not found');
        return user.organizationId;
    }

    async findAll(userId: number) {
        const organizationId = await this.resolveOrganizationId(userId);
        return this.prisma.operator.findMany({
            where: { organizationId },
            select: selectOperator,
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(userId: number, id: number) {
        const organizationId = await this.resolveOrganizationId(userId);
        return this.prisma.operator.findFirst({
            where: { id, organizationId },
            select: selectOperator,
        });
    }

    async create(userId: number, dto: CreateOperatorDto) {
        const organizationId = await this.resolveOrganizationId(userId);
        return this.prisma.operator.create({
            data: { ...dto, organizationId },
            select: selectOperator,
        });
    }

    update(id: number, dto: UpdateOperatorDto) {
        return this.prisma.operator.update({
            where: { id },
            data: dto,
            select: selectOperator,
        });
    }

    delete(id: number) {
        return this.prisma.operator.delete({ where: { id } });
    }

    /** Confirms the operator is in the caller's org; returns null otherwise. */
    async findOperatorInOrg(userId: number, operatorId: number) {
        const organizationId = await this.resolveOrganizationId(userId);
        return this.prisma.operator.findFirst({
            where: { id: operatorId, organizationId },
            select: { id: true, organizationId: true },
        });
    }

    createServiceArea(
        organizationId: number,
        operatorId: number,
        dto: CreateServiceAreaDto,
    ) {
        return this.prisma.serviceArea.create({
            data: { ...dto, operatorId, organizationId },
            select: selectServiceArea,
        });
    }

    async findServiceAreaInOrg(userId: number, areaId: number) {
        const organizationId = await this.resolveOrganizationId(userId);
        return this.prisma.serviceArea.findFirst({
            where: { id: areaId, organizationId },
            select: { id: true },
        });
    }

    deleteServiceArea(id: number) {
        return this.prisma.serviceArea.delete({ where: { id } });
    }
}
