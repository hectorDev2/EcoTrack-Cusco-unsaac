import { IsString, IsOptional, IsNumber, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVehicleDto {
  @ApiProperty({ description: 'Placa del vehículo', example: 'ABC-123' })
  @IsString()
  @MinLength(1)
  plate: string;

  @ApiPropertyOptional({ description: 'Marca del vehículo', example: 'Toyota' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ description: 'Modelo del vehículo', example: 'Hilux' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({
    description: 'Capacidad de carga en kg',
    example: 1500,
  })
  @IsOptional()
  @IsNumber()
  capacity?: number;

  @ApiPropertyOptional({
    description: 'ID del conductor asignado',
    example: 'uuid-de-conductor',
  })
  @IsOptional()
  @IsString()
  driverId?: string;
}
