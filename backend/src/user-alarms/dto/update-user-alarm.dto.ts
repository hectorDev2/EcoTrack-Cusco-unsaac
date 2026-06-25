import { PartialType } from '@nestjs/swagger';
import { CreateUserAlarmDto } from './create-user-alarm.dto';

export class UpdateUserAlarmDto extends PartialType(CreateUserAlarmDto) {}
