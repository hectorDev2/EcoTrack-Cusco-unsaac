import { IsString, MinLength, IsOptional, IsIn } from 'class-validator';

export class CreateWasteTypeDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @IsIn(['ORGANIC', 'RECYCLABLE', 'NON_RECYCLABLE', 'HAZARDOUS'])
  category: string;

  @IsOptional()
  @IsString()
  description?: string;
}
