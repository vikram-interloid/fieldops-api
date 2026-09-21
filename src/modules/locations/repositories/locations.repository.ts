import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/core/database/prisma.service';
import { CreateLocationDto } from '../dto/create-location.dto';
import { UpdateLocationDto } from '../dto/update-location.dto';

const selectLocation = {
  id: true,
  organizationId: true,
  customerId: true,
  type: true,
  name: true,
  address: true,
  city: true,
  region: true,
  state: true,
  postalCode: true,
  country: true,
  lat: true,
  lng: true,
  createdAt: true,
  updatedAt: true,
  customer: { select: { name: true } },
};

@Injectable()
export class LocationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Resolves the org the user belongs to so every query stays tenant-scoped. */
  async resolveOrganizationId(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (!user) {
      throw new NotFoundException('User organization not found');
    }

    return user.organizationId;
  }

  async findAll(userId: string) {
    const organizationId = await this.resolveOrganizationId(userId);

    return this.prisma.location.findMany({
      where: { organizationId },
      select: selectLocation,
      orderBy: [{ type: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findById(userId: string, id: string) {
    const organizationId = await this.resolveOrganizationId(userId);

    return this.prisma.location.findFirst({
      where: {
        id,
        OR: [{ organizationId }, { customer: { organizationId } }],
      },
      select: selectLocation,
    });
  }

  async create(userId: string, dto: CreateLocationDto) {
    const organizationId = await this.resolveOrganizationId(userId);

    if (dto.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: dto.customerId, organizationId },
        select: { id: true },
      });

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }
    }

    return this.prisma.location.create({
      data: {
        ...dto,
        organizationId,
        type: dto.type ?? 'customer_site',
      },
      select: selectLocation,
    });
  }

  async update(id: string, dto: UpdateLocationDto, organizationId?: string) {
    if (dto.customerId && organizationId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: dto.customerId, organizationId },
        select: { id: true },
      });

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }
    }

    return this.prisma.location.update({
      where: { id },
      data: dto,
      select: selectLocation,
    });
  }

  delete(id: string) {
    return this.prisma.location.delete({
      where: { id },
    });
  }
}
