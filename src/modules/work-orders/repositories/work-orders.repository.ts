import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/core/database/prisma.service';
import { CreateWorkOrderDto } from '../dto/create-work-order.dto';
import { UpdateWorkOrderDto } from '../dto/update-work-order.dto';

const selectWorkOrder = {
    id: true,
    customerId: true,
    technicianId: true,
    assetId: true,
    priority: true,
    status: true,
    serviceType: true,
    location: true,
    contactName: true,
    contactPhone: true,
    contactEmail: true,
    due: true,
    scheduledDate: true,
    estimatedHours: true,
    description: true,
    accepted: true,
    lat: true,
    lng: true,
    respondedAt: true,
    resolvedAt: true,
    slaPausedAt: true,
    slaPausedMs: true,
    createdAt: true,
    updatedAt: true,
    customer: { select: { name: true } },
    technician: { select: { name: true } },
    asset: { select: { name: true } },
};

@Injectable()
export class WorkOrdersRepository {
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

    async findAll(userId: number) {
        const organizationId = await this.resolveOrganizationId(userId);

        return this.prisma.workOrder.findMany({
            where: { organizationId },
            select: selectWorkOrder,
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(userId: number, id: number) {
        const organizationId = await this.resolveOrganizationId(userId);

        return this.prisma.workOrder.findFirst({
            where: { id, organizationId },
            select: selectWorkOrder,
        });
    }

    async create(userId: number, dto: CreateWorkOrderDto) {
        const organizationId = await this.resolveOrganizationId(userId);

        return this.prisma.workOrder.create({
            data: { ...dto, organizationId },
            select: selectWorkOrder,
        });
    }

    update(id: number, dto: UpdateWorkOrderDto) {
        return this.prisma.workOrder.update({
            where: { id },
            data: dto,
            select: selectWorkOrder,
        });
    }

    setStatus(id: number, status: string) {
        return this.prisma.workOrder.update({
            where: { id },
            data: { status },
            select: selectWorkOrder,
        });
    }

    assign(id: number, technicianId: number) {
        return this.prisma.workOrder.update({
            where: { id },
            data: { technicianId, accepted: false },
            select: selectWorkOrder,
        });
    }

    accept(id: number) {
        return this.prisma.workOrder.update({
            where: { id },
            data: { accepted: true },
            select: selectWorkOrder,
        });
    }

    delete(id: number) {
        return this.prisma.workOrder.delete({
            where: { id },
        });
    }
}
