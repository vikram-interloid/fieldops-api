import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class SlaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async resolveOrganizationId(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });
    if (!user) throw new NotFoundException('User organization not found');
    return user.organizationId;
  }

  findPolicies(organizationId: string) {
    return this.prisma.slaPolicy.findMany({
      where: { organizationId },
      orderBy: { id: 'asc' },
    });
  }

  upsertPolicy(
    organizationId: string,
    priority: string,
    responseMinutes: number,
    resolutionMinutes: number,
  ) {
    return this.prisma.slaPolicy.upsert({
      where: {
        organizationId_priority: { organizationId, priority },
      },
      create: {
        organizationId,
        priority,
        responseMinutes,
        resolutionMinutes,
      },
      update: { responseMinutes, resolutionMinutes },
    });
  }

  /** Work orders in the org with the fields needed for SLA computation. */
  findWorkOrdersForSla(organizationId: string) {
    return this.prisma.workOrder.findMany({
      where: { organizationId },
      select: {
        id: true,
        priority: true,
        status: true,
        createdAt: true,
        respondedAt: true,
        resolvedAt: true,
        slaPausedAt: true,
        slaPausedMs: true,
      },
    });
  }

  /** Confirms a work order is within the user's org; returns null otherwise. */
  findWorkOrderInOrg(organizationId: string, id: string) {
    return this.prisma.workOrder.findFirst({
      where: { id, organizationId },
      select: {
        id: true,
        respondedAt: true,
        resolvedAt: true,
        slaPausedAt: true,
        slaPausedMs: true,
      },
    });
  }

  updateWorkOrderSla(
    id: string,
    data: {
      respondedAt?: Date;
      resolvedAt?: Date;
      slaPausedAt?: Date | null;
      slaPausedMs?: number;
      status?: string;
    },
  ) {
    return this.prisma.workOrder.update({ where: { id }, data });
  }
}
