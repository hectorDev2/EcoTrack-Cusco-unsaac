import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';

const incidentInclude = {
  reporter: { select: { id: true, fullName: true, email: true } },
  zone: { select: { id: true, name: true } },
};

@Injectable()
export class IncidentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateIncidentDto, userId: string) {
    return this.prisma.incident.create({
      data: {
        reportedBy: userId,
        type: dto.type,
        description: dto.description,
        zoneId: dto.zoneId ?? null,
        createdAt: new Date().toISOString(),
      },
      include: incidentInclude,
    });
  }

  async findByUser(userId: string) {
    return this.prisma.incident.findMany({
      where: { reportedBy: userId },
      include: incidentInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(status?: string) {
    const where: any = {};
    if (status) where.status = status;

    return this.prisma.incident.findMany({
      where,
      include: incidentInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: {
        ...incidentInclude,
        route: { select: { id: true, status: true } },
      },
    });
    if (!incident) throw new NotFoundException('Incidencia no encontrada');
    return incident;
  }

  async update(id: string, dto: UpdateIncidentDto) {
    await this.findOne(id);
    return this.prisma.incident.update({
      where: { id },
      data: dto,
      include: incidentInclude,
    });
  }
}
