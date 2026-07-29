# Base de datos — EcoTrack Cusco

SQLite vía Prisma. Generado a partir de `backend/prisma/schema.prisma`.

## users

| Campo | Tipo | Notas |
|---|---|---|
| id | String | PK, cuid |
| email | String | único |
| passwordHash | String | columna `password_hash` |
| fullName | String | columna `full_name` |
| phone | String? | WhatsApp para notificaciones, ej. `+51987654321` |
| role | String | default `CITIZEN` (`CITIZEN`\|`DRIVER`\|`ADMIN`) |
| status | String | default `ACTIVE` |
| createdAt | DateTime | columna `created_at` |

Relaciones: `UserZone[]`, `Route[]` (como conductor), `Incident[]` (reportados), `CitizenAlarm[]`, `Vehicle[]` (como conductor).

## zones

| Campo | Tipo | Notas |
|---|---|---|
| id | String | PK, cuid |
| name | String | |
| description | String? | |
| status | String | default `ACTIVE` |
| createdAt | DateTime | columna `created_at` |

Relaciones: `UserZone[]`, `PickupPoint[]`, `CollectionSchedule[]`, `Route[]`, `Incident[]`.

## user_zones

Tabla de asignación usuario ↔ zona.

| Campo | Tipo | Notas |
|---|---|---|
| id | String | PK, cuid |
| userId | String | FK → `users.id` |
| zoneId | String | FK → `zones.id` |
| assignedAt | DateTime | columna `assigned_at` |

Restricción: `@@unique([userId, zoneId])`.

## waste_types

| Campo | Tipo | Notas |
|---|---|---|
| id | String | PK, cuid |
| name | String | |
| category | String | |
| description | String? | |
| createdAt | DateTime | columna `created_at` |

Relaciones: `CollectionSchedule[]`, `Collection[]`.

## pickup_points

Catálogo geográfico de puntos de recojo, con los campos del rutero de compactadores.

| Campo | Tipo | Notas |
|---|---|---|
| id | String | PK, cuid |
| zoneId | String | FK → `zones.id`, columna `zone_id` |
| name | String | |
| address | String | |
| latitude | Float | |
| longitude | Float | |
| status | String | default `ACTIVE` |
| shift | Shift? | enum, columna `shift` |
| stopType | StopType | enum, default `NORMAL`, columna `stop_type` |
| scheduledTime | String? | `HH:MM`, columna `scheduled_time` |
| frequencyId | String? | FK → `frequency_configs.id`, columna `frequency_id` |
| orderIndex | Int | orden de recorrido, default `0`, columna `order_index` |

Relaciones: `RouteStop[]`, `CitizenAlarm[]`.
Índices: `[zoneId, shift, frequencyId]`, `[shift, stopType]`.

## frequency_configs

Frecuencia de la ruta (LMV, MJS, DOM, etc.) según el rutero oficial.

| Campo | Tipo | Notas |
|---|---|---|
| id | String | PK, cuid |
| code | FrequencyCode | enum, único |
| label | String | ej. "Lunes, Miércoles y Viernes" |
| days | String | formato iCal, ej. `MON,WED,FRI` |

Relaciones: `PickupPoint[]`, `CollectionSchedule[]`.

## collection_schedules

| Campo | Tipo | Notas |
|---|---|---|
| id | String | PK, cuid |
| zoneId | String | FK → `zones.id`, columna `zone_id` |
| wasteTypeId | String | FK → `waste_types.id`, columna `waste_type_id` |
| dayOfWeek | String | columna `day_of_week` |
| startTime | String | columna `start_time` |
| endTime | String | columna `end_time` |
| status | String | default `ACTIVE` |
| frequencyId | String? | FK → `frequency_configs.id`, columna `frequency_id` |

## routes

| Campo | Tipo | Notas |
|---|---|---|
| id | String | PK, cuid |
| zoneId | String | FK → `zones.id`, columna `zone_id` |
| driverId | String? | FK → `users.id`, columna `driver_id` — nullable: rutas plantilla sin conductor |
| name | String? | ej. "Zona 1 - Mañana LMV" |
| shift | String? | `MANANA`\|`TARDE`\|`NOCHE`\|`DOMINICAL` |
| frequency | String? | `LMV`\|`MJS`\|`DOM`\|`DOM_LUN`\|`TODOS` |
| status | String | default `PENDING` |
| startedAt | DateTime? | columna `started_at` |
| finishedAt | DateTime? | columna `finished_at` |
| createdAt | DateTime | columna `created_at` |

Relaciones: `RouteStop[]`, `RouteLocation[]`, `Incident[]`, `CitizenAlarm[]`.

## route_stops

Ocurrencia de un `PickupPoint` dentro de una ruta concreta.

| Campo | Tipo | Notas |
|---|---|---|
| id | String | PK, cuid |
| routeId | String | FK → `routes.id`, columna `route_id` |
| pickupPointId | String | FK → `pickup_points.id`, columna `pickup_point_id` |
| orderIndex | Int | columna `order_index` |
| status | String | default `PENDING` (`PENDING`\|`COMPLETED`) |

Relaciones: `Collection?` (1-a-1).

## collections

Registro de recojo efectivo sobre una parada.

| Campo | Tipo | Notas |
|---|---|---|
| id | String | PK, cuid |
| routeStopId | String | FK → `route_stops.id`, único, columna `route_stop_id` |
| wasteTypeId | String | FK → `waste_types.id`, columna `waste_type_id` |
| collectedAt | DateTime | columna `collected_at` |
| notes | String? | |

## vehicles

| Campo | Tipo | Notas |
|---|---|---|
| id | String | PK, cuid |
| plate | String | único |
| brand | String? | |
| model | String? | |
| capacity | Float? | |
| driverId | String? | FK → `users.id`, columna `driver_id` |
| status | String | default `ACTIVE` |
| createdAt | DateTime | columna `created_at` |

## route_locations

Posiciones GPS de una ruta en curso — reales o de modo demo.

| Campo | Tipo | Notas |
|---|---|---|
| id | String | PK, cuid |
| routeId | String | FK → `routes.id`, columna `route_id` |
| latitude | Float | |
| longitude | Float | |
| recordedAt | DateTime | columna `recorded_at` |
| simulated | Boolean | default `false` — `true` si viene del modo demo, no de GPS real |

Índice: `[routeId, recordedAt]`.

## incidents

| Campo | Tipo | Notas |
|---|---|---|
| id | String | PK, cuid |
| reportedBy | String | FK → `users.id`, columna `reported_by` |
| zoneId | String? | FK → `zones.id`, columna `zone_id` |
| routeId | String? | FK → `routes.id`, columna `route_id` |
| type | String | |
| description | String | |
| status | String | default `OPEN` |
| latitude | Float? | |
| longitude | Float? | |
| address | String? | |
| createdAt | DateTime | columna `created_at` |

## citizen_alarms

Alarmas ciudadanas por parada, con notificación previa (WhatsApp/navegador).

| Campo | Tipo | Notas |
|---|---|---|
| id | String | PK, cuid |
| userId | String | FK → `users.id`, columna `user_id` |
| routeId | String | FK → `routes.id`, columna `route_id` |
| pickupPointId | String | FK → `pickup_points.id`, columna `pickup_point_id` |
| notifyBeforeMinutes | Int | default `30`, columna `notify_before_minutes` |
| label | String? | |
| active | Boolean | default `true` |
| lastNotifiedDate | String? | `YYYY-MM-DD`, para no repetir el aviso el mismo día, columna `last_notified_date` |
| createdAt | DateTime | columna `created_at` |

Índices: `[userId]`, `[routeId]`, `[pickupPointId]`.

## Enums

### Shift
Turno del día en que se realiza la ruta.

| Valor | Descripción |
|---|---|
| MANANA | 4:00 - 12:00 |
| TARDE | 12:00 - 18:00 |
| NOCHE | 18:00 - 00:00 |
| DOMINICAL | Turno dominical |

### StopType
Tipo de parada según el rutero oficial.

| Valor | Descripción |
|---|---|
| NORMAL | Parada regular |
| CAMPANEO | Parada con aviso sonoro |
| REPECHAJE | Recorrido adicional de repaso |
| VIA_PUBLICA | Recojo de RRSS de vía pública |
| DOMINICAL | Parada solo domingos |

### FrequencyCode
Código de frecuencia de la ruta.

| Valor | Descripción |
|---|---|
| LMV | Lunes, Miércoles y Viernes |
| MJS | Martes, Jueves y Sábado |
| DOM | Solo Domingo |
| DOM_LUN | Domingo y Lunes |
| TODOS | Todos los días |
