import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignZonesDto {
  @ApiProperty({
    description: 'Lista de IDs de zonas a asignar',
    example: ['uuid-zona-1', 'uuid-zona-2'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  zoneIds: string[];
}
