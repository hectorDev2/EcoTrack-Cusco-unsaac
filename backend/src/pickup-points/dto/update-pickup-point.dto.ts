import { IsOptional, IsString, IsNumber, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePickupPointDto {
  @ApiPropertyOptional({ description: 'Nombre del punto de recolección', example: 'Parque San Francisco' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Dirección del punto de recolección', example: 'Plaza San Francisco s/n, Cusco' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Latitud de la ubicación', example: -13.5167 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitud de la ubicación', example: -71.9781 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Estado del punto de recolección', enum: ['ACTIVE', 'INACTIVE'], example: 'ACTIVE' })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: string;
}
