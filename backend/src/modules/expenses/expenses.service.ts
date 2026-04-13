import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async findByProject(projectId: string) {
    return this.prisma.expense.findMany({
      where: { projectId },
      orderBy: { date: 'desc' },
    });
  }

  async getSummary(projectId: string) {
    const expenses = await this.findByProject(projectId);
    const byCategory: Record<string, number> = {};
    expenses.forEach(e => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    return {
      total,
      count: expenses.length,
      byCategory: Object.entries(byCategory).map(([category, amount]) => ({ category, amount })),
    };
  }

  async create(data: {
    projectId: string; concept: string; category: string;
    amount: number; registeredBy?: string; date?: Date;
  }) {
    const expense = await this.prisma.expense.create({ data });
    // Update project spent
    const total = await this.prisma.expense.aggregate({
      where: { projectId: data.projectId },
      _sum: { amount: true },
    });
    await this.prisma.project.update({
      where: { id: data.projectId },
      data: { spent: total._sum.amount || 0 },
    });
    return expense;
  }

  async remove(id: string) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new NotFoundException('Gasto no encontrado');
    await this.prisma.expense.delete({ where: { id } });
    // Recalculate project spent
    const total = await this.prisma.expense.aggregate({
      where: { projectId: expense.projectId },
      _sum: { amount: true },
    });
    await this.prisma.project.update({
      where: { id: expense.projectId },
      data: { spent: total._sum.amount || 0 },
    });
    return { deleted: true };
  }
}
