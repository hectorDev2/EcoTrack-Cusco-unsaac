/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { bootstrapE2E, E2eContext, mockPrisma } from './app.e2e-helper';

describe('Incidents (e2e)', () => {
  let app: INestApplication;
  let ctx: E2eContext;
  let citizenToken: string;

  beforeAll(async () => {
    ctx = await bootstrapE2E();
    app = ctx.app;
    citizenToken = ctx.generateToken('CITIZEN');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Restore default for JwtStrategy (findUnique must return ACTIVE user)
    mockPrisma.user.findUnique.mockResolvedValue(ctx.defaultUser);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /incidents', () => {
    it('debe crear una incidencia y retornar 201', async () => {
      const fakeIncident = {
        id: 'e2e-incident-1',
        type: 'ILLEGAL_DUMPING',
        description: 'Botadero ilegal en la Av. Principal',
        status: 'OPEN',
        reportedBy: ctx.defaultUser.id,
        createdAt: new Date(),
        reporter: {
          id: ctx.defaultUser.id,
          fullName: ctx.defaultUser.fullName,
          email: ctx.defaultUser.email,
        },
        zone: null,
      };

      mockPrisma.incident.create.mockResolvedValue(fakeIncident);

      const res = await request(app.getHttpServer())
        .post('/incidents')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          type: 'ILLEGAL_DUMPING',
          description: 'Botadero ilegal en la Av. Principal',
        })
        .expect(201);

      expect(res.body).toBeDefined();
      expect(res.body.id).toBe('e2e-incident-1');
      expect(res.body.type).toBe('ILLEGAL_DUMPING');
      expect(res.body.description).toBe('Botadero ilegal en la Av. Principal');
      expect(res.body.status).toBe('OPEN');
    });
  });

  describe('GET /incidents/my', () => {
    it('debe retornar las incidencias del usuario autenticado', async () => {
      const fakeIncidents = [
        {
          id: 'e2e-incident-1',
          type: 'ILLEGAL_DUMPING',
          description: 'Botadero ilegal',
          status: 'OPEN',
          reportedBy: ctx.defaultUser.id,
          createdAt: new Date(),
          reporter: {
            id: ctx.defaultUser.id,
            fullName: ctx.defaultUser.fullName,
            email: ctx.defaultUser.email,
          },
          zone: null,
        },
        {
          id: 'e2e-incident-2',
          type: 'CONTAINER_DAMAGED',
          description: 'Contenedor roto en la esquina',
          status: 'IN_PROGRESS',
          reportedBy: ctx.defaultUser.id,
          createdAt: new Date(),
          reporter: {
            id: ctx.defaultUser.id,
            fullName: ctx.defaultUser.fullName,
            email: ctx.defaultUser.email,
          },
          zone: null,
        },
      ];

      mockPrisma.incident.findMany.mockResolvedValue(fakeIncidents);

      const res = await request(app.getHttpServer())
        .get('/incidents/my')
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].type).toBe('ILLEGAL_DUMPING');
      expect(res.body[1].type).toBe('CONTAINER_DAMAGED');
    });
  });
});
