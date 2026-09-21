import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';

import { CreateTableViewDto } from '../dto/create-table-view.dto';
import { UpdateTableViewDto } from '../dto/update-table-view.dto';

@Injectable()
export class TableViewsService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, organizationId: true, isOrgAdmin: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Lists all views for the user or shared within their organization.
   */
  async listViews(userId: string, tableKey?: string) {
    const user = await this.resolveUser(userId);

    const where: Prisma.TableViewWhereInput = {
      organizationId: user.organizationId,
      OR: [{ userId: user.id }, { isShared: true }],
      ...(tableKey ? { tableKey } : {}),
    };

    return this.prisma.tableView.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Creates a new table view config.
   */
  async createView(userId: string, dto: CreateTableViewDto) {
    const user = await this.resolveUser(userId);

    // If this new view is marked default, unset default for other user views on this table
    if (dto.isDefault) {
      await this.prisma.tableView.updateMany({
        where: {
          userId: user.id,
          tableKey: dto.tableKey,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    return this.prisma.tableView.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        tableKey: dto.tableKey,
        name: dto.name,
        filters: dto.filters as Prisma.InputJsonValue,
        isDefault: Boolean(dto.isDefault),
        isShared: Boolean(dto.isShared),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Updates an existing table view config.
   */
  async updateView(userId: string, id: string, dto: UpdateTableViewDto) {
    const user = await this.resolveUser(userId);

    const view = await this.prisma.tableView.findFirst({
      where: { id, organizationId: user.organizationId },
    });

    if (!view) {
      throw new NotFoundException(`Table view with id ${id} not found`);
    }

    // Only creator or org admin can edit
    if (view.userId !== user.id && !user.isOrgAdmin) {
      throw new ForbiddenException(
        'You do not have permission to update this view',
      );
    }

    if (dto.isDefault) {
      await this.prisma.tableView.updateMany({
        where: {
          userId: user.id,
          tableKey: view.tableKey,
          isDefault: true,
          NOT: { id },
        },
        data: { isDefault: false },
      });
    }

    return this.prisma.tableView.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.filters !== undefined && {
          filters: dto.filters as Prisma.InputJsonValue,
        }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        ...(dto.isShared !== undefined && { isShared: dto.isShared }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Deletes an existing table view config.
   */
  async deleteView(userId: string, id: string) {
    const user = await this.resolveUser(userId);

    const view = await this.prisma.tableView.findFirst({
      where: { id, organizationId: user.organizationId },
    });

    if (!view) {
      throw new NotFoundException(`Table view with id ${id} not found`);
    }

    if (view.userId !== user.id && !user.isOrgAdmin) {
      throw new ForbiddenException(
        'You do not have permission to delete this view',
      );
    }

    await this.prisma.tableView.delete({
      where: { id },
    });

    return { message: 'Table view deleted successfully', id };
  }
}
