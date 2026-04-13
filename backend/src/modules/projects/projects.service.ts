import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(ownerId?: string) {
    return this.prisma.project.findMany({
      where: ownerId ? { ownerId } : undefined,
      include: {
        tasks: { select: { id: true, status: true } },
        expenses: { select: { amount: true } },
        owner: { select: { name: true, email: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        tasks: { orderBy: { createdAt: 'desc' } },
        expenses: { orderBy: { date: 'desc' } },
        owner: { select: { name: true, email: true } },
      },
    });
    if (!project) throw new NotFoundException('Proyecto no encontrado');
    return project;
  }

  async create(data: {
    name: string; type: string; area?: string; location?: string;
    budget: number; startDate: Date; endDate: Date; ownerId: string;
  }) {
    return this.prisma.project.create({ data });
  }

  async update(id: string, data: Partial<{
    name: string; type: string; area: string; location: string;
    budget: number; spent: number; progress: number; status: string;
    startDate: Date; endDate: Date;
  }>) {
    await this.findOne(id);
    return this.prisma.project.update({ where: { id }, data: data as any });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.project.delete({ where: { id } });
  }

  async getStats(ownerId: string) {
    const projects = await this.prisma.project.findMany({
      where: { ownerId },
      include: { tasks: true, expenses: true },
    });
    const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
    const totalSpent = projects.reduce((s, p) => s + p.spent, 0);
    const tasksCount = projects.reduce((s, p) => s + p.tasks.length, 0);
    const tasksDone = projects.reduce((s, p) => s + p.tasks.filter(t => t.status === 'DONE').length, 0);

    return {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'ON_TRACK' || p.status === 'AT_RISK').length,
      totalBudget,
      totalSpent,
      budgetRemaining: totalBudget - totalSpent,
      tasksCount,
      tasksDone,
      tasksProgress: tasksCount > 0 ? Math.round((tasksDone / tasksCount) * 100) : 0,
    };
  }
}
