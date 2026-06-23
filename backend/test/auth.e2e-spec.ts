/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import type { Server } from 'http';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';
import { bootstrapE2E, E2eContext, mockPrisma } from './app.e2e-helper';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let ctx: E2eContext;
  let passwordHash: string;

  beforeAll(async () => {
    ctx = await bootstrapE2E();
    app = ctx.app;
    // Pre-compute a real bcrypt hash for login tests
    passwordHash = await bcrypt.hash('123456', 10);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Restore default mock for JwtStrategy (must return an ACTIVE user)
    mockPrisma.user.findUnique.mockResolvedValue(ctx.defaultUser);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('debe registrar un nuevo usuario con role CITIZEN y retornar accessToken', async () => {
      // ── Mock: no existe usuario con ese email ──
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      // ── Mock: crear usuario retorna el nuevo registro ──
      mockPrisma.user.create.mockResolvedValueOnce({
        id: 'e2e-new-user-id',
        email: 'nuevo@test.com',
        fullName: 'Nuevo Usuario',
        role: 'CITIZEN',
        createdAt: new Date(),
      });

      const res = await request(app.getHttpServer() as Server)
        .post('/auth/register')
        .send({
          email: 'nuevo@test.com',
          password: '123456',
          fullName: 'Nuevo Usuario',
        })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(typeof res.body.accessToken).toBe('string');
      expect(res.body.accessToken).not.toHaveLength(0);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('nuevo@test.com');
      expect(res.body.user.role).toBe('CITIZEN');
    });
  });

  describe('POST /auth/login', () => {
    it('debe iniciar sesión con credenciales válidas y retornar accessToken', async () => {
      // ── Mock: usuario existe con password real ──
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'e2e-login-user-id',
        email: 'login@test.com',
        passwordHash, // hash real de "123456"
        fullName: 'Login User',
        role: 'CITIZEN',
        status: 'ACTIVE',
        createdAt: new Date(),
      });

      const res = await request(app.getHttpServer() as Server)
        .post('/auth/login')
        .send({ email: 'login@test.com', password: '123456' })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(typeof res.body.accessToken).toBe('string');
      expect(res.body.accessToken).not.toHaveLength(0);
    });

    it('debe retornar 401 si la contraseña es incorrecta', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'e2e-login-user-id',
        email: 'login@test.com',
        passwordHash, // hash real de "123456"
        fullName: 'Login User',
        role: 'CITIZEN',
        status: 'ACTIVE',
        createdAt: new Date(),
      });

      await request(app.getHttpServer() as Server)
        .post('/auth/login')
        .send({ email: 'login@test.com', password: 'wrong-password' })
        .expect(401);
    });
  });
});
