import { IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateRouteDto {
  @IsOptional()
  @IsIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
  status?: string;

  @IsOptional()
  @IsString()
  driverId?: string;
}
