import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';

export class AssignZonesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  zoneIds: string[];
}
