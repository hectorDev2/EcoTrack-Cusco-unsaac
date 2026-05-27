import { IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateZoneDto {
  @ApiProperty({ description: 'Nombre de la zona', example: 'Centro Histórico' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ description: 'Descripción de la zona', example: 'Zona monumental del centro de Cusco' })
  @IsOptional()
  @IsString()
  description?: string;
}
