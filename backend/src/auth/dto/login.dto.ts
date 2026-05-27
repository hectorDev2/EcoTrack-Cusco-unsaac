import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'Correo electrónico del usuario', example: 'juan.perez@unsaac.edu.pe' })
  @IsEmail({}, { message: 'El email no es válido' })
  email: string;

  @ApiProperty({ description: 'Contraseña del usuario', example: 'MiClave123' })
  @IsString()
  @MinLength(1)
  password: string;
}
