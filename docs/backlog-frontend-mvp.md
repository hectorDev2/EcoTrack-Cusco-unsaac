# Backlog Frontend — MVP (Entrega 1 · Semana 6)

> Stack: **Next.js 14 (App Router) · React · TailwindCSS**
> Se asume que las **vistas base / layout** ya están implementadas.

---

## Configuración e integración

| ID | Tarea | Prioridad | Estimación |
|----|-------|-----------|------------|
| FE-00 | Cliente HTTP centralizado (`lib/api.ts`) con interceptor de JWT | Alta | 2 pts |
| FE-01 | Context / Zustand store de autenticación (`useAuth`) | Alta | 2 pts |
| FE-02 | Middleware Next.js para protección de rutas privadas | Alta | 1 pt |
| FE-03 | Componentes base reutilizables: `Button`, `Input`, `Card`, `Badge`, `Spinner` | Alta | 2 pts |

---

## HU-01 · Registro e inicio de sesión (Ciudadano)

| ID | Tarea | Prioridad | Estimación |
|----|-------|-----------|------------|
| FE-10 | Página `/auth/register` — formulario de registro con validación (`react-hook-form` + `zod`) | Alta | 3 pts |
| FE-11 | Página `/auth/login` — formulario de inicio de sesión | Alta | 2 pts |
| FE-12 | Lógica de almacenamiento de JWT en cookie segura (`httpOnly` via API route) | Alta | 2 pts |
| FE-13 | Redirección post-login al dashboard del rol correspondiente | Alta | 1 pt |
| FE-14 | Botón de cerrar sesión con limpieza de token | Alta | 1 pt |
| FE-15 | Página `/perfil` — vista del perfil del usuario autenticado (`GET /auth/me`) | Media | 2 pts |

---

## HU-02 · Consultar horarios y puntos de recolección (Ciudadano)

| ID | Tarea | Prioridad | Estimación |
|----|-------|-----------|------------|
| FE-20 | Página `/recoleccion` — selector de zona + listado de horarios | Alta | 3 pts |
| FE-21 | Componente `ScheduleCard` — muestra día, hora y tipo de residuo | Alta | 2 pts |
| FE-22 | Página `/puntos-recojo` — lista de puntos de recojo con dirección | Alta | 2 pts |
| FE-23 | Componente `PickupPointCard` — nombre, dirección, zona | Alta | 1 pt |
| FE-24 | Integración con `GET /schedules` y `GET /pickup-points` | Alta | 1 pt |

---

## HU-Consultar tipo de residuos (Ciudadano)

| ID | Tarea | Prioridad | Estimación |
|----|-------|-----------|------------|
| FE-25 | Página `/residuos` — catálogo de tipos de residuos con clasificación | Alta | 2 pts |
| FE-26 | Componente `WasteTypeCard` — ícono de categoría, nombre, descripción | Alta | 2 pts |
| FE-27 | Integración con `GET /waste-types` | Alta | 1 pt |

---

## HU-06 · Reportar incidencia (Ciudadano)

| ID | Tarea | Prioridad | Estimación |
|----|-------|-----------|------------|
| FE-30 | Página `/incidencias/nueva` — formulario de reporte (tipo, descripción, zona) | Alta | 3 pts |
| FE-31 | Página `/incidencias` — listado de incidencias propias del ciudadano | Media | 2 pts |
| FE-32 | Componente `IncidentCard` — estado, tipo, fecha | Media | 1 pt |
| FE-33 | Integración con `POST /incidents` y `GET /incidents/my` | Alta | 1 pt |

---

## Panel Conductor

| ID | Tarea | Prioridad | Estimación |
|----|-------|-----------|------------|
| FE-40 | Página `/conductor/dashboard` — resumen de ruta del día | Alta | 2 pts |
| FE-41 | Página `/conductor/ruta` — lista de paradas con estado (pendiente / atendido) | Alta | 3 pts |
| FE-42 | Componente `RouteStopItem` — nombre del punto, acción "Confirmar" | Alta | 2 pts |
| FE-43 | Botón "Iniciar ruta" → `PATCH /routes/:id/start` | Alta | 1 pt |
| FE-44 | Modal "Registrar recolección" — selector de tipo de residuo → `POST /collections` | Alta | 3 pts |
| FE-45 | Botón / formulario "Reportar problema" en ruta → `POST /incidents` | Alta | 2 pts |
| FE-46 | Integración con `GET /routes/my` | Alta | 1 pt |

---

## Panel Administrador

| ID | Tarea | Prioridad | Estimación |
|----|-------|-----------|------------|
| FE-50 | Página `/admin/usuarios` — tabla de usuarios con acciones desactivar/editar | Alta | 3 pts |
| FE-51 | Página `/admin/zonas` — CRUD de zonas (lista + modal crear/editar) | Alta | 3 pts |
| FE-52 | Página `/admin/residuos` — lista de tipos de residuos + formulario crear | Alta | 2 pts |
| FE-53 | Página `/admin/rutas` — asignar ruta a conductor + ver estado | Alta | 3 pts |
| FE-54 | Componente `StatusBadge` — activo / inactivo / en curso / finalizado | Alta | 1 pt |
| FE-55 | Integración con endpoints admin (`/users`, `/zones`, `/waste-types`, `/routes`) | Alta | 2 pts |

---

## Total estimado MVP Frontend

| Sección | Puntos |
|---------|--------|
| Configuración | 7 |
| Auth / Ciudadano | 11 |
| Horarios y puntos | 9 |
| Incidencias ciudadano | 7 |
| Panel Conductor | 14 |
| Panel Administrador | 14 |
| **Total** | **62 pts** |
