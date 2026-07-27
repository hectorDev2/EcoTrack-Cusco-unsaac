import { IsString, IsOptional, IsInt, IsBoolean, Min, Max, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCitizenAlarmDto {
  @ApiPropertyOptional({ description: 'ID de la ruta', example: 'cuid-route' })
  @IsOptional()
  @IsString()
  routeId?: string;

  @ApiPropertyOptional({ description: 'ID del punto de recojo', example: 'cuid-pickup-point' })
  @IsOptional()
  @IsString()
  pickupPointId?: string;

  @ApiPropertyOptional({
    description: 'Minutos antes de la llegada para notificar',
    example: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(120)
  notifyBeforeMinutes?: number;

  @ApiPropertyOptional({
    description: 'Etiqueta personalizada',
    example: 'Orgánicos',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  label?: string;

  @ApiPropertyOptional({
    description: 'Activar/desactivar la alarma sin eliminarla',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
