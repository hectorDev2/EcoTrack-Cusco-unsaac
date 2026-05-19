# Esquema de Base de Datos — MVP

> Motor: **Turso (libSQL / SQLite)** · ORM: **Prisma** con adapter `@prisma/adapter-libsql`
> Todos los IDs usan `CUID` generado en aplicación (compatible con libSQL).

---

## Tabla: `users`

Almacena todos los actores del sistema: ciudadanos, conductores y administradores.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | TEXT | PK | CUID |
| `email` | TEXT | UNIQUE NOT NULL | Correo de acceso |
| `password_hash` | TEXT | NOT NULL | Hash bcrypt |
| `full_name` | TEXT | NOT NULL | Nombre completo |
| `role` | TEXT | NOT NULL | `CITIZEN` \| `DRIVER` \| `ADMIN` |
| `status` | TEXT | NOT NULL DEFAULT `ACTIVE` | `ACTIVE` \| `INACTIVE` |
| `created_at` | TEXT | NOT NULL | ISO 8601 |

---

## Tabla: `zones`

Zonas geográficas de recolección en la ciudad del Cusco.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | TEXT | PK | CUID |
| `name` | TEXT | NOT NULL | Nombre de la zona |
| `description` | TEXT | | Descripción opcional |
| `status` | TEXT | NOT NULL DEFAULT `ACTIVE` | `ACTIVE` \| `INACTIVE` |
| `created_at` | TEXT | NOT NULL | ISO 8601 |

---

## Tabla: `user_zones`

Relación N:M entre ciudadanos/conductores y zonas.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | TEXT | PK | CUID |
| `user_id` | TEXT | FK → users.id | Usuario asignado |
| `zone_id` | TEXT | FK → zones.id | Zona asignada |
| `assigned_at` | TEXT | NOT NULL | ISO 8601 |

Índice único: `(user_id, zone_id)`.

---

## Tabla: `waste_types`

Catálogo de tipos de residuos con clasificación.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | TEXT | PK | CUID |
| `name` | TEXT | NOT NULL | Ej: "Plástico PET" |
| `category` | TEXT | NOT NULL | `ORGANIC` \| `RECYCLABLE` \| `NON_RECYCLABLE` |
| `description` | TEXT | | Guía de segregación |
| `created_at` | TEXT | NOT NULL | ISO 8601 |

---

## Tabla: `pickup_points`

Puntos físicos de recojo dentro de cada zona.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | TEXT | PK | CUID |
| `zone_id` | TEXT | FK → zones.id NOT NULL | Zona a la que pertenece |
| `name` | TEXT | NOT NULL | Nombre del punto |
| `address` | TEXT | NOT NULL | Dirección |
| `latitude` | REAL | NOT NULL | Coordenada GPS |
| `longitude` | REAL | NOT NULL | Coordenada GPS |
| `status` | TEXT | NOT NULL DEFAULT `ACTIVE` | `ACTIVE` \| `INACTIVE` |

---

## Tabla: `collection_schedules`

Horarios de recolección por zona y tipo de residuo.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | TEXT | PK | CUID |
| `zone_id` | TEXT | FK → zones.id NOT NULL | Zona |
| `waste_type_id` | TEXT | FK → waste_types.id NOT NULL | Tipo de residuo |
| `day_of_week` | TEXT | NOT NULL | `MON` \| `TUE` \| ... \| `SUN` |
| `start_time` | TEXT | NOT NULL | Hora inicio HH:MM |
| `end_time` | TEXT | NOT NULL | Hora fin HH:MM |

---

## Tabla: `routes`

Rutas de recolección asignadas a un conductor en una zona.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | TEXT | PK | CUID |
| `zone_id` | TEXT | FK → zones.id NOT NULL | Zona de la ruta |
| `driver_id` | TEXT | FK → users.id NOT NULL | Conductor asignado |
| `status` | TEXT | NOT NULL DEFAULT `PENDING` | `PENDING` \| `IN_PROGRESS` \| `COMPLETED` \| `CANCELLED` |
| `started_at` | TEXT | | ISO 8601 (cuando conductor inicia) |
| `finished_at` | TEXT | | ISO 8601 (cuando finaliza) |
| `created_at` | TEXT | NOT NULL | ISO 8601 |

---

## Tabla: `route_stops`

Paradas ordenadas dentro de cada ruta.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | TEXT | PK | CUID |
| `route_id` | TEXT | FK → routes.id NOT NULL | Ruta padre |
| `pickup_point_id` | TEXT | FK → pickup_points.id NOT NULL | Punto de recojo |
| `order_index` | INTEGER | NOT NULL | Orden de visita (0, 1, 2…) |
| `status` | TEXT | NOT NULL DEFAULT `PENDING` | `PENDING` \| `COMPLETED` \| `SKIPPED` |

---

## Tabla: `collections`

Registro de lo que se recolectó en cada parada.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | TEXT | PK | CUID |
| `route_stop_id` | TEXT | FK → route_stops.id NOT NULL UNIQUE | Parada atendida |
| `waste_type_id` | TEXT | FK → waste_types.id NOT NULL | Tipo de residuo recolectado |
| `collected_at` | TEXT | NOT NULL | ISO 8601 |
| `notes` | TEXT | | Observaciones del conductor |

---

## Tabla: `incidents`

Incidencias reportadas por ciudadanos o conductores.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | TEXT | PK | CUID |
| `reported_by` | TEXT | FK → users.id NOT NULL | Usuario que reporta |
| `zone_id` | TEXT | FK → zones.id | Zona relacionada (opcional) |
| `route_id` | TEXT | FK → routes.id | Ruta relacionada (solo conductor) |
| `type` | TEXT | NOT NULL | `MISSED_PICKUP` \| `OVERFLOW` \| `ROUTE_PROBLEM` \| `OTHER` |
| `description` | TEXT | NOT NULL | Descripción del problema |
| `status` | TEXT | NOT NULL DEFAULT `OPEN` | `OPEN` \| `IN_REVIEW` \| `RESOLVED` |
| `created_at` | TEXT | NOT NULL | ISO 8601 |

---

## Relaciones resumidas

```
users        ──< user_zones >──  zones
zones        ──<  pickup_points
zones        ──<  collection_schedules >──  waste_types
zones        ──<  routes >──  users (driver)
routes       ──<  route_stops >──  pickup_points
route_stops  ──|  collections >──  waste_types
users        ──<  incidents
routes       ──<  incidents
zones        ──<  incidents
```

---

## Prisma schema (fragmento base)

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String   @map("password_hash")
  fullName     String   @map("full_name")
  role         Role     @default(CITIZEN)
  status       Status   @default(ACTIVE)
  createdAt    String   @map("created_at")

  zones      UserZone[]
  routes     Route[]
  incidents  Incident[]

  @@map("users")
}

enum Role {
  CITIZEN
  DRIVER
  ADMIN
}

enum Status {
  ACTIVE
  INACTIVE
}
```

> **Nota Turso**: libSQL no soporta enums nativos de SQLite. En Prisma con `provider = "sqlite"` los enums se almacenan como `TEXT`. Para el adapter de Turso instala `@prisma/adapter-libsql` y `@libsql/client`.
