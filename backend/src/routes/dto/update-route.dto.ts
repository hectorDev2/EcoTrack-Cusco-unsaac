import { IsOptional, IsString, IsIn, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRouteDto {
  @ApiPropertyOptional({ description: 'Nombre descriptivo de la ruta', example: 'Zona 1 — Mañana LMV' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Turno: MANANA | TARDE | NOCHE | DOMINICAL' })
  @IsOptional()
  @IsString()
  shift?: string;

  @ApiPropertyOptional({ description: 'Frecuencia: LMV | MJS | DOM | DOM_LUN | TODOS' })
  @IsOptional()
  @IsString()
  frequency?: string;

  @ApiPropertyOptional({ description: 'Estado de la ruta', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] })
  @IsOptional()
  @IsIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
  status?: string;

  @ApiPropertyOptional({ description: 'ID del conductor asignado' })
  @IsOptional()
  @IsString()
  driverId?: string;

  @ApiPropertyOptional({ description: 'Lista ordenada de IDs de pickup points' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pickupPointIds?: string[];
}
