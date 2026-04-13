import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskStatus, Priority } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findByProject(projectId: string) {
    return this.prisma.task.findMany({
      where: { projectId },
      orderBy: [{ status: 'asc' }, { priority: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findByStatus(projectId: string, status: TaskStatus) {
    return this.prisma.task.findMany({
      where: { projectId, status },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({ where: { id }, include: { project: true } });
    if (!task) throw new NotFoundException('Tarea no encontrada');
    return task;
  }

  async create(data: {
    title: string; projectId: string; priority?: Priority;
    assignedTo?: string; dueDate?: Date;
  }) {
    return this.prisma.task.create({ data });
  }

  async update(id: string, data: Partial<{
    title: string; status: TaskStatus; priority: Priority;
    assignedTo: string; dueDate: Date; progress: number;
  }>) {
    await this.findOne(id);
    const updateData: any = { ...data };
    if (data.status === 'DONE') {
      updateData.completedDate = new Date();
      updateData.progress = 100;
    }
    return this.prisma.task.update({ where: { id }, data: updateData });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.task.delete({ where: { id } });
  }

  async moveToColumn(id: string, status: TaskStatus) {
    return this.update(id, { status });
  }
}
