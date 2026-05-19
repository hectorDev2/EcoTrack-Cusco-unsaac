# Backlog Backend — MVP (Entrega 1 · Semana 6)

> Stack: **NestJS · TypeScript · Prisma ORM · Turso DB (libSQL)**

---

## Configuración inicial

| ID | Tarea | Prioridad | Estimación |
|----|-------|-----------|------------|
| BE-00 | Scaffolding NestJS + Prisma + libSQL adapter (Turso) | Alta | 3 pts |
| BE-01 | Variables de entorno (`.env`) y configuración de conexión Turso | Alta | 1 pt |
| BE-02 | Guard JWT global + estrategia Passport | Alta | 2 pts |
| BE-03 | Pipe global de validación (`class-validator`) y filtro de excepciones | Alta | 1 pt |

---

## HU-01 · Registro e inicio de sesión de ciudadano

> *Como ciudadano quiero registrarme e iniciar sesión para acceder al sistema.*

| ID | Tarea | Prioridad | Estimación |
|----|-------|-----------|------------|
| BE-10 | Módulo `AuthModule` con endpoint `POST /auth/register` | Alta | 3 pts |
| BE-11 | Endpoint `POST /auth/login` → devuelve JWT (access token) | Alta | 2 pts |
| BE-12 | Módulo `UsersModule` con modelo `User` (Prisma schema) | Alta | 2 pts |
| BE-13 | Hash de contraseña con `bcrypt` | Alta | 1 pt |
| BE-14 | DTO `RegisterDto` + `LoginDto` con validaciones | Alta | 1 pt |
| BE-15 | Endpoint `GET /auth/me` — perfil del usuario autenticado | Alta | 1 pt |

---

## HU-02 · Consultar horarios y puntos de recolección

> *Como ciudadano quiero ver los horarios de recolección y los puntos de recojo.*

| ID | Tarea | Prioridad | Estimación |
|----|-------|-----------|------------|
| BE-20 | Módulo `ZonesModule` con modelo `Zone` (Prisma) | Alta | 2 pts |
| BE-21 | Endpoint `GET /zones` — lista zonas activas | Alta | 1 pt |
| BE-22 | Módulo `SchedulesModule` con modelo `CollectionSchedule` | Alta | 2 pts |
| BE-23 | Endpoint `GET /schedules?zoneId=` — horarios por zona | Alta | 2 pts |
| BE-24 | Módulo `PickupPointsModule` con modelo `PickupPoint` | Alta | 2 pts |
| BE-25 | Endpoint `GET /pickup-points?zoneId=` — puntos de recojo | Alta | 1 pt |

---

## HU-06 · Reportar incidencia

> *Como ciudadano quiero reportar una incidencia.*

| ID | Tarea | Prioridad | Estimación |
|----|-------|-----------|------------|
| BE-30 | Módulo `IncidentsModule` con modelo `Incident` | Alta | 2 pts |
| BE-31 | Endpoint `POST /incidents` — crear incidencia (auth requerido) | Alta | 2 pts |
| BE-32 | Endpoint `GET /incidents/my` — incidencias del ciudadano autenticado | Media | 1 pt |
| BE-33 | DTO `CreateIncidentDto` con validaciones | Alta | 1 pt |

---

## HU-Conductor · Gestionar ruta y registrar recolección

> *Como conductor quiero ver mi ruta asignada, iniciarla y confirmar puntos atendidos.*

| ID | Tarea | Prioridad | Estimación |
|----|-------|-----------|------------|
| BE-40 | Rol `DRIVER` en el modelo `User` + guard de rol | Alta | 1 pt |
| BE-41 | Módulo `RoutesModule` con modelos `Route` y `RouteStop` | Alta | 3 pts |
| BE-42 | Endpoint `GET /routes/my` — ruta asignada al conductor | Alta | 2 pts |
| BE-43 | Endpoint `PATCH /routes/:id/start` — iniciar ruta | Alta | 1 pt |
| BE-44 | Módulo `CollectionsModule` con modelo `Collection` | Alta | 2 pts |
| BE-45 | Endpoint `POST /collections` — confirmar punto atendido + tipo de residuo | Alta | 2 pts |
| BE-46 | Endpoint `POST /incidents` (conductor) — reportar problema en ruta | Alta | 1 pt |

---

## HU-Admin · Gestionar usuarios, zonas y residuos

> *Como administrador quiero gestionar usuarios, zonas de recolección y tipos de residuos.*

| ID | Tarea | Prioridad | Estimación |
|----|-------|-----------|------------|
| BE-50 | Rol `ADMIN` + guard de rol en rutas protegidas | Alta | 1 pt |
| BE-51 | Endpoint `GET /users` — listar usuarios (admin) | Alta | 1 pt |
| BE-52 | Endpoint `PATCH /users/:id` — actualizar usuario | Media | 1 pt |
| BE-53 | Endpoint `DELETE /users/:id` — desactivar usuario | Media | 1 pt |
| BE-54 | Endpoints CRUD `POST/PATCH/DELETE /zones` | Alta | 2 pts |
| BE-55 | Módulo `WasteTypesModule` con modelo `WasteType` | Alta | 2 pts |
| BE-56 | Endpoints `GET/POST /waste-types` — listar y registrar tipos de residuos | Alta | 2 pts |
| BE-57 | Endpoint `GET/POST /waste-types/:id/classify` — clasificar residuo | Alta | 1 pt |
| BE-58 | Endpoints `POST/GET /routes` — asignar y listar rutas (admin) | Alta | 2 pts |
| BE-59 | Endpoint `GET /routes` — ver estado de todas las rutas | Alta | 1 pt |

---

## Total estimado MVP Backend

| Sección | Puntos |
|---------|--------|
| Configuración inicial | 7 |
| Auth / Ciudadano | 10 |
| Horarios y zonas | 10 |
| Incidencias | 6 |
| Conductor | 12 |
| Administrador | 14 |
| **Total** | **59 pts** |
