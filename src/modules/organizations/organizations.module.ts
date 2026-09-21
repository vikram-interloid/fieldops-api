import { Module } from '@nestjs/common';
import { OrganizationsController } from './controllers/organizations.controller';
import { AdminOrganizationsController } from './controllers/admin-organizations.controller';
import { OrganizationsService } from './services/organizations.service';
import { OrganizationsRepository } from './repositories/organizations.repository';

@Module({
  controllers: [OrganizationsController, AdminOrganizationsController],
  providers: [OrganizationsRepository, OrganizationsService],
})
export class OrganizationModule {}
