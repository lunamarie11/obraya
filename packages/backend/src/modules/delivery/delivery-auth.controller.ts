import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { DeliveriesService } from './deliveries.service';
import { DeliveryAuthService } from './delivery-auth.service';
import { RegisterDeliveryDto } from './dto/register-delivery.dto';
import { LoginDeliveryDto } from './dto/login-delivery.dto';
import { AuthThrottlerGuard } from '../../config/scoped-throttler.guard';

// Ver ADR-007, ADR-023, ADR-026 y CHANGELOG 0.33.10: mismo throttler 'auth'
// (15 intentos / 15 min) que auth.controller.ts y buyer-auth.controller.ts.
@UseGuards(AuthThrottlerGuard)
@Throttle({ auth: { limit: 15, ttl: 900000 } })
@ApiTags('delivery-auth')
@Controller('delivery-auth')
export class DeliveryAuthController {
  constructor(
    private readonly deliveriesService: DeliveriesService,
    private readonly deliveryAuthService: DeliveryAuthService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Registro de repartidor independiente' })
  @ApiResponse({ status: 201, description: 'Repartidor registrado, retorna JWT tokens' })
  @ApiResponse({ status: 409, description: 'Email ya registrado' })
  async register(@Body() dto: RegisterDeliveryDto) {
    const delivery = await this.deliveriesService.register(dto);
    return this.deliveryAuthService.login(delivery);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login de repartidor independiente' })
  @ApiResponse({ status: 200, description: 'Login exitoso, retorna JWT tokens' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() dto: LoginDeliveryDto) {
    const delivery = await this.deliveriesService.validateDelivery(dto.email, dto.password);
    return this.deliveryAuthService.login(delivery);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refrescar access token con refresh token' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.deliveryAuthService.refreshToken(refreshToken);
  }
}
