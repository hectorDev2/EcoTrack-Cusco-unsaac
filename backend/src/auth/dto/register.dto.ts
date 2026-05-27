import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: 'Correo electrónico del usuario', example: 'juan.perez@unsaac.edu.pe' })
  @IsEmail({}, { message: 'El email no es válido' })
  email: string;

  @ApiProperty({ description: 'Contraseña del usuario', example: 'MiClave123' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(100)
  password: string;

  @ApiProperty({ description: 'Nombre completo del usuario', example: 'Juan Pérez' })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(200)
  fullName: string;

  @ApiPropertyOptional({ description: 'Rol del usuario', enum: ['CITIZEN', 'DRIVER'], example: 'CITIZEN' })
  @IsOptional()
  @IsIn(['CITIZEN', 'DRIVER'], { message: 'El rol debe ser CITIZEN o DRIVER' })
  role?: string;
}
