import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';
import { UserResponse } from '../responses/user.response';
import { AUTH_MESSAGES } from 'src/modules/auth/constants/auth.constants';
import { UpdateUserDto } from '../dto/update-user.dto';
import { CreateOrgUserDto } from '../dto/create-org-user.dto';
import { PasswordService } from 'src/modules/auth/services/password.service';
import { RoleEnum } from 'src/modules/auth/enums/role.enum';

import { CloudFrontSignerService } from 'src/core/storage/services/cloudfront-signer.service';

/** Prisma row shape returned by the repository's org-user selects. */
type OrgUserRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  avatarKey?: string | null;
  isActive: boolean;
  isOrgAdmin?: boolean;
  organizationId?: string | null;
  organization?: { id: string; name: string; type: string } | null;
  userRoles?: { role: { name: string } }[];
};

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordService: PasswordService,
    private readonly cloudFrontSigner: CloudFrontSignerService,
  ) {}

  private resolveAvatar(
    avatarKey?: string | null,
    avatarUrl?: string | null,
  ): string | null {
    const raw = avatarKey || avatarUrl;
    if (!raw) return null;
    if (raw.startsWith('data:')) return raw;
    return this.cloudFrontSigner.getSignedUrl(raw);
  }

  async findAll() {
    const users = await this.usersRepository.findAll();
    return users.map((u) => ({
      ...u,
      avatarUrl: this.resolveAvatar(u.avatarKey, u.avatarUrl),
    }));
  }

  async findById(id: string): Promise<UserResponse> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException(AUTH_MESSAGES.USER_NOT_FOUND);
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      avatarUrl: this.resolveAvatar(user.avatarKey, user.avatarUrl),
      avatarKey: user.avatarKey ?? null,
      isActive: user.isActive,
      isOrgAdmin: user.isOrgAdmin ?? false,
      role: user.userRoles?.[0]?.role.name ?? null,
    };
  }
  async update(id: string, dto: UpdateUserDto): Promise<UserResponse> {
    const user = await this.usersRepository.update(id, dto);

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      avatarUrl: this.resolveAvatar(user.avatarKey, user.avatarUrl),
      avatarKey: user.avatarKey ?? null,
      isActive: user.isActive,
      isOrgAdmin: user.isOrgAdmin ?? false,
      role: user.userRoles?.[0]?.role.name ?? null,
    };
  }

  async delete(id: string) {
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
      avatarUrl: this.resolveAvatar(row.avatarKey, row.avatarUrl),
      avatarKey: row.avatarKey ?? null,
      isActive: row.isActive,
      isOrgAdmin: row.isOrgAdmin ?? false,
      role: row.userRoles?.[0]?.role.name ?? null,
      organizationId: row.organizationId ?? row.organization?.id ?? null,
      organizationName: row.organization?.name ?? null,
      orgType: row.organization?.type ?? null,
    };
  }

  /** Every user in the caller's organization (or all users across application for platform admin). */
  async listOrgUsers(userId: string): Promise<UserResponse[]> {
    const caller = await this.usersRepository.getCaller(userId);
    const orgType = await this.usersRepository.orgType(caller.organizationId);

    if (orgType === 'platform') {
      const rows = await this.usersRepository.findAllAcrossAllOrgs();
      return rows.map((r) => this.toOrgUser(r as unknown as OrgUserRow));
    }

    const rows = await this.usersRepository.findAllInOrg(caller.organizationId);
    return rows.map((r) => this.toOrgUser(r as unknown as OrgUserRow));
  }

  /** Add a user to an organization — platform admin can add anywhere, tenant admins to their own org. */
  async createOrgUser(
    userId: string,
    dto: CreateOrgUserDto,
  ): Promise<UserResponse> {
    const caller = await this.usersRepository.getCaller(userId);
    const orgType = await this.usersRepository.orgType(caller.organizationId);
    const isPlatform = orgType === 'platform';

    if (!caller.isOrgAdmin && !isPlatform) {
      throw new ForbiddenException('Only an organization admin can add users.');
    }

    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ForbiddenException(AUTH_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    const targetOrgId =
      isPlatform && dto.organizationId
        ? dto.organizationId
        : caller.organizationId;

    const passwordHash = await this.passwordService.hash(dto.password);
    const roleName =
      dto.role ?? (await this.defaultRole(targetOrgId));

    const row = await this.usersRepository.createInOrg(
      targetOrgId,
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
    return this.toOrgUser(row as unknown as OrgUserRow);
  }

  /** Deactivate a user — platform admin can deactivate any user, tenant admins within their org. */
  async deleteOrgUser(userId: string, id: string): Promise<UserResponse> {
    const caller = await this.usersRepository.getCaller(userId);
    const orgType = await this.usersRepository.orgType(caller.organizationId);
    const isPlatform = orgType === 'platform';

    if (!caller.isOrgAdmin && !isPlatform) {
      throw new ForbiddenException(
        'Only an organization admin can remove users.',
      );
    }
    if (id === userId) {
      throw new ForbiddenException('You cannot remove your own account.');
    }

    if (isPlatform) {
      const user = await this.usersRepository.findById(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      await this.usersRepository.delete(id);
      return this.toOrgUser({
        ...user,
        isActive: false,
      } as unknown as OrgUserRow);
    }

    const row = await this.usersRepository.deactivateInOrg(
      caller.organizationId,
      id,
    );
    return this.toOrgUser(row as unknown as OrgUserRow);
  }

  /** Member role default: Customer for customer orgs, else Technician. */
  private async defaultRole(organizationId: string): Promise<string> {
    const type = await this.usersRepository.orgType(organizationId);
    return type === 'customer' ? RoleEnum.CUSTOMER : RoleEnum.TECHNICIAN;
  }
}
