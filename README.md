# Eco Track Cusco — UNSAAC

Sistema inteligente de recolección de residuos para Cusco, con monitoreo en tiempo real y participación ciudadana.

**Frontend:** Next.js 16 · App Router · React 19 · Tailwind CSS v4 \
**Backend:** NestJS · TypeScript · Prisma · Turso (libSQL) — ver [`backend/README.md`](backend/README.md)

---

## Desarrollo

```bash
# Frontend (raíz del proyecto)
npm run dev
# http://localhost:3000

# Backend (directorio backend/)
cd backend && npm run start:dev
# http://localhost:3001
```

---

## Progreso del Frontend

### Configuración e integración
- [x] FE-00 — Cliente HTTP centralizado (`lib/api.ts`) con interceptor JWT
- [x] FE-01 — Context / store de autenticación (`useAuth`)
- [x] FE-02 — Middleware Next.js para protección de rutas
- [ ] FE-03 — Componentes base: `Button`, `Input`, `Card`, `Badge`, `Spinner`

### HU-01 · Registro e inicio de sesión (Ciudadano)
- [x] FE-10 — `/` — formulario de registro conectado a `POST /auth/register`
- [x] FE-11 — `/auth/login` — formulario de inicio de sesión funcional
- [x] FE-12 — JWT en cookie + localStorage vía `setToken()`
- [x] FE-13 — Redirección post-login por rol (`/inicio` o `/dashboard`)
- [ ] FE-14 — Cerrar sesión con limpieza de token (falta botón UI)
- [ ] FE-15 — `/perfil` — vista del perfil (`GET /auth/me`)

### HU-02 · Horarios y puntos de recolección (Ciudadano)
- [ ] FE-20 — `/recoleccion` — selector de zona + horarios
- [ ] FE-21 — `ScheduleCard` — día, hora, tipo de residuo
- [ ] FE-22 — `/puntos-recojo` — puntos con dirección
- [ ] FE-23 — `PickupPointCard` — nombre, dirección, zona
- [ ] FE-24 — Integración `GET /schedules` y `GET /pickup-points`

### HU-03 · Consultar tipos de residuos (Ciudadano)
- [ ] FE-25 — `/residuos` — catálogo con clasificación
- [ ] FE-26 — `WasteTypeCard` — ícono, categoría, descripción
- [ ] FE-27 — Integración `GET /waste-types`

### HU-06 · Reportar incidencia (Ciudadano)
- [ ] FE-30 — `/incidencias/nueva` — formulario de reporte
- [ ] FE-31 — `/incidencias` — listado de incidencias propias
- [ ] FE-32 — `IncidentCard` — estado, tipo, fecha
- [ ] FE-33 — Integración `POST /incidents` y `GET /incidents/my`

### Panel Conductor
- [ ] FE-40 — `/conductor/dashboard` — resumen de ruta del día
- [ ] FE-41 — `/conductor/ruta` — paradas con estado
- [ ] FE-42 — `RouteStopItem` — nombre, acción "Confirmar"
- [ ] FE-43 — Botón "Iniciar ruta" → `PATCH /routes/:id/start`
- [ ] FE-44 — Modal "Registrar recolección" → `POST /collections`
- [ ] FE-45 — Reportar problema → `POST /incidents`
- [ ] FE-46 — Integración `GET /routes/my`

### Panel Administrador
- [x] FE-50 — `/usuarios` — tabla conectada a API con búsqueda y paginación
- [ ] FE-51 — `/zonas` — CRUD de zonas
- [ ] FE-52 — `/residuos` — lista + formulario crear
- [ ] FE-53 — `/rutas` — asignar ruta + estado
- [ ] FE-54 — `StatusBadge` — componente de estado
- [x] FE-55 — Integración endpoints `/users` y `/users/stats`

---

## Screens actuales

| Ruta | Vista | Auth |
|------|-------|------|
| `/` | Onboarding / Registro ciudadano | Público |
| `/auth/login` | Inicio de sesión | Público |
| `/inicio` | Inicio ciudadano | Requiere login |
| `/reportar` | Reportar incidencia | Requiere login |
| `/mapa` | Mapa de recolección | Requiere login |
| `/dashboard` | Panel de administración | Requiere login + ADMIN |
| `/flota` | Monitoreo de flota | Requiere login |
| `/usuarios` | Gestión de usuarios | Requiere login |
| `/incidencias` | Gestión de incidencias | Requiere login |
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
├── auth/
│   ├── layout.tsx
│   └── login/page.tsx
├── (citizen)/
│   ├── layout.tsx          ← AuthGuard ciudadano
│   ├── inicio/
│   ├── reportar/
│   └── mapa/
└── (admin)/
    ├── layout.tsx          ← AuthGuard admin
    ├── admin-shell.tsx
    ├── dashboard/
    ├── flota/
    ├── usuarios/
    ├── incidencias/
    ├── analisis/
    └── configuracion/
lib/
├── api.ts                  ← HTTP client con JWT interceptor
├── auth-context.tsx        ← AuthProvider + useAuth hook
└── types.ts                ← Interfaces compartidas

backend/
├── src/...
├── prisma/schema.prisma
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
| conductor@terracivic.pe | 123456 | Conductor |
| ciudadano@terracivic.pe | 123456 | Ciudadano |
