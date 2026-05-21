import { Module, Controller, Get } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { Public } from './common/decorators/public.decorator';

@Controller()
class HealthController {
  @Public()
  @Get()
  health() {
    return {
      status: 'ok',
      service: 'Eco Track Cusco API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ZonesModule } from './zones/zones.module';
import { PickupPointsModule } from './pickup-points/pickup-points.module';
import { CollectionSchedulesModule } from './collection-schedules/collection-schedules.module';
import { IncidentsModule } from './incidents/incidents.module';
import { RoutesModule } from './routes/routes.module';
import { CollectionsModule } from './collections/collections.module';
import { WasteTypesModule } from './waste-types/waste-types.module';
import { AdminModule } from './admin/admin.module';
import { VehiclesModule } from './vehicles/vehicles.module';
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
    RoutesModule,
    CollectionsModule,
    WasteTypesModule,
    AdminModule,
    VehiclesModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
