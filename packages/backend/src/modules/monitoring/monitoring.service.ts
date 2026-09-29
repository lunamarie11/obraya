import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
// use global fetch (Node 18+). Use globalThis.fetch to avoid needing node-fetch types
import { AdminService } from '../admin/admin.service';

@Injectable()
export class MonitoringService {
  constructor(
    private readonly adminService: AdminService,
    // Ver docs/adrs (bug corregido): antes usaba el AppDataSource standalone de
    // database/data-source.ts (pensado solo para el CLI de migrations), que
    // nunca se inicializa en runtime y hacía que /health reportara la DB caída
    // aunque la app funcionara bien. Este es el DataSource real de Nest/TypeORM.
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async checkDatabase() {
    try {
      await this.dataSource.query('SELECT 1');
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? String(err) };
    }
  }

  async checkElasticsearch() {
    try {
      const res = await (globalThis as any).fetch(process.env.ELASTICSEARCH_URL || 'http://localhost:9200/_cluster/health');
      if (!res.ok) return { ok: false, status: res.status };
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? String(err) };
    }
  }

  async checkMinio() {
    try {
      const url = process.env.MINIO_URL || 'http://localhost:9000/minio/health/live';
      const res = await (globalThis as any).fetch(url);
      if (!res.ok) return { ok: false, status: res.status };
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? String(err) };
    }
  }

  async getStats() {
    return this.adminService.getStats();
  }

  async getPrometheusMetrics() {
    const db = await this.checkDatabase();
    const es = await this.checkElasticsearch();
    const minio = await this.checkMinio();
    const stats = await this.getStats();

    const lines: string[] = [];
    lines.push('# HELP obraya_db_up Whether the database is reachable (1 up, 0 down)');
    lines.push('# TYPE obraya_db_up gauge');
    lines.push(`obraya_db_up ${db.ok ? 1 : 0}`);

    lines.push('# HELP obraya_elasticsearch_up Elasticsearch reachable (1/0)');
    lines.push('# TYPE obraya_elasticsearch_up gauge');
    lines.push(`obraya_elasticsearch_up ${es.ok ? 1 : 0}`);

    lines.push('# HELP obraya_minio_up MinIO reachable (1/0)');
    lines.push('# TYPE obraya_minio_up gauge');
    lines.push(`obraya_minio_up ${minio.ok ? 1 : 0}`);

    lines.push('# HELP obraya_total_companies Total companies');
    lines.push('# TYPE obraya_total_companies gauge');
    lines.push(`obraya_total_companies ${stats.totalCompanies ?? 0}`);

    lines.push('# HELP obraya_total_users Total users');
    lines.push('# TYPE obraya_total_users gauge');
    lines.push(`obraya_total_users ${stats.totalUsers ?? 0}`);

    lines.push('# HELP obraya_total_orders Total orders');
    lines.push('# TYPE obraya_total_orders gauge');
    lines.push(`obraya_total_orders ${stats.totalOrders ?? 0}`);

    return lines.join('\n') + '\n';
  }
}
