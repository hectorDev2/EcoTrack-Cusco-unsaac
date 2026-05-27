import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { AssignZonesDto } from './dto/assign-zones.dto';

const userSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  status: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
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
      select: userSelect,
    });

    return user;
  }

  async findAll(query: QueryUserDto) {
    const { search, role, status, page = 1, limit = 10 } = query;

    const where: Prisma.UserWhereInput = {};

    if (role) where.role = role;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          ...userSelect,
          zones: {
            select: {
              zone: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: data.map(({ zones, ...user }) => ({
        ...user,
        zones: zones.map((z) => z.zone),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...userSelect,
        zones: {
          select: {
            zone: {
              select: { id: true, name: true, description: true },
            },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    return {
      ...user,
      zones: user.zones.map((z) => z.zone),
    };
  }

  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...userSelect,
        zones: {
          select: {
            zone: {
              select: { id: true, name: true, description: true },
            },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    return {
      ...user,
      zones: user.zones.map((z) => z.zone),
    };
  }

  async update(id: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });

    if (!existing) throw new NotFoundException('Usuario no encontrado');

    const data: Prisma.UserUpdateInput = {};

    if (dto.fullName !== undefined) data.fullName = dto.fullName;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.status !== undefined) data.status = dto.status;

    if (dto.password !== undefined) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });
  }

  async deactivate(id: string) {
    const existing = await this.prisma.user.findUnique({ where: { id } });

    if (!existing) throw new NotFoundException('Usuario no encontrado');

    return this.prisma.user.update({
      where: { id },
      data: { status: 'INACTIVE' },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
      },
    });
  }

  async assignZones(id: string, dto: AssignZonesDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });

    if (!existing) throw new NotFoundException('Usuario no encontrado');

    const zonesExist = await this.prisma.zone.findMany({
      where: { id: { in: dto.zoneIds } },
      select: { id: true },
    });

    if (zonesExist.length !== dto.zoneIds.length) {
      throw new BadRequestException('Una o más zonas no existen');
    }

    await this.prisma.userZone.deleteMany({ where: { userId: id } });

    if (dto.zoneIds.length > 0) {
      await this.prisma.userZone.createMany({
        data: dto.zoneIds.map((zoneId) => ({
          userId: id,
          zoneId,
          assignedAt: new Date(),
        })),
      });
    }

    return this.findOne(id);
  }

  async getStats() {
    const [total, active, drivers, admins, citizens] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { role: 'DRIVER', status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { role: 'ADMIN', status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { role: 'CITIZEN', status: 'ACTIVE' } }),
    ]);

    return { total, active, drivers, admins, citizens };
  }
}
