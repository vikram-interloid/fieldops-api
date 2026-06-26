import { Injectable, NotFoundException } from "@nestjs/common";
import { UsersRepository } from "../repositories/users.repository";
import { UserResponse } from "../responses/user.response";
import { AUTH_MESSAGES } from "src/modules/auth/constants/auth.constants";
import { UpdateUserDto } from "../dto/update-user.dto";

@Injectable()
export class UsersService {
    constructor(
        private readonly usersRepository: UsersRepository,
    ) { }

    async findAll() {
        return this.usersRepository.findAll();
    }

    async findById(id: number): Promise<UserResponse> {
        const user = await this.usersRepository.findById(id);

        if (!user) {
            throw new NotFoundException(
                AUTH_MESSAGES.USER_NOT_FOUND,
            );
        }

        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            isActive: user.isActive,
        };
    }
    async update(
        id: number,
        dto: UpdateUserDto,
    ): Promise<UserResponse> {
        const user = await this.usersRepository.update(id, dto);

        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            isActive: user.isActive,
        }
    }

    async delete(
        id: number,
    ) {
        await this.usersRepository.delete(id);
    }
}