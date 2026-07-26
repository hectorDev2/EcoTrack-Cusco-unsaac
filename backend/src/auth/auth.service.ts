import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        role: dto.role ?? 'CITIZEN',
        createdAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });

    const token = this.generateToken(user);

    return { user, accessToken: token };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('La cuenta está desactivada');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }

    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      accessToken: token,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        zones: {
          select: {
            zone: { select: { id: true, name: true, description: true } },
          },
        },
      },
    });

    if (!user) return null;

    return {
      ...user,
      zones: user.zones.map((uz) => uz.zone),
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.newPassword && !dto.currentPassword) {
      throw new BadRequestException('Debes proporcionar tu contraseña actual');
    }

    const data: Record<string, string | null> = {};
    if (dto.fullName) data.fullName = dto.fullName;
    if (dto.phone !== undefined) data.phone = dto.phone || null;

    if (dto.newPassword) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true },
      });

      if (!user) throw new UnauthorizedException('Usuario no encontrado');

      const isValid = await bcrypt.compare(
        dto.currentPassword!,
        user.passwordHash,
      );
      if (!isValid)
        throw new BadRequestException('Contraseña actual incorrecta');

      data.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No hay campos para actualizar');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return this.getProfile(userId);
  }

  private generateToken(user: { id: string; email: string; role: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    return this.jwtService.sign(payload);
  }
}
