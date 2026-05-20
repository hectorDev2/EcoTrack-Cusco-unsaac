import { IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateIncidentDto {
  @IsOptional()
  @IsIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
  status?: string;

  @IsOptional()
  @IsString()
  zoneId?: string;
}
