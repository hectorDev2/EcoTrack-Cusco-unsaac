import { IsString, MinLength, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWasteTypeDto {
  @ApiProperty({ description: 'Nombre del tipo de residuo', example: 'Plástico PET' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ description: 'Categoría del residuo', enum: ['ORGANIC', 'RECYCLABLE', 'NON_RECYCLABLE', 'HAZARDOUS'], example: 'RECYCLABLE' })
  @IsString()
  @IsIn(['ORGANIC', 'RECYCLABLE', 'NON_RECYCLABLE', 'HAZARDOUS'])
  category: string;

  @ApiPropertyOptional({ description: 'Descripción del tipo de residuo', example: 'Botellas y envases de plástico reciclable' })
  @IsOptional()
  @IsString()
  description?: string;
}
