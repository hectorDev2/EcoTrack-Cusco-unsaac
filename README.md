# Eco Track Cusco — UNSAAC

Sistema de monitoreo de recolección de residuos sólidos para el distrito de Wanchaq, Cusco. Desarrollado como proyecto de la UNSAAC en colaboración con la Municipalidad Distrital de Wanchaq.

**Frontend:** Next.js 16 · App Router · React 19 · Tailwind CSS v4 · TanStack Query · PWA \
**Backend:** NestJS 11 · TypeScript · Prisma · Turso (libSQL) · Swagger · Helmet · Throttler \
**Auth:** JWT + Passport · middleware edge · guards por rol · httpOnly cookies · rate limiting \
**Mapa:** MapLibre GL · OSRM (cálculo de rutas) · Nominatim (geocoding) · dark mode adaptativo \
**Notificaciones:** Cron (`@nestjs/schedule`) · Twilio WhatsApp API · Notification API del navegador \
**DB:** Turso (libSQL cloud) — exclusivo, sin SQLite local

---

## Arquitectura

### Flujo de datos

```mermaid
flowchart LR
    subgraph Frontend["Frontend — Next.js 16"]
        A["/"] --> B["/auth/login"]
        B --> D["Middleware Edge\nJWT decode + RBAC redirect"]
        D --> E["Ciudadano\n/inicio"]
        D --> F["Admin\n/dashboard"]
        D --> G["Conductor\n/conductor/*"]
        E --> H["TanStack Query\nCaché + SWR"]
        H --> I["API Routes\n/proxy auth"]
        I --> J["Backend\nNestJS + Prisma"]
        J --> K["Turso\nlibSQL Cloud"]
    end

    subgraph Conductor["Conductor"]
        L["GPS Tracking\nnavigator.geolocation"] --> M["POST /routes/:id/location\nCada 15-20s"]
        M --> J
        J --> N["Admin Flota\n/flota en tiempo real"]
    end

    subgraph Ciudadano["Ciudadano"]
        O["Reportar\n/reportar"] --> H
        H --> P["POST /incidents"]
        P --> J
    end
```

### Modelo de datos

```mermaid
erDiagram
    User ||--o{ UserZone : "assigned"
    User ||--o{ Route : "drives"
    User ||--o{ Incident : "reports"

    Zone ||--o{ UserZone : "has_users"
    Zone ||--o{ PickupPoint : "contains"
    Zone ||--o{ CollectionSchedule : "has"
    Zone ||--o{ Route : "belongs_to"
    Zone ||--o{ Incident : "located_in"

    PickupPoint ||--o{ RouteStop : "is_stop_of"
    RouteStop ||--|| Route : "belongs_to"
    RouteStop ||--o{ Collection : "recorded_at"

    Route ||--o{ RouteLocation : "tracked"
    Route ||--|{ Vehicle : "assigned"

    CollectionSchedule ||--|| WasteType : "collects"
    Collection ||--|| WasteType : "type"
```

---

## Desarrollo

```bash
# Instalar dependencias (pnpm workspace — raíz + backend)
pnpm install

# Frontend (raíz del proyecto)
pnpm dev
# http://localhost:3000

# Backend (directorio backend/)
cd backend && pnpm start:dev
# http://localhost:3001

# Reparar FKs en Turso (solo si hay migración rota)
cd backend && npx ts-node prisma/recover-db.ts

# Seed (recrea datos de prueba — requiere Turso activo)
cd backend && pnpm prisma:seed

# Documentación Swagger
# http://localhost:3001/docs
```

---

## Deploy

Servidor propio con Ubuntu · Nginx (reverse proxy) · PM2 · pnpm

### Frontend

| URL | Proxy |
|-----|-------|
| `https://ecotrack.157.230.83.213.nip.io` | Nginx → `localhost:3000` |

### Backend

| URL | Proxy |
|-----|-------|
| `https://api-ecotrack.157.230.83.213.nip.io` | Nginx → `localhost:3001` |

### Script de deploy

```bash
# ~/deploy-ecotrack.sh
git pull origin hector-2
pnpm install
pnpm build                 # frontend
cd backend && pnpm build   # backend
pm2 restart ecotrack-frontend ecotrack-backend
```

**Variables de entorno (`.env.local` en raíz y `backend/.env`):**

| Variable | Descripción |
|----------|-------------|
| `TURSO_DATABASE_URL` | `libsql://...` (obligatorio) |
| `TURSO_AUTH_TOKEN` | Token de autenticación Turso |
| `JWT_SECRET` | Secreto JWT — usar `openssl rand -base64 32` |
| `JWT_EXPIRATION` | `7d` |
| `CORS_ORIGINS` | Orígenes CORS separados por coma |
| `NEXT_PUBLIC_API_URL` | `https://api-ecotrack.157.230.83.213.nip.io` |
| `TWILIO_ACCOUNT_SID` | Opcional — sin ella, las alarmas WhatsApp solo se registran en el log (modo simulado) |
| `TWILIO_AUTH_TOKEN` | Opcional — junto con `TWILIO_ACCOUNT_SID` habilita el envío real |
| `TWILIO_WHATSAPP_FROM` | Número de WhatsApp habilitado en Twilio (sandbox: `+14155238886`) |

### Troubleshooting

| Problema | Solución |
|----------|----------|
| Backend crashea con "JWT_SECRET is required" | Configurar variable en `backend/.env` |
| Frontend en blanco | Verificar `NEXT_PUBLIC_API_URL` en `.env.local` |
| 401 en todos los requests | `JWT_SECRET` regenerado — usuarios deben reloguear |
| 429 Too Many Requests en login | Esperar 60s, o ajustar límites en `app.module.ts` |
| WhatsApp no llega, log dice "simulado" | Faltan `TWILIO_*` en `backend/.env` — reiniciar backend tras agregarlas |
| Twilio: "not connected to a Sandbox" | El número destino debe enviar `join <código>` por WhatsApp al número del sandbox primero |
| Twilio: "could not find a Channel with the specified From address" | `TWILIO_WHATSAPP_FROM` no tiene canal de WhatsApp habilitado — usar el número del sandbox o un Sender de WhatsApp verificado |
| `no such table: main.routes_old` | Ejecutar `npx ts-node prisma/recover-db.ts` desde `backend/` |

---

## Estado del proyecto

### Backend — API REST (+30 endpoints)

| Módulo | Endpoints | Status |
|--------|-----------|--------|
| `Auth` | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PATCH /auth/me` | ✅ |
| `Users` | CRUD + stats + zone assignment | ✅ |
| `Zones` | CRUD (GET público, resto ADMIN) | ✅ |
| `PickupPoints` | CRUD con filtros `?zoneId=` y `?routeId=` | ✅ |
| `Schedules` | CRUD con filtros `?zoneId=&wasteTypeId=` | ✅ |
| `Incidents` | `POST /incidents`, `GET /incidents/my`, CRUD admin | ✅ |
| `Routes` | CRUD + fleet + start/complete + stops + locations + `GET /routes/public` | ✅ |
| `WasteType` | CRUD (GET público, ADMIN write) | ✅ |
| `Vehicles` | CRUD (ADMIN) | ✅ |
| `Collections` | `POST /collections` (conductor) | ✅ |
| `Admin` | `GET /admin/dashboard`, `GET /admin/analytics` | ✅ |
| `CitizenAlarms` | `POST/GET /citizen-alarms`, `DELETE /citizen-alarms/:id` + cron de notificación WhatsApp cada minuto | ✅ |

### Frontend — Páginas

| Página | Ruta | Rol |
|--------|------|-----|
| Onboarding / Registro | `/` | Público |
| Login | `/auth/login` | Público |
| Inicio ciudadano | `/inicio` | CITIZEN |
| Horarios de recolección | `/recoleccion` | CITIZEN |
| Puntos de recojo (filtro por ruta) | `/puntos-recojo` | CITIZEN |
| Reportar incidencia | `/reportar` | CITIZEN |
| Mis incidencias | `/incidencias` | CITIZEN |
| Mapa | `/mapa` | CITIZEN |
| Alarmas (día → punto → ruta, WhatsApp) | `/alarmas` | CITIZEN |
| Perfil | `/perfil` | Todos |
| Dashboard admin | `/dashboard` | ADMIN |
| Flota en tiempo real | `/flota` | ADMIN |
| Gestión de usuarios | `/usuarios` | ADMIN |
| Incidencias admin | `/admin-incidencias` | ADMIN |
| Gestión de rutas | `/admin-rutas` | ADMIN |
| Analíticas | `/analisis` | ADMIN |
| Configuración | `/configuracion` | ADMIN |
| Panel conductor | `/conductor/dashboard` | DRIVER |
| Mapa de ruta | `/conductor/mapa` | DRIVER |
| Paradas y recolección | `/conductor/ruta` | DRIVER |

### Características implementadas

| Característica | Detalle |
|----------------|---------|
| Rutas del rutero oficial | 287 paradas · 19 rutas · Wanchaq 2024 |
| CRUD de rutas con mapa | Crear y editar paradas directamente en MapLibre |
| Edición de rutas | Nombre, turno, frecuencia, conductor y paradas en un modal |
| GPS tracking | Conductor envía posición cada 15s, admin la ve en tiempo real |
| Credenciales en login | Panel de cuentas de prueba con autocompletado |
| Configuración admin | CRUD de tipos de residuos, vehículos, parámetros del sistema |
| Turso exclusivo | Sin SQLite local — todo va a Turso cloud |
| recover-db | Script que repara FKs rotas con `@libsql/client` batch() |
| TanStack Query | Caché y stale-while-revalidate en todo el frontend |
| PWA | Manifest + service worker para instalación en móvil |
| Dark mode en mapa | MapLibre cambia a dark-matter-gl-style automáticamente |
| JWT httpOnly | Login/register via API route proxy |
| Helmet + Throttler | Headers de seguridad + rate limiting |
| Filtro de puntos por ruta | `/puntos-recojo` filma por ruta en vez de zona |
| Endpoint público de rutas | `GET /routes/public` sin autenticación |
| pnpm workspace | Monorepo con dependencias compartidas entre frontend y backend |
| Tests backend | 89 tests unitarios + 9 e2e |
| Origen de ruta arrastrable en mapa | Un solo marker (origen/mi ubicación) draggable; recalcula 4 vertederos + ruta más cercana al soltar |
| Tooltip flotante en mapa | Info del vertedero (horarios) anclada sobre su marker, en vez de panel fijo |
| Alarmas ciudadanas | Flujo Día → Punto de recojo → rutas que pasan ese día con su hora → elegir una |
| Notificación WhatsApp | Cron cada minuto compara `scheduledTime - notifyBeforeMinutes` y envía por Twilio (una vez por día) |
| Notificación del navegador | Notification API con permiso + polling cliente, dedupe en localStorage |
| Teléfono en perfil | Campo WhatsApp (`+51...`) en `/perfil`, editable vía `PATCH /auth/me` |
| CI/CD | GitHub Actions en push/PR |

---

## Datos de prueba

```bash
cd backend && npm run prisma:seed
```

> ⚠️ Solo para demo. En producción, rotar todas las contraseñas.

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@ecotrack.pe | 123456 | Administrador |
| carlos.conductor@ecotrack.pe | 123456 | Conductor |
| maria.conductora@ecotrack.pe | 123456 | Conductor |
| juan@ecotrack.pe | 123456 | Ciudadano |
| rosa@ecotrack.pe | 123456 | Ciudadano |
| pedro@ecotrack.pe | 123456 | Ciudadano |
| lucia@ecotrack.pe | 123456 | Ciudadano |
| miguel@ecotrack.pe | 123456 | Ciudadano |

---

## Estructura del proyecto

```
app/
├── middleware.ts            ← Edge auth (JWT decode + redirect por rol)
├── providers.tsx            ← Auth + Query + Toast + OfflineBanner
├── api/auth/                ← Proxy login/register/logout → httpOnly cookie
├── auth/                    ← Login + Register
├── (citizen)/               ← Layout con bottom tabs
│   ├── inicio/
│   ├── recoleccion/
│   ├── puntos-recojo/
│   ├── reportar/
│   ├── incidencias/
│   ├── mapa/
│   ├── alarmas/              ← Día → punto → ruta, WhatsApp + notificación navegador
│   └── perfil/
└── (admin)/                 ← Layout con sidebar
    ├── dashboard/
    ├── flota/
    ├── usuarios/
    ├── admin-incidencias/
    ├── admin-rutas/         ← Crear + editar rutas en mapa interactivo
    ├── analisis/
    └── configuracion/       ← Tipos de residuos + vehículos + parámetros

conductor/
├── dashboard/
├── mapa/                    ← MapLibre + OSRM
└── ruta/                    ← Paradas + recolección

lib/
├── api.ts                   ← HTTP client con JWT interceptor
├── auth-context.tsx
├── queries.ts               ← TanStack Query factory
├── types.ts
├── waste-colors.ts
└── status.ts

components/
├── ui/                      ← Button, Badge, Spinner, Card, Input, Avatar, Toast, Skeleton…
├── map-view.tsx             ← MapLibre GL con dark mode y marcadores adaptativos
└── …

backend/
├── src/
│   ├── auth/
│   ├── users/
│   ├── zones/
│   ├── pickup-points/
│   ├── collection-schedules/
│   ├── incidents/
│   ├── routes/              ← CRUD + fleet + GPS locations
│   ├── vehicles/
│   ├── waste-types/
│   ├── admin/
│   ├── citizen-alarms/      ← CRUD + CitizenAlarmsScheduler (cron cada minuto)
│   ├── notifications/       ← NotificationsService (Twilio WhatsApp)
│   ├── prisma/              ← PrismaService Turso-only
│   └── common/              ← Guards, decorators, filters
└── prisma/
    ├── schema.prisma        ← 14 modelos
    ├── seed.ts              ← 287 paradas · 19 rutas del rutero oficial
    ├── migrate-turso.ts     ← ALTER TABLE ADD COLUMN incremental (idempotente)
    └── recover-db.ts        ← Reparación de FKs con batch() de libSQL
```

---

## Design System

Paleta verde tierra inspirada en los Andes · Nunito Sans · Material Symbols · esquinas redondeadas

| Token | Color | Uso |
|-------|-------|-----|
| `primary` | #154212 | Acciones principales, headers |
| `secondary` | #805533 | Elementos secundarios |
| `waste-organic` | #4CAF50 | Residuos orgánicos |
| `waste-recyclable` | #2196F3 | Reciclables |
| `waste-non-recyclable` | #757575 | No reciclables |
| `status-alert` | #E76F51 | Alertas y estados críticos |

---

## Pendiente para producción

| Aspecto | Estado |
|---------|--------|
| Refresh token | ❌ Solo JWT de 7 días |
| Logging estructurado | ❌ Sin Pino/Winston |
| Monitorización de errores | ❌ Sin Sentry |
