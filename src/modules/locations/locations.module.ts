import { Module } from '@nestjs/common';

import { LocationsController } from './controllers/locations.controller';
import { LocationsService } from './services/locations.service';
import { LocationsRepository } from './repositories/locations.repository';

@Module({
  controllers: [LocationsController],
  providers: [LocationsRepository, LocationsService],
  exports: [LocationsRepository, LocationsService],
})
export class LocationModule {}
