import { Module, Global } from '@nestjs/common';
import { InputSanitizerService } from './input-sanitizer.service';
import { SanitizePipe } from './sanitize.pipe';
import { SanitizeMiddleware } from './sanitize.middleware';
import { LoggingModule } from './logging/logger.module';
import { MetricsService } from './monitoring/metrics.service';
import { MetricsController } from './monitoring/metrics.controller';

@Global()
@Module({
  imports: [LoggingModule],
  providers: [InputSanitizerService, SanitizePipe, SanitizeMiddleware, MetricsService],
  controllers: [MetricsController],
  exports: [InputSanitizerService, SanitizePipe, SanitizeMiddleware, LoggingModule, MetricsService],
})
export class CommonModule {}