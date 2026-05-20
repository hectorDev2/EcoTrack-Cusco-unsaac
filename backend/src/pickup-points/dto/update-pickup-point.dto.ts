import { IsOptional, IsString, IsNumber, IsIn } from 'class-validator';

export class UpdatePickupPointDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: string;
}
