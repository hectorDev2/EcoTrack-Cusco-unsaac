import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRouteDto {
  @ApiPropertyOptional({ description: 'Estado de la ruta', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], example: 'IN_PROGRESS' })
  @IsOptional()
  @IsIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
  status?: string;

  @ApiPropertyOptional({ description: 'ID del conductor asignado', example: 'uuid-de-conductor' })
  @IsOptional()
  @IsString()
  driverId?: string;
}
