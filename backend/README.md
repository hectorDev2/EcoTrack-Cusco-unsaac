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
npm run prisma:seed    # crear usuarios por defecto
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
| `npm run prisma:seed` | Poblar DB con usuarios por defecto |
| `npm run prisma:studio` | Abrir Prisma Studio |

## Seed — Usuarios por defecto

```bash
npm run prisma:seed
```

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@terracivic.pe | 123456 | Administrador |
| conductor@terracivic.pe | 123456 | Conductor |
| ciudadano@terracivic.pe | 123456 | Ciudadano |

## API — Endpoints

### Auth (`/auth`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/auth/register` | `@Public()` | Registrar ciudadano |
| POST | `/auth/login` | `@Public()` | Iniciar sesión → JWT |
| GET | `/auth/me` | JWT | Perfil del usuario autenticado |

### Users (`/users`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/users` | ADMIN | Lista paginada con `?search=&role=&status=&page=&limit=` |
| GET | `/users/me` | JWT | Perfil propio con zonas asignadas |
| GET | `/users/stats` | ADMIN | Estadísticas (total, activos, drivers, admins) |
| GET | `/users/:id` | ADMIN | Detalle de usuario con zonas |
| POST | `/users` | ADMIN | Crear usuario |
| PATCH | `/users/:id` | ADMIN | Actualizar (nombre, rol, status, password) |
| PATCH | `/users/:id/zones` | ADMIN | Asignar zonas al usuario |
| DELETE | `/users/:id` | ADMIN | Desactivar usuario |

### Zones (`/zones`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/zones` | `@Public()` | Lista zonas activas |
| GET | `/zones/:id` | `@Public()` | Detalle de zona |
| POST | `/zones` | ADMIN | Crear zona |
| PATCH | `/zones/:id` | ADMIN | Actualizar zona |
| DELETE | `/zones/:id` | ADMIN | Desactivar zona |

### Pickup Points (`/pickup-points`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/pickup-points` | `@Public()` | Lista activos, opcional `?zoneId=` |
| GET | `/pickup-points/:id` | `@Public()` | Detalle |
| POST | `/pickup-points` | ADMIN | Crear punto |
| PATCH | `/pickup-points/:id` | ADMIN | Actualizar |
| DELETE | `/pickup-points/:id` | ADMIN | Desactivar |

### Schedules (`/schedules`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/schedules` | `@Public()` | Lista, opcional `?zoneId=&wasteTypeId=` |
| GET | `/schedules/:id` | `@Public()` | Detalle |
| POST | `/schedules` | ADMIN | Crear horario |
| PATCH | `/schedules/:id` | ADMIN | Actualizar |
| DELETE | `/schedules/:id` | ADMIN | Eliminar |

### Incidents (`/incidents`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/incidents` | JWT | Crear incidencia (ciudadano) |
| GET | `/incidents/my` | JWT | Incidencias del usuario |
| GET | `/incidents` | ADMIN | Todas las incidencias |
| GET | `/incidents/:id` | JWT | Detalle |
| PATCH | `/incidents/:id` | ADMIN | Cambiar estado |

> **Nota:** El `JwtAuthGuard` es **global** (`APP_GUARD`). Para rutas públicas se usa `@Public()`.

## Base de datos

Turso (libSQL) vía `@prisma/adapter-libsql`. Schema en `prisma/schema.prisma` (10 modelos). Para desarrollo local se usa SQLite (`prisma/dev.db`), la app en runtime apunta a Turso vía variables de entorno.

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
- [x] BE-20 — `ZonesModule` + modelo `Zone`
- [x] BE-21 — `GET /zones`
- [x] BE-22 — `SchedulesModule` + modelo `CollectionSchedule`
- [x] BE-23 — `GET /schedules?zoneId=&wasteTypeId=`
- [x] BE-24 — `PickupPointsModule` + modelo `PickupPoint`
- [x] BE-25 — `GET /pickup-points?zoneId=`

### HU-06 · Reportar incidencia
- [x] BE-30 — `IncidentsModule` + modelo `Incident`
- [x] BE-31 — `POST /incidents`
- [x] BE-32 — `GET /incidents/my`
- [x] BE-33 — `CreateIncidentDto`
- [x] `GET /incidents` (admin) — Listar todas
- [x] `PATCH /incidents/:id` (admin) — Cambiar estado

### HU-Conductor · Ruta y recolección
- [x] BE-40 — Rol `DRIVER` en modelo `User` + guard de rol
- [ ] BE-41 — `RoutesModule` + modelos `Route` + `RouteStop`
- [ ] BE-42 — `GET /routes/my`
- [ ] BE-43 — `PATCH /routes/:id/start`
- [ ] BE-44 — `CollectionsModule` + modelo `Collection`
- [ ] BE-45 — `POST /collections`
- [ ] BE-46 — `POST /incidents` (conductor)

### HU-Admin · Gestión
- [x] BE-50 — Rol `ADMIN` + guard de rol
- [x] BE-51 — `GET /users` (con paginación, búsqueda, filtros)
- [x] BE-52 — `PATCH /users/:id` (soporta cambio de password)
- [x] BE-53 — `DELETE /users/:id` (desactivar)
- [x] BE-54 — CRUD `POST/PATCH/DELETE /zones`
- [ ] BE-55 — `WasteTypesModule` + modelo `WasteType`
- [ ] BE-56 — `GET/POST /waste-types`
- [ ] BE-57 — `GET/POST /waste-types/:id/classify`
- [ ] BE-58 — `POST/GET /routes` (admin)
- [ ] BE-59 — `GET /routes` (estado todas las rutas)

### Extra — Implementado fuera del backlog original
- [x] `GET /users/me` — Perfil propio con zonas
- [x] `GET /users/stats` — Estadísticas de usuarios
- [x] `POST /users` — Crear usuario desde admin
- [x] `PATCH /users/:id/zones` — Asignar zonas a usuario
- [x] `@Public()` decorator — Marcar rutas públicas
- [x] Guard global `APP_GUARD` — Protección por defecto
- [x] Seed de usuarios — `prisma/seed.ts`
- [x] Modo noche — Variables CSS dark en frontend
- [x] `GET /pickup-points/:id` — Detalle de punto
- [x] `GET /incidents/:id` — Detalle de incidencia
- [x] `PATCH /incidents/:id` — Cambiar estado (admin)

---

## Estructura

```
backend/
├── prisma/
│   ├── schema.prisma        # Schema completo (10 tablas)
│   └── seed.ts              # Seed de usuarios por defecto
├── src/
│   ├── auth/                # AuthModule (register, login, me, JWT)
│   ├── users/               # UsersModule (CRUD admin + zonas)
│   ├── zones/               # ZonesModule (CRUD admin + GET público)
│   ├── pickup-points/       # PickupPointsModule (consulta + CRUD admin)
│   ├── collection-schedules/# CollectionSchedulesModule (horarios)
│   ├── incidents/           # IncidentsModule (reporte ciudadano + gestión admin)
│   ├── prisma/              # PrismaService (adapter Turso)
│   ├── common/              # Guards, decorators, filters, pipes
│   │   ├── decorators/      # @CurrentUser, @Roles, @Public()
│   │   ├── guards/          # JwtAuthGuard (global), RolesGuard
│   │   ├── filters/         # AllExceptionsFilter
│   │   └── pipes/           # AppValidationPipe
│   ├── app.module.ts        # Módulo raíz + APP_GUARD
│   └── main.ts              # Bootstrap
├── .env.example
└── package.json
```
