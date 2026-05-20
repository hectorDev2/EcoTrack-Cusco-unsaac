import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWasteTypeDto } from './dto/create-waste-type.dto';
import { UpdateWasteTypeDto } from './dto/update-waste-type.dto';

@Injectable()
export class WasteTypesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.wasteType.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const wt = await this.prisma.wasteType.findUnique({ where: { id } });
    if (!wt) throw new NotFoundException('Tipo de residuo no encontrado');
    return wt;
  }

  async create(dto: CreateWasteTypeDto) {
    return this.prisma.wasteType.create({
      data: { ...dto, createdAt: new Date().toISOString() },
    });
  }

  async update(id: string, dto: UpdateWasteTypeDto) {
    await this.findOne(id);
    return this.prisma.wasteType.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.wasteType.delete({ where: { id } });
  }
}
