import { Controller, Get } from '@nestjs/common';
import type { RequestMetrics } from '../monitoring/metrics.service';
import { MetricsService } from '../monitoring/metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  @Get()
  getMetrics(): RequestMetrics {
    return this.metricsService.getMetrics();
  }

  @Get('health')
  getHealthWithMetrics(): {
    status: string;
    timestamp: string;
    metrics: RequestMetrics;
  } {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      metrics: this.metricsService.getMetrics(),
    };
  }
}
