import { Controller, Get, Header } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';

@Controller()
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('health')
  async health() {
    const db = await this.monitoringService.checkDatabase();
    const es = await this.monitoringService.checkElasticsearch();
    const minio = await this.monitoringService.checkMinio();

    const ok = db.ok && es.ok && minio.ok;

    return {
      status: ok ? 'ok' : 'degraded',
      services: { database: db, elasticsearch: es, minio: minio },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async metrics() {
    return this.monitoringService.getPrometheusMetrics();
  }
}
