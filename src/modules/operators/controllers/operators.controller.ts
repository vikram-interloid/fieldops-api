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
import { OperatorsService } from '../services/operators.service';
import { CreateOperatorDto } from '../dto/create-operator.dto';
import { UpdateOperatorDto } from '../dto/update-operator.dto';
import { CreateServiceAreaDto } from '../dto/create-service-area.dto';

@Controller('operators')
@UseGuards(JwtAuthGuard)
export class OperatorsController {
  constructor(private readonly operatorsService: OperatorsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.operatorsService.findAll(user.userId);
  }

  @Get(':id')
  findById(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.operatorsService.findById(user.userId, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOperatorDto) {
    return this.operatorsService.create(user.userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOperatorDto,
  ) {
    return this.operatorsService.update(user.userId, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.operatorsService.delete(user.userId, id);
  }

  @Post(':id/service-areas')
  addServiceArea(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateServiceAreaDto,
  ) {
    return this.operatorsService.addServiceArea(user.userId, id, dto);
  }

  @Delete('service-areas/:areaId')
  removeServiceArea(
    @CurrentUser() user: AuthUser,
    @Param('areaId', ParseUUIDPipe) areaId: string,
  ) {
    return this.operatorsService.removeServiceArea(user.userId, areaId);
  }
}
