import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RouteScheduleDto } from './route-schedule.dto';

export class CreateRouteDto {
  @ApiProperty({
    description: 'ID de la zona de la ruta',
    example: 'uuid-de-zona',
  })
  @IsString()
  zoneId: string;

  @ApiPropertyOptional({
    description: 'ID del conductor asignado (opcional para rutas plantilla)',
    example: 'uuid-de-conductor',
  })
  @IsOptional()
  @IsString()
  driverId?: string;

  @ApiPropertyOptional({
    description: 'Nombre descriptivo de la ruta',
    example: 'Zona 1 — Mañana LMV',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Turno: MANANA | TARDE | NOCHE | DOMINICAL',
  })
  @IsOptional()
  @IsString()
  shift?: string;

  @ApiPropertyOptional({
    description: 'Frecuencia: LMV | MJS | DOM | DOM_LUN | TODOS',
  })
  @IsOptional()
  @IsString()
  frequency?: string;

  @ApiPropertyOptional({ description: 'Estado de la ruta', example: 'PENDING' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Lista de IDs de puntos de recolección en orden',
    example: ['uuid-punto-1', 'uuid-punto-2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pickupPointIds?: string[];

  @ApiPropertyOptional({
    description: 'Horarios en los que corre la ruta — puede tener varios (ej. LMV 06:00 y MJS 17:00)',
    type: [RouteScheduleDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RouteScheduleDto)
  schedules?: RouteScheduleDto[];
}
