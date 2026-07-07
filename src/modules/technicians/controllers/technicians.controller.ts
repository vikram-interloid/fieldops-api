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
import { TechniciansService } from '../services/technicians.service';
import { CreateTechnicianDto } from '../dto/create-technician.dto';
import { UpdateTechnicianDto } from '../dto/update-technician.dto';

@Controller('technicians')
@UseGuards(JwtAuthGuard)
export class TechniciansController {
    constructor(private readonly techniciansService: TechniciansService) {}

    @Get()
    findAll(@CurrentUser() user: AuthUser) {
        return this.techniciansService.findAll(user.userId);
    }

    @Get(':id')
    findById(
        @CurrentUser() user: AuthUser,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.techniciansService.findById(user.userId, id);
    }

    @Post()
    create(
        @CurrentUser() user: AuthUser,
        @Body() dto: CreateTechnicianDto,
    ) {
        return this.techniciansService.create(user.userId, dto);
    }

    @Patch(':id')
    update(
        @CurrentUser() user: AuthUser,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateTechnicianDto,
    ) {
        return this.techniciansService.update(user.userId, id, dto);
    }

    @Delete(':id')
    remove(
        @CurrentUser() user: AuthUser,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.techniciansService.delete(user.userId, id);
    }
}
