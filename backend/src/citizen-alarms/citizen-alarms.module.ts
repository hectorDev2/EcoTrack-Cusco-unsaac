import { Module } from '@nestjs/common';
import { CitizenAlarmsController } from './citizen-alarms.controller';
import { CitizenAlarmsService } from './citizen-alarms.service';
import { CitizenAlarmsScheduler } from './citizen-alarms.scheduler';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [CitizenAlarmsController],
  providers: [CitizenAlarmsService, CitizenAlarmsScheduler],
})
export class CitizenAlarmsModule {}
