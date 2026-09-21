import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGaurd } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { RoleEnum } from 'src/modules/auth/enums/role.enum';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import type { AuthUser } from 'src/modules/auth/interfaces/auth-user.interface';
import { OrganizationsService } from '../services/organizations.service';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { UpdateOrganizationDto } from '../dto/update-organization.dto';
import { VerifyOrganizationDto } from '../dto/verify-organization.dto';

@Controller('admin/organizations')
@UseGuards(JwtAuthGuard, RolesGaurd)
@Roles(RoleEnum.ADMIN)
export class AdminOrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  findAll() {
    return this.organizationsService.findAll();
  }

  /** Platform-only: orgs awaiting/decided verification (with their location). */
  @Get('review')
  review(@CurrentUser() user: AuthUser, @Query('status') status?: string) {
    return this.organizationsService.findForReview(user.userId, status);
  }

  /** Platform-only: verify / reject a tenant after reviewing its location. */
  @Patch(':id/verification')
  setVerification(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyOrganizationDto,
  ) {
    return this.organizationsService.setVerification(
      user.userId,
      id,
      dto.status,
      dto.note,
    );
  }

  @Get(':id')
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateOrganizationDto) {
    return this.organizationsService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.delete(id);
  }
}
