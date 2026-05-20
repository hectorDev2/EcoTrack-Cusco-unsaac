import { IsString, MinLength, IsOptional, IsIn } from 'class-validator';

export class CreateIncidentDto {
  @IsString()
  @IsIn(['CONTAINER_DAMAGED', 'MISSED_COLLECTION', 'ILLEGAL_DUMPING', 'OTHER'])
  type: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsOptional()
  @IsString()
  zoneId?: string;
}
