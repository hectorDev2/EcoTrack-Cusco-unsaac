/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import type { Server } from 'http';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { bootstrapE2E, E2eContext, mockPrisma } from './app.e2e-helper';

describe('Admin (e2e)', () => {
  let app: INestApplication;
  let ctx: E2eContext;

  beforeAll(async () => {
    ctx = await bootstrapE2E();
    app = ctx.app;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: findUnique returns CITIZEN user
    mockPrisma.user.findUnique.mockResolvedValue(ctx.defaultUser);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /admin/dashboard', () => {
    it('debe retornar el dashboard con role ADMIN y 200', async () => {
      // ── Mock: JwtStrategy devuelve un usuario ADMIN ──
      mockPrisma.user.findUnique.mockResolvedValue({
        ...ctx.defaultUser,
        role: 'ADMIN',
      });

      const res = await request(app.getHttpServer() as Server)
        .get('/admin/dashboard')
        .set('Authorization', `Bearer ${ctx.generateToken('ADMIN')}`)
        .expect(200);

      // Verificar la forma del dashboard (valores pueden ser 0)
      expect(res.body).toBeDefined();
      expect(res.body).toHaveProperty('zones');
      expect(res.body).toHaveProperty('pickupPoints');
      expect(res.body).toHaveProperty('coverage');
      expect(res.body).toHaveProperty('incidentsByStatus');
      expect(res.body.incidentsByStatus).toHaveProperty('open');
      expect(res.body.incidentsByStatus).toHaveProperty('inProgress');
      expect(res.body.incidentsByStatus).toHaveProperty('resolved');
      expect(res.body.incidentsByStatus).toHaveProperty('closed');
      expect(res.body).toHaveProperty('pendingIncidents');
      expect(res.body).toHaveProperty('recentIncidents');
      expect(res.body).toHaveProperty('usersStats');
      expect(res.body.usersStats).toHaveProperty('total');
      expect(res.body.usersStats).toHaveProperty('active');
      expect(res.body.usersStats).toHaveProperty('drivers');
      expect(res.body.usersStats).toHaveProperty('admins');
      expect(res.body.usersStats).toHaveProperty('citizens');
      expect(res.body).toHaveProperty('schedulesCount');
    });

    it('debe retornar 403 si el usuario no es ADMIN', async () => {
      // Default mock: CITIZEN → RolesGuard rechaza
      await request(app.getHttpServer() as Server)
        .get('/admin/dashboard')
        .set('Authorization', `Bearer ${ctx.generateToken('CITIZEN')}`)
        .expect(403);
    });
  });
});
