import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCitizenAlarmDto {
  @ApiProperty({ description: 'ID de la zona', example: 'cuid-zona' })
  @IsString()
  zoneId: string;

  @ApiProperty({
    description: 'Día de la semana',
    example: 'MONDAY',
    enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
  })
  @IsString()
  dayOfWeek: string;

  @ApiPropertyOptional({ description: 'Etiqueta personalizada', example: 'Orgánicos' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  label?: string;
}
