import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/core/database/prisma.service';
import { CreateCaseDto } from '../dto/create-case.dto';
import { UpdateCaseDto } from '../dto/update-case.dto';

/** Who performed a service-case action, for the history trail. */
export type CaseActor = { userId: string; role?: string };

const baseServiceCaseFields = {
  id: true,
  customerId: true,
  subject: true,
  description: true,
  serviceType: true,
  priority: true,
  location: true,
  status: true,
  category: true,
  preferredOperatorId: true,
  interestedOperatorIds: true,
  assignedOperatorOrgId: true,
  workOrderId: true,
  createdAt: true,
  updatedAt: true,
  caseNo: true,
};

export function buildSelectServiceCase(includes: string[] = []) {
  const inc = new Set(includes.map((i) => i.toLowerCase()));

  return {
    ...baseServiceCaseFields,
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
    workOrder: inc.has('workorder')
      ? {
          select: {
            id: true,
            workOrderNo: true,
            status: true,
            priority: true,
            due: true,
            scheduledDate: true,
            technician: { select: { name: true } },
          },
        }
      : { select: { workOrderNo: true } },
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
            orderBy: { createdAt: 'desc' as const },
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
        }
      : {}),
  };
}

const selectServiceCase = buildSelectServiceCase([]);

/** Case statuses that are still open to operator interest / dispatch. */
const OPEN_STATUSES = ['New', 'In Review'];

@Injectable()
export class ServiceCasesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Appends one entry to a case's history, resolving the actor name. */
  private async logEvent(
    serviceCaseId: string,
    type: string,
    opts: {
      from?: string | null;
      to?: string | null;
      note?: string;
      actor?: CaseActor;
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
    await this.prisma.serviceCaseEvent.create({
      data: {
        serviceCaseId,
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
   * Read scope: platform staff (FieldOps) manage every tenant's cases, so
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

    return this.prisma.serviceCase.findMany({
      where: scope,
      select: buildSelectServiceCase(includes),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(userId: string, id: string, includes?: string[]) {
    const scope = await this.orgScope(userId);

    return this.prisma.serviceCase.findFirst({
      where: { id, ...scope },
      select: buildSelectServiceCase(includes),
    });
  }

  /** Case with resolved operator name + full history timeline. */
  async findDetail(userId: string, id: string) {
    const scope = await this.orgScope(userId);

    const sc = await this.prisma.serviceCase.findFirst({
      where: { id, ...scope },
      select: {
        ...selectServiceCase,
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
    if (!sc) return null;

    let operatorName: string | null = null;
    if (sc.assignedOperatorOrgId) {
      const org = await this.prisma.organization.findUnique({
        where: { id: sc.assignedOperatorOrgId },
        select: { name: true },
      });
      operatorName = org?.name ?? null;
    }

    return { ...sc, operatorName };
  }

  async create(userId: string, dto: CreateCaseDto, actor?: CaseActor) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        organizationId: true,
        customerId: true,
        organization: {
          select: { type: true, verificationStatus: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User organization not found');
    }

    // Self-registered tenants must be verified by platform staff before
    // they can raise cases. The platform org is always verified.
    if (
      user.organization?.type !== 'platform' &&
      user.organization?.verificationStatus !== 'verified'
    ) {
      throw new ForbiddenException(
        'Your organization is pending verification. You can create cases once a FieldOps admin verifies your account.',
      );
    }

    const created = await this.prisma.serviceCase.create({
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
    await this.logEvent(created.id, 'created', {
      to: created.status,
      actor: actor ?? { userId },
    });
    return created;
  }

  // ---- Operator marketplace (cross-org) ---------------------------------

  /** The caller's organization profile — kind + operator coverage. */
  private async resolveOrgProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        organization: {
          select: {
            id: true,
            type: true,
            region: true,
            categories: true,
          },
        },
      },
    });
    if (!user?.organization) {
      throw new NotFoundException('User organization not found');
    }
    return user.organization;
  }

  /** Cases (any status, across tenants) assigned to the caller operator org. */
  async findAssigned(userId: string, includes?: string[]) {
    const org = await this.resolveOrgProfile(userId);

    return this.prisma.serviceCase.findMany({
      where: { assignedOperatorOrgId: org.id },
      select: buildSelectServiceCase(includes),
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findAvailable(userId: string, includes?: string[]) {
    const org = await this.resolveOrgProfile(userId);

    const coverage: object[] = [{ category: null }, { category: '' }];
    if (org.categories?.length) {
      coverage.push({ category: { in: org.categories } });
    }
    if (org.region) {
      coverage.push({
        location: { contains: org.region, mode: 'insensitive' },
      });
    }

    return this.prisma.serviceCase.findMany({
      where: {
        status: { in: OPEN_STATUSES },
        assignedOperatorOrgId: null,
        organizationId: { not: org.id },
        OR: coverage,
      },
      select: buildSelectServiceCase(includes),
      orderBy: { createdAt: 'desc' },
    });
  }

  async addInterest(userId: string, caseId: string, actor?: CaseActor) {
    const org = await this.resolveOrgProfile(userId);

    const existing = await this.prisma.serviceCase.findUnique({
      where: { id: caseId },
      select: { interestedOperatorIds: true },
    });
    if (!existing) throw new NotFoundException('Service case not found');

    const already = existing.interestedOperatorIds.includes(org.id);
    const ids = new Set(existing.interestedOperatorIds);
    ids.add(org.id);

    const updated = await this.prisma.serviceCase.update({
      where: { id: caseId },
      data: { interestedOperatorIds: [...ids] },
      select: selectServiceCase,
    });

    if (!already) {
      const orgRow = await this.prisma.organization.findUnique({
        where: { id: org.id },
        select: { name: true },
      });
      await this.logEvent(caseId, 'operator_interest', {
        to: orgRow?.name ?? `Org #${org.id}`,
        actor: actor ?? { userId },
      });
    }
    return updated;
  }

  /** Platform dispatcher assigns an operator org to the case. */
  async assignOperator(
    caseId: string,
    operatorOrgId: string,
    actor?: CaseActor,
  ) {
    const updated = await this.prisma.serviceCase.update({
      where: { id: caseId },
      data: { assignedOperatorOrgId: operatorOrgId },
      select: selectServiceCase,
    });

    const org = await this.prisma.organization.findUnique({
      where: { id: operatorOrgId },
      select: { name: true },
    });
    const operatorName = org?.name ?? `Org #${operatorOrgId}`;

    await this.logEvent(caseId, 'operator_assigned', {
      to: operatorName,
      actor,
    });

    // Mirror the assignment onto the work order's history when the case has
    // already been converted, so its timeline reflects the operator handoff.
    const sc = await this.prisma.serviceCase.findUnique({
      where: { id: caseId },
      select: { workOrderId: true },
    });
    if (sc?.workOrderId) {
      await this.prisma.workOrderEvent.create({
        data: {
          workOrderId: sc.workOrderId,
          type: 'assigned_operator',
          toValue: operatorName,
        },
      });
    }

    return updated;
  }

  /** Whether the caller belongs to the platform org (for dispatch actions). */
  async isPlatform(userId: string): Promise<boolean> {
    const org = await this.resolveOrgProfile(userId);
    return org.type === 'platform';
  }

  /**
   * All operator orgs a dispatcher can assign to a case, flagged with whether
   * each expressed interest — so dispatch isn't limited to interested ones.
   */
  async assignableOperators(caseId: string) {
    const sc = await this.prisma.serviceCase.findUnique({
      where: { id: caseId },
      select: { interestedOperatorIds: true },
    });
    const interested = new Set(sc?.interestedOperatorIds ?? []);

    const orgs = await this.prisma.organization.findMany({
      where: { type: 'operator' },
      select: { id: true, name: true, region: true },
      orderBy: { name: 'asc' },
    });
    return orgs.map((o) => ({ ...o, interested: interested.has(o.id) }));
  }

  /** Operator orgs (id, name, region) that opted in to the given case. */
  async interestedOperators(caseId: string) {
    const sc = await this.prisma.serviceCase.findUnique({
      where: { id: caseId },
      select: { interestedOperatorIds: true },
    });
    if (!sc || sc.interestedOperatorIds.length === 0) return [];

    return this.prisma.organization.findMany({
      where: { id: { in: sc.interestedOperatorIds } },
      select: { id: true, name: true, region: true },
    });
  }

  async update(id: string, dto: UpdateCaseDto, actor?: CaseActor) {
    const updated = await this.prisma.serviceCase.update({
      where: { id },
      data: dto,
      select: selectServiceCase,
    });
    await this.logEvent(id, 'updated', { actor });
    return updated;
  }

  async updateStatus(id: string, status: string, actor?: CaseActor) {
    const current = await this.prisma.serviceCase.findUnique({
      where: { id },
      select: { status: true },
    });
    const updated = await this.prisma.serviceCase.update({
      where: { id },
      data: { status },
      select: selectServiceCase,
    });
    await this.logEvent(id, 'status_changed', {
      from: current?.status ?? null,
      to: status,
      actor,
    });
    return updated;
  }

  delete(id: string) {
    return this.prisma.serviceCase.delete({
      where: { id },
    });
  }

  /**
   * Converts a service case into a work order. The work order is created in
   * the same organization as the case, then the case is updated to reference
   * the new work order and marked as 'Converted'.
   */
  async convert(userId: string, id: string) {
    const scope = await this.orgScope(userId);

    const serviceCase = await this.prisma.serviceCase.findFirst({
      where: { id, ...scope },
    });

    if (!serviceCase) {
      throw new NotFoundException('Service case not found');
    }

    const due = serviceCase.createdAt.toISOString().slice(0, 10);

    // Actor for the work order's opening history entry.
    const actor = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });
    const actorName = actor
      ? `${actor.firstName} ${actor.lastName}`
      : undefined;

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

      // Seed the work order's history so its timeline starts at creation.
      await tx.workOrderEvent.create({
        data: {
          workOrderId: workOrder.id,
          type: 'created',
          toValue: 'Open',
          note: `Converted from case #${serviceCase.id}`,
          actorId: userId,
          actorName,
        },
      });

      // Record the conversion on the case's own history too.
      await tx.serviceCaseEvent.create({
        data: {
          serviceCaseId: serviceCase.id,
          type: 'converted',
          toValue: 'Converted',
          note: `Work order #${workOrder.id}`,
          actorId: userId,
          actorName,
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
