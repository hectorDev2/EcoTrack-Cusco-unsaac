import { Module } from '@nestjs/common';
import { UserAlarmsController } from './user-alarms.controller';
import { UserAlarmsService } from './user-alarms.service';

@Module({
  controllers: [UserAlarmsController],
  providers: [UserAlarmsService],
})
export class UserAlarmsModule {}
