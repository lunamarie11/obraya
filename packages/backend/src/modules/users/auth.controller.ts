import { Controller, Post, Body, HttpCode, HttpStatus, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { ConfigService } from '@nestjs/config';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Registro de empresa con usuario administrador' })
  @ApiResponse({ status: 201, description: 'Empresa registrada. Pendiente de aprobación.' })
  @ApiResponse({ status: 409, description: 'CUIT o email ya registrado' })
  async register(@Body() dto: RegisterCompanyDto) {
    const { company, adminUser } = await this.usersService.registerCompany(dto);
    return {
      message: 'Empresa registrada exitosamente. Pendiente de aprobación por el equipo ObraYa.',
      companyId: company.id,
      status: company.status,
      adminUserId: adminUser.id,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login de usuario de empresa' })
  @ApiResponse({ status: 200, description: 'Login exitoso, retorna JWT tokens' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    return this.authService.login(user);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refrescar access token con refresh token' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Post('demo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login demo (dev/staging only) usando solo email' })
  async demo(@Body('email') email: string, @Body('demoSecret') demoSecret?: string) {
    const enabled = this.config.get<string>('ENABLE_DEMO') === 'true';
    const nodeEnv = this.config.get<string>('NODE_ENV') || process.env.NODE_ENV;
    if (!enabled || nodeEnv === 'production') {
      throw new ForbiddenException('Demo login no disponible');
    }

    // If a DEMO_SECRET is configured, require it in the request
    const configuredSecret = this.config.get<string>('DEMO_SECRET');
    if (configuredSecret && configuredSecret.length > 0) {
      if (!demoSecret || demoSecret !== configuredSecret) {
        throw new ForbiddenException('Demo secret inválido');
      }
    }

    const user = await this.usersService.findUserByEmail(email);
    if (!user || !user.isActive) throw new UnauthorizedException('Usuario inválido o inactivo');

    return this.authService.login(user);
  }
}
