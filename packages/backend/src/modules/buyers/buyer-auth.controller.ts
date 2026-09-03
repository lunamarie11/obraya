import { Controller, Post, Body, HttpCode, HttpStatus, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { BuyersService } from './buyers.service';
import { BuyerAuthService } from './buyer-auth.service';
import { RegisterBuyerDto } from './dto/register-buyer.dto';
import { LoginBuyerDto } from './dto/login-buyer.dto';

@ApiTags('buyer-auth')
@Controller('buyer-auth')
export class BuyerAuthController {
  constructor(
    private readonly buyersService: BuyersService,
    private readonly buyerAuthService: BuyerAuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Registro de comprador' })
  @ApiResponse({ status: 201, description: 'Comprador registrado, retorna JWT tokens' })
  @ApiResponse({ status: 409, description: 'Email ya registrado' })
  async register(@Body() dto: RegisterBuyerDto) {
    const buyer = await this.buyersService.register(dto);
    return this.buyerAuthService.login(buyer);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login de comprador' })
  @ApiResponse({ status: 200, description: 'Login exitoso, retorna JWT tokens' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() dto: LoginBuyerDto) {
    const buyer = await this.buyersService.validateBuyer(dto.email, dto.password);
    return this.buyerAuthService.login(buyer);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refrescar access token con refresh token' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.buyerAuthService.refreshToken(refreshToken);
  }

  @Post('demo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login demo de comprador (dev/staging only)' })
  async demo(@Body('email') email: string, @Body('demoSecret') demoSecret?: string) {
    const enabled = this.config.get<string>('ENABLE_DEMO') === 'true';
    const nodeEnv = this.config.get<string>('NODE_ENV') || process.env.NODE_ENV;
    if (!enabled || nodeEnv === 'production') {
      throw new ForbiddenException('Demo login no disponible');
    }

    const configuredSecret = this.config.get<string>('DEMO_SECRET');
    if (configuredSecret && configuredSecret.length > 0) {
      if (!demoSecret || demoSecret !== configuredSecret) {
        throw new ForbiddenException('Demo secret inválido');
      }
    }

    const buyer = await this.buyersService.findByEmail(email);
    if (!buyer || !buyer.isActive) throw new UnauthorizedException('Comprador inválido o inactivo');

    return this.buyerAuthService.login(buyer);
  }
}
