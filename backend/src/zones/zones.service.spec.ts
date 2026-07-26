/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { jest } from '@jest/globals';
import { ZonesService } from './zones.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

type MockPrisma = Record<string, Record<string, jest.Mock<any>>>;

const mockDate = new Date('2025-01-01T00:00:00.000Z');
const mockZone = {
  id: 'zone-1',
  name: 'Centro Histórico',
  description: 'Zona céntrica de Cusco',
  status: 'ACTIVE',
  createdAt: mockDate,
};

describe('ZonesService', () => {
  let service: ZonesService;
  let _prisma: MockPrisma;

  const mockPrisma: MockPrisma = {
    zone: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ZonesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ZonesService>(ZonesService);
    _prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('debe retornar todas las zonas ordenadas por nombre', async () => {
      mockPrisma.zone.findMany.mockResolvedValue([mockZone]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(mockPrisma.zone.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('findActive', () => {
    it('debe retornar solo zonas activas ordenadas por nombre', async () => {
      mockPrisma.zone.findMany.mockResolvedValue([mockZone]);

      const result = await service.findActive();

      expect(result).toHaveLength(1);
      expect(mockPrisma.zone.findMany).toHaveBeenCalledWith({
        where: { status: 'ACTIVE' },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('debe retornar una zona por ID', async () => {
      mockPrisma.zone.findUnique.mockResolvedValue(mockZone);

      const result = await service.findOne('zone-1');

      expect(result).toMatchObject({ id: 'zone-1', name: 'Centro Histórico' });
    });

    it('debe lanzar NotFoundException si la zona no existe', async () => {
      mockPrisma.zone.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('debe crear una nueva zona', async () => {
      const dto: CreateZoneDto = {
        name: 'Nueva Zona',
        description: 'Descripción',
      };
      const created = {
        id: 'zone-new',
        name: dto.name,
        description: dto.description,
        status: 'ACTIVE',
        createdAt: mockDate,
      };
      mockPrisma.zone.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(result.name).toBe(dto.name);
      expect(mockPrisma.zone.create).toHaveBeenCalledWith({
        data: { ...dto, createdAt: expect.any(Date) },
      });
    });
  });

  describe('update', () => {
    it('debe actualizar una zona existente', async () => {
      const dto: UpdateZoneDto = { name: 'Zona Actualizada' };
      mockPrisma.zone.findUnique.mockResolvedValue(mockZone);
      mockPrisma.zone.update.mockResolvedValue({
        ...mockZone,
        name: dto.name,
      });

      const result = await service.update('zone-1', dto);

      expect(result.name).toBe(dto.name);
    });

    it('debe lanzar NotFoundException al actualizar una zona que no existe', async () => {
      mockPrisma.zone.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deactivate', () => {
    it('debe desactivar una zona existente', async () => {
      mockPrisma.zone.findUnique.mockResolvedValue(mockZone);
      mockPrisma.zone.update.mockResolvedValue({
        ...mockZone,
        status: 'INACTIVE',
      });

      const result = await service.deactivate('zone-1');

      expect(result.status).toBe('INACTIVE');
      expect(mockPrisma.zone.update).toHaveBeenCalledWith({
        where: { id: 'zone-1' },
        data: { status: 'INACTIVE' },
      });
    });

    it('debe lanzar NotFoundException al desactivar una zona que no existe', async () => {
      mockPrisma.zone.findUnique.mockResolvedValue(null);

      await expect(service.deactivate('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
