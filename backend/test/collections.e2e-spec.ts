import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { bootstrapE2E, E2eContext, mockPrisma } from './app.e2e-helper';

describe('Collections (e2e)', () => {
  let app: INestApplication;
  let ctx: E2eContext;

  beforeAll(async () => {
    ctx = await bootstrapE2E();
    app = ctx.app;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: findUnique returns CITIZEN user (for JwtStrategy)
    mockPrisma.user.findUnique.mockResolvedValue(ctx.defaultUser);
    mockPrisma.routeStop.findUnique.mockResolvedValue(null);
    mockPrisma.collection.findUnique.mockResolvedValue(null);
    mockPrisma.collection.create.mockResolvedValue({});
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /collections', () => {
    it('debe crear una recolección con role DRIVER y retornar 201', async () => {
      // ── Mock: JwtStrategy devuelve un usuario DRIVER ──
      mockPrisma.user.findUnique.mockResolvedValue({
        ...ctx.defaultUser,
        role: 'DRIVER',
      });

      // ── Mock: la parada existe y pertenece al driver ──
      mockPrisma.routeStop.findUnique.mockResolvedValue({
        id: 'e2e-stop-id',
        route: { driverId: ctx.defaultUser.id },
      });

      // ── Mock: no hay recolección duplicada ──
      mockPrisma.collection.findUnique.mockResolvedValue(null);

      // ── Mock: recolección creada exitosamente ──
      const fakeCollection = {
        id: 'e2e-collection-1',
        routeStopId: 'e2e-stop-id',
        wasteTypeId: 'e2e-waste-type-id',
        collectedAt: new Date(),
        notes: null,
        routeStop: {
          pickupPoint: { id: 'pp-1', name: 'Punto de Prueba', address: 'Av. Prueba 123' },
        },
        wasteType: { id: 'e2e-waste-type-id', name: 'Plástico', category: 'RECYCLABLE' },
      };
      mockPrisma.collection.create.mockResolvedValue(fakeCollection);

      const res = await request(app.getHttpServer())
        .post('/collections')
        .set('Authorization', `Bearer ${ctx.generateToken('DRIVER')}`)
        .send({
          routeStopId: 'e2e-stop-id',
          wasteTypeId: 'e2e-waste-type-id',
        })
        .expect(201);

      expect(res.body).toBeDefined();
      expect(res.body.id).toBe('e2e-collection-1');
      expect(res.body.routeStop).toBeDefined();
      expect(res.body.wasteType).toBeDefined();
      expect(res.body.wasteType.name).toBe('Plástico');
    });

    it('debe retornar 403 si el usuario no tiene role DRIVER', async () => {
      // Default mock: user.findUnique returns CITIZEN → RolesGuard rechaza
      await request(app.getHttpServer())
        .post('/collections')
        .set('Authorization', `Bearer ${ctx.generateToken('CITIZEN')}`)
        .send({
          routeStopId: 'e2e-stop-id',
          wasteTypeId: 'e2e-waste-type-id',
        })
        .expect(403);
    });
  });
});
