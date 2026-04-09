import { Module } from '@nestjs/common';

// MVP: Dashboard KPIs, reportes ventas/stock, exportacion CSV/Excel

@Module({
  imports: [
    // TypeOrmModule.forFeature([AnalyticsEvent, SalesReport, StockReport]),
    // ElasticsearchModule (for analytics queries),
  ],
  controllers: [
    // AnalyticsController,
    // ReportsController,
  ],
  providers: [
    // AnalyticsService,
    // ReportsService,
    // ExportService,
  ],
  exports: [
    // AnalyticsService,
  ],
})
export class AnalyticsModule {}
