import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logging/logger.service';

export interface RequestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  requestsByEndpoint: Record<string, number>;
  errorRates: Record<string, number>;
  successRate?: number;
  uptime?: number;
  memoryUsage?: NodeJS.MemoryUsage;
}

@Injectable()
export class MetricsService {
  private requestMetrics: RequestMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    requestsByEndpoint: {},
    errorRates: {},
  };

  private responseTimes: number[] = [];
  private maxMetricsHistory = 1000; // Keep last 1000 requests

  constructor(private logger: LoggerService) {}

  recordRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    error?: boolean
  ) {
    const endpoint = `${method} ${url}`;

    this.requestMetrics.totalRequests++;
    this.requestMetrics.requestsByEndpoint[endpoint] =
      (this.requestMetrics.requestsByEndpoint[endpoint] || 0) + 1;

    if (statusCode >= 200 && statusCode < 300) {
      this.requestMetrics.successfulRequests++;
    } else if (statusCode >= 400) {
      this.requestMetrics.failedRequests++;
      this.requestMetrics.errorRates[endpoint] =
        (this.requestMetrics.errorRates[endpoint] || 0) + 1;
    }

    this.responseTimes.push(duration);
    if (this.responseTimes.length > this.maxMetricsHistory) {
      this.responseTimes.shift();
    }

    this.requestMetrics.averageResponseTime =
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
  }

  getMetrics(): RequestMetrics {
    return {
      ...this.requestMetrics,
      successRate: this.calculateSuccessRate(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };
  }

  private calculateSuccessRate(): number {
    if (this.requestMetrics.totalRequests === 0) return 100;
    return (
      (this.requestMetrics.successfulRequests /
        this.requestMetrics.totalRequests) *
      100
    );
  }

  resetMetrics() {
    this.requestMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      requestsByEndpoint: {},
      errorRates: {},
    };
    this.responseTimes = [];
    this.logger.log('Metrics reset', 'MetricsService');
  }
}
