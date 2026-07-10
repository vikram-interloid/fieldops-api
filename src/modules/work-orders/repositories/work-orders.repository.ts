import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/core/database/prisma.service';
import { CreateWorkOrderDto } from '../dto/create-work-order.dto';
import { UpdateWorkOrderDto } from '../dto/update-work-order.dto';

/** Who performed a work-order action, for the history trail. */
export type WorkOrderActor = { userId: number; role?: string };

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

    /**
     * Read scope: platform staff (FieldOps) dispatch across every tenant, so
     * their reads aren't org-filtered; everyone else is scoped to their org.
     */
    private async orgScope(userId: number): Promise<{ organizationId?: number }> {
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

    async findAll(userId: number) {
        const scope = await this.orgScope(userId);

        return this.prisma.workOrder.findMany({
            where: scope,
            select: selectWorkOrder,
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(userId: number, id: number) {
        const scope = await this.orgScope(userId);

        return this.prisma.workOrder.findFirst({
            where: { id, ...scope },
            select: selectWorkOrder,
        });
    }

    /** Full detail: related entities, resolved operator/dispatcher + history. */
    async findDetail(userId: number, id: number) {
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
        workOrderId: number,
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

    async create(userId: number, dto: CreateWorkOrderDto, actor?: WorkOrderActor) {
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

    async update(id: number, dto: UpdateWorkOrderDto, actor?: WorkOrderActor) {
        const updated = await this.prisma.workOrder.update({
            where: { id },
            data: dto,
            select: selectWorkOrder,
        });
        await this.logEvent(id, 'updated', { actor });
        return updated;
    }

    async setStatus(id: number, status: string, actor?: WorkOrderActor) {
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

    async assign(id: number, technicianId: number, actor?: WorkOrderActor) {
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

    async accept(id: number, actor?: WorkOrderActor) {
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

    delete(id: number) {
        return this.prisma.workOrder.delete({
            where: { id },
        });
    }
}
