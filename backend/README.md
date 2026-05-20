# Eco Track Cusco — Backend

API REST para el sistema inteligente de recolección de residuos de Cusco.

**Stack:** NestJS 11 · TypeScript · Prisma ORM · SQLite (dev) / Turso (prod)

---

## Arrancar (desarrollo)

```bash
cd backend
cp .env.example .env   # completar credenciales
npm install
npx prisma generate
npm run prisma:seed    # crear datos de prueba
npm run start:dev      # http://localhost:3001
```

## Deploy en Render

| Campo | Valor |
|-------|-------|
| Root Directory | `backend` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm run start:prod` |

**Variables de entorno:**

| Variable | Requerido | Descripción |
|----------|-----------|-------------|
| `TURSO_DATABASE_URL` | Sí | `libsql://...` (Turso) |
| `TURSO_AUTH_TOKEN` | Sí | Token de autenticación Turso |
| `DATABASE_URL` | Para SQLite local | `file:./dev.db` (solo dev) |
| `JWT_SECRET` | Sí | Clave para firmar JWT |
| `JWT_EXPIRATION` | No | Default: `7d` |
| `FRONTEND_URL` | Sí | `https://tu-frontend.vercel.app` |
| `PORT` | No | Render asigna automáticamente |

> **Nota:** Render usa un sistema de archivos efímero. Con SQLite los datos
> se pierden en cada deploy. Usá [Turso](https://turso.tech) para persistencia real.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run start:dev` | Dev con hot-reload |
| `npm run build` | Compilar a `dist/` |
| `npm run start:prod` | Producción |
| `npm run prisma:generate` | Regenerar Prisma Client |
| `npm run prisma:push` | Sincronizar schema a DB local |
| `npm run prisma:seed` | Poblar DB con datos de prueba |
| `npm run prisma:studio` | Abrir Prisma Studio |

## Health check

| Método | Ruta | Auth | Respuesta |
|--------|------|------|-----------|
| GET | `/` | `@Public()` | `{ status, service, version, timestamp }` |

Usalo para verificar que el backend está vivo después del deploy en Render:

## Seed — Datos de prueba (70+ registros)

```bash
npm run prisma:seed
```

### Usuarios

| Email | Contraseña | Rol | Zonas asignadas |
|-------|-----------|-----|----------------|
| admin@terracivic.pe | 123456 | Administrador | Todas |
| carlos.conductor@terracivic.pe | 123456 | Conductor | Centro Histórico, San Blas |
| maria.conductor@terracivic.pe | 123456 | Conductor | San Sebastián, Santiago, Wanchaq |
| juan@terracivic.pe | 123456 | Ciudadano | Centro Histórico, San Blas |
| rosa@terracivic.pe | 123456 | Ciudadano | San Blas, Wanchaq |
| pedro@terracivic.pe | 123456 | Ciudadano | San Sebastián |
| lucia@terracivic.pe | 123456 | Ciudadano | Santiago, Centro Histórico |
| miguel@terracivic.pe | 123456 | Ciudadano | Wanchaq, San Sebastián |
| inactivo@terracivic.pe | 123456 | Inactivo | — |

### Datos cargados

| Tipo | Cantidad |
|------|----------|
| Zonas (distritos Cusco) | 5 |
| Puntos de recolección | 13 |
| Horarios de recolección | 17 |
| Incidencias | 16 (6 open, 3 in_progress, 3 resolved, 4 closed) |
| Tipos de residuo | 4 (Orgánico, Reciclable, No Reciclable, Peligroso) |
| Rutas de recolección | 6 (2 en tránsito, 2 pendientes, 2 completadas) |
| Paradas de ruta | 16 |
| Recolecciones registradas | 8 |

---

## API — Endpoints (+30)

### Auth (`/auth`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/auth/register` | `@Public()` | Registrar ciudadano o conductor |
| POST | `/auth/login` | `@Public()` | Iniciar sesión → JWT (7d) |
| GET | `/auth/me` | JWT | Perfil del usuario autenticado |

### Users (`/users`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/users` | ADMIN | Lista paginada (`?search=&role=&status=&page=&limit=`) |
| GET | `/users/me` | JWT | Perfil propio con zonas |
| GET | `/users/stats` | ADMIN | Estadísticas del sistema |
| GET | `/users/:id` | ADMIN | Detalle con zonas |
| POST | `/users` | ADMIN | Crear usuario |
| PATCH | `/users/:id` | ADMIN | Actualizar (nombre, rol, status, password) |
| PATCH | `/users/:id/zones` | ADMIN | Asignar zonas |
| DELETE | `/users/:id` | ADMIN | Desactivar (soft-delete) |

### Zones (`/zones`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/zones` | `@Public()` | Zonas activas |
| GET | `/zones/:id` | `@Public()` | Detalle |
| POST | `/zones` | ADMIN | Crear |
| PATCH | `/zones/:id` | ADMIN | Actualizar |
| DELETE | `/zones/:id` | ADMIN | Desactivar |

### Pickup Points (`/pickup-points`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/pickup-points` | `@Public()` | Activos, opcional `?zoneId=` |
| GET | `/pickup-points/:id` | `@Public()` | Detalle |
| POST | `/pickup-points` | ADMIN | Crear |
| PATCH | `/pickup-points/:id` | ADMIN | Actualizar |
| DELETE | `/pickup-points/:id` | ADMIN | Desactivar |

### Schedules (`/schedules`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/schedules` | `@Public()` | Lista, opcional `?zoneId=&wasteTypeId=` |
| GET | `/schedules/:id` | `@Public()` | Detalle |
| POST | `/schedules` | ADMIN | Crear |
| PATCH | `/schedules/:id` | ADMIN | Actualizar |
| DELETE | `/schedules/:id` | ADMIN | Eliminar |

### Incidents (`/incidents`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/incidents` | JWT | Reportar incidencia |
| GET | `/incidents/my` | JWT | Mis incidencias |
| GET | `/incidents` | ADMIN | Todas, opcional `?status=` |
| GET | `/incidents/:id` | JWT | Detalle |
| PATCH | `/incidents/:id` | ADMIN | Cambiar estado |

### Routes (`/routes`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/routes` | ADMIN | Todas las rutas con progreso |
| GET | `/routes/fleet` | ADMIN | Vista flota (stats + rutas activas) |
| GET | `/routes/my` | DRIVER | Rutas asignadas al conductor |
| GET | `/routes/:id` | ADMIN | Detalle de ruta con paradas |
| POST | `/routes` | ADMIN | Crear ruta (con pickupPointIds opcional) |
| PATCH | `/routes/:id` | ADMIN | Cambiar estado |
| PATCH | `/routes/:id/start` | DRIVER | Iniciar ruta |
| PATCH | `/routes/:id/complete` | DRIVER | Finalizar ruta |

### Collections (`/collections`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/collections` | DRIVER | Registrar recolección en una parada |

### Waste Types (`/waste-types`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/waste-types` | `@Public()` | Todos los tipos de residuo |
| GET | `/waste-types/:id` | `@Public()` | Detalle |
| POST | `/waste-types` | ADMIN | Crear tipo |
| PATCH | `/waste-types/:id` | ADMIN | Editar |
| DELETE | `/waste-types/:id` | ADMIN | Eliminar |

### Admin (`/admin`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/admin/dashboard` | ADMIN | Datos agregados del sistema |
| GET | `/admin/analytics` | ADMIN | Analíticas, composición, ranking zonas |

---

## Arquitectura

### Seguridad

- **JwtAuthGuard global** (`APP_GUARD`) — protege todas las rutas por defecto
- `@Public()` — excluye rutas públicas (auth, consultas)
- **RolesGuard** — verifica roles (`@Roles('ADMIN')`) en rutas administrativas
- JWT con 7 días de expiración, claims: `{ sub, email, role }`

### Base de datos

- **Dev**: SQLite local (`prisma/dev.db`) vía `PrismaClient` estándar
- **Prod**: Turso (libSQL distribuido) vía `@prisma/adapter-libsql`
- El `PrismaService` detecta automáticamente el modo según las variables de entorno

### Estructura

```
backend/
├── prisma/
│   ├── schema.prisma        # Schema completo (10 modelos)
│   └── seed.ts              # Seed con 70+ registros
├── src/
│   ├── auth/                # AuthModule — register, login, JWT
│   ├── users/               # UsersModule — CRUD + stats + zones
│   ├── zones/               # ZonesModule — CRUD + GET público
│   ├── pickup-points/       # PickupPointsModule — puntos de recojo
│   ├── collection-schedules/# SchedulesModule — horarios por zona
│   ├── incidents/           # IncidentsModule — reportes + gestión
│   ├── routes/              # RoutesModule — CRUD + fleet + driver
│   ├── collections/         # CollectionsModule — recolecciones
│   ├── waste-types/         # WasteTypesModule — CRUD residuos
│   ├── admin/               # AdminModule — dashboard + analytics
│   ├── prisma/              # PrismaService — dual SQLite/Turso
│   └── common/              # Guards, decorators, filters, pipes
├── .env.example
└── package.json
```
