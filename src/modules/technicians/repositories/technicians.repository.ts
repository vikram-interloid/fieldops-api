import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/core/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateTechnicianDto } from '../dto/create-technician.dto';
import { UpdateTechnicianDto } from '../dto/update-technician.dto';

/** Who performed a technician action, for the history trail. */
export type TechnicianActor = { userId: string; role?: string };

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
   * Technician visibility:
   *  - platform staff (FieldOps) manage everyone → 'all' (no org filter);
   *  - everyone else sees their own org plus the shared platform org, whose
   *    technicians every operator can dispatch.
   * Own-org mutations still scope via `findById`.
   */
  private async resolveVisibleOrgIds(
    userId: string,
  ): Promise<string[] | 'all'> {
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
    const ids = new Set<string>([user.organizationId]);
    if (platform) ids.add(platform.id);
    return [...ids];
  }

  async findAll(userId: string) {
    const scope = await this.resolveVisibleOrgIds(userId);

    return this.prisma.technician.findMany({
      where: scope === 'all' ? {} : { organizationId: { in: scope } },
      select: selectTechnician,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(userId: string, id: string) {
    const organizationId = await this.resolveOrganizationId(userId);

    return this.prisma.technician.findFirst({
      where: { id, organizationId },
      select: selectTechnician,
    });
  }

  /** Technician with its full history timeline (own-org scoped). */
  async findDetail(userId: string, id: string) {
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
    technicianId: string,
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

  /** Blocks unverified self-registered tenants from mutating the workforce. */
  private async assertOrgVerified(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        organization: {
          select: { type: true, verificationStatus: true },
        },
      },
    });
    if (
      user?.organization?.type !== 'platform' &&
      user?.organization?.verificationStatus !== 'verified'
    ) {
      throw new ForbiddenException(
        'Your organization is pending verification. You can add technicians once a FieldOps admin verifies your account.',
      );
    }
  }

  /** Ensures any skills referenced on the technician exist in the skills catalog table. */
  private async syncSkills(organizationId: string, skills?: string[]): Promise<void> {
    if (!skills || skills.length === 0) return;
    for (const raw of skills) {
      const name = raw.trim();
      if (!name) continue;
      await this.prisma.skill.upsert({
        where: { organizationId_name: { organizationId, name } },
        create: { organizationId, name },
        update: {},
      });
    }
  }

  /** Creates or links a user record for the technician and assigns the Technician role. */
  private async syncTechnicianUser(
    technicianId: string,
    organizationId: string,
    name: string,
    email?: string | null,
    phone?: string | null,
    rawPassword?: string,
  ): Promise<void> {
    if (!email || !email.trim()) return;
    const normalizedEmail = email.trim().toLowerCase();

    let techRole = await this.prisma.role.findUnique({
      where: { name: 'Technician' },
      select: { id: true },
    });
    if (!techRole) {
      techRole = await this.prisma.role.create({
        data: { name: 'Technician', description: 'Field Technician' },
        select: { id: true },
      });
    }

    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Technician';
    const lastName = nameParts.slice(1).join(' ') || '';

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { userRoles: true },
    });

    if (existingUser) {
      await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          technicianId,
          firstName: existingUser.firstName || firstName,
          lastName: existingUser.lastName || lastName,
          phone: phone?.trim() || existingUser.phone,
          isActive: true,
        },
      });

      const hasTechRole = existingUser.userRoles.some((ur) => ur.roleId === techRole.id);
      if (!hasTechRole) {
        await this.prisma.userRole.create({
          data: {
            userId: existingUser.id,
            roleId: techRole.id,
          },
        }).catch(() => {});
      }
    } else {
      const password = rawPassword?.trim() || 'Password123!';
      const passwordHash = await bcrypt.hash(password, 10);

      await this.prisma.user.create({
        data: {
          firstName,
          lastName,
          email: normalizedEmail,
          phone: phone?.trim() || null,
          passwordHash,
          organizationId,
          technicianId,
          isActive: true,
          userRoles: {
            create: { roleId: techRole.id },
          },
        },
      });
    }
  }

  async create(
    userId: string,
    dto: CreateTechnicianDto,
    actor?: TechnicianActor,
  ) {
    await this.assertOrgVerified(userId);
    const organizationId = await this.resolveOrganizationId(userId);

    const { password, ...technicianData } = dto;

    const created = await this.prisma.technician.create({
      data: { ...technicianData, organizationId },
      select: selectTechnician,
    });
    await this.syncSkills(organizationId, dto.skills);
    await this.syncTechnicianUser(
      created.id,
      organizationId,
      dto.name,
      dto.email,
      dto.phone,
      password,
    );
    await this.logEvent(created.id, 'created', {
      to: created.status,
      actor: actor ?? { userId },
    });
    return created;
  }

  async update(id: string, dto: UpdateTechnicianDto, actor?: TechnicianActor) {
    const before = await this.prisma.technician.findUnique({
      where: { id },
      select: { status: true, organizationId: true },
    });
    const updated = await this.prisma.technician.update({
      where: { id },
      data: dto,
      select: selectTechnician,
    });
    if (before && dto.skills) {
      await this.syncSkills(before.organizationId, dto.skills);
    }

    if (dto.name || dto.email || dto.phone !== undefined) {
      const linkedUser = await this.prisma.user.findFirst({
        where: { technicianId: id },
      });
      if (linkedUser) {
        const updateData: { firstName?: string; lastName?: string; email?: string; phone?: string | null } = {};
        if (dto.email) updateData.email = dto.email.trim().toLowerCase();
        if (dto.phone !== undefined) updateData.phone = dto.phone?.trim() || null;
        if (dto.name) {
          const nameParts = dto.name.trim().split(/\s+/);
          updateData.firstName = nameParts[0];
          updateData.lastName = nameParts.slice(1).join(' ') || '';
        }
        await this.prisma.user.update({
          where: { id: linkedUser.id },
          data: updateData,
        }).catch(() => {});
      }
    }

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

  async delete(id: string) {
    await this.prisma.user.updateMany({
      where: { technicianId: id },
      data: { isActive: false, technicianId: null },
    });
    return this.prisma.technician.delete({
      where: { id },
    });
  }
}
