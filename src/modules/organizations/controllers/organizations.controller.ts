import {
    Controller,
    Get,
    UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import type { AuthUser } from 'src/modules/auth/interfaces/auth-user.interface';
import { OrganizationsService } from '../services/organizations.service';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
    constructor(
        private readonly organizationsService: OrganizationsService,
    ) { }

    @Get('current')
    getCurrent(
        @CurrentUser() user: AuthUser,
    ) {
        return this.organizationsService.findCurrent(
            user.userId,
        );
    }
}
