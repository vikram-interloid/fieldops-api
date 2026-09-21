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
import { WorkOrdersService } from '../services/work-orders.service';
import { CreateWorkOrderDto } from '../dto/create-work-order.dto';
import { UpdateWorkOrderDto } from '../dto/update-work-order.dto';
import { SetStatusDto } from '../dto/set-status.dto';
import { AssignDto } from '../dto/assign.dto';

import { Includes } from 'src/common/decorators/includes.decorator';

const WORK_ORDER_ALLOWED_INCLUDES = [
  'customer',
  'technician',
  'asset',
  'site',
  'location',
  'attachments',
  'events',
  'servicecase',
  'case',
  'operator',
];

/** Maps the authenticated user to the actor recorded on history events. */
function actorOf(user: AuthUser) {
  return { userId: user.userId, role: user.roles?.[0] };
}

@Controller('work-orders')
@UseGuards(JwtAuthGuard)
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Includes(WORK_ORDER_ALLOWED_INCLUDES) includes: string[],
  ) {
    return this.workOrdersService.findAll(user.userId, includes);
  }

  @Get(':id')
  findById(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Includes(WORK_ORDER_ALLOWED_INCLUDES) includes: string[],
  ) {
    return this.workOrdersService.findById(user.userId, id, includes);
  }

  @Get(':id/detail')
  findDetail(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.workOrdersService.findDetail(user.userId, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateWorkOrderDto) {
    return this.workOrdersService.create(user.userId, dto, actorOf(user));
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWorkOrderDto,
  ) {
    return this.workOrdersService.update(user.userId, id, dto, actorOf(user));
  }

  @Patch(':id/status')
  setStatus(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetStatusDto,
  ) {
    return this.workOrdersService.setStatus(
      user.userId,
      id,
      dto,
      actorOf(user),
    );
  }

  @Patch(':id/assign')
  assign(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignDto,
  ) {
    return this.workOrdersService.assign(user.userId, id, dto, actorOf(user));
  }

  @Patch(':id/accept')
  accept(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.workOrdersService.accept(user.userId, id, actorOf(user));
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.workOrdersService.delete(user.userId, id);
  }
}
