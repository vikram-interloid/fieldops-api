import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import configuration from './core/config/configuration';
import jwtConfig from './core/config/jwt.config';
import { PrismaModule } from './core/database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/users/users.module';
import { OrganizationModule } from './modules/organizations/organizations.module';
import { LocationModule } from './modules/locations/locations.module';
import { OperatorModule } from './modules/operators/operators.module';
import { CustomerModule } from './modules/customers/customers.module';
import { TechnicianModule } from './modules/technicians/technicians.module';
import { AssetModule } from './modules/assets/assets.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { WorkOrderModule } from './modules/work-orders/work-orders.module';
import { SlaModule } from './modules/sla/sla.module';
import { ServiceCaseModule } from './modules/service-cases/service-cases.module';
import { NotificationModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration, jwtConfig],
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    OrganizationModule,
    LocationModule,
    OperatorModule,
    CustomerModule,
    TechnicianModule,
    AssetModule,
    InventoryModule,
    WorkOrderModule,
    SlaModule,
    ServiceCaseModule,
    NotificationModule,
  ],
})
export class AppModule { }
