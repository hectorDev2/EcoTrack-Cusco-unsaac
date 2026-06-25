import {
  IsString,
  MinLength,
  IsOptional,
  IsIn,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateIncidentDto {
  @ApiProperty({
    description: 'Tipo de incidente',
    enum: [
      'CONTAINER_DAMAGED',
      'MISSED_COLLECTION',
      'ILLEGAL_DUMPING',
      'OTHER',
    ],
    example: 'CONTAINER_DAMAGED',
  })
  @IsString()
  @IsIn(['CONTAINER_DAMAGED', 'MISSED_COLLECTION', 'ILLEGAL_DUMPING', 'OTHER'])
  type: string;

  @ApiProperty({
    description: 'Descripción detallada del incidente',
    example: 'Contenedor de la calle Los Olivos presenta rotura en la tapa',
  })
  @IsString()
  @MinLength(10)
  description: string;

  @ApiPropertyOptional({
    description: 'ID de la zona donde ocurrió',
    example: 'uuid-de-zona',
  })
  @IsOptional()
  @IsString()
  zoneId?: string;

  @ApiPropertyOptional({
    description: 'Latitud de la ubicación',
    example: -13.5167,
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitud de la ubicación',
    example: -71.9781,
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Dirección del incidente',
    example: 'Av. Los Olivos 123, Cusco',
  })
  @IsOptional()
  @IsString()
  address?: string;
}
