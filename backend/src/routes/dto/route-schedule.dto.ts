import { IsArray, IsIn, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const WEEKDAY_CODES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;

export class RouteScheduleDto {
  @ApiProperty({
    description: 'Días en que corre este horario',
    example: ['MON', 'WED', 'FRI'],
    enum: WEEKDAY_CODES,
    isArray: true,
  })
  @IsArray()
  @IsIn(WEEKDAY_CODES, { each: true })
  days: string[];

  @ApiProperty({ description: 'Hora de inicio, formato HH:MM (24h)', example: '06:00' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'time debe tener formato HH:MM (24h)',
  })
  time: string;

  @ApiPropertyOptional({ description: 'Etiqueta opcional', example: 'Turno mañana' })
  @IsOptional()
  @IsString()
  label?: string;
}
