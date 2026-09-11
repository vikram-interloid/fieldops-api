import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/core/database/prisma.service";
import { UpdateUserDto } from "../dto/update-user.dto";

const selectUser = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    avatarUrl: true,
    isActive: true,
    createdAt: true,
}

/** Org-user listing shape: adds the tenant role + org-admin flag. */
const selectOrgUser = {
    ...selectUser,
    isOrgAdmin: true,
    userRoles: {
        select: { role: { select: { name: true } } },
    },
}
@Injectable()
export class UsersRepository {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    findAll() {
        return this.prisma.user.findMany({
            select: selectUser,
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    findById(id: string) {
        return this.prisma.user.findUnique({
            select: selectUser,
            where: {
                id: id,
            },
        });
    }

    findByEmail(email: string) {
        return this.prisma.user.findUnique({
            select: selectUser,
            where: {
                email: email,
            },
        });
    }

    async update(
        id: string,
        dto: UpdateUserDto,
    ) {
        return this.prisma.user.update({
            where: {
                id: id,
            },
            data: dto,
        });
    }

    async delete(
        id: string,
    ) {
        return this.prisma.user.update({
            where: {
                id: id,
            },
            data: {
                isActive: false,
            },
        });
    }

    // ---- Org-scoped user management ---------------------------------------

    /** The caller's organization + whether they own it (may manage users). */
    async getCaller(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { organizationId: true, isOrgAdmin: true },
        });
        if (!user) throw new NotFoundException('User organization not found');
        return user;
    }

    /** Organization kind, to pick a default role for new members. */
    async orgType(organizationId: string): Promise<string> {
        const org = await this.prisma.organization.findUnique({
            where: { id: organizationId },
            select: { type: true },
        });
        return org?.type ?? 'customer';
    }

    findAllInOrg(organizationId: string) {
        return this.prisma.user.findMany({
            where: { organizationId },
            select: selectOrgUser,
            orderBy: { createdAt: 'desc' },
        });
    }

    findByIdInOrg(organizationId: string, id: string) {
        return this.prisma.user.findFirst({
            where: { id, organizationId },
            select: selectOrgUser,
        });
    }

    async createInOrg(
        organizationId: string,
        data: {
            firstName: string;
            lastName: string;
            email: string;
            phone?: string;
            passwordHash: string;
            isOrgAdmin: boolean;
        },
        roleName: string,
    ) {
        const role = await this.prisma.role.findUnique({
            where: { name: roleName },
            select: { id: true },
        });
        if (!role) throw new NotFoundException(`${roleName} role not found`);

        return this.prisma.user.create({
            data: {
                ...data,
                organizationId,
                userRoles: { create: { roleId: role.id } },
            },
            select: selectOrgUser,
        });
    }

    async deactivateInOrg(organizationId: string, id: string) {
        const existing = await this.prisma.user.findFirst({
            where: { id, organizationId },
            select: { id: true },
        });
        if (!existing) throw new NotFoundException('User not found');

        return this.prisma.user.update({
            where: { id },
            data: { isActive: false },
            select: selectOrgUser,
        });
    }
}