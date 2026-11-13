import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/core/database/prisma.service';
import { SkillResponse } from '../responses/skill.response';

const selectSkill = {
  id: true,
  name: true,
  organizationId: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class SkillsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveUserOrg(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        organizationId: true,
        organization: { select: { type: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User organization not found');
    }

    return user;
  }

  private async resolveVisibleOrgIds(
    userId: string,
  ): Promise<string[] | 'all'> {
    const user = await this.resolveUserOrg(userId);
    if (user.organization?.type === 'platform') return 'all';

    const platform = await this.prisma.organization.findFirst({
      where: { type: 'platform' },
      select: { id: true },
    });
    const ids = new Set<string>([user.organizationId]);
    if (platform) ids.add(platform.id);
    return [...ids];
  }

  async findAll(userId: string): Promise<SkillResponse[]> {
    const scope = await this.resolveVisibleOrgIds(userId);

    return this.prisma.skill.findMany({
      where: scope === 'all' ? {} : { organizationId: { in: scope } },
      select: selectSkill,
      orderBy: { name: 'asc' },
    });
  }

  async create(userId: string, rawName: string): Promise<SkillResponse> {
    const user = await this.resolveUserOrg(userId);
    const name = rawName.trim();

    // Check if skill already exists in this organization (case-insensitive)
    const existing = await this.prisma.skill.findFirst({
      where: {
        organizationId: user.organizationId,
        name: { equals: name, mode: 'insensitive' },
      },
      select: selectSkill,
    });

    if (existing) {
      return existing;
    }

    return this.prisma.skill.create({
      data: {
        organizationId: user.organizationId,
        name,
      },
      select: selectSkill,
    });
  }

  async delete(userId: string, identifier: string): Promise<void> {
    const user = await this.resolveUserOrg(userId);

    // Look up by id or by name
    const existing = await this.prisma.skill.findFirst({
      where: {
        organizationId: user.organizationId,
        OR: [{ id: identifier }, { name: { equals: identifier, mode: 'insensitive' } }],
      },
      select: { id: true },
    });

    if (!existing) {
      return;
    }

    await this.prisma.skill.delete({
      where: { id: existing.id },
    });
  }
}
