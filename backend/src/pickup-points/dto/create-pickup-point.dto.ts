import { IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class CreatePickupPointDto {
  @IsString()
  zoneId: string;

  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}
