import { IsString, IsOptional, IsInt, Min, Max, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCitizenAlarmDto {
  @ApiProperty({ description: 'ID de la ruta', example: 'cuid-route' })
  @IsString()
  routeId: string;

  @ApiProperty({ description: 'ID del punto de recojo', example: 'cuid-pickup-point' })
  @IsString()
  pickupPointId: string;

  @ApiPropertyOptional({
    description: 'Minutos antes de la llegada para notificar',
    example: 30,
    default: 30,
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
}