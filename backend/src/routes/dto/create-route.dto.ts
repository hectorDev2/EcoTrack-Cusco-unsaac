import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRouteDto {
  @ApiProperty({ description: 'ID de la zona de la ruta', example: 'uuid-de-zona' })
  @IsString()
  zoneId: string;

  @ApiPropertyOptional({ description: 'ID del conductor asignado (opcional para rutas plantilla)', example: 'uuid-de-conductor' })
  @IsOptional()
  @IsString()
  driverId?: string;

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

  @ApiPropertyOptional({ description: 'Estado de la ruta', example: 'PENDING' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Lista de IDs de puntos de recolección en orden', example: ['uuid-punto-1', 'uuid-punto-2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pickupPointIds?: string[];
}
