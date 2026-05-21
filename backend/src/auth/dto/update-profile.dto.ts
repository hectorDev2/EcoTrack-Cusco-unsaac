import { IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @MinLength(2)
  @MaxLength(200)
  fullName?: string;

  @IsOptional()
  @MinLength(6)
  @MaxLength(100)
  currentPassword?: string;

  @IsOptional()
  @MinLength(6)
  @MaxLength(100)
  newPassword?: string;
}
