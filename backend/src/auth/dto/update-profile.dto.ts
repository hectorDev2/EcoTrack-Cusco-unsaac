import { IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez',
  })
  @IsOptional()
  @MinLength(2)
  @MaxLength(200)
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Contraseña actual',
    example: 'MiClave123',
  })
  @IsOptional()
  @MinLength(6)
  @MaxLength(100)
  currentPassword?: string;

  @ApiPropertyOptional({
    description: 'Nueva contraseña',
    example: 'NuevaClave456',
  })
  @IsOptional()
  @MinLength(6)
  @MaxLength(100)
  newPassword?: string;
}
