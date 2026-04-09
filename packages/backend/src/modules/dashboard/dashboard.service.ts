import { Injectable } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { StockService } from '../stock/stock.service';

export type Period = 'today' | 'week' | 'month';

function getPeriodDates(period: Period): { from: Date; to: Date; prevFrom: Date; prevTo: Date } {
  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);

  let from: Date;
  let prevFrom: Date;
  let prevTo: Date;

  if (period === 'today') {
    from = new Date(now);
    from.setHours(0, 0, 0, 0);
    prevFrom = new Date(from);
    prevFrom.setDate(prevFrom.getDate() - 1);
    prevTo = new Date(from);
    prevTo.setMilliseconds(-1);
  } else if (period === 'week') {
    from = new Date(now);
    from.setDate(now.getDate() - 6);
    from.setHours(0, 0, 0, 0);
    prevFrom = new Date(from);
    prevFrom.setDate(prevFrom.getDate() - 7);
    prevTo = new Date(from);
    prevTo.setMilliseconds(-1);
  } else {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
    prevFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    prevTo = new Date(from);
    prevTo.setMilliseconds(-1);
  }

  return { from, to, prevFrom, prevTo };
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly stockService: StockService,
  ) {}

  async getSummary(companyId: string, period: Period = 'month') {
    const { from, to, prevFrom, prevTo } = getPeriodDates(period);

    const [current, previous, lowStockItems] = await Promise.all([
      this.ordersService.getSummary(companyId, from, to),
      this.ordersService.getSummary(companyId, prevFrom, prevTo),
      this.stockService.findLowStock(companyId),
    ]);

    const revenueChange = previous.totalRevenue
      ? Math.round(((current.totalRevenue - previous.totalRevenue) / previous.totalRevenue) * 100)
      : null;

    const ordersChange = previous.totalOrders
      ? Math.round(((current.totalOrders - previous.totalOrders) / previous.totalOrders) * 100)
      : null;

    return {
      period,
      from: from.toISOString(),
      to: to.toISOString(),
      kpis: {
        totalRevenue: current.totalRevenue,
        totalOrders: current.totalOrders,
        avgTicket: current.avgTicket,
        revenueChangePct: revenueChange,
        ordersChangePct: ordersChange,
      },
      ordersByStatus: current.byStatus,
      topProducts: current.topProducts,
      alerts: {
        lowStockCount: lowStockItems.length,
        lowStockProducts: lowStockItems.slice(0, 5).map((s) => ({
          productId: s.productId,
          warehouseId: s.warehouseId,
          quantity: s.quantity,
          minimumAlert: s.minimumAlert,
        })),
      },
      comparison: {
        previousRevenue: previous.totalRevenue,
        previousOrders: previous.totalOrders,
        previousAvgTicket: previous.avgTicket,
      },
    };
  }
}
