import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRouteDto {
  @ApiProperty({ description: 'ID de la zona de la ruta', example: 'uuid-de-zona' })
  @IsString()
  zoneId: string;

  @ApiProperty({ description: 'ID del conductor asignado', example: 'uuid-de-conductor' })
  @IsString()
  driverId: string;

  @ApiPropertyOptional({ description: 'Estado de la ruta', example: 'PENDING' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Lista de IDs de puntos de recolección', example: ['uuid-punto-1', 'uuid-punto-2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pickupPointIds?: string[];
}
