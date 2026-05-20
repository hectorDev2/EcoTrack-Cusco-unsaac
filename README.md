# Eco Track Cusco — UNSAAC

Sistema inteligente de recolección de residuos para Cusco, con monitoreo en tiempo real y participación ciudadana.

**Frontend:** Next.js 16 · App Router · React 19 · Tailwind CSS v4 \
**Backend:** NestJS 11 · TypeScript · Prisma · SQLite / Turso (libSQL) — ver [`backend/README.md`](backend/README.md)

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
```

---

## Estado del proyecto

### Backend — API REST (+30 endpoints)

| Módulo | Endpoints | Status |
|--------|-----------|--------|
| `Auth` | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` | ✅ Completo |
| `Users` | CRUD + `GET /users/me`, `GET /users/stats`, `PATCH /users/:id/zones` | ✅ Completo |
| `Zones` | CRUD (GET público, resto ADMIN) | ✅ Completo |
| `PickupPoints` | CRUD con filtro `?zoneId=` (GET público, resto ADMIN) | ✅ Completo |
| `Schedules` | CRUD con filtros `?zoneId=&wasteTypeId=` (GET público, resto ADMIN) | ✅ Completo |
| `Incidents` | `POST /incidents`, `GET /incidents/my`, CRUD admin con filtro `?status=` | ✅ Completo |
| `Routes` | CRUD + `GET /routes/fleet` — rutas con progreso desde RouteStops | ✅ Completo |
| `Admin` | `GET /admin/dashboard`, `GET /admin/analytics` — datos agregados | ✅ Completo |
| `WasteType` | Modelo en Prisma, **sin módulo NestJS** | 🔜 Pendiente |
| `Collections` | Modelo en Prisma, **sin endpoints** | 🔜 Pendiente |

### Frontend — Páginas conectadas a API real

| Página | Ruta | Status |
|--------|------|--------|
| Registro | `/` | ✅ `POST /auth/register` |
| Login | `/auth/login` | ✅ `POST /auth/login` |
| Perfil | `/perfil` | ✅ `useAuth()` context |
| Inicio ciudadano | `/inicio` | 🔜 Datos hardcodeados |
| Mapa | `/mapa` | ✅ Mapa interactivo con MapLibre GL |
| Horarios | `/recoleccion` | ✅ `GET /schedules`, `GET /zones` |
| Puntos de recojo | `/puntos-recojo` | ✅ `GET /pickup-points`, `GET /zones` |
| Reportar incidencia | `/reportar` | ✅ `POST /incidents` |
| Mis incidencias | `/incidencias` | ✅ `GET /incidents/my` |
| Dashboard admin | `/dashboard` | ✅ `GET /admin/dashboard` |
| Flota | `/flota` | ✅ `GET /routes/fleet` + mapa MapLibre |
| Usuarios | `/usuarios` | ✅ `GET /users` + paginación |
| Incidencias admin | `/admin-incidencias` | ✅ `GET /incidents` + `PATCH /incidents/:id` |
| Analíticas | `/analisis` | ✅ `GET /admin/analytics` |
| Configuración | `/configuracion` | 🔜 Solo estado local |
| Panel conductor | `/conductor/*` | ❌ No implementado |
| Catálogo residuos | `/residuos` | ❌ No implementado |

### Seguridad

| Capa | Status |
|------|--------|
| JWT con Passport (backend) | ✅ Global JwtAuthGuard + RolesGuard |
| Middleware edge Next.js (frontend) | ✅ Lee cookie `auth_token`, redirige a `/auth/login` |
| Client-side guards | ✅ AdminShell y CitizenGuard verifican `useAuth()` |
| **RBAC en frontend** | ❌ Middleware y guards solo verifican autenticación, **no el rol** |

---

## Próximos pasos prioritarios

1. **Inicio ciudadano** — Conectar `/inicio` a datos dinámicos del ciudadano
2. **RBAC frontend** — Agregar verificación de roles en middleware y guards
3. **Módulo WasteType** — Crear CRUD en backend + página de administración
4. **Panel Conductor** — Implementar rutas `/conductor/*` con registro de recolecciones
5. **Configuración persistente** — Guardar configuración del sistema en backend

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
| `/dashboard` | Panel de administración | Requiere login |
| `/flota` | Monitoreo de flota con mapa MapLibre | Requiere login |
| `/usuarios` | Gestión de usuarios | Requiere login |
| `/admin-incidencias` | Gestión de incidencias (admin) | Requiere login |
| `/analisis` | Analíticas y reportes | Requiere login |
| `/configuracion` | Configuración del sistema | Requiere login |

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
├── layout.tsx              ← Root layout con Providers (Auth)
├── page.tsx                ← Registro ciudadano
├── providers.tsx           ← AuthProvider global
├── middleware.ts           ← Edge auth middleware
├── dev-nav.tsx             ← Navegación dev oculta
├── auth/
│   ├── layout.tsx
│   └── login/page.tsx
├── (citizen)/
│   ├── layout.tsx          ← AuthGuard ciudadano (bottom tabs)
│   ├── inicio/             ← Dashboard ciudadano
│   ├── recoleccion/        ← Horarios por zona
│   ├── puntos-recojo/      ← Puntos de recojo
│   ├── reportar/           ← Formulario de incidencias
│   ├── incidencias/        ← Mis reportes
│   ├── mapa/
│   └── perfil/
└── (admin)/
    ├── layout.tsx          ← Sidebar admin
    ├── admin-shell.tsx     ← AuthGuard admin
    ├── dashboard/          ← Con datos reales
    ├── flota/              ← Con datos reales + mapa MapLibre
    ├── usuarios/           ← Con datos reales
    ├── admin-incidencias/  ← Gestión con cambio de estado
    ├── analisis/           ← Con datos reales
    └── configuracion/      ← Solo estado local
lib/
├── api.ts                  ← HTTP client con JWT interceptor
├── auth-context.tsx        ← AuthProvider + useAuth hook
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
│   ├── auth/               ← Register, login, JWT profile
│   ├── users/              ← CRUD + stats + zone assignment
│   ├── zones/              ← CRUD zonas
│   ├── pickup-points/      ← CRUD puntos de recojo
│   ├── collection-schedules/ ← CRUD horarios
│   ├── incidents/          ← Reportes ciudadanos + gestión admin
│   ├── routes/             ← CRUD rutas + fleet overview
│   ├── admin/              ← Dashboard aggregator
│   ├── prisma/             ← PrismaService (dual SQLite/Turso)
│   └── common/             ← Guards, decorators, filters, pipes
├── prisma/
│   ├── schema.prisma       ← 10 modelos
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
