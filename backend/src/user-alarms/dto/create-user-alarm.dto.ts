import { IsString, IsInt, Min, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserAlarmDto {
  @ApiProperty({ description: 'ID del punto de recolección', example: 'uuid-pickup-point' })
  @IsString()
  pickupPointId: string;

  @ApiProperty({ description: 'ID de la ruta asociada', example: 'uuid-route' })
  @IsString()
  routeId: string;

  @ApiProperty({ description: 'Título descriptivo de la alarma', example: 'Recojo de mi cuadra' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Minutos antes de la recolección para notificar', example: 30 })
  @IsInt()
  @Min(0)
  notifyBeforeMinutes: number;

  @ApiPropertyOptional({ description: 'Alarma activa o no', default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
