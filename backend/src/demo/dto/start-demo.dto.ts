import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class StartDemoDto {
  @ApiPropertyOptional({
    description: 'Duración total de la simulación en segundos',
    example: 120,
    default: 120,
  })
  @IsOptional()
  @IsInt()
  @Min(20)
  @Max(600)
  durationSeconds?: number;

  @ApiPropertyOptional({
    description: 'Cada cuántos segundos se inserta una posición simulada',
    example: 3,
    default: 3,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  tickSeconds?: number;
}
