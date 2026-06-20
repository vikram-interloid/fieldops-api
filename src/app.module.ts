import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import configuration from './core/config/configuration';
import jwtConfig from './core/config/jwt.config';
import { PrismaModule } from './core/database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration, jwtConfig],
    }),
    PrismaModule,
    AuthModule
  ],
})
export class AppModule { }
