import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FrequenciesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const freqs = await this.prisma.frequencyConfig.findMany({
      orderBy: { code: 'asc' },
      include: {
        _count: {
          select: { pickupPoints: true },
        },
      },
    });
    return freqs.map((f) => ({
      id: f.id,
      code: f.code,
      label: f.label,
      days: f.days,
      pickupPointsCount: f._count.pickupPoints,
    }));
  }

  async findOne(code: string) {
    return this.prisma.frequencyConfig.findUnique({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      where: { code: code as any },
    });
  }
}
