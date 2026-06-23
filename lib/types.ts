export interface Zone {
  id: string;
  name: string;
  description?: string;
  status?: string;
  createdAt?: string;
}

export interface WasteType {
  id: string;
  name: string;
  category: string;
  description?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Turnos según rutero de compactadores Wanchaq 2024
// ═══════════════════════════════════════════════════════════════════════════
export type Shift = 'MANANA' | 'TARDE' | 'NOCHE' | 'DOMINICAL';

// Tipos de parada según rutero oficial
export type StopType = 'NORMAL' | 'CAMPANEO' | 'REPECHAJE' | 'VIA_PUBLICA' | 'DOMINICAL';

// Códigos de frecuencia
export type FrequencyCode = 'LMV' | 'MJS' | 'DOM' | 'DOM_LUN' | 'TODOS';

export interface FrequencyConfig {
  id: string;
  code: FrequencyCode;
  label: string;  // "Lunes, Miércoles y Viernes"
  days: string;   // "MON,WED,FRI"
  pickupPointsCount?: number;
}

export interface PickupPoint {
  id: string;
  zoneId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  status: string;

  // Campos del rutero de compactadores
  shift?: Shift | null;
  stopType: StopType;
  scheduledTime?: string | null;  // "HH:MM"
  frequencyId?: string | null;
  orderIndex: number;

  zone?: { id: string; name: string };
  frequency?: FrequencyConfig | null;
}

export interface CollectionSchedule {
  id: string;
  zoneId: string;
  wasteTypeId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  frequencyId?: string | null;
  zone?: { id: string; name: string };
  wasteType?: { id: string; name: string; category: string };
  frequency?: FrequencyConfig | null;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'CITIZEN' | 'DRIVER' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  zones: Zone[];
}

export interface UserStats {
  total: number;
  active: number;
  drivers: number;
  admins: number;
  citizens: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface Incident {
  id: string;
  reportedBy: string;
  zoneId?: string | null;
  routeId?: string | null;
  type: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  createdAt: string;
  reporter?: { id: string; fullName: string; email: string };
  zone?: { id: string; name: string } | null;
}

export interface Vehicle {
  id: string;
  plate: string;
  brand?: string | null;
  model?: string | null;
  capacity?: number | null;
  status: string;
  driverId?: string | null;
  createdAt: string;
  driver?: { id: string; fullName: string; email: string } | null;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
