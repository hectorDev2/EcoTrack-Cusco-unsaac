import { Module } from '@nestjs/common';
import { CitizenAlarmsController } from './citizen-alarms.controller';
import { CitizenAlarmsService } from './citizen-alarms.service';

@Module({
  controllers: [CitizenAlarmsController],
  providers: [CitizenAlarmsService],
})
export class CitizenAlarmsModule {}
