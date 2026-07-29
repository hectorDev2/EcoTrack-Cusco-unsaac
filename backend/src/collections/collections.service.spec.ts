import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCollectionDto } from './dto/create-collection.dto';

describe('CollectionsService', () => {
  let service: CollectionsService;

  const mockPrisma = {
    routeStop: {
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    collection: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    route: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };

  const dto: CreateCollectionDto = {
    routeStopId: 'stop-1',
    wasteTypeId: 'waste-1',
    notes: undefined,
  };

  const stop = {
    id: 'stop-1',
    routeId: 'route-1',
    status: 'PENDING',
    route: { id: 'route-1', driverId: 'driver-1' },
  };

  const collectionRecord = { id: 'collection-1', routeStopId: 'stop-1' };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollectionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CollectionsService>(CollectionsService);
  });

  it('debe lanzar NotFoundException si la parada no existe', async () => {
    mockPrisma.routeStop.findUnique.mockResolvedValue(null);
    await expect(service.create(dto, 'driver-1')).rejects.toThrow(NotFoundException);
  });

  it('debe lanzar NotFoundException si la parada no pertenece al conductor', async () => {
    mockPrisma.routeStop.findUnique.mockResolvedValue(stop);
    await expect(service.create(dto, 'driver-otro')).rejects.toThrow(NotFoundException);
  });

  it('debe lanzar ConflictException si la parada ya tiene una recolección', async () => {
    mockPrisma.routeStop.findUnique.mockResolvedValue(stop);
    mockPrisma.collection.findUnique.mockResolvedValue(collectionRecord);
    await expect(service.create(dto, 'driver-1')).rejects.toThrow(ConflictException);
  });

  it('debe crear la recolección y marcar la parada como completada', async () => {
    mockPrisma.routeStop.findUnique.mockResolvedValue(stop);
    mockPrisma.collection.findUnique.mockResolvedValue(null);
    mockPrisma.collection.create.mockResolvedValue(collectionRecord);
    mockPrisma.routeStop.update.mockResolvedValue({ ...stop, status: 'COMPLETED' });
    mockPrisma.routeStop.count.mockResolvedValue(1); // aún quedan paradas pendientes

    const result = await service.create(dto, 'driver-1');

    expect(result).toEqual(collectionRecord);
    expect(mockPrisma.routeStop.update).toHaveBeenCalledWith({
      where: { id: 'stop-1' },
      data: { status: 'COMPLETED' },
    });
    expect(mockPrisma.route.updateMany).not.toHaveBeenCalled();
  });

  it('debe completar la ruta automáticamente si esa era la última parada pendiente', async () => {
    mockPrisma.routeStop.findUnique.mockResolvedValue(stop);
    mockPrisma.collection.findUnique.mockResolvedValue(null);
    mockPrisma.collection.create.mockResolvedValue(collectionRecord);
    mockPrisma.routeStop.update.mockResolvedValue({ ...stop, status: 'COMPLETED' });
    mockPrisma.routeStop.count.mockResolvedValue(0); // ninguna parada queda pendiente

    await service.create(dto, 'driver-1');

    expect(mockPrisma.route.updateMany).toHaveBeenCalledWith({
      where: { id: 'route-1', status: 'IN_PROGRESS' },
      data: { status: 'COMPLETED', finishedAt: expect.any(Date) },
    });
  });
});
