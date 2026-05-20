import { IsString, IsOptional } from 'class-validator';

export class CreateScheduleDto {
  @IsString()
  zoneId: string;

  @IsString()
  wasteTypeId: string;

  @IsString()
  dayOfWeek: string;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;
}
