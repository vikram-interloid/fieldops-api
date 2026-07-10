import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { UsersRepository } from "../repositories/users.repository";
import { UserResponse } from "../responses/user.response";
import { AUTH_MESSAGES } from "src/modules/auth/constants/auth.constants";
import { UpdateUserDto } from "../dto/update-user.dto";
import { CreateOrgUserDto } from "../dto/create-org-user.dto";
import { PasswordService } from "src/modules/auth/services/password.service";
import { RoleEnum } from "src/modules/auth/enums/role.enum";

/** Prisma row shape returned by the repository's org-user selects. */
type OrgUserRow = {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    isActive: boolean;
    isOrgAdmin?: boolean;
    userRoles?: { role: { name: string } }[];
};

@Injectable()
export class UsersService {
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly passwordService: PasswordService,
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

    // ---- Org-scoped user management ---------------------------------------

    private toOrgUser(row: OrgUserRow): UserResponse {
        return {
            id: row.id,
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            phone: row.phone,
            isActive: row.isActive,
            isOrgAdmin: row.isOrgAdmin ?? false,
            role: row.userRoles?.[0]?.role.name ?? null,
        };
    }

    /** Every user in the caller's organization (any member may view). */
    async listOrgUsers(userId: number): Promise<UserResponse[]> {
        const { organizationId } = await this.usersRepository.getCaller(userId);
        const rows = await this.usersRepository.findAllInOrg(organizationId);
        return rows.map((r) => this.toOrgUser(r as OrgUserRow));
    }

    /** Add a user to the caller's org — org admins only. */
    async createOrgUser(
        userId: number,
        dto: CreateOrgUserDto,
    ): Promise<UserResponse> {
        const caller = await this.usersRepository.getCaller(userId);
        if (!caller.isOrgAdmin) {
            throw new ForbiddenException(
                'Only an organization admin can add users.',
            );
        }

        const existing = await this.usersRepository.findByEmail(dto.email);
        if (existing) {
            throw new ForbiddenException(AUTH_MESSAGES.EMAIL_ALREADY_EXISTS);
        }

        const passwordHash = await this.passwordService.hash(dto.password);
        const roleName =
            dto.role ?? (await this.defaultRole(caller.organizationId));

        const row = await this.usersRepository.createInOrg(
            caller.organizationId,
            {
                firstName: dto.firstName,
                lastName: dto.lastName,
                email: dto.email,
                phone: dto.phone,
                passwordHash,
                isOrgAdmin: dto.isOrgAdmin ?? false,
            },
            roleName,
        );
        return this.toOrgUser(row as OrgUserRow);
    }

    /** Deactivate a user in the caller's org — org admins only. */
    async deleteOrgUser(userId: number, id: number): Promise<UserResponse> {
        const caller = await this.usersRepository.getCaller(userId);
        if (!caller.isOrgAdmin) {
            throw new ForbiddenException(
                'Only an organization admin can remove users.',
            );
        }
        if (id === userId) {
            throw new ForbiddenException('You cannot remove your own account.');
        }
        const row = await this.usersRepository.deactivateInOrg(
            caller.organizationId,
            id,
        );
        return this.toOrgUser(row as OrgUserRow);
    }

    /** Member role default: Customer for customer orgs, else Technician. */
    private async defaultRole(organizationId: number): Promise<string> {
        const type = await this.usersRepository.orgType(organizationId);
        return type === 'customer' ? RoleEnum.CUSTOMER : RoleEnum.TECHNICIAN;
    }
}
