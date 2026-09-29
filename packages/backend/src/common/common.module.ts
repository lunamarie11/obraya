import { Module, Global } from '@nestjs/common';
import { InputSanitizerService } from './input-sanitizer.service';
import { SanitizeMiddleware } from './sanitize.middleware';
import { LoggingModule } from './logging/logger.module';

@Global()
@Module({
  imports: [LoggingModule],
  providers: [InputSanitizerService, SanitizeMiddleware],
  exports: [InputSanitizerService, SanitizeMiddleware, LoggingModule],
})
export class CommonModule {}
