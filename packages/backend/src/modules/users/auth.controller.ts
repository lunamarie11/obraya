import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterCompanyDto } from './dto/register-company.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
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
}
