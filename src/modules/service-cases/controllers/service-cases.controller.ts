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
import { ServiceCasesService } from '../services/service-cases.service';
import { CreateCaseDto } from '../dto/create-case.dto';
import { UpdateCaseDto } from '../dto/update-case.dto';
import { SetStatusDto } from '../dto/set-status.dto';
import { AssignOperatorDto } from '../dto/assign-operator.dto';

import { Includes } from 'src/common/decorators/includes.decorator';

const SERVICE_CASE_ALLOWED_INCLUDES = [
  'customer',
  'workorder',
  'attachments',
  'events',
];

/** Maps the authenticated user to the actor recorded on history events. */
function actorOf(user: AuthUser) {
  return { userId: user.userId, role: user.roles?.[0] };
}

@Controller('service-cases')
@UseGuards(JwtAuthGuard)
export class ServiceCasesController {
  constructor(private readonly serviceCasesService: ServiceCasesService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Includes(SERVICE_CASE_ALLOWED_INCLUDES) includes: string[],
  ) {
    return this.serviceCasesService.findAll(user.userId, includes);
  }

  @Get('available')
  findAvailable(
    @CurrentUser() user: AuthUser,
    @Includes(SERVICE_CASE_ALLOWED_INCLUDES) includes: string[],
  ) {
    return this.serviceCasesService.findAvailable(user.userId, includes);
  }

  // Cases assigned to the caller operator org (any status).
  @Get('assigned')
  findAssigned(
    @CurrentUser() user: AuthUser,
    @Includes(SERVICE_CASE_ALLOWED_INCLUDES) includes: string[],
  ) {
    return this.serviceCasesService.findAssigned(user.userId, includes);
  }

  @Get(':id')
  findById(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Includes(SERVICE_CASE_ALLOWED_INCLUDES) includes: string[],
  ) {
    return this.serviceCasesService.findById(user.userId, id, includes);
  }

  @Get(':id/detail')
  findDetail(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.serviceCasesService.findDetail(user.userId, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCaseDto) {
    return this.serviceCasesService.create(user.userId, dto, actorOf(user));
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCaseDto,
  ) {
    return this.serviceCasesService.update(user.userId, id, dto, actorOf(user));
  }

  @Patch(':id/status')
  setStatus(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetStatusDto,
  ) {
    return this.serviceCasesService.setStatus(
      user.userId,
      id,
      dto,
      actorOf(user),
    );
  }

  @Post(':id/interest')
  expressInterest(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.serviceCasesService.expressInterest(
      user.userId,
      id,
      actorOf(user),
    );
  }

  @Get(':id/interested-operators')
  interestedOperators(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.serviceCasesService.interestedOperators(user.userId, id);
  }

  @Get(':id/assignable-operators')
  assignableOperators(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.serviceCasesService.assignableOperators(user.userId, id);
  }

  @Post(':id/assign-operator')
  assignOperator(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignOperatorDto,
  ) {
    return this.serviceCasesService.assignOperator(
      user.userId,
      id,
      dto.operatorOrgId,
      actorOf(user),
    );
  }

  @Post(':id/convert')
  convert(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.serviceCasesService.convert(user.userId, id);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.serviceCasesService.delete(user.userId, id);
  }
}
