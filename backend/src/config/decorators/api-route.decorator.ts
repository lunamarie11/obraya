import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to apply rate limiting throttle groups to endpoints
 * Usage: @ApiRoute('auth') | @ApiRoute('search')
 */
export const ApiRoute = (name: string) => SetMetadata('throttle-key', name);

/**
 * Disable rate limiting for specific endpoints
 * Usage: @SkipThrottle()
 */
export { SkipThrottle } from '@nestjs/throttler';
