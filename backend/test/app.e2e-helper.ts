import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Must be set before AppModule/AuthModule is loaded,
 * since auth.module.ts reads JWT_SECRET at module load time.
 */
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-e2e';

/** Default user shape that JwtStrategy.validate() expects */
const DEFAULT_USER = {
  id: 'e2e-default-user-id',
  email: 'test@e2e.com',
  fullName: 'E2E Test User',
  role: 'CITIZEN' as const,
  status: 'ACTIVE' as const,
};

/**
 * Base mock for PrismaService.
 * Each e2e test file can override individual mocks via mockResolvedValue / mockResolvedValueOnce.
 */
export const mockPrisma = {
  user: {
    findUnique: jest.fn().mockResolvedValue(DEFAULT_USER),
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue(DEFAULT_USER),
    update: jest.fn().mockResolvedValue(DEFAULT_USER),
    count: jest.fn().mockResolvedValue(0),
    groupBy: jest.fn().mockResolvedValue([]),
  },
  zone: {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    count: jest.fn().mockResolvedValue(0),
  },
  pickupPoint: {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    count: jest.fn().mockResolvedValue(0),
  },
  incident: {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    count: jest.fn().mockResolvedValue(0),
    groupBy: jest.fn().mockResolvedValue([]),
  },
  routeStop: {
    findUnique: jest.fn().mockResolvedValue(null),
    findMany: jest.fn().mockResolvedValue([]),
  },
  collection: {
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
  },
  collectionSchedule: {
    findMany: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
  },
  route: {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    count: jest.fn().mockResolvedValue(0),
  },
  wasteType: {
    findMany: jest.fn().mockResolvedValue([]),
  },
};

export interface E2eContext {
  app: INestApplication;
  moduleFixture: TestingModule;
  jwtService: JwtService;
  mockPrisma: typeof mockPrisma;
  generateToken: (role: 'ADMIN' | 'DRIVER' | 'CITIZEN') => string;
  defaultUser: typeof DEFAULT_USER;
}

/**
 * Bootstrap a NestJS test application for e2e testing.
 *
 * Importa AppModule completo pero sobreescribe:
 * - PrismaService → mock que devuelve datos ficticios (incluyendo un usuario
 *   ACTIVE por defecto para que JwtStrategy.validate() funcione sin DB real).
 * - ThrottlerModule → límite muy alto para evitar 429 en tests rápidos.
 */
export async function bootstrapE2E(): Promise<E2eContext> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(mockPrisma)
    .overrideProvider('THROTTLER:MODULE_OPTIONS')
    .useValue([{ ttl: 60000, limit: 100000 }])
    .compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  const jwtService = app.get(JwtService);

  return {
    app,
    moduleFixture,
    jwtService,
    mockPrisma,
    generateToken: (role: 'ADMIN' | 'DRIVER' | 'CITIZEN') => {
      return jwtService.sign({
        sub: DEFAULT_USER.id,
        email: DEFAULT_USER.email,
        role,
      });
    },
    defaultUser: DEFAULT_USER,
  };
}
