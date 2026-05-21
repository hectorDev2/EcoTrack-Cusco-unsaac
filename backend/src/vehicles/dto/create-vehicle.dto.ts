import { IsString, IsOptional, IsNumber, MinLength, IsIn } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @MinLength(1)
  plate: string;

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
}
