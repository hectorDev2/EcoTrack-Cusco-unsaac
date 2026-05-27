import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateIncidentDto {
  @ApiPropertyOptional({ description: 'Nuevo estado del incidente', enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], example: 'IN_PROGRESS' })
  @IsOptional()
  @IsIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
  status?: string;

  @ApiPropertyOptional({ description: 'ID de la zona asignada', example: 'uuid-de-zona' })
  @IsOptional()
  @IsString()
  zoneId?: string;
}
