import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/core/database/prisma.service';
import { CreatePartDto } from '../dto/create-part.dto';
import { UpdatePartDto } from '../dto/update-part.dto';

const selectPart = {
    id: true,
    name: true,
    sku: true,
    category: true,
    location: true,
    quantity: true,
    reorderLevel: true,
    unitPrice: true,
    supplier: true,
    createdAt: true,
    updatedAt: true,
};

@Injectable()
export class PartsRepository {
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

        return this.prisma.part.findMany({
            where: { organizationId },
            select: selectPart,
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(userId: number, id: number) {
        const organizationId = await this.resolveOrganizationId(userId);

        return this.prisma.part.findFirst({
            where: { id, organizationId },
            select: selectPart,
        });
    }

    async create(userId: number, dto: CreatePartDto) {
        const organizationId = await this.resolveOrganizationId(userId);

        return this.prisma.part.create({
            data: { ...dto, organizationId },
            select: selectPart,
        });
    }

    update(id: number, dto: UpdatePartDto) {
        return this.prisma.part.update({
            where: { id },
            data: dto,
            select: selectPart,
        });
    }

    updateQuantity(id: number, quantity: number) {
        return this.prisma.part.update({
            where: { id },
            data: { quantity },
            select: selectPart,
        });
    }

    delete(id: number) {
        return this.prisma.part.delete({
            where: { id },
        });
    }
}
