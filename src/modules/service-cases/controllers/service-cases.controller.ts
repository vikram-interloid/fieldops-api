import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
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

@Controller('service-cases')
@UseGuards(JwtAuthGuard)
export class ServiceCasesController {
    constructor(private readonly serviceCasesService: ServiceCasesService) {}

    @Get()
    findAll(@CurrentUser() user: AuthUser) {
        return this.serviceCasesService.findAll(user.userId);
    }

    @Get(':id')
    findById(
        @CurrentUser() user: AuthUser,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.serviceCasesService.findById(user.userId, id);
    }

    @Post()
    create(
        @CurrentUser() user: AuthUser,
        @Body() dto: CreateCaseDto,
    ) {
        return this.serviceCasesService.create(user.userId, dto);
    }

    @Patch(':id')
    update(
        @CurrentUser() user: AuthUser,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCaseDto,
    ) {
        return this.serviceCasesService.update(user.userId, id, dto);
    }

    @Patch(':id/status')
    setStatus(
        @CurrentUser() user: AuthUser,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: SetStatusDto,
    ) {
        return this.serviceCasesService.setStatus(user.userId, id, dto);
    }

    @Post(':id/convert')
    convert(
        @CurrentUser() user: AuthUser,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.serviceCasesService.convert(user.userId, id);
    }

    @Delete(':id')
    remove(
        @CurrentUser() user: AuthUser,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.serviceCasesService.delete(user.userId, id);
    }
}
