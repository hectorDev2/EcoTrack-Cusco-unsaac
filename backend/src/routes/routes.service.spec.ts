/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, type TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { RoutesService } from './routes.service';
import { PrismaService } from '../prisma/prisma.service';
import { DemoStateService } from '../demo/demo-state.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';

type MockPrisma = Record<string, Record<string, jest.Mock>>;

const mockDate = new Date('2025-01-01T00:00:00.000Z');

const mockZone = { id: 'zone-1', name: 'Centro Histórico' };
const mockDriver = {
  id: 'driver-1',
  fullName: 'Carlos Conductor',
  email: 'carlos@test.com',
};
const mockPickupPoint = {
  id: 'pp-1',
  name: 'Parque de la Madre',
  address: 'Av. de la Cultura',
  latitude: -13.517,
  longitude: -71.978,
};

const mockStops = [
  {
    id: 'stop-1',
    routeId: 'route-1',
    pickupPointId: 'pp-1',
    orderIndex: 0,
    status: 'PENDING',
    pickupPoint: mockPickupPoint,
  },
  {
    id: 'stop-2',
    routeId: 'route-1',
    pickupPointId: 'pp-2',
    orderIndex: 1,
    status: 'COMPLETED',
    pickupPoint: {
      id: 'pp-2',
      name: 'Plaza de Armas',
      address: 'Plaza de Armas',
      latitude: -13.516,
      longitude: -71.978,
    },
  },
];

const mockRoute = {
  id: 'route-1',
  zoneId: 'zone-1',
  driverId: 'driver-1',
  status: 'PENDING',
  createdAt: mockDate,
  startedAt: null,
  finishedAt: null,
  zone: mockZone,
  driver: mockDriver,
  stops: mockStops,
  schedules: [],
};

describe('RoutesService', () => {
  let service: RoutesService;
  let _prisma: MockPrisma;

  const mockPrisma: MockPrisma = {
    route: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    routeStop: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
    },
    routeLocation: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    routeSchedule: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoutesService,
        { provide: PrismaService, useValue: mockPrisma },
        DemoStateService,
      ],
    }).compile();

    service = module.get<RoutesService>(RoutesService);
    _prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('debe retornar todas las rutas con progreso de paradas', async () => {
      mockPrisma.route.findMany.mockResolvedValue([mockRoute]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].totalStops).toBe(2);
      expect(result[0].completedStops).toBe(1);
    });

    it('debe retornar lista vacía si no hay rutas', async () => {
      mockPrisma.route.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('debe retornar una ruta con progreso de paradas', async () => {
      mockPrisma.route.findUnique.mockResolvedValue(mockRoute);

      const result = await service.findOne('route-1');

      expect(result.id).toBe('route-1');
      expect(result.totalStops).toBe(2);
      expect(result.completedStops).toBe(1);
      expect(result.zone).toMatchObject({
        id: 'zone-1',
        name: 'Centro Histórico',
      });
    });

    it('debe devolver los horarios como arrays de días, no como CSV', async () => {
      mockPrisma.route.findUnique.mockResolvedValue({
        ...mockRoute,
        schedules: [
          { id: 'sch-1', days: 'MON,WED,FRI', time: '06:00', label: null },
          { id: 'sch-2', days: 'TUE,THU,SAT', time: '17:00', label: 'Turno tarde' },
        ],
      });

      const result = await service.findOne('route-1');

      expect(result.schedules).toEqual([
        { id: 'sch-1', days: ['MON', 'WED', 'FRI'], time: '06:00', label: null },
        { id: 'sch-2', days: ['TUE', 'THU', 'SAT'], time: '17:00', label: 'Turno tarde' },
      ]);
    });

    it('debe lanzar NotFoundException si la ruta no existe', async () => {
      mockPrisma.route.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('debe crear una ruta con paradas si se proporcionan pickupPointIds', async () => {
      const dto: CreateRouteDto = {
        zoneId: 'zone-1',
        driverId: 'driver-1',
        pickupPointIds: ['pp-1', 'pp-2'],
      };
      const createdRoute = { ...mockRoute, id: 'route-new' };
      mockPrisma.route.create.mockResolvedValue(createdRoute);
      mockPrisma.routeStop.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.route.findUnique.mockResolvedValue({
        ...createdRoute,
        stops: mockStops,
      });

      const result = await service.create(dto);

      expect(mockPrisma.route.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            zoneId: 'zone-1',
            driverId: 'driver-1',
            status: 'PENDING',
          }),
        }),
      );
      expect(mockPrisma.routeStop.createMany).toHaveBeenCalledWith({
        data: [
          { routeId: 'route-new', pickupPointId: 'pp-1', orderIndex: 0 },
          { routeId: 'route-new', pickupPointId: 'pp-2', orderIndex: 1 },
        ],
      });
      expect(result.id).toBe('route-new');
    });

    it('debe crear los horarios de la ruta si se proporcionan schedules', async () => {
      const dto: CreateRouteDto = {
        zoneId: 'zone-1',
        driverId: 'driver-1',
        schedules: [
          { days: ['MON', 'WED', 'FRI'], time: '06:00' },
          { days: ['TUE', 'THU', 'SAT'], time: '17:00', label: 'Turno tarde' },
        ],
      };
      const createdRoute = { ...mockRoute, id: 'route-new-3' };
      mockPrisma.route.create.mockResolvedValue(createdRoute);
      mockPrisma.route.findUnique.mockResolvedValue(createdRoute);

      await service.create(dto);

      expect(mockPrisma.routeSchedule.deleteMany).toHaveBeenCalledWith({
        where: { routeId: 'route-new-3' },
      });
      expect(mockPrisma.routeSchedule.createMany).toHaveBeenCalledWith({
        data: [
          { routeId: 'route-new-3', days: 'MON,WED,FRI', time: '06:00', label: null },
          { routeId: 'route-new-3', days: 'TUE,THU,SAT', time: '17:00', label: 'Turno tarde' },
        ],
      });
    });

    it('debe crear una ruta sin paradas si no se proporcionan pickupPointIds', async () => {
      const dto: CreateRouteDto = {
        zoneId: 'zone-1',
        driverId: 'driver-1',
      };
      const createdRoute = { ...mockRoute, id: 'route-new-2' };
      mockPrisma.route.create.mockResolvedValue(createdRoute);
      mockPrisma.route.findUnique.mockResolvedValue({
        ...createdRoute,
        stops: [],
      });

      const result = await service.create(dto);

      expect(mockPrisma.routeStop.createMany).not.toHaveBeenCalled();
      expect(result.id).toBe('route-new-2');
    });
  });

  describe('update', () => {
    it('debe actualizar el estado a IN_PROGRESS con startedAt', async () => {
      const updatedRoute = {
        ...mockRoute,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        stops: mockStops,
      };
      // findOne() se llama 2 veces: al inicio y al final de update()
      mockPrisma.route.findUnique
        .mockResolvedValueOnce({ ...mockRoute, stops: mockStops })
        .mockResolvedValueOnce(updatedRoute);
      mockPrisma.route.update.mockResolvedValue(updatedRoute);

      const dto: UpdateRouteDto = { status: 'IN_PROGRESS' };
      const result = await service.update('route-1', dto);

      expect(result.status).toBe('IN_PROGRESS');
      expect(result.startedAt).toBeDefined();
      expect(mockPrisma.route.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'route-1' },
          data: expect.objectContaining({
            status: 'IN_PROGRESS',
            startedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('debe actualizar el estado a COMPLETED con finishedAt', async () => {
      const inProgressRoute = {
        ...mockRoute,
        status: 'IN_PROGRESS',
        startedAt: mockDate,
        stops: mockStops,
      };
      const completedRoute = {
        ...inProgressRoute,
        status: 'COMPLETED',
        finishedAt: new Date(),
      };
      // findOne() se llama 2 veces: al inicio y al final de update()
      mockPrisma.route.findUnique
        .mockResolvedValueOnce(inProgressRoute)
        .mockResolvedValueOnce(completedRoute);
      mockPrisma.route.update.mockResolvedValue(completedRoute);

      const dto: UpdateRouteDto = { status: 'COMPLETED' };
      const result = await service.update('route-1', dto);

      expect(result.status).toBe('COMPLETED');
      expect(result.finishedAt).toBeDefined();
      expect(mockPrisma.route.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'COMPLETED',
            finishedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('debe lanzar NotFoundException si la ruta no existe', async () => {
      mockPrisma.route.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { status: 'IN_PROGRESS' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe reemplazar los horarios existentes cuando se envía schedules', async () => {
      mockPrisma.route.findUnique
        .mockResolvedValueOnce(mockRoute)
        .mockResolvedValueOnce(mockRoute);
      mockPrisma.route.update.mockResolvedValue(mockRoute);

      const dto: UpdateRouteDto = {
        schedules: [{ days: ['DOM'], time: '08:00', label: 'Dominical' }],
      };
      await service.update('route-1', dto);

      expect(mockPrisma.routeSchedule.deleteMany).toHaveBeenCalledWith({
        where: { routeId: 'route-1' },
      });
      expect(mockPrisma.routeSchedule.createMany).toHaveBeenCalledWith({
        data: [{ routeId: 'route-1', days: 'DOM', time: '08:00', label: 'Dominical' }],
      });
    });

    it('debe dejar la ruta sin horarios si se envía schedules vacío', async () => {
      mockPrisma.route.findUnique
        .mockResolvedValueOnce(mockRoute)
        .mockResolvedValueOnce(mockRoute);
      mockPrisma.route.update.mockResolvedValue(mockRoute);

      await service.update('route-1', { schedules: [] });

      expect(mockPrisma.routeSchedule.deleteMany).toHaveBeenCalledWith({
        where: { routeId: 'route-1' },
      });
      expect(mockPrisma.routeSchedule.createMany).not.toHaveBeenCalled();
    });
  });

  describe('findByZone', () => {
    it('debe retornar rutas activas de una zona', async () => {
      mockPrisma.route.findMany.mockResolvedValue([mockRoute]);

      const result = await service.findByZone('zone-1');

      expect(result).toHaveLength(1);
      expect(result[0].totalStops).toBe(2);
      expect(mockPrisma.route.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            zoneId: 'zone-1',
            status: { in: ['PENDING', 'IN_PROGRESS'] },
          }),
        }),
      );
    });
  });

  describe('findByDriver', () => {
    it('debe retornar las rutas asignadas a un conductor', async () => {
      mockPrisma.route.findMany.mockResolvedValue([mockRoute]);

      const result = await service.findByDriver('driver-1');

      expect(result).toHaveLength(1);
      expect(result[0].driver?.fullName).toBe('Carlos Conductor');
    });

    it('debe retornar lista vacía si el conductor no tiene rutas', async () => {
      mockPrisma.route.findMany.mockResolvedValue([]);

      const result = await service.findByDriver('driver-sin-rutas');

      expect(result).toHaveLength(0);
    });

    it('debe ordenar varias rutas del conductor por hora de turno, no por fecha de creación', async () => {
      const noche = { ...mockRoute, id: 'route-noche', shift: 'NOCHE' };
      const manana = { ...mockRoute, id: 'route-manana', shift: 'MANANA' };
      const tarde = { ...mockRoute, id: 'route-tarde', shift: 'TARDE' };
      // El mock ya viene en un orden distinto (simula orderBy createdAt: desc)
      mockPrisma.route.findMany.mockResolvedValue([noche, manana, tarde]);

      const result = await service.findByDriver('driver-1');

      expect(result.map((r) => r.id)).toEqual(['route-manana', 'route-tarde', 'route-noche']);
    });

    it('debe incluir en la consulta las rutas COMPLETED de hoy además de PENDING/IN_PROGRESS', async () => {
      mockPrisma.route.findMany.mockResolvedValue([mockRoute]);

      await service.findByDriver('driver-1');

      expect(mockPrisma.route.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            driverId: 'driver-1',
            OR: [
              { status: { in: ['PENDING', 'IN_PROGRESS'] } },
              { status: 'COMPLETED', finishedAt: { gte: expect.any(Date) } },
            ],
          }),
        }),
      );
    });
  });

  describe('startRoute', () => {
    it('debe iniciar una ruta pendiente exitosamente', async () => {
      mockPrisma.route.findUnique.mockResolvedValue(mockRoute);
      const startedRoute = {
        ...mockRoute,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      };
      mockPrisma.route.update.mockResolvedValue(startedRoute);

      const result = await service.startRoute('route-1', 'driver-1');

      expect(result.status).toBe('IN_PROGRESS');
      expect(result.startedAt).toBeDefined();
      expect(mockPrisma.route.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'route-1' },
          data: expect.objectContaining({
            status: 'IN_PROGRESS',
            startedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('debe lanzar ForbiddenException si el conductor no es el dueño de la ruta', async () => {
      mockPrisma.route.findUnique.mockResolvedValue(mockRoute);

      await expect(
        service.startRoute('route-1', 'driver-wrong'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe lanzar BadRequestException si la ruta no está pendiente', async () => {
      const inProgressRoute = { ...mockRoute, status: 'IN_PROGRESS' };
      mockPrisma.route.findUnique.mockResolvedValue(inProgressRoute);

      await expect(service.startRoute('route-1', 'driver-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('completeRoute', () => {
    it('debe completar una ruta en progreso exitosamente', async () => {
      const inProgressRoute = {
        ...mockRoute,
        status: 'IN_PROGRESS',
        startedAt: mockDate,
      };
      mockPrisma.route.findUnique.mockResolvedValue(inProgressRoute);
      const completedRoute = {
        ...inProgressRoute,
        status: 'COMPLETED',
        finishedAt: new Date(),
      };
      mockPrisma.route.update.mockResolvedValue(completedRoute);

      const result = await service.completeRoute('route-1', 'driver-1');

      expect(result.status).toBe('COMPLETED');
      expect(result.finishedAt).toBeDefined();
    });

    it('debe lanzar ForbiddenException si el conductor no es el dueño de la ruta', async () => {
      const inProgressRoute = {
        ...mockRoute,
        status: 'IN_PROGRESS',
        startedAt: mockDate,
      };
      mockPrisma.route.findUnique.mockResolvedValue(inProgressRoute);

      await expect(
        service.completeRoute('route-1', 'driver-wrong'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe lanzar BadRequestException si la ruta no está en progreso', async () => {
      mockPrisma.route.findUnique.mockResolvedValue(mockRoute);

      await expect(
        service.completeRoute('route-1', 'driver-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('completeStop', () => {
    const mockStopWithRoute = {
      id: 'stop-1',
      routeId: 'route-1',
      pickupPointId: 'pp-1',
      orderIndex: 0,
      status: 'PENDING',
      route: { driverId: 'driver-1', status: 'IN_PROGRESS' },
    };

    it('debe marcar una parada como completada', async () => {
      mockPrisma.routeStop.findUnique.mockResolvedValue(mockStopWithRoute);
      const completedStop = { ...mockStopWithRoute, status: 'COMPLETED' };
      mockPrisma.routeStop.update.mockResolvedValue(completedStop);

      const result = await service.completeStop('stop-1', 'driver-1');

      expect(result.status).toBe('COMPLETED');
      expect(mockPrisma.routeStop.update).toHaveBeenCalledWith({
        where: { id: 'stop-1' },
        data: { status: 'COMPLETED' },
      });
    });

    it('debe lanzar NotFoundException si la parada no existe', async () => {
      mockPrisma.routeStop.findUnique.mockResolvedValue(null);

      await expect(
        service.completeStop('non-existent', 'driver-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar ForbiddenException si la parada no pertenece a la ruta del conductor', async () => {
      mockPrisma.routeStop.findUnique.mockResolvedValue(mockStopWithRoute);

      await expect(
        service.completeStop('stop-1', 'driver-wrong'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe lanzar BadRequestException si la parada ya fue completada', async () => {
      const alreadyCompleted = { ...mockStopWithRoute, status: 'COMPLETED' };
      mockPrisma.routeStop.findUnique.mockResolvedValue(alreadyCompleted);

      await expect(service.completeStop('stop-1', 'driver-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('sendLocation', () => {
    it('debe enviar una ubicación para una ruta', async () => {
      mockPrisma.route.findUnique.mockResolvedValue(mockRoute);
      const location = {
        id: 'loc-1',
        routeId: 'route-1',
        latitude: -13.517,
        longitude: -71.978,
        recordedAt: mockDate,
      };
      mockPrisma.routeLocation.create.mockResolvedValue(location);

      const result = await service.sendLocation(
        'route-1',
        'driver-1',
        -13.517,
        -71.978,
      );

      expect('ignored' in result).toBe(false);
      expect((result as typeof location).latitude).toBe(-13.517);
      expect((result as typeof location).longitude).toBe(-71.978);
      expect(mockPrisma.routeLocation.create).toHaveBeenCalledWith({
        data: { routeId: 'route-1', latitude: -13.517, longitude: -71.978 },
      });
    });

    it('debe lanzar NotFoundException si la ruta no existe', async () => {
      mockPrisma.route.findUnique.mockResolvedValue(null);

      await expect(
        service.sendLocation('non-existent', 'driver-1', 0, 0),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar ForbiddenException si el conductor no es el dueño de la ruta', async () => {
      mockPrisma.route.findUnique.mockResolvedValue(mockRoute);

      await expect(
        service.sendLocation('route-1', 'driver-wrong', 0, 0),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getLocations', () => {
    it('debe retornar las ubicaciones ordenadas por timestamp', async () => {
      const locations = [
        {
          id: 'loc-1',
          routeId: 'route-1',
          latitude: -13.517,
          longitude: -71.978,
          recordedAt: new Date('2025-01-01T00:00:00Z'),
        },
        {
          id: 'loc-2',
          routeId: 'route-1',
          latitude: -13.518,
          longitude: -71.979,
          recordedAt: new Date('2025-01-01T00:05:00Z'),
        },
      ];
      mockPrisma.routeLocation.findMany.mockResolvedValue(locations);

      const result = await service.getLocations('route-1');

      expect(result).toHaveLength(2);
      expect(mockPrisma.routeLocation.findMany).toHaveBeenCalledWith({
        where: { routeId: 'route-1' },
        orderBy: { recordedAt: 'asc' },
      });
    });
  });

  describe('getFleetOverview', () => {
    it('debe retornar el resumen de flota con progreso calculado', async () => {
      const inProgressRoute = {
        ...mockRoute,
        id: 'route-1',
        status: 'IN_PROGRESS',
        startedAt: mockDate,
      };
      const pendingRoute = {
        ...mockRoute,
        id: 'route-2',
      };
      mockPrisma.route.findMany.mockResolvedValue([
        inProgressRoute,
        pendingRoute,
      ]);

      const result = await service.getFleetOverview();

      expect(result.totalRoutes).toBe(2);
      expect(result.inTransit).toBe(1);
      expect(result.pending).toBe(1);
      expect(result.completed).toBe(0);
      expect(result.alerts).toBe(0);
      expect(result.routes).toHaveLength(2);
      expect(result.routes[0].progress).toBe(50); // 1 completed / 2 total stops
      expect(result.routes[0].zone).toBe('Centro Histórico');
      expect(result.routes[0].driver).toBe('Carlos Conductor');
    });
  });
});
