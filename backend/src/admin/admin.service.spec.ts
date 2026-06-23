import { Test, type TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';

type MockPrisma = Record<string, Record<string, jest.Mock>>;

const mockDate = new Date('2025-01-01T00:00:00.000Z');

describe('AdminService', () => {
  let service: AdminService;

  const mockPrisma: MockPrisma = {
    zone: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    pickupPoint: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    incident: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    user: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    collectionSchedule: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    route: {
      findMany: jest.fn(),
    },
    wasteType: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('debe retornar el dashboard con todos los KPIs', async () => {
      mockPrisma.zone.count.mockResolvedValue(5);
      mockPrisma.pickupPoint.count.mockResolvedValue(15);
      mockPrisma.incident.count
        .mockResolvedValueOnce(3) // OPEN
        .mockResolvedValueOnce(2) // IN_PROGRESS
        .mockResolvedValueOnce(8) // RESOLVED
        .mockResolvedValueOnce(1); // CLOSED
      mockPrisma.incident.findMany.mockResolvedValue([
        {
          id: 'inc-1',
          title: 'Incidente reciente',
          status: 'OPEN',
          createdAt: mockDate,
          reporter: {
            id: 'user-1',
            fullName: 'Juan Pérez',
            email: 'juan@test.com',
          },
          zone: { id: 'zone-1', name: 'Centro Histórico' },
        },
      ]);
      mockPrisma.user.groupBy.mockResolvedValue([
        { role: 'CITIZEN', status: 'ACTIVE', _count: 30 },
        { role: 'DRIVER', status: 'ACTIVE', _count: 15 },
        { role: 'ADMIN', status: 'ACTIVE', _count: 5 },
        { role: 'CITIZEN', status: 'INACTIVE', _count: 10 },
      ]);
      mockPrisma.collectionSchedule.count.mockResolvedValue(10);
      mockPrisma.user.count.mockResolvedValue(60);

      const result = await service.getDashboard();

      expect(result.zones).toBe(5);
      expect(result.pickupPoints).toBe(15);
      expect(result.coverage).toBe(100); // 15 / max(5*3, 1) = 15/15 * 100
      expect(result.incidentsByStatus).toEqual({
        open: 3,
        inProgress: 2,
        resolved: 8,
        closed: 1,
      });
      expect(result.pendingIncidents).toBe(5); // open + inProgress
      expect(result.recentIncidents).toHaveLength(1);
      expect(result.usersStats).toEqual({
        total: 60,
        active: 50, // 30 + 15 + 5
        drivers: 15,
        admins: 5,
        citizens: 30,
      });
      expect(result.schedulesCount).toBe(10);
    });

    it('debe retornar coverage 0% si no hay zonas activas', async () => {
      mockPrisma.zone.count.mockResolvedValue(0);
      mockPrisma.pickupPoint.count.mockResolvedValue(0);
      mockPrisma.incident.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockPrisma.incident.findMany.mockResolvedValue([]);
      mockPrisma.user.groupBy.mockResolvedValue([]);
      mockPrisma.collectionSchedule.count.mockResolvedValue(0);
      mockPrisma.user.count.mockResolvedValue(0);

      const result = await service.getDashboard();

      expect(result.zones).toBe(0);
      expect(result.coverage).toBe(0);
      expect(result.pendingIncidents).toBe(0);
      expect(result.usersStats.total).toBe(0);
      expect(result.usersStats.active).toBe(0);
    });

    it('debe manejar datos vacíos sin usuarios activos', async () => {
      mockPrisma.zone.count.mockResolvedValue(2);
      mockPrisma.pickupPoint.count.mockResolvedValue(3);
      mockPrisma.incident.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockPrisma.incident.findMany.mockResolvedValue([]);
      mockPrisma.user.groupBy.mockResolvedValue([
        { role: 'CITIZEN', status: 'INACTIVE', _count: 5 },
      ]);
      mockPrisma.collectionSchedule.count.mockResolvedValue(0);
      mockPrisma.user.count.mockResolvedValue(5);

      const result = await service.getDashboard();

      expect(result.zones).toBe(2);
      expect(result.coverage).toBe(50); // 3 / max(2*3, 1) = 3/6 * 100
      expect(result.usersStats.active).toBe(0);
      expect(result.usersStats.drivers).toBe(0);
      expect(result.usersStats.admins).toBe(0);
      expect(result.usersStats.citizens).toBe(0);
    });
  });

  describe('getAnalytics', () => {
    it('debe retornar analytics completos con wasteComposition y zoneRanking', async () => {
      const mockZones = [
        { id: 'z1', name: 'Centro Histórico', status: 'ACTIVE' },
        { id: 'z2', name: 'San Blas', status: 'ACTIVE' },
      ];

      const mockPickupPoints = [
        {
          id: 'pp1',
          zoneId: 'z1',
          status: 'ACTIVE',
          zone: { id: 'z1', name: 'Centro Histórico' },
        },
        {
          id: 'pp2',
          zoneId: 'z1',
          status: 'ACTIVE',
          zone: { id: 'z1', name: 'Centro Histórico' },
        },
        {
          id: 'pp3',
          zoneId: 'z2',
          status: 'ACTIVE',
          zone: { id: 'z2', name: 'San Blas' },
        },
      ];

      const mockSchedules = [
        {
          id: 's1',
          zoneId: 'z1',
          wasteTypeId: 'wt1',
          zone: { id: 'z1', name: 'Centro Histórico' },
          wasteType: { id: 'wt1', name: 'Plástico', category: 'RECYCLABLE' },
        },
        {
          id: 's2',
          zoneId: 'z1',
          wasteTypeId: 'wt2',
          zone: { id: 'z1', name: 'Centro Histórico' },
          wasteType: { id: 'wt2', name: 'Orgánico', category: 'ORGANIC' },
        },
        {
          id: 's3',
          zoneId: 'z2',
          wasteTypeId: 'wt1',
          zone: { id: 'z2', name: 'San Blas' },
          wasteType: { id: 'wt1', name: 'Plástico', category: 'RECYCLABLE' },
        },
      ];

      const mockIncidents = [
        {
          id: 'i1',
          zoneId: 'z1',
          status: 'OPEN',
          createdAt: new Date('2025-01-01T10:00:00Z'),
          zone: { id: 'z1', name: 'Centro Histórico' },
        },
        {
          id: 'i2',
          zoneId: 'z1',
          status: 'RESOLVED',
          createdAt: new Date('2025-01-02T10:00:00Z'),
          zone: { id: 'z1', name: 'Centro Histórico' },
        },
        {
          id: 'i3',
          zoneId: 'z2',
          status: 'CLOSED',
          createdAt: new Date('2025-01-03T10:00:00Z'),
          zone: { id: 'z2', name: 'San Blas' },
        },
      ];

      const mockRoutes = [
        {
          id: 'r1',
          status: 'IN_PROGRESS',
          stops: [{ id: 'stop1' }, { id: 'stop2' }],
        },
        { id: 'r2', status: 'COMPLETED', stops: [{ id: 'stop3' }] },
      ];

      const mockWasteTypes = [
        { id: 'wt1', name: 'Plástico', category: 'RECYCLABLE' },
        { id: 'wt2', name: 'Orgánico', category: 'ORGANIC' },
      ];

      mockPrisma.zone.findMany.mockResolvedValue(mockZones);
      mockPrisma.pickupPoint.findMany.mockResolvedValue(mockPickupPoints);
      mockPrisma.collectionSchedule.findMany.mockResolvedValue(mockSchedules);
      mockPrisma.incident.findMany.mockResolvedValue(mockIncidents);
      mockPrisma.route.findMany.mockResolvedValue(mockRoutes);
      mockPrisma.wasteType.findMany.mockResolvedValue(mockWasteTypes);
      mockPrisma.incident.groupBy.mockResolvedValue([]);

      const result = await service.getAnalytics();

      // Stats
      expect(result.stats.totalWaste).toBe(9); // 3 schedules * 3 pickupPoints
      expect(result.stats.recyclingRate).toBe(67); // 2 recyclable / 3 total * 100, rounded
      expect(result.stats.activeRoutes).toBe('1/2');
      expect(result.stats.criticalAlerts).toBe(1); // OPEN incidents

      // Waste composition
      expect(result.wasteComposition).toHaveLength(2);
      const plastico = result.wasteComposition.find(
        (w) => w.name === 'Plástico',
      );
      expect(plastico?.count).toBe(2);
      expect(plastico?.percentage).toBe(67); // 2/3 * 100

      // Zone ranking
      expect(result.zoneRanking).toHaveLength(2);
      const centro = result.zoneRanking.find(
        (z) => z.name === 'Centro Histórico',
      );
      expect(centro).toBeDefined();
      expect(centro!.pickupPoints).toBe(2);
      expect(centro!.incidents).toBe(2);
      expect(centro!.participationRate).toBe(50); // 1 resolved/closed / 2 total
      expect(centro!.status).toBe('OPTIMO'); // 50 >= 40

      // Totals
      expect(result.totalZones).toBe(2);
      expect(result.totalPickupPoints).toBe(3);
      expect(result.totalSchedules).toBe(3);
      expect(result.totalIncidents).toBe(3);
    });

    it('debe retornar analytics con datos vacíos (todo cero)', async () => {
      mockPrisma.zone.findMany.mockResolvedValue([]);
      mockPrisma.pickupPoint.findMany.mockResolvedValue([]);
      mockPrisma.collectionSchedule.findMany.mockResolvedValue([]);
      mockPrisma.incident.findMany.mockResolvedValue([]);
      mockPrisma.route.findMany.mockResolvedValue([]);
      mockPrisma.wasteType.findMany.mockResolvedValue([]);
      mockPrisma.incident.groupBy.mockResolvedValue([]);

      const result = await service.getAnalytics();

      expect(result.stats.totalWaste).toBe(0);
      expect(result.stats.recyclingRate).toBe(0);
      expect(result.stats.activeRoutes).toBe('0/0');
      expect(result.stats.criticalAlerts).toBe(0);
      expect(result.wasteComposition).toHaveLength(0);
      expect(result.zoneRanking).toHaveLength(0);
      expect(result.totalZones).toBe(0);
      expect(result.totalPickupPoints).toBe(0);
      expect(result.totalSchedules).toBe(0);
      expect(result.totalIncidents).toBe(0);
    });
  });
});
