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
import { WorkOrdersService } from '../services/work-orders.service';
import { CreateWorkOrderDto } from '../dto/create-work-order.dto';
import { UpdateWorkOrderDto } from '../dto/update-work-order.dto';
import { SetStatusDto } from '../dto/set-status.dto';
import { AssignDto } from '../dto/assign.dto';

/** Maps the authenticated user to the actor recorded on history events. */
function actorOf(user: AuthUser) {
    return { userId: user.userId, role: user.roles?.[0] };
}

@Controller('work-orders')
@UseGuards(JwtAuthGuard)
export class WorkOrdersController {
    constructor(private readonly workOrdersService: WorkOrdersService) {}

    @Get()
    findAll(@CurrentUser() user: AuthUser) {
        return this.workOrdersService.findAll(user.userId);
    }

    @Get(':id')
    findById(
        @CurrentUser() user: AuthUser,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.workOrdersService.findById(user.userId, id);
    }

    @Get(':id/detail')
    findDetail(
        @CurrentUser() user: AuthUser,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.workOrdersService.findDetail(user.userId, id);
    }

    @Post()
    create(
        @CurrentUser() user: AuthUser,
        @Body() dto: CreateWorkOrderDto,
    ) {
        return this.workOrdersService.create(user.userId, dto, actorOf(user));
    }

    @Patch(':id')
    update(
        @CurrentUser() user: AuthUser,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateWorkOrderDto,
    ) {
        return this.workOrdersService.update(user.userId, id, dto, actorOf(user));
    }

    @Patch(':id/status')
    setStatus(
        @CurrentUser() user: AuthUser,
        @Param('id', ParseIntPipe) id: number,
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
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: AssignDto,
    ) {
        return this.workOrdersService.assign(user.userId, id, dto, actorOf(user));
    }

    @Patch(':id/accept')
    accept(
        @CurrentUser() user: AuthUser,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.workOrdersService.accept(user.userId, id, actorOf(user));
    }

    @Delete(':id')
    remove(
        @CurrentUser() user: AuthUser,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.workOrdersService.delete(user.userId, id);
    }
}
