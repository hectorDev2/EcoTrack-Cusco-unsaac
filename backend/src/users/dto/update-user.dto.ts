import { IsOptional, IsString, IsIn, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Nombre completo del usuario', example: 'Juan Pérez' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ description: 'Nueva contraseña', example: 'MiClave123' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ description: 'Rol del usuario', enum: ['CITIZEN', 'DRIVER', 'ADMIN'], example: 'CITIZEN' })
  @IsOptional()
  @IsIn(['CITIZEN', 'DRIVER', 'ADMIN'])
  role?: string;

  @ApiPropertyOptional({ description: 'Estado del usuario', enum: ['ACTIVE', 'INACTIVE'], example: 'ACTIVE' })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: string;
}
