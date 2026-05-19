# Eco Track Cusco — UNSAAC

Sistema inteligente de recolección de residuos para Cusco, con monitoreo en tiempo real y participación ciudadana.

**Frontend:** Next.js 16 · App Router · React 19 · Tailwind CSS v4 \
**Backend:** NestJS · TypeScript · Prisma · Turso (libSQL) — ver [`backend/README.md`](backend/README.md)

---

## Desarrollo

```bash
npm run dev
# http://localhost:3000
```

## Build

```bash
npm run build
npm start
```

---

## Progreso del Frontend

Marcá con `[x]` los items completados.

### Configuración e integración
- [ ] FE-00 — Cliente HTTP centralizado (`lib/api.ts`) con interceptor JWT
- [ ] FE-01 — Context / store de autenticación (`useAuth`)
- [ ] FE-02 — Middleware Next.js para protección de rutas
- [ ] FE-03 — Componentes base: `Button`, `Input`, `Card`, `Badge`, `Spinner`

### HU-01 · Registro e inicio de sesión (Ciudadano)
- [ ] FE-10 — `/auth/register` — formulario con validación (react-hook-form + zod)
- [ ] FE-11 — `/auth/login` — formulario de inicio de sesión
- [ ] FE-12 — JWT en cookie segura vía API route
- [ ] FE-13 — Redirección post-login por rol
- [ ] FE-14 — Cerrar sesión con limpieza de token
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
- [ ] FE-50 — `/admin/usuarios` — tabla con acciones
- [ ] FE-51 — `/admin/zonas` — CRUD de zonas
- [ ] FE-52 — `/admin/residuos` — lista + formulario crear
- [ ] FE-53 — `/admin/rutas` — asignar ruta + estado
- [ ] FE-54 — `StatusBadge` — componente de estado
- [ ] FE-55 — Integración endpoints admin

---

## Screens actuales

| Ruta | Vista |
|------|-------|
| `/` | Onboarding / Registro ciudadano |
| `/inicio` | Inicio ciudadano |
| `/reportar` | Reportar incidencia |
| `/mapa` | Mapa de recolección |
| `/dashboard` | Panel de administración |
| `/flota` | Monitoreo de flota |
| `/usuarios` | Gestión de usuarios |
| `/incidencias` | Gestión de incidencias |
| `/analisis` | Analíticas y reportes |
| `/configuracion` | Configuración del sistema |

## Design System

Basado en **Terra Civic**: verdes bosque y tierra arcilla, Nunito Sans, esquinas redondeadas, sombras suaves.

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
├── layout.tsx
├── page.tsx
├── (citizen)/
│   ├── layout.tsx
│   ├── inicio/
│   ├── reportar/
│   └── mapa/
└── (admin)/
    ├── layout.tsx
    ├── dashboard/
    ├── flota/
    ├── usuarios/
    ├── incidencias/
    ├── analisis/
    └── configuracion/

backend/
├── src/...
├── prisma/schema.prisma
└── README.md
```
