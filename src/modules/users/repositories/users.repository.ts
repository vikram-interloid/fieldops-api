import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/core/database/prisma.service";
import { UpdateUserDto } from "../dto/update-user.dto";

const selectUser = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    isActive: true,
    createdAt: true,
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

    findById(id: number) {
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
        id: number,
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
        id: number,
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
}