import { IsOptional, MinLength, MaxLength, Matches } from 'class-validator';
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
    description: 'Número de WhatsApp con código de país (ej. +51987654321). Vacío para quitarlo.',
    example: '+51987654321',
  })
  @IsOptional()
  @Matches(/^(\+\d{8,15})?$/, {
    message: 'El teléfono debe incluir código de país, ej. +51987654321',
  })
  phone?: string;

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
