import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateScheduleDto {
  @ApiProperty({ description: 'ID de la zona', example: 'uuid-de-zona' })
  @IsString()
  zoneId: string;

  @ApiProperty({
    description: 'ID del tipo de residuo',
    example: 'uuid-de-tipo-residuo',
  })
  @IsString()
  wasteTypeId: string;

  @ApiProperty({ description: 'Día de la semana', example: 'LUNES' })
  @IsString()
  dayOfWeek: string;

  @ApiProperty({ description: 'Hora de inicio (HH:mm)', example: '08:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ description: 'Hora de fin (HH:mm)', example: '12:00' })
  @IsString()
  endTime: string;
}
