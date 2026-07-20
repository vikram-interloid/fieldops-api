import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/core/database/prisma.service";
import { CreateOrganizationDto } from "../dto/create-organization.dto";
import { UpdateOrganizationDto } from "../dto/update-organization.dto";

const selectOrganization = {
    id: true,
    name: true,
    industry: true,
    type: true,
    region: true,
    categories: true,
    verificationStatus: true,
    verifiedAt: true,
    verificationNote: true,
    createdAt: true,
    updatedAt: true,
    locations: {
        select: {
            name: true,
            address: true,
            city: true,
            region: true,
            state: true,
            country: true,
            type: true,
        },
    },
}

@Injectable()
export class OrganizationsRepository {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    findAll(status?: string) {
        return this.prisma.organization.findMany({
            where: status ? { verificationStatus: status } : undefined,
            select: selectOrganization,
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    /** The org type for a user (used to gate platform-only actions). */
    async orgTypeForUser(userId: string): Promise<string | null> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { organization: { select: { type: true } } },
        });
        return user?.organization?.type ?? null;
    }

    setVerification(id: string, status: string, note?: string) {
        return this.prisma.organization.update({
            where: { id },
            data: {
                verificationStatus: status,
                verifiedAt: status === 'verified' ? new Date() : null,
                verificationNote: note ?? null,
            },
            select: selectOrganization,
        });
    }

    findById(id: string) {
        return this.prisma.organization.findUnique({
            select: selectOrganization,
            where: {
                id: id,
            },
        });
    }

    async findByUserId(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                organization: {
                    select: selectOrganization,
                },
            },
        });

        return user?.organization ?? null;
    }

    create(dto: CreateOrganizationDto) {
        return this.prisma.organization.create({
            data: dto,
            select: selectOrganization,
        });
    }

    update(
        id: string,
        dto: UpdateOrganizationDto,
    ) {
        return this.prisma.organization.update({
            where: {
                id: id,
            },
            data: dto,
            select: selectOrganization,
        });
    }

    delete(id: string) {
        return this.prisma.organization.delete({
            where: {
                id: id,
            },
        });
    }
}
