# Eco Track Cusco - UNSAAC

Sistema inteligente de recolección de residuos para Cusco, con monitoreo en tiempo real y participación ciudadana.

## Tecnologías

- **Next.js 16** — App Router, Turbopack, React 19
- **Tailwind CSS v4** — Design system Terra Civic con `@theme`
- **Nunito Sans** — Tipografía principal vía `next/font`
- **Material Symbols** — Iconografía

## Screens

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

## Design System

Basado en el sistema **Terra Civic**: paleta de verdes bosque y tierra arcilla, tipografía Nunito Sans, esquinas redondeadas (8px default), sombras suaves con tinte verde.

### Colores clave

| Token | Uso |
|-------|-----|
| `primary` (#154212) | Acciones principales, headers |
| `primary-container` (#2d5a27) | Tarjetas destacadas |
| `secondary` (#805533) | Elementos secundarios |
| `tertiary` (#493700) | Highlights |
| `waste-organic` (#4CAF50) | Residuos orgánicos |
| `waste-recyclable` (#2196F3) | Residuos reciclables |
| `waste-non-recyclable` (#757575) | Residuos no reciclables |

## Estructura del proyecto

```
app/
├── globals.css          # Design system (@theme)
├── layout.tsx           # Root layout + fuentes
├── page.tsx             # Onboarding
├── dev-nav.tsx          # Navbar de desarrollo
├── (citizen)/
│   ├── layout.tsx       # Layout ciudadano (BottomNavBar)
│   ├── inicio/
│   ├── reportar/
│   └── mapa/
└── (admin)/
│   ├── layout.tsx       # Layout admin (Sidebar)
│   ├── dashboard/
│   ├── flota/
│   ├── usuarios/
│   ├── incidencias/
│   ├── analisis/
│   └── configuracion/
```

Hecho con ❤️ para la Municipalidad del Cusco.
