import { api } from './api';
import type { Incident, CollectionSchedule, Zone, PickupPoint, WasteType, PaginatedResponse, User, UserStats, FrequencyConfig, UserAlarm } from './types';

export const queryKeys = {
  incidents: {
    my: () => ['incidents', 'my'] as const,
    all: (status?: string) => ['incidents', 'all', status] as const,
  },
  schedules: {
    all: (zoneId?: string, wasteTypeId?: string) => ['schedules', zoneId, wasteTypeId] as const,
  },
  pickupPoints: {
    all: (zoneId?: string, routeId?: string) => ['pickup-points', zoneId, routeId] as const,
  },
  routes: {
    public: () => ['routes', 'public'] as const,
  },
  frequencies: {
    all: () => ['frequencies'] as const,
  },
  zones: {
    all: () => ['zones'] as const,
  },
  wasteTypes: {
    all: () => ['waste-types'] as const,
  },
  userAlarms: {
    my: () => ['user-alarms', 'my'] as const,
  },
  users: {
    all: (query?: string) => ['users', 'all', query] as const,
    stats: () => ['users', 'stats'] as const,
    me: () => ['users', 'me'] as const,
  },
  admin: {
    dashboard: () => ['admin', 'dashboard'] as const,
    analytics: () => ['admin', 'analytics'] as const,
  },
};

export const queries = {
  incidents: {
    my: () => ({
      queryKey: queryKeys.incidents.my(),
      queryFn: () => api.get<Incident[]>('/incidents/my'),
    }),
    all: (status?: string) => ({
      queryKey: queryKeys.incidents.all(status),
      queryFn: () => {
        const params = status ? `?status=${status}` : '';
        return api.get<PaginatedResponse<Incident>>(`/incidents${params}`);
      },
    }),
  },
  schedules: {
    all: (zoneId?: string, wasteTypeId?: string) => ({
      queryKey: queryKeys.schedules.all(zoneId, wasteTypeId),
      queryFn: () => {
        const params = new URLSearchParams();
        if (zoneId) params.set('zoneId', zoneId);
        if (wasteTypeId) params.set('wasteTypeId', wasteTypeId);
        const qs = params.toString();
        return api.get<CollectionSchedule[]>(`/schedules${qs ? `?${qs}` : ''}`);
      },
    }),
  },
  pickupPoints: {
    all: (zoneId?: string, routeId?: string) => ({
      queryKey: queryKeys.pickupPoints.all(zoneId, routeId),
      queryFn: () => {
        const params = new URLSearchParams();
        if (zoneId) params.set('zoneId', zoneId);
        if (routeId) params.set('routeId', routeId);
        const qs = params.toString();
        return api.get<PickupPoint[]>(`/pickup-points${qs ? `?${qs}` : ''}`);
      },
    }),
  },
  routes: {
    public: () => ({
      queryKey: queryKeys.routes.public(),
      queryFn: () => api.get<Array<{ id: string; name: string; zoneId?: string; zoneName?: string }>>('/routes/public'),
    }),
  },
  zones: {
    all: () => ({
      queryKey: queryKeys.zones.all(),
      queryFn: () => api.get<Zone[]>('/zones'),
    }),
  },
  frequencies: {
    all: () => ({
      queryKey: queryKeys.frequencies.all(),
      queryFn: () => api.get<FrequencyConfig[]>('/frequencies'),
    }),
  },
  wasteTypes: {
    all: () => ({
      queryKey: queryKeys.wasteTypes.all(),
      queryFn: () => api.get<WasteType[]>('/waste-types'),
    }),
  },
  userAlarms: {
    my: () => ({
      queryKey: queryKeys.userAlarms.my(),
      queryFn: () => api.get<UserAlarm[]>('/user-alarms/my'),
    }),
  },
  admin: {
    dashboard: () => ({
      queryKey: queryKeys.admin.dashboard(),
      queryFn: () => api.get<DashboardData>('/admin/dashboard'),
    }),
  },
};

interface DashboardData {
  zones: number;
  pickupPoints: number;
  coverage: number;
  incidentsByStatus: { open: number; inProgress: number; resolved: number; closed: number };
  pendingIncidents: number;
  recentIncidents: (Incident & { reporter: { fullName: string } })[];
  usersStats: { total: number; active: number; drivers: number; admins: number; citizens: number };
  schedulesCount: number;
}
