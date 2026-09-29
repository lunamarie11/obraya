import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ErrorTrackingService } from './error-tracking.service';
import { AllExceptionsFilter } from './all-exceptions.filter';

// Global: AllExceptionsFilter y ErrorTrackingService se usan en toda la app
// (ver ADR-013), no solo en un modulo de negocio puntual.
@Global()
@Module({
  providers: [ErrorTrackingService, { provide: APP_FILTER, useClass: AllExceptionsFilter }],
  exports: [ErrorTrackingService],
})
export class ErrorTrackingModule {}
