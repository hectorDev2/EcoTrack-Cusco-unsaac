import { IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePickupPointDto {
  @ApiProperty({
    description: 'ID de la zona a la que pertenece',
    example: 'uuid-de-zona',
  })
  @IsString()
  zoneId: string;

  @ApiProperty({
    description: 'Nombre del punto de recolección',
    example: 'Parque San Francisco',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Dirección del punto de recolección',
    example: 'Plaza San Francisco s/n, Cusco',
  })
  @IsString()
  address: string;

  @ApiProperty({ description: 'Latitud de la ubicación', example: -13.5167 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: 'Longitud de la ubicación', example: -71.9781 })
  @IsNumber()
  longitude: number;
}
