import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/core/database/prisma.service';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';

const selectDeliveryPoint = {
    id: true,
    locationId: true,
    name: true,
    createdAt: true,
    updatedAt: true,
};

const selectLocation = {
    id: true,
    customerId: true,
    name: true,
    address: true,
    city: true,
    deliveryPoints: {
        select: selectDeliveryPoint,
        orderBy: { createdAt: 'desc' as const },
    },
    createdAt: true,
    updatedAt: true,
};

const selectCustomer = {
    id: true,
    name: true,
    contactName: true,
    email: true,
    phone: true,
    industry: true,
    contractType: true,
    status: true,
    city: true,
    address: true,
    locations: {
        select: selectLocation,
        orderBy: { createdAt: 'desc' as const },
    },
    createdAt: true,
    updatedAt: true,
};

@Injectable()
export class CustomersRepository {
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

        return this.prisma.customer.findMany({
            where: { organizationId },
            select: selectCustomer,
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(userId: number, id: number) {
        const organizationId = await this.resolveOrganizationId(userId);

        return this.prisma.customer.findFirst({
            where: { id, organizationId },
            select: selectCustomer,
        });
    }

    async create(userId: number, dto: CreateCustomerDto) {
        const organizationId = await this.resolveOrganizationId(userId);

        return this.prisma.customer.create({
            data: { ...dto, organizationId },
            select: selectCustomer,
        });
    }

    update(id: number, dto: UpdateCustomerDto) {
        return this.prisma.customer.update({
            where: { id },
            data: dto,
            select: selectCustomer,
        });
    }

    delete(id: number) {
        return this.prisma.customer.delete({
            where: { id },
        });
    }
}
