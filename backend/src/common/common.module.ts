import { Module, Global } from '@nestjs/common';
import { InputSanitizerService } from './input-sanitizer.service';
import { SanitizePipe } from './sanitize.pipe';

@Global()
@Module({
  providers: [InputSanitizerService, SanitizePipe],
  exports: [InputSanitizerService, SanitizePipe],
})
export class CommonModule {}