import { IsOptional, IsString, MinLength, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWasteTypeDto {
  @ApiPropertyOptional({ description: 'Nombre del tipo de residuo', example: 'Plástico PET' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ description: 'Categoría del residuo', enum: ['ORGANIC', 'RECYCLABLE', 'NON_RECYCLABLE', 'HAZARDOUS'], example: 'RECYCLABLE' })
  @IsOptional()
  @IsIn(['ORGANIC', 'RECYCLABLE', 'NON_RECYCLABLE', 'HAZARDOUS'])
  category?: string;

  @ApiPropertyOptional({ description: 'Descripción del tipo de residuo', example: 'Botellas y envases de plástico reciclable' })
  @IsOptional()
  @IsString()
  description?: string;
}
