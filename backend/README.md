# Eco Track Cusco — Backend

API REST para el sistema inteligente de recolección de residuos de Cusco.

**Stack:** NestJS · TypeScript · Prisma ORM · Turso DB (libSQL)

---

## Arrancar

```bash
cd backend
cp .env.example .env   # completar credenciales
npm install
npx prisma generate
npm run start:dev      # http://localhost:3001
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run start:dev` | Dev con hot-reload |
| `npm run build` | Compilar a `dist/` |
| `npm run start:prod` | Producción |
| `npm run prisma:generate` | Regenerar Prisma Client |
| `npm run prisma:push` | Sincronizar schema a DB local |
| `npm run prisma:studio` | Abrir Prisma Studio |

## Base de datos

Turso (libSQL) vía `@prisma/adapter-libsql`. Schema en `prisma/schema.prisma`. Para desarrollo local se usa SQLite (`prisma/dev.db`), la app en runtime apunta a Turso vía variables de entorno.

## Progreso del Backlog

### Configuración inicial
- [x] BE-00 — Scaffolding NestJS + Prisma + libSQL adapter
- [x] BE-01 — Variables de entorno (`.env`) y conexión Turso
- [x] BE-02 — Guard JWT global + estrategia Passport
- [x] BE-03 — Pipe global de validación y filtro de excepciones

### HU-01 · Registro e inicio de sesión (Ciudadano)
- [x] BE-10 — `AuthModule` + `POST /auth/register`
- [x] BE-11 — `POST /auth/login` → JWT
- [x] BE-12 — Modelo `User` en Prisma
- [x] BE-13 — Hash bcrypt
- [x] BE-14 — DTOs `RegisterDto` + `LoginDto`
- [x] BE-15 — `GET /auth/me`

### HU-02 · Horarios y puntos de recolección
- [ ] BE-20 — `ZonesModule` + modelo `Zone`
- [ ] BE-21 — `GET /zones`
- [ ] BE-22 — `SchedulesModule` + modelo `CollectionSchedule`
- [ ] BE-23 — `GET /schedules?zoneId=`
- [ ] BE-24 — `PickupPointsModule` + modelo `PickupPoint`
- [ ] BE-25 — `GET /pickup-points?zoneId=`

### HU-06 · Reportar incidencia
- [ ] BE-30 — `IncidentsModule` + modelo `Incident`
- [ ] BE-31 — `POST /incidents`
- [ ] BE-32 — `GET /incidents/my`
- [ ] BE-33 — `CreateIncidentDto`

### HU-Conductor · Ruta y recolección
- [ ] BE-40 — Rol `DRIVER` + guard de rol
- [ ] BE-41 — `RoutesModule` + modelos `Route` + `RouteStop`
- [ ] BE-42 — `GET /routes/my`
- [ ] BE-43 — `PATCH /routes/:id/start`
- [ ] BE-44 — `CollectionsModule` + modelo `Collection`
- [ ] BE-45 — `POST /collections`
- [ ] BE-46 — `POST /incidents` (conductor)

### HU-Admin · Gestión
- [ ] BE-50 — Rol `ADMIN` + guard de rol
- [x] BE-51 — `GET /users`
- [x] BE-52 — `PATCH /users/:id`
- [x] BE-53 — `DELETE /users/:id` (desactivar)
- [ ] BE-54 — CRUD `POST/PATCH/DELETE /zones`
- [ ] BE-55 — `WasteTypesModule` + modelo `WasteType`
- [ ] BE-56 — `GET/POST /waste-types`
- [ ] BE-57 — `GET/POST /waste-types/:id/classify`
- [ ] BE-58 — `POST/GET /routes` (admin)
- [ ] BE-59 — `GET /routes` (estado todas las rutas)

---

## Estructura

```
backend/
├── prisma/schema.prisma     # Schema completo (10 tablas)
├── src/
│   ├── auth/                # AuthModule (register, login, me)
│   ├── users/               # UsersModule (CRUD admin)
│   ├── prisma/              # PrismaService (adapter Turso)
│   ├── common/              # Guards, decorators, filters, pipes
│   ├── app.module.ts        # Módulo raíz
│   └── main.ts              # Bootstrap
├── .env.example
└── package.json
```
