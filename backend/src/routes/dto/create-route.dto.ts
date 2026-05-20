import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateRouteDto {
  @IsString()
  zoneId: string;

  @IsString()
  driverId: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pickupPointIds?: string[];
}
