import { IsString, IsOptional } from 'class-validator';

export class CreateCollectionDto {
  @IsString()
  routeStopId: string;

  @IsString()
  wasteTypeId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
