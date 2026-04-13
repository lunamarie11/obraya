import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  // ── Arquitecto Dashboard ─────────────────────────────────────────────
  async getArquitectoStats(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: { ownerId: userId },
      include: { tasks: true, expenses: true },
    });

    const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
    const totalSpent = projects.reduce((s, p) => s + p.spent, 0);
    const allTasks = projects.flatMap(p => p.tasks);
    const avgProgress = projects.length > 0
      ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length)
      : 0;

    return {
      projects: {
        total: projects.length,
        active: projects.filter(p => ['ON_TRACK', 'AT_RISK'].includes(p.status)).length,
        atRisk: projects.filter(p => p.status === 'AT_RISK').length,
        completed: projects.filter(p => p.status === 'COMPLETED').length,
      },
      budget: {
        total: totalBudget,
        spent: totalSpent,
        remaining: totalBudget - totalSpent,
        percentage: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
      },
      tasks: {
        total: allTasks.length,
        backlog: allTasks.filter(t => t.status === 'BACKLOG').length,
        inProgress: allTasks.filter(t => t.status === 'IN_PROGRESS').length,
        review: allTasks.filter(t => t.status === 'REVIEW').length,
        done: allTasks.filter(t => t.status === 'DONE').length,
      },
      avgProgress,
      recentProjects: projects.slice(0, 5).map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        progress: p.progress,
        budget: p.budget,
        spent: p.spent,
      })),
    };
  }

  // ── Comercio Dashboard ───────────────────────────────────────────────
  async getComercioStats(period: 'day' | 'week' | 'month' | 'quarter' = 'month') {
    const now = new Date();
    let since: Date;
    switch (period) {
      case 'day': since = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
      case 'week': since = new Date(now.getTime() - 7 * 86400000); break;
      case 'quarter': since = new Date(now.getTime() - 90 * 86400000); break;
      default: since = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: since } },
      include: {
        items: { include: { product: { select: { name: true, emoji: true, brand: true, categoryId: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const revenue = orders.reduce((s, o) => s + o.total, 0);
    const uniqueCustomers = new Set(orders.map(o => o.userId)).size;
    const avgTicket = orders.length > 0 ? Math.round(revenue / orders.length) : 0;

    // Top products
    const productSales: Record<string, { name: string; emoji: string; sold: number; revenue: number }> = {};
    orders.forEach(o => o.items.forEach(item => {
      const key = item.productId;
      if (!productSales[key]) {
        productSales[key] = { name: item.product.name, emoji: item.product.emoji || '📦', sold: 0, revenue: 0 };
      }
      productSales[key].sold += item.qty;
      productSales[key].revenue += item.subtotal;
    }));
    const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    return {
      revenue,
      orders: orders.length,
      avgTicket,
      customers: uniqueCustomers,
      topProducts,
      recentOrders: orders.slice(0, 10).map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        total: o.total,
        status: o.status,
        itemCount: o.items.reduce((s, i) => s + i.qty, 0),
        createdAt: o.createdAt,
      })),
    };
  }

  // ── Categories stats ─────────────────────────────────────────────────
  async getCategoryStats() {
    const categories = await this.prisma.category.findMany({
      include: { products: { select: { id: true, stock: true, price: true } } },
    });
    return categories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      emoji: c.emoji,
      productCount: c.products.length,
      totalStock: c.products.reduce((s, p) => s + p.stock, 0),
      avgPrice: c.products.length > 0
        ? Math.round(c.products.reduce((s, p) => s + p.price, 0) / c.products.length)
        : 0,
    }));
  }
}
