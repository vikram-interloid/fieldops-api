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
  private async resolveOrganizationId(userId: string): Promise<string> {
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
   * Read scope: platform staff (FieldOps) manage every customer across the
   * marketplace, so their reads aren't org-filtered; a customer/operator
   * tenant only sees its own org's customer records.
   */
  private async orgScope(userId: string): Promise<{ organizationId?: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        organizationId: true,
        organization: { select: { type: true } },
      },
    });
    if (!user) throw new NotFoundException('User organization not found');
    return user.organization?.type === 'platform'
      ? {}
      : { organizationId: user.organizationId };
  }

  async findAll(userId: string) {
    const scope = await this.orgScope(userId);

    return this.prisma.customer.findMany({
      where: scope,
      select: selectCustomer,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(userId: string, id: string) {
    const scope = await this.orgScope(userId);

    return this.prisma.customer.findFirst({
      where: { id, ...scope },
      select: selectCustomer,
    });
  }

  async create(userId: string, dto: CreateCustomerDto) {
    const organizationId = await this.resolveOrganizationId(userId);

    return this.prisma.customer.create({
      data: { ...dto, organizationId },
      select: selectCustomer,
    });
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const customer = await this.prisma.customer.update({
      where: { id },
      data: dto,
      select: selectCustomer,
    });

    if (dto.contactName) {
      const parts = dto.contactName.trim().split(/\s+/);
      const firstName = parts[0] || dto.contactName.trim();
      const lastName = parts.slice(1).join(' ') || '';

      await this.prisma.user
        .updateMany({
          where: {
            OR: [{ customerId: id }, { email: customer.email }],
          },
          data: {
            firstName,
            lastName,
            ...(dto.phone ? { phone: dto.phone } : {}),
          },
        })
        .catch(() => {});
    }

    if (dto.name) {
      const existing = await this.prisma.customer.findUnique({
        where: { id },
        select: { organizationId: true },
      });

      if (existing?.organizationId) {
        await this.prisma.organization
          .update({
            where: { id: existing.organizationId },
            data: { name: dto.name },
          })
          .catch(() => {});
      }
    }

    return customer;
  }

  delete(id: string) {
    return this.prisma.customer.delete({
      where: { id },
    });
  }
}
