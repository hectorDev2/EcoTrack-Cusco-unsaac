import { IsString, IsOptional } from 'class-validator';

export class CreateRouteDto {
  @IsString()
  zoneId: string;

  @IsString()
  driverId: string;

  @IsOptional()
  @IsString()
  status?: string;
}
