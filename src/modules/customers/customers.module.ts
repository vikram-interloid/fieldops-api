import { Module } from '@nestjs/common';

import { CustomersController } from './controllers/customers.controller';
import { CustomerLocationsController } from './controllers/customer-locations.controller';
import { CustomersService } from './services/customers.service';
import { CustomerLocationsService } from './services/customer-locations.service';
import { CustomersRepository } from './repositories/customers.repository';
import { CustomerLocationsRepository } from './repositories/customer-locations.repository';

@Module({
    controllers: [CustomersController, CustomerLocationsController],
    providers: [
        CustomersRepository,
        CustomerLocationsRepository,
        CustomersService,
        CustomerLocationsService,
    ],
})
export class CustomerModule {}
