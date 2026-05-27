import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'Correo electrónico del usuario', example: 'juan.perez@unsaac.edu.pe' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Contraseña del usuario', example: 'MiClave123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'Nombre completo del usuario', example: 'Juan Pérez' })
  @IsString()
  @MinLength(2)
  fullName: string;

  @ApiPropertyOptional({ description: 'Rol del usuario', enum: ['CITIZEN', 'DRIVER', 'ADMIN'], example: 'CITIZEN' })
  @IsOptional()
  @IsIn(['CITIZEN', 'DRIVER', 'ADMIN'])
  role?: string;
}
