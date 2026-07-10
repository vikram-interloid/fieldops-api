import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/core/database/prisma.service';
import { CreateTechnicianDto } from '../dto/create-technician.dto';
import { UpdateTechnicianDto } from '../dto/update-technician.dto';

/** Who performed a technician action, for the history trail. */
export type TechnicianActor = { userId: number; role?: string };

const selectTechnician = {
    id: true,
    name: true,
    role: true,
    status: true,
    activeJobs: true,
    rating: true,
    skills: true,
    email: true,
    phone: true,
    employeeId: true,
    region: true,
    department: true,
    hireDate: true,
    createdAt: true,
    updatedAt: true,
};

@Injectable()
export class TechniciansRepository {
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
     * Technician visibility:
     *  - platform staff (FieldOps) manage everyone → 'all' (no org filter);
     *  - everyone else sees their own org plus the shared platform org, whose
     *    technicians every operator can dispatch.
     * Own-org mutations still scope via `findById`.
     */
    private async resolveVisibleOrgIds(
        userId: number,
    ): Promise<number[] | 'all'> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                organizationId: true,
                organization: { select: { type: true } },
            },
        });
        if (!user) throw new NotFoundException('User organization not found');
        if (user.organization?.type === 'platform') return 'all';

        const platform = await this.prisma.organization.findFirst({
            where: { type: 'platform' },
            select: { id: true },
        });
        const ids = new Set<number>([user.organizationId]);
        if (platform) ids.add(platform.id);
        return [...ids];
    }

    async findAll(userId: number) {
        const scope = await this.resolveVisibleOrgIds(userId);

        return this.prisma.technician.findMany({
            where: scope === 'all' ? {} : { organizationId: { in: scope } },
            select: selectTechnician,
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(userId: number, id: number) {
        const organizationId = await this.resolveOrganizationId(userId);

        return this.prisma.technician.findFirst({
            where: { id, organizationId },
            select: selectTechnician,
        });
    }

    /** Technician with its full history timeline (own-org scoped). */
    async findDetail(userId: number, id: number) {
        const organizationId = await this.resolveOrganizationId(userId);

        return this.prisma.technician.findFirst({
            where: { id, organizationId },
            select: {
                ...selectTechnician,
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
    }

    /** Appends one entry to a technician's history, resolving the actor name. */
    private async logEvent(
        technicianId: number,
        type: string,
        opts: {
            from?: string | null;
            to?: string | null;
            note?: string;
            actor?: TechnicianActor;
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
        await this.prisma.technicianEvent.create({
            data: {
                technicianId,
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
        userId: number,
        dto: CreateTechnicianDto,
        actor?: TechnicianActor,
    ) {
        const organizationId = await this.resolveOrganizationId(userId);

        const created = await this.prisma.technician.create({
            data: { ...dto, organizationId },
            select: selectTechnician,
        });
        await this.logEvent(created.id, 'created', {
            to: created.status,
            actor: actor ?? { userId },
        });
        return created;
    }

    async update(
        id: number,
        dto: UpdateTechnicianDto,
        actor?: TechnicianActor,
    ) {
        const before = await this.prisma.technician.findUnique({
            where: { id },
            select: { status: true },
        });
        const updated = await this.prisma.technician.update({
            where: { id },
            data: dto,
            select: selectTechnician,
        });
        // A status change gets its own event; other edits log as 'updated'.
        if (before && before.status !== updated.status) {
            await this.logEvent(id, 'status_changed', {
                from: before.status,
                to: updated.status,
                actor,
            });
        } else {
            await this.logEvent(id, 'updated', { actor });
        }
        return updated;
    }

    delete(id: number) {
        return this.prisma.technician.delete({
            where: { id },
        });
    }
}
