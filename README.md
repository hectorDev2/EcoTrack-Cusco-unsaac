# Eco Track Cusco — UNSAAC

Sistema inteligente de recolección de residuos para Cusco, con monitoreo en tiempo real y participación ciudadana.

**Frontend:** Next.js 16 · App Router · React 19 · Tailwind CSS v4 · TanStack Query · PWA \
**Backend:** NestJS 11 · TypeScript · Prisma · SQLite / Turso (libSQL) · Swagger \
**Auth:** JWT con Passport (backend) + middleware edge + guards por rol + httpOnly cookies \
**Tracking:** GPS en tiempo real con geolocation API + polling en mapa admin

---

## Desarrollo

```bash
# Frontend (raíz del proyecto)
npm run dev
# http://localhost:3000

# Backend (directorio backend/)
cd backend && npm run start:dev
# http://localhost:3001

# Seed (recrea datos de prueba)
cd backend && npm run prisma:seed

# Documentación Swagger
# http://localhost:3001/docs
```

---

## Deploy

### Frontend → [Vercel](https://vercel.com)

Conectar repo desde dashboard de Vercel. Framework se auto-detecta como Next.js.

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://tu-backend.onrender.com` |
| Build Command | `npm run build` (default) |
| Output | `.next` (default) |

### Backend → [Render](https://render.com)

Web Service desde dashboard de Render:

| Campo | Valor |
|-------|-------|
| Root Directory | `backend` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm run start:prod` |
| Port | `3001` (o el que asigne Render via `PORT`) |

**Variables de entorno:**

| Variable | Descripción |
|----------|-------------|
| `TURSO_DATABASE_URL` | `libsql://...` (obligatorio en Render) |
| `TURSO_AUTH_TOKEN` | Token de Turso |
| `JWT_SECRET` | Secreto para firmar JWT |
| `JWT_EXPIRATION` | `7d` |
| `CORS_ORIGINS` | `https://tu-frontend.vercel.app` |

> ⚠️ **Importante:** Con Turso, el schema y los datos persisten independientemente del deploy.
> Para seed inicial de Turso: `cd backend && npm run start:prod:seed` una sola vez.

---

## Estado del proyecto — MVP

### Backend — API REST (+30 endpoints)

| Módulo | Endpoints | Status |
|--------|-----------|--------|
| `Auth` | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PATCH /auth/me` | ✅ |
| `Users` | CRUD + `GET /users/me`, `GET /users/stats`, `PATCH /users/:id/zones` | ✅ |
| `Zones` | CRUD (GET público, resto ADMIN) | ✅ |
| `PickupPoints` | CRUD con filtro `?zoneId=` (GET público, resto ADMIN) | ✅ |
| `Schedules` | CRUD con filtros `?zoneId=&wasteTypeId=` (GET público, resto ADMIN) | ✅ |
| `Incidents` | `POST /incidents`, `GET /incidents/my`, CRUD admin con filtro `?status=` | ✅ |
| `Routes` | CRUD + `GET /routes/fleet`, `GET /routes/my`, `GET /routes/zone/:zoneId` | ✅ |
| `Admin` | `GET /admin/dashboard`, `GET /admin/analytics` | ✅ |
| `WasteType` | CRUD (GET público, ADMIN create/update/delete) | ✅ |
| `Collections` | `POST /collections` (conductor) | ✅ |

### Frontend — Páginas conectadas a API real

| Página | Ruta | Status |
|--------|------|--------|
| Onboarding / Registro | `/` | ✅ |
| Login | `/auth/login` | ✅ |
| Perfil | `/perfil` | ✅ |
| Inicio ciudadano | `/inicio` | ✅ |
| Mapa | `/mapa` | ✅ |
| Horarios | `/recoleccion` | ✅ |
| Puntos de recojo | `/puntos-recojo` | ✅ |
| Reportar incidencia | `/reportar` | ✅ |
| Mis incidencias | `/incidencias` | ✅ |
| Dashboard admin | `/dashboard` | ✅ |
| Flota | `/flota` | ✅ |
| Usuarios | `/usuarios` | ✅ |
| Incidencias admin | `/admin-incidencias` | ✅ |
| Analíticas | `/analisis` | ✅ |
| Gestión rutas | `/admin-rutas` | ✅ |
| Panel conductor | `/conductor/*` | ✅ |
| Configuración | `/configuracion` | 🔜 |
| Catálogo residuos | `/residuos` | ✅ |
| Registro ciudadano | `/auth/register` | ✅ |
| Zonas (admin) | `/admin-zonas` | ✅ CRUD completo |
| Tracking GPS conductor | `/conductor/ruta` | ✅ Envío cada 15s/20m |
| Mapa en vivo | `/flota` | ✅ Posiciones de conductores en tiempo real |

### Mejoras arquitectónicas implementadas

| Mejora | Status |
|--------|--------|
| TanStack Query — fetching con caché y stale-while-revalidate | ✅ |
| Swagger / OpenAPI — documentación interactiva en `/docs` | ✅ |
| Paginación en listas críticas (`incidents`, `schedules`, `users`) | ✅ |
| Fechas como `DateTime` nativo de Prisma (antes `String`) | ✅ |
| Soft-delete consistente en todos los módulos | ✅ |
| `CurrentUser` decorator con tipado fuerte y validación | ✅ |
| `PrismaService` sin `require()` dinámico | ✅ |
| PWA — manifest + service worker para instalación en celular | ✅ |
| Tracking GPS — conductor envía posición cada 15s/20m | ✅ |
| Mapa en vivo — admin ve posiciones en tiempo real en `/flota` | ✅ |
| JWT httpOnly cookie — login/register via API route proxy | ✅ |
| Página `/auth/register` dedicada | ✅ |
| CRUD zonas admin (`/admin-zonas`) | ✅ |

### Seguridad

| Capa | Status |
|------|--------|
| JWT con Passport (backend) | ✅ Global JwtAuthGuard + RolesGuard |
| Middleware edge Next.js (frontend) | ✅ Decodifica JWT + redirige por rol |
| Client-side guards | ✅ AdminShell, CitizenGuard, DriverGuard verifican rol |
| **RBAC** | ✅ Triple capa: middleware → guards → redirect post-login |

---

## Lo que falta del MVP

### Backlog pendiente

| ID | Tarea | Prioridad |
|----|-------|-----------|
| BE-57 | `GET/POST /waste-types/:id/classify` — clasificar residuo específico | Baja |
| FE-54 | `StatusBadge` — componente reutilizable de badges | Baja |
| FE-03 | Componentes base reutilizables (`Button`, `Input`, `Card`, `Spinner`) | Media |

### Crítico para producción

| Aspecto | Estado |
|---------|--------|
| Tests automatizados | ❌ Cero tests (unitarios, e2e, frontend) |
| Refresh token | ❌ Solo JWT único de 7 días |
| Rate limiting / Helmet | ❌ Sin protección contra fuerza bruta |
| CI/CD pipeline | ❌ Sin GitHub Actions |
| Error boundaries | ❌ Sin captura de errores en frontend |
| Logging estructurado | ❌ Sin Pino/Winston |
| Monitorización | ❌ Sin Sentry o similar |

---

## Screens actuales

| Ruta | Vista | Auth |
|------|-------|------|
| `/` | Onboarding / Registro ciudadano | Público |
| `/auth/login` | Inicio de sesión | Público |
| `/inicio` | Inicio ciudadano | Requiere login |
| `/recoleccion` | Horarios de recolección por zona | Requiere login |
| `/puntos-recojo` | Puntos de recojo cercanos | Requiere login |
| `/reportar` | Reportar incidencia | Requiere login |
| `/incidencias` | Mis incidencias reportadas | Requiere login |
| `/mapa` | Mapa de recolección | Requiere login |
| `/perfil` | Perfil del usuario | Requiere login |
| `/dashboard` | Panel de administración | Requiere ADMIN |
| `/flota` | Monitoreo de flota con mapa interactivo | Requiere ADMIN |
| `/usuarios` | Gestión de usuarios | Requiere ADMIN |
| `/admin-incidencias` | Gestión de incidencias | Requiere ADMIN |
| `/admin-rutas` | Gestión de rutas con trazado en mapa | Requiere ADMIN |
| `/analisis` | Analíticas y reportes | Requiere ADMIN |
| `/configuracion` | Configuración del sistema | Requiere ADMIN |
| `/conductor/dashboard` | Panel del conductor — ruta del día + mapa | Requiere DRIVER |
| `/conductor/mapa` | Mapa de ruta con paradas y trazado OSRM | Requiere DRIVER |
| `/conductor/ruta` | Paradas y registro de recolección | Requiere DRIVER |

## Design System

Paleta verde tierra inspirada en los Andes, Nunito Sans, esquinas redondeadas, sombras suaves.

| Token | Uso |
|-------|-----|
| `primary` (#154212) | Acciones principales, headers |
| `primary-container` (#2d5a27) | Tarjetas destacadas |
| `secondary` (#805533) | Elementos secundarios |
| `tertiary` (#493700) | Highlights |
| `waste-organic` (#4CAF50) | Residuos orgánicos |
| `waste-recyclable` (#2196F3) | Residuos reciclables |
| `waste-non-recyclable` (#757575) | Residuos no reciclables |

## Estructura

```
app/
├── globals.css
├── layout.tsx              ← Root layout con Providers (Auth + Query)
├── page.tsx                ← Onboarding (Crear cuenta / Iniciar sesión)
├── providers.tsx           ← AuthProvider + QueryProvider
├── middleware.ts           ← Edge auth middleware (JWT decode + redirect)
├── dev-nav.tsx             ← Navegación dev oculta
├── api/auth/
│   ├── login/route.ts      ← Proxy login → httpOnly cookie
│   ├── register/route.ts   ← Proxy register → httpOnly cookie
│   └── logout/route.ts     ← Limpia cookie
├── auth/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (citizen)/
│   ├── layout.tsx          ← AuthGuard ciudadano (bottom tabs)
│   ├── inicio/             ← Dashboard ciudadano
│   ├── recoleccion/        ← Horarios por zona
│   ├── puntos-recojo/      ← Puntos de recojo
│   ├── reportar/           ← Formulario de incidencias
│   ├── incidencias/        ← Mis reportes
│   ├── mapa/
│   └── perfil/             ← Edición perfil + horarios/rutas por zona
└── (admin)/
    ├── layout.tsx          ← Sidebar admin
    ├── admin-shell.tsx     ← AuthGuard admin
    ├── dashboard/          ← Con datos reales
    ├── flota/              ← Con datos reales + mapa MapLibre
    ├── usuarios/           ← Con datos reales
    ├── admin-incidencias/  ← Gestión con cambio de estado
    ├── analisis/           ← Con datos reales
    └── configuracion/      ← Solo estado local
conductor/
├── layout.tsx              ← Nav + DriverGuard + logout
├── dashboard/              ← Ruta activa + botón mapa
├── mapa/                   ← Mapa con MapLibre + OSRM
└── ruta/                   ← Paradas + completar recolección
lib/
├── api.ts                  ← HTTP client con JWT interceptor
├── auth-context.tsx        ← AuthProvider + useAuth hook
├── queries.ts              ← TanStack Query factory + query keys
├── query-provider.tsx      ← QueryClientProvider wrapper
└── types.ts                ← Interfaces compartidas
components/
├── map-view.tsx             ← Mapa interactivo (MapLibre GL)
├── logout-button.tsx
├── theme-toggle.tsx
├── schedule-card.tsx
├── pickup-point-card.tsx
└── incident-card.tsx

backend/
├── src/
│   ├── auth/               ← Register, login, JWT profile, update profile
│   ├── users/              ← CRUD + stats + zone assignment
│   ├── zones/              ← CRUD zonas
│   ├── pickup-points/      ← CRUD puntos de recojo
│   ├── collection-schedules/ ← CRUD horarios (soft-delete)
│   ├── incidents/          ← Reportes ciudadanos + gestión admin
│   ├── routes/             ← CRUD rutas + fleet overview
│   ├── admin/              ← Dashboard aggregator
│   ├── prisma/             ← PrismaService (dual SQLite/Turso)
│   └── common/             ← Guards, decorators, filters, pipes
├── prisma/
│   ├── schema.prisma       ← 10 modelos (fechas DateTime)
│   └── seed.ts             ← Datos de prueba
└── README.md
```

## Usuarios por defecto

Seed disponible en `backend/prisma/seed.ts`. Ejecutar con:

```bash
cd backend && npm run prisma:seed
```

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@terracivic.pe | 123456 | Administrador |
| carlos.conductor@terracivic.pe | 123456 | Conductor |
| maria.conductor@terracivic.pe | 123456 | Conductor |
| juan@terracivic.pe | 123456 | Ciudadano (Centro Histórico) |
| rosa@terracivic.pe | 123456 | Ciudadano (San Blas, Wanchaq) |
| pedro@terracivic.pe | 123456 | Ciudadano (San Sebastián) |
| lucia@terracivic.pe | 123456 | Ciudadano (Santiago) |
| miguel@terracivic.pe | 123456 | Ciudadano (Wanchaq) |
