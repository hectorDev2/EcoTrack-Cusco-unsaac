import { IsOptional, IsString, MinLength, IsIn } from 'class-validator';

export class UpdateWasteTypeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsIn(['ORGANIC', 'RECYCLABLE', 'NON_RECYCLABLE', 'HAZARDOUS'])
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
