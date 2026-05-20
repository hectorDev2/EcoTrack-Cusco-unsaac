import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ZonesModule } from './zones/zones.module';
import { PickupPointsModule } from './pickup-points/pickup-points.module';
import { CollectionSchedulesModule } from './collection-schedules/collection-schedules.module';
import { IncidentsModule } from './incidents/incidents.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ZonesModule,
    PickupPointsModule,
    CollectionSchedulesModule,
    IncidentsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
