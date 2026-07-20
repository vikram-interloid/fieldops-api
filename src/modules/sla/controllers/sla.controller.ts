import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    Put,
    UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import type { AuthUser } from 'src/modules/auth/interfaces/auth-user.interface';
import { SlaService } from '../services/sla.service';
import { UpdatePoliciesDto } from '../dto/update-policies.dto';

@Controller('sla')
@UseGuards(JwtAuthGuard)
export class SlaController {
    constructor(private readonly slaService: SlaService) {}

    @Get('policies')
    getPolicies(@CurrentUser() user: AuthUser) {
        return this.slaService.getPolicies(user.userId);
    }

    @Put('policies')
    updatePolicies(
        @CurrentUser() user: AuthUser,
        @Body() dto: UpdatePoliciesDto,
    ) {
        return this.slaService.updatePolicies(user.userId, dto);
    }

    @Get('summary')
    getSummary(@CurrentUser() user: AuthUser) {
        return this.slaService.getSummary(user.userId);
    }

    @Post('work-orders/:id/respond')
    respond(
        @CurrentUser() user: AuthUser,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.slaService.respond(user.userId, id);
    }

    @Post('work-orders/:id/resolve')
    resolve(
        @CurrentUser() user: AuthUser,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.slaService.resolve(user.userId, id);
    }

    @Post('work-orders/:id/pause')
    pause(
        @CurrentUser() user: AuthUser,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.slaService.pause(user.userId, id);
    }

    @Post('work-orders/:id/resume')
    resume(
        @CurrentUser() user: AuthUser,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.slaService.resume(user.userId, id);
    }
}
