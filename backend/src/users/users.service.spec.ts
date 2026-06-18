import { Test, type TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { AssignZonesDto } from './dto/assign-zones.dto';

jest.mock('bcrypt');

type MockPrisma = Record<string, Record<string, jest.Mock>>;

const mockDate = new Date('2025-01-01T00:00:00.000Z');
const mockUser = {
  id: 'user-1',
  email: 'juan@test.com',
  fullName: 'Juan Pérez',
  role: 'CITIZEN',
  status: 'ACTIVE',
  createdAt: mockDate,
};

const mockUserWithZones = {
  ...mockUser,
  zones: [
    {
      zone: { id: 'zone-1', name: 'Centro Histórico', description: 'Descripción' },
    },
    {
      zone: { id: 'zone-2', name: 'San Blas', description: null },
    },
  ],
};

describe('UsersService', () => {
  let service: UsersService;
  let prisma: MockPrisma;

  const mockPrisma: MockPrisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    zone: {
      findMany: jest.fn(),
    },
    userZone: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto: CreateUserDto = {
      email: 'nuevo@test.com',
      password: '123456',
      fullName: 'Nuevo Usuario',
    };

    it('debe crear un usuario exitosamente', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-123');
      mockPrisma.user.create.mockResolvedValue({
        ...mockUser,
        email: dto.email,
      });

      const result = await service.create(dto);

      expect(result.email).toBe(dto.email);
      expect(result.role).toBe('CITIZEN');
      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: dto.email,
            passwordHash: 'hashed-123',
            fullName: dto.fullName,
            role: 'CITIZEN',
          }),
        }),
      );
    });

    it('debe lanzar ConflictException si el email ya existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('debe asignar rol CITIZEN por defecto si no se especifica', async () => {
      const dtoWithoutRole: CreateUserDto = {
        email: 'sin-rol@test.com',
        password: '123456',
        fullName: 'Sin Rol',
      };
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-456');
      mockPrisma.user.create.mockResolvedValue({
        ...mockUser,
        id: 'user-2',
        email: dtoWithoutRole.email,
      });

      const result = await service.create(dtoWithoutRole);

      expect(result.role).toBe('CITIZEN');
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: 'CITIZEN' }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('debe retornar usuarios paginados con metadata', async () => {
      const rawUsers = [
        { ...mockUserWithZones },
        {
          ...mockUser,
          id: 'user-2',
          email: 'maria@test.com',
          fullName: 'María García',
          zones: [],
        },
      ];
      mockPrisma.user.findMany.mockResolvedValue(rawUsers);
      mockPrisma.user.count.mockResolvedValue(2);

      const query: QueryUserDto = { page: 1, limit: 10 };
      const result = await service.findAll(query);

      expect(result.data).toHaveLength(2);
      expect(result.data[0].zones).toHaveLength(2);
      expect(result.data[0].zones[0]).toMatchObject({ id: 'zone-1', name: 'Centro Histórico' });
      expect(result.meta).toEqual({ total: 2, page: 1, limit: 10, totalPages: 1 });
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        }),
      );
    });

    it('debe aplicar filtro de búsqueda por nombre o email', async () => {
      mockPrisma.user.findMany.mockResolvedValue([mockUserWithZones]);
      mockPrisma.user.count.mockResolvedValue(1);

      const query: QueryUserDto = { search: 'Juan', page: 1, limit: 10 };
      await service.findAll(query);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { fullName: { contains: 'Juan' } },
              { email: { contains: 'Juan' } },
            ],
          }),
        }),
      );
    });

    it('debe aplicar filtro por rol', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      const query: QueryUserDto = { role: 'DRIVER', page: 1, limit: 10 };
      await service.findAll(query);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ role: 'DRIVER' }),
        }),
      );
    });

    it('debe aplicar filtro por estado', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      const query: QueryUserDto = { status: 'ACTIVE', page: 1, limit: 10 };
      await service.findAll(query);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ACTIVE' }),
        }),
      );
    });

    it('debe retornar lista vacía si no hay resultados', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      const query: QueryUserDto = { page: 1, limit: 10 };
      const result = await service.findAll(query);

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });
  });

  describe('findOne', () => {
    it('debe retornar un usuario con sus zonas', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserWithZones);

      const result = await service.findOne('user-1');

      expect(result.id).toBe('user-1');
      expect(result.zones).toHaveLength(2);
      expect(result.zones[0]).toMatchObject({ id: 'zone-1', name: 'Centro Histórico', description: 'Descripción' });
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMyProfile', () => {
    it('debe retornar el perfil con zonas', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserWithZones);

      const result = await service.getMyProfile('user-1');

      expect(result.id).toBe('user-1');
      expect(result.zones).toHaveLength(2);
      expect(result.zones[0]).toMatchObject({ id: 'zone-1', name: 'Centro Histórico', description: 'Descripción' });
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getMyProfile('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('debe actualizar los campos del usuario exitosamente', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      const dto: UpdateUserDto = { fullName: 'Juan Actualizado', role: 'DRIVER' };
      const updatedUser = { ...mockUser, fullName: 'Juan Actualizado', role: 'DRIVER' };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.update('user-1', dto);

      expect(result.fullName).toBe('Juan Actualizado');
      expect(result.role).toBe('DRIVER');
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: expect.objectContaining({ fullName: 'Juan Actualizado', role: 'DRIVER' }),
        }),
      );
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', { fullName: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe hashear la contraseña si se proporciona', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-new');
      const dto: UpdateUserDto = { password: 'nueva123' };
      mockPrisma.user.update.mockResolvedValue(mockUser);

      await service.update('user-1', dto);

      expect(bcrypt.hash).toHaveBeenCalledWith('nueva123', 10);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ passwordHash: 'hashed-new' }),
        }),
      );
    });

    it('debe solo incluir campos definidos en los datos de actualización', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      const dto: UpdateUserDto = { status: 'INACTIVE' };
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, status: 'INACTIVE' });

      const result = await service.update('user-1', dto);

      expect(result.status).toBe('INACTIVE');
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'INACTIVE' },
        }),
      );
    });
  });

  describe('deactivate', () => {
    it('debe desactivar un usuario cambiando su estado a INACTIVE', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        status: 'INACTIVE',
      });

      const result = await service.deactivate('user-1');

      expect(result.status).toBe('INACTIVE');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { status: 'INACTIVE' },
        select: { id: true, email: true, fullName: true, role: true, status: true },
      });
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.deactivate('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignZones', () => {
    const dto: AssignZonesDto = { zoneIds: ['zone-1', 'zone-2'] };
    const userWithAssignedZones = {
      ...mockUser,
      zones: [
        { zone: { id: 'zone-1', name: 'Centro Histórico', description: 'Descripción' } },
        { zone: { id: 'zone-2', name: 'San Blas', description: null } },
      ],
    };

    it('debe reemplazar las zonas del usuario exitosamente', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockUser) // first call: existing user check
        .mockResolvedValueOnce(userWithAssignedZones); // second call: findOne return
      mockPrisma.zone.findMany.mockResolvedValue([
        { id: 'zone-1' },
        { id: 'zone-2' },
      ]);
      mockPrisma.userZone.deleteMany.mockResolvedValue({ count: 2 });
      mockPrisma.userZone.createMany.mockResolvedValue({ count: 2 });

      const result = await service.assignZones('user-1', dto);

      expect(result.zones).toHaveLength(2);
      expect(mockPrisma.userZone.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(mockPrisma.userZone.createMany).toHaveBeenCalledWith({
        data: [
          { userId: 'user-1', zoneId: 'zone-1', assignedAt: expect.any(Date) },
          { userId: 'user-1', zoneId: 'zone-2', assignedAt: expect.any(Date) },
        ],
      });
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.assignZones('non-existent', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar BadRequestException si alguna zona no existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.zone.findMany.mockResolvedValue([{ id: 'zone-1' }]); // only 1 of 2 found

      await expect(service.assignZones('user-1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe manejar lista vacía de zoneIds sin crear zonas', async () => {
      const emptyDto: AssignZonesDto = { zoneIds: [] };
      const mockUserWithEmptyZones = { ...mockUser, zones: [] };
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockUserWithEmptyZones);
      mockPrisma.zone.findMany.mockResolvedValue([]);
      mockPrisma.userZone.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.assignZones('user-1', emptyDto);

      expect(mockPrisma.userZone.deleteMany).toHaveBeenCalled();
      expect(mockPrisma.userZone.createMany).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('getStats', () => {
    it('debe retornar las estadísticas de usuarios', async () => {
      mockPrisma.user.count
        .mockResolvedValueOnce(100)  // total
        .mockResolvedValueOnce(80)   // active
        .mockResolvedValueOnce(30)   // drivers (active)
        .mockResolvedValueOnce(10)   // admins (active)
        .mockResolvedValueOnce(40);  // citizens (active)

      const result = await service.getStats();

      expect(result).toEqual({
        total: 100,
        active: 80,
        drivers: 30,
        admins: 10,
        citizens: 40,
      });
    });
  });
});
