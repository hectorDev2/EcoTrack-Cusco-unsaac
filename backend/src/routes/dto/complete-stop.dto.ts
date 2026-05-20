import { IsString, IsOptional } from 'class-validator';

export class CompleteStopDto {
  @IsString()
  wasteTypeId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
