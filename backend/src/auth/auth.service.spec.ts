import { Test, type TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

jest.mock('bcrypt');

type MockPrisma = Record<string, Record<string, jest.Mock>>;

const mockDate = new Date('2025-01-01T00:00:00.000Z');
const mockUser = {
  id: 'user-1',
  email: 'juan@test.com',
  passwordHash: '$2b$10$hashed',
  fullName: 'Juan Pérez',
  role: 'CITIZEN',
  status: 'ACTIVE',
  createdAt: mockDate,
};

describe('AuthService', () => {
  let service: AuthService;
  let prisma: MockPrisma;
  let jwtService: { sign: jest.Mock };

  const mockPrisma: MockPrisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    jwtService = module.get(JwtService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    const dto: RegisterDto = {
      email: 'nuevo@test.com',
      password: '123456',
      fullName: 'Nuevo Usuario',
    };

    it('debe registrar un usuario nuevo exitosamente', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-123');
      mockPrisma.user.create.mockResolvedValue({
        id: 'new-1',
        email: dto.email,
        passwordHash: 'hashed-123',
        fullName: dto.fullName,
        role: 'CITIZEN',
        status: 'ACTIVE',
        createdAt: mockDate,
      });

      const result = await service.register(dto);

      expect(result.accessToken).toBe('mock-token');
      expect(result.user.email).toBe(dto.email);
      expect(result.user.role).toBe('CITIZEN');
      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
    });

    it('debe lanzar ConflictException si el email ya existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('debe asignar rol CITIZEN por defecto si no se especifica', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-123');
      mockPrisma.user.create.mockResolvedValue({
        ...mockUser,
        id: 'new-2',
        email: dto.email,
        role: 'CITIZEN',
      });

      const result = await service.register(dto);

      expect(result.user.role).toBe('CITIZEN');
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: 'CITIZEN' }),
        }),
      );
    });
  });

  describe('login', () => {
    const dto: LoginDto = {
      email: 'juan@test.com',
      password: '123456',
    };

    it('debe iniciar sesión con credenciales válidas', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(dto);

      expect(result.accessToken).toBe('mock-token');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('debe lanzar UnauthorizedException si el usuario no existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('debe lanzar UnauthorizedException si la cuenta está inactiva', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        status: 'INACTIVE',
      });

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('debe lanzar UnauthorizedException si la contraseña es incorrecta', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    it('debe retornar el perfil con zonas formateadas', async () => {
      const profileData = {
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
        role: mockUser.role,
        status: mockUser.status,
        createdAt: mockUser.createdAt,
        zones: [
          {
            zone: {
              id: 'zone-1',
              name: 'Centro Histórico',
              description: null,
            },
          },
        ],
      };
      mockPrisma.user.findUnique.mockResolvedValue(profileData);

      const result = await service.getProfile(mockUser.id);

      expect(result).toBeDefined();
      expect(result?.zones).toHaveLength(1);
      expect(result?.zones[0]).toMatchObject({ id: 'zone-1', name: 'Centro Histórico' });
    });

    it('debe retornar null si el usuario no existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.getProfile('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('debe actualizar el nombre exitosamente', async () => {
      const dto: UpdateProfileDto = { fullName: 'Juan Actualizado' };
      const updatedUser = {
        ...mockUser,
        fullName: 'Juan Actualizado',
        zones: [],
      };
      mockPrisma.user.update.mockResolvedValue(updatedUser);
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(updatedUser)
        .mockResolvedValueOnce(updatedUser);

      await service.updateProfile(mockUser.id, dto);

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: { fullName: 'Juan Actualizado' },
        }),
      );
    });

    it('debe lanzar BadRequestException si no hay campos que actualizar', async () => {
      const dto: UpdateProfileDto = {};

      await expect(service.updateProfile(mockUser.id, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar BadRequestException si se da nueva contraseña sin actual', async () => {
      const dto: UpdateProfileDto = { newPassword: 'nueva123' };

      await expect(service.updateProfile(mockUser.id, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
