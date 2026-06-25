import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateScheduleDto {
  @ApiPropertyOptional({ description: 'Día de la semana', example: 'LUNES' })
  @IsOptional()
  @IsString()
  dayOfWeek?: string;

  @ApiPropertyOptional({
    description: 'Hora de inicio (HH:mm)',
    example: '08:00',
  })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ description: 'Hora de fin (HH:mm)', example: '12:00' })
  @IsOptional()
  @IsString()
  endTime?: string;
}
