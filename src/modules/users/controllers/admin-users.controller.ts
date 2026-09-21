import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import type { AuthUser } from 'src/modules/auth/interfaces/auth-user.interface';
import { UsersService } from '../services/users.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { CreateOrgUserDto } from '../dto/create-org-user.dto';

/**
 * Org-user management for tenant admins. Every action is scoped to the
 * caller's organization; mutations additionally require `isOrgAdmin`.
 */
@Controller('admin/users')
@UseGuards(JwtAuthGuard)
export class AdminUsersController {
  constructor(private readonly usersSerivce: UsersService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.usersSerivce.listOrgUsers(user.userId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrgUserDto) {
    return this.usersSerivce.createOrgUser(user.userId, dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.usersSerivce.update(id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersSerivce.deleteOrgUser(user.userId, id);
  }
}
