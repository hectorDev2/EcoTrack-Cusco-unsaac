import { Module } from '@nestjs/common';
import { DemoController } from './demo.controller';
import { DemoSimulationService } from './demo-simulation.service';
import { RoutesModule } from '../routes/routes.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DemoStateModule } from './demo-state.module';

@Module({
  imports: [RoutesModule, NotificationsModule, DemoStateModule],
  controllers: [DemoController],
  providers: [DemoSimulationService],
})
export class DemoModule {}
