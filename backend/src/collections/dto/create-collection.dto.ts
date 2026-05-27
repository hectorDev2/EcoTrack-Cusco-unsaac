import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCollectionDto {
  @ApiProperty({ description: 'ID de la parada de ruta', example: 'uuid-de-parada' })
  @IsString()
  routeStopId: string;

  @ApiProperty({ description: 'ID del tipo de residuo recolectado', example: 'uuid-de-tipo-residuo' })
  @IsString()
  wasteTypeId: string;

  @ApiPropertyOptional({ description: 'Notas adicionales sobre la recolección', example: 'Contenedor completamente lleno' })
  @IsOptional()
  @IsString()
  notes?: string;
}
