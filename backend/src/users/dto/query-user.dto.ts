import { IsOptional, IsString, IsIn, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryUserDto {
  @ApiPropertyOptional({
    description: 'Texto de búsqueda (nombre o email)',
    example: 'Juan',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por rol',
    enum: ['CITIZEN', 'DRIVER', 'ADMIN'],
    example: 'DRIVER',
  })
  @IsOptional()
  @IsIn(['CITIZEN', 'DRIVER', 'ADMIN'])
  role?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado',
    enum: ['ACTIVE', 'INACTIVE'],
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: string;

  @ApiPropertyOptional({ description: 'Número de página', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Resultados por página', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
