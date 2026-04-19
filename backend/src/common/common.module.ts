import { Module, Global } from '@nestjs/common';
import { InputSanitizerService } from './input-sanitizer.service';
import { SanitizePipe } from './sanitize.pipe';
import { LoggingModule } from './logging/logger.module';
import { MetricsService } from './monitoring/metrics.service';
import { MetricsController } from './monitoring/metrics.controller';

@Global()
@Module({
  imports: [LoggingModule],
  providers: [InputSanitizerService, SanitizePipe, MetricsService],
  controllers: [MetricsController],
  exports: [InputSanitizerService, SanitizePipe, LoggingModule, MetricsService],
})
export class CommonModule {}