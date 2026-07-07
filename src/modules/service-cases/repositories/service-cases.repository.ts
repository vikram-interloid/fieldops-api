import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/core/database/prisma.service';
import { CreateCaseDto } from '../dto/create-case.dto';
import { UpdateCaseDto } from '../dto/update-case.dto';

const selectServiceCase = {
    id: true,
    customerId: true,
    subject: true,
    description: true,
    serviceType: true,
    priority: true,
    location: true,
    status: true,
    workOrderId: true,
    createdAt: true,
    updatedAt: true,
    customer: { select: { name: true } },
};

@Injectable()
export class ServiceCasesRepository {
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

        return this.prisma.serviceCase.findMany({
            where: { organizationId },
            select: selectServiceCase,
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(userId: number, id: number) {
        const organizationId = await this.resolveOrganizationId(userId);

        return this.prisma.serviceCase.findFirst({
            where: { id, organizationId },
            select: selectServiceCase,
        });
    }

    async create(userId: number, dto: CreateCaseDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { organizationId: true, customerId: true },
        });

        if (!user) {
            throw new NotFoundException('User organization not found');
        }

        return this.prisma.serviceCase.create({
            data: {
                ...dto,
                status: dto.status ?? 'New',
                organizationId: user.organizationId,
                // When a customer raises their own case and no customer was
                // specified, link it to their own record so it shows in their
                // scoped views.
                customerId: dto.customerId ?? user.customerId ?? undefined,
            },
            select: selectServiceCase,
        });
    }

    update(id: number, dto: UpdateCaseDto) {
        return this.prisma.serviceCase.update({
            where: { id },
            data: dto,
            select: selectServiceCase,
        });
    }

    updateStatus(id: number, status: string) {
        return this.prisma.serviceCase.update({
            where: { id },
            data: { status },
            select: selectServiceCase,
        });
    }

    delete(id: number) {
        return this.prisma.serviceCase.delete({
            where: { id },
        });
    }

    /**
     * Converts a service case into a work order. The work order is created in
     * the same organization as the case, then the case is updated to reference
     * the new work order and marked as 'Converted'.
     */
    async convert(userId: number, id: number) {
        const organizationId = await this.resolveOrganizationId(userId);

        const serviceCase = await this.prisma.serviceCase.findFirst({
            where: { id, organizationId },
        });

        if (!serviceCase) {
            throw new NotFoundException('Service case not found');
        }

        const due = serviceCase.createdAt.toISOString().slice(0, 10);

        return this.prisma.$transaction(async (tx) => {
            const workOrder = await tx.workOrder.create({
                data: {
                    organizationId: serviceCase.organizationId,
                    customerId: serviceCase.customerId,
                    priority: serviceCase.priority,
                    serviceType: serviceCase.serviceType,
                    location: serviceCase.location,
                    description: serviceCase.description,
                    status: 'Open',
                    due,
                    accepted: false,
                },
            });

            return tx.serviceCase.update({
                where: { id: serviceCase.id },
                data: {
                    status: 'Converted',
                    workOrderId: workOrder.id,
                },
                include: { workOrder: true },
            });
        });
    }
}
