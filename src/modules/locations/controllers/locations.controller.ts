import { Controller, Get, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import type { AuthUser } from 'src/modules/auth/interfaces/auth-user.interface';
import { LocationsService } from '../services/locations.service';

@Controller('locations')
@UseGuards(JwtAuthGuard)
export class LocationsController {
    constructor(private readonly locationsService: LocationsService) {}

    @Get()
    findAll(@CurrentUser() user: AuthUser) {
        return this.locationsService.findAll(user.userId);
    }
}
