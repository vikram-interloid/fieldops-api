import {
    Body,
    Controller,
    Delete,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import type { AuthUser } from 'src/modules/auth/interfaces/auth-user.interface';
import { CustomerLocationsService } from '../services/customer-locations.service';
import { CreateLocationDto } from '../dto/create-location.dto';
import { UpdateLocationDto } from '../dto/update-location.dto';
import { CreateDeliveryPointDto } from '../dto/create-delivery-point.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class CustomerLocationsController {
    constructor(
        private readonly customerLocationsService: CustomerLocationsService,
    ) {}

    @Post('customers/:customerId/locations')
    createLocation(
        @CurrentUser() user: AuthUser,
        @Param('customerId', ParseUUIDPipe) customerId: string,
        @Body() dto: CreateLocationDto,
    ) {
        return this.customerLocationsService.createLocation(
            user.userId,
            customerId,
            dto,
        );
    }

    @Patch('locations/:id')
    updateLocation(
        @CurrentUser() user: AuthUser,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateLocationDto,
    ) {
        return this.customerLocationsService.updateLocation(
            user.userId,
            id,
            dto,
        );
    }

    @Delete('locations/:id')
    removeLocation(
        @CurrentUser() user: AuthUser,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.customerLocationsService.deleteLocation(user.userId, id);
    }

    @Post('locations/:locationId/delivery-points')
    createDeliveryPoint(
        @CurrentUser() user: AuthUser,
        @Param('locationId', ParseUUIDPipe) locationId: string,
        @Body() dto: CreateDeliveryPointDto,
    ) {
        return this.customerLocationsService.createDeliveryPoint(
            user.userId,
            locationId,
            dto,
        );
    }

    @Delete('delivery-points/:id')
    removeDeliveryPoint(
        @CurrentUser() user: AuthUser,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.customerLocationsService.deleteDeliveryPoint(
            user.userId,
            id,
        );
    }
}
