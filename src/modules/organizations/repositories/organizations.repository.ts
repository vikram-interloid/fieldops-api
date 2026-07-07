import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/core/database/prisma.service";
import { CreateOrganizationDto } from "../dto/create-organization.dto";
import { UpdateOrganizationDto } from "../dto/update-organization.dto";

const selectOrganization = {
    id: true,
    name: true,
    industry: true,
    createdAt: true,
    updatedAt: true,
}

@Injectable()
export class OrganizationsRepository {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    findAll() {
        return this.prisma.organization.findMany({
            select: selectOrganization,
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    findById(id: number) {
        return this.prisma.organization.findUnique({
            select: selectOrganization,
            where: {
                id: id,
            },
        });
    }

    async findByUserId(userId: number) {
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
        id: number,
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

    delete(id: number) {
        return this.prisma.organization.delete({
            where: {
                id: id,
            },
        });
    }
}
