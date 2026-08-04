import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const [
      zones,
      pickupPoints,
      openIncidents,
      inProgressIncidents,
      resolvedIncidents,
      closedIncidents,
      recentIncidents,
      userStats,
      schedulesCount,
      usersCount,
    ] = await Promise.all([
      this.prisma.zone.count({ where: { status: 'ACTIVE' } }),
      this.prisma.pickupPoint.count({ where: { status: 'ACTIVE' } }),
      this.prisma.incident.count({ where: { status: 'OPEN' } }),
      this.prisma.incident.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.incident.count({ where: { status: 'RESOLVED' } }),
      this.prisma.incident.count({ where: { status: 'CLOSED' } }),
      this.prisma.incident.findMany({
        take: 5,
        include: {
          reporter: { select: { id: true, fullName: true, email: true } },
          zone: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.groupBy({ by: ['role', 'status'], _count: true }),
      this.prisma.collectionSchedule.count(),
      this.prisma.user.count(),
    ]);

    const activeUsers = userStats
      .filter((u) => u.status === 'ACTIVE')
      .reduce(
        (acc, u) => ({ ...acc, [u.role.toLowerCase()]: u._count }),
        {} as Record<string, number>,
      );

    return {
      zones,
      pickupPoints,
      coverage:
        zones > 0
          ? Math.round((pickupPoints / Math.max(zones * 3, 1)) * 100)
          : 0,
      incidentsByStatus: {
        open: openIncidents,
        inProgress: inProgressIncidents,
        resolved: resolvedIncidents,
        closed: closedIncidents,
      },
      pendingIncidents: openIncidents + inProgressIncidents,
      recentIncidents,
      usersStats: {
        total: usersCount,
        active: userStats
          .filter((u) => u.status === 'ACTIVE')
          .reduce((sum, u) => sum + u._count, 0),
        drivers: activeUsers['driver'] ?? 0,
        admins: activeUsers['admin'] ?? 0,
        citizens: activeUsers['citizen'] ?? 0,
      },
      schedulesCount,
    };
  }

  async getAnalytics() {
    const [
      zones,
      pickupPoints,
      schedules,
      incidents,
      routesData,
      wasteTypes,
      _incidentsByDayRaw,
    ] = await Promise.all([
      this.prisma.zone.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { name: 'asc' },
      }),
      this.prisma.pickupPoint.findMany({
        where: { status: 'ACTIVE' },
        include: { zone: { select: { id: true, name: true } } },
      }),
      this.prisma.collectionSchedule.findMany({
        include: {
          zone: { select: { id: true, name: true } },
          wasteType: { select: { id: true, name: true, category: true } },
        },
      }),
      this.prisma.incident.findMany({
        include: { zone: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.route.findMany({
        include: { stops: true },
      }),
      this.prisma.wasteType.findMany(),
      this.prisma.incident.groupBy({
        by: ['createdAt'],
        _count: true,
      }),
    ]);

    // ─── Stats ────────────────────────────────────────────────────────────
    const recyclableSchedules = schedules.filter(
      (s) => s.wasteType?.category === 'RECYCLABLE',
    ).length;
    const totalRoutes = routesData.length;
    const activeRoutes = routesData.filter(
      (r) => r.status === 'IN_PROGRESS',
    ).length;
    const openIncidents = incidents.filter((i) => i.status === 'OPEN').length;

    // ─── Incidents by day (last 30 days) ──────────────────────────────────
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const incidentsByDay = incidents
      .filter((i) => new Date(i.createdAt) >= thirtyDaysAgo)
      .reduce(
        (acc, i) => {
          const day = new Date(i.createdAt).toISOString().slice(0, 10);
          acc[day] = (acc[day] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

    // ─── Waste composition (from schedules) ───────────────────────────────
    const wasteComposition = wasteTypes.map((wt) => {
      const count = schedules.filter((s) => s.wasteTypeId === wt.id).length;
      return {
        category: wt.category,
        name: wt.name,
        count,
        percentage:
          schedules.length > 0
            ? Math.round((count / schedules.length) * 100)
            : 0,
      };
    });

    // ─── Zone ranking ─────────────────────────────────────────────────────
    const zoneRanking = zones
      .map((z) => {
        const zonePPs = pickupPoints.filter((pp) => pp.zoneId === z.id);
        const zoneIncidents = incidents.filter((i) => i.zoneId === z.id);
        const zoneSchedules = schedules.filter((s) => s.zoneId === z.id);
        const resolved = zoneIncidents.filter(
          (i) => i.status === 'RESOLVED' || i.status === 'CLOSED',
        ).length;
        const participationRate =
          zoneIncidents.length > 0
            ? Math.round((resolved / zoneIncidents.length) * 100)
            : 100;

        let status = 'REGULAR';
        if (participationRate >= 80) status = 'EXCELENTE';
        else if (participationRate >= 60) status = 'ALTA';
        else if (participationRate >= 40) status = 'OPTIMO';

        return {
          name: z.name,
          participationRate,
          pickupPoints: zonePPs.length,
          schedules: zoneSchedules.length,
          incidents: zoneIncidents.length,
          status,
          statusStyle:
            status === 'EXCELENTE'
              ? 'bg-primary-fixed text-on-primary-fixed-variant'
              : status === 'ALTA'
                ? 'bg-primary-fixed text-on-primary-fixed-variant'
                : status === 'OPTIMO'
                  ? 'bg-secondary-fixed text-on-secondary-fixed-variant'
                  : 'bg-surface-variant text-on-surface-variant',
        };
      })
      .sort((a, b) => b.participationRate - a.participationRate);

    return {
      stats: {
        totalWaste: schedules.length * pickupPoints.length,
        recyclingRate:
          schedules.length > 0
            ? Math.round((recyclableSchedules / schedules.length) * 100)
            : 0,
        activeRoutes: `${activeRoutes}/${totalRoutes}`,
        criticalAlerts: openIncidents,
      },
      incidentsByDay: Object.entries(incidentsByDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      wasteComposition,
      zoneRanking,
      totalZones: zones.length,
      totalPickupPoints: pickupPoints.length,
      totalSchedules: schedules.length,
      totalIncidents: incidents.length,
    };
  }

  async getNotifications(page = 1, limit = 20, type?: string) {
    const where: { type?: string } = {};
    if (type) where.type = type;

    const [data, total] = await Promise.all([
      this.prisma.notificationLog.findMany({
        where,
        include: { user: { select: { id: true, fullName: true, email: true } } },
        orderBy: { sentAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notificationLog.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
