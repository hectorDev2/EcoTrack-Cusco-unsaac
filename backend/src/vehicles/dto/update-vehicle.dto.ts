import { IsOptional, IsString, IsNumber, IsIn } from 'class-validator';

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  plate?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsNumber()
  capacity?: number;

  @IsOptional()
  @IsString()
  driverId?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'MAINTENANCE'])
  status?: string;
}
