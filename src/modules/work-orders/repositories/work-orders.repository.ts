import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/core/database/prisma.service';
import { CreateWorkOrderDto } from '../dto/create-work-order.dto';
import { UpdateWorkOrderDto } from '../dto/update-work-order.dto';

/** Who performed a work-order action, for the history trail. */
export type WorkOrderActor = { userId: string; role?: string };

const baseWorkOrderFields = {
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
  workOrderNo: true,
  locationId: true,
};

export function buildSelectWorkOrder(includes: string[] = []) {
  const inc = new Set(includes.map((i) => i.toLowerCase()));

  return {
    ...baseWorkOrderFields,
    customer: inc.has('customer')
      ? {
          select: {
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
          },
        }
      : { select: { name: true } },
    technician: inc.has('technician')
      ? {
          select: {
            id: true,
            technicianNo: true,
            name: true,
            role: true,
            status: true,
            rating: true,
            skills: true,
            email: true,
            phone: true,
            region: true,
            department: true,
          },
        }
      : { select: { name: true } },
    asset: inc.has('asset')
      ? {
          select: {
            id: true,
            assetNo: true,
            name: true,
            serial: true,
            category: true,
            manufacturer: true,
            model: true,
            health: true,
            warranty: true,
            status: true,
            photoUrl: true,
            photoKey: true,
          },
        }
      : { select: { name: true } },
    site: {
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        lat: true,
        lng: true,
      },
    },
    attachments: {
      select: {
        id: true,
        key: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        type: true,
        createdAt: true,
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    },
    ...(inc.has('events')
      ? {
          events: {
            select: {
              id: true,
              type: true,
              fromValue: true,
              toValue: true,
              note: true,
              actorName: true,
              actorRole: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' as const },
          },
        }
      : {}),
    ...(inc.has('servicecase') || inc.has('case')
      ? {
          serviceCase: {
            select: {
              id: true,
              caseNo: true,
              subject: true,
              status: true,
              priority: true,
            },
          },
        }
      : {}),
    ...(inc.has('operator')
      ? {
          operator: {
            select: {
              id: true,
              name: true,
              region: true,
            },
          },
        }
      : {}),
  };
}

const selectWorkOrder = buildSelectWorkOrder([]);

@Injectable()
export class WorkOrdersRepository {
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
   * Read scope: platform staff (FieldOps) dispatch across every tenant, so
   * their reads aren't org-filtered; everyone else is scoped to their org.
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

  async findAll(userId: string, includes?: string[]) {
    const scope = await this.orgScope(userId);

    return this.prisma.workOrder.findMany({
      where: scope,
      select: buildSelectWorkOrder(includes),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(userId: string, id: string, includes?: string[]) {
    const scope = await this.orgScope(userId);

    return this.prisma.workOrder.findFirst({
      where: { id, ...scope },
      select: buildSelectWorkOrder(includes),
    });
  }

  /** Full detail: related entities, resolved operator/dispatcher + history. */
  async findDetail(userId: string, id: string) {
    const scope = await this.orgScope(userId);

    const wo = await this.prisma.workOrder.findFirst({
      where: { id, ...scope },
      select: {
        ...selectWorkOrder,
        customer: {
          select: {
            name: true,
            city: true,
            address: true,
            locations: {
              select: {
                name: true,
                address: true,
                city: true,
                deliveryPoints: { select: { name: true } },
              },
            },
          },
        },
        technician: {
          select: {
            name: true,
            role: true,
            region: true,
            department: true,
            email: true,
            phone: true,
            rating: true,
          },
        },
        site: {
          select: { name: true, address: true, city: true },
        },
        serviceCase: {
          select: { id: true, assignedOperatorOrgId: true },
        },
        events: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            type: true,
            fromValue: true,
            toValue: true,
            note: true,
            actorName: true,
            actorRole: true,
            createdAt: true,
          },
        },
      },
    });
    if (!wo) return null;

    // Resolve the assigned operator org's name (assignment lives on the
    // originating service case).
    let operatorName: string | null = null;
    const operatorOrgId = wo.serviceCase?.assignedOperatorOrgId ?? null;
    if (operatorOrgId) {
      const org = await this.prisma.organization.findUnique({
        where: { id: operatorOrgId },
        select: { name: true },
      });
      operatorName = org?.name ?? null;
    }

    // Dispatcher = the most recent staff actor to touch the order.
    const dispatcherName =
      [...wo.events]
        .reverse()
        .find((e) =>
          ['admin', 'manager', 'dispatcher'].includes(
            (e.actorRole ?? '').toLowerCase(),
          ),
        )?.actorName ?? null;

    return { ...wo, operatorName, operatorOrgId, dispatcherName };
  }

  /** Appends one entry to a work order's history, resolving the actor name. */
  private async logEvent(
    workOrderId: string,
    type: string,
    opts: {
      from?: string | null;
      to?: string | null;
      note?: string;
      actor?: WorkOrderActor;
    } = {},
  ) {
    let actorName: string | undefined;
    if (opts.actor) {
      const u = await this.prisma.user.findUnique({
        where: { id: opts.actor.userId },
        select: { firstName: true, lastName: true },
      });
      if (u) actorName = `${u.firstName} ${u.lastName}`;
    }
    await this.prisma.workOrderEvent.create({
      data: {
        workOrderId,
        type,
        fromValue: opts.from ?? null,
        toValue: opts.to ?? null,
        note: opts.note,
        actorId: opts.actor?.userId,
        actorName,
        actorRole: opts.actor?.role,
      },
    });
  }

  async create(
    userId: string,
    dto: CreateWorkOrderDto,
    actor?: WorkOrderActor,
  ) {
    const organizationId = await this.resolveOrganizationId(userId);

    const created = await this.prisma.workOrder.create({
      data: { ...dto, organizationId },
      select: selectWorkOrder,
    });
    await this.logEvent(created.id, 'created', {
      to: created.status,
      actor,
    });
    return created;
  }

  async update(id: string, dto: UpdateWorkOrderDto, actor?: WorkOrderActor) {
    const updated = await this.prisma.workOrder.update({
      where: { id },
      data: dto,
      select: selectWorkOrder,
    });
    await this.logEvent(id, 'updated', { actor });
    return updated;
  }

  async setStatus(id: string, status: string, actor?: WorkOrderActor) {
    const current = await this.prisma.workOrder.findUnique({
      where: { id },
      select: { status: true },
    });
    const updated = await this.prisma.workOrder.update({
      where: { id },
      data: { status },
      select: selectWorkOrder,
    });
    await this.logEvent(id, 'status_changed', {
      from: current?.status ?? null,
      to: status,
      actor,
    });
    return updated;
  }

  async assign(id: string, technicianId: string, actor?: WorkOrderActor) {
    const updated = await this.prisma.workOrder.update({
      where: { id },
      data: { technicianId, accepted: false },
      select: selectWorkOrder,
    });
    await this.logEvent(id, 'assigned_technician', {
      to: updated.technician?.name ?? `#${technicianId}`,
      actor,
    });
    return updated;
  }

  async accept(id: string, actor?: WorkOrderActor) {
    const updated = await this.prisma.workOrder.update({
      where: { id },
      data: { accepted: true },
      select: selectWorkOrder,
    });
    await this.logEvent(id, 'accepted', {
      to: updated.technician?.name ?? undefined,
      actor,
    });
    return updated;
  }

  delete(id: string) {
    return this.prisma.workOrder.delete({
      where: { id },
    });
  }
}
