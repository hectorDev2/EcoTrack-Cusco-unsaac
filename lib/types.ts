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

export interface PickupPoint {
  id: string;
  zoneId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  status: string;
  zone?: { id: string; name: string };
}

export interface CollectionSchedule {
  id: string;
  zoneId: string;
  wasteTypeId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  zone?: { id: string; name: string };
  wasteType?: { id: string; name: string; category: string };
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

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
