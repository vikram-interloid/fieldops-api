import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/core/database/prisma.service';
import { CreateLocationDto } from '../dto/create-location.dto';
import { UpdateLocationDto } from '../dto/update-location.dto';
import { CreateDeliveryPointDto } from '../dto/create-delivery-point.dto';

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

@Injectable()
export class CustomerLocationsRepository {
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
     * Confirms the parent customer belongs to the user's organization before a
     * location is mutated. Returns null when the customer is out of scope.
     */
    async findCustomerInOrg(userId: number, customerId: number) {
        const organizationId = await this.resolveOrganizationId(userId);

        return this.prisma.customer.findFirst({
            where: { id: customerId, organizationId },
            select: { id: true },
        });
    }

    /**
     * Confirms a location belongs to a customer within the user's organization.
     * Returns null when the location is out of scope.
     */
    async findLocationInOrg(userId: number, locationId: number) {
        const organizationId = await this.resolveOrganizationId(userId);

        return this.prisma.location.findFirst({
            where: { id: locationId, customer: { organizationId } },
            select: { id: true },
        });
    }

    /**
     * Confirms a delivery point belongs to a location/customer within the
     * user's organization. Returns null when out of scope.
     */
    async findDeliveryPointInOrg(userId: number, deliveryPointId: number) {
        const organizationId = await this.resolveOrganizationId(userId);

        return this.prisma.deliveryPoint.findFirst({
            where: {
                id: deliveryPointId,
                location: { customer: { organizationId } },
            },
            select: { id: true },
        });
    }

    /**
     * Creates a customer site. The location inherits its customer's
     * organization so the tenant scope and geo data stay consistent.
     */
    async createLocation(customerId: number, dto: CreateLocationDto) {
        const customer = await this.prisma.customer.findUniqueOrThrow({
            where: { id: customerId },
            select: { organizationId: true },
        });

        return this.prisma.location.create({
            data: {
                ...dto,
                customerId,
                organizationId: customer.organizationId,
                type: 'customer_site',
            },
            select: selectLocation,
        });
    }

    updateLocation(id: number, dto: UpdateLocationDto) {
        return this.prisma.location.update({
            where: { id },
            data: dto,
            select: selectLocation,
        });
    }

    deleteLocation(id: number) {
        return this.prisma.location.delete({
            where: { id },
        });
    }

    createDeliveryPoint(locationId: number, dto: CreateDeliveryPointDto) {
        return this.prisma.deliveryPoint.create({
            data: { ...dto, locationId },
            select: selectDeliveryPoint,
        });
    }

    deleteDeliveryPoint(id: number) {
        return this.prisma.deliveryPoint.delete({
            where: { id },
        });
    }
}
