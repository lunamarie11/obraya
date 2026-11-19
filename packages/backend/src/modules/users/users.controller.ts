import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateDeliveryZonesDto } from './dto/update-delivery-zones.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from './entities/company-user.entity';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // SEGURIDAD (19/11/2026): ninguna ruta /companies/:id verificaba que la
  // empresa fuera la del usuario logueado. Un Admin de otra empresa podía ver
  // sus datos bancarios, cambiarle el CBU o invitarse como Admin. Solo
  // SuperAdmin (ObraYa) puede operar sobre cualquier empresa.
  private assertOwnCompany(user: any, id: string) {
    if (user?.role === UserRole.SUPER_ADMIN) return;
    if (!user?.companyId || user.companyId !== id) {
      throw new ForbiddenException('No tenés acceso a esta empresa');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de empresa' })
  async getCompany(@Param('id') id: string, @CurrentUser() user: any) {
    this.assertOwnCompany(user, id);
    return this.usersService.findCompanyById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar datos de perfil y bancarios de la empresa (solo Admin)' })
  @Roles(UserRole.ADMIN)
  async updateCompany(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
    @CurrentUser() user: any,
  ) {
    this.assertOwnCompany(user, id);
    return this.usersService.updateCompanyProfile(id, dto);
  }

  @Put(':id/delivery-zones')
  @ApiOperation({ summary: 'Actualizar zonas de entrega (Admin o Logistica)' })
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  async updateDeliveryZones(
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryZonesDto,
    @CurrentUser() user: any,
  ) {
    this.assertOwnCompany(user, id);
    return this.usersService.updateDeliveryZones(id, dto.deliveryZones);
  }

  @Get(':id/users')
  @ApiOperation({ summary: 'Listar usuarios de la empresa' })
  @Roles(UserRole.ADMIN)
  async getCompanyUsers(@Param('id') id: string, @CurrentUser() currentUser: any) {
    this.assertOwnCompany(currentUser, id);
    return this.usersService.getCompanyUsers(id);
  }

  @Post(':id/users/invite')
  @ApiOperation({ summary: 'Invitar usuario a la empresa' })
  @Roles(UserRole.ADMIN)
  @ApiResponse({ status: 201, description: 'Invitación enviada' })
  async inviteUser(@Param('id') id: string, @Body() dto: InviteUserDto, @CurrentUser() currentUser: any) {
    this.assertOwnCompany(currentUser, id);
    const user = await this.usersService.inviteUser(id, dto);
    return {
      message: `Invitación enviada a ${dto.email}`,
      userId: user.id,
      inviteToken: user.inviteToken, // En v2 se envía por email, no se retorna en response
    };
  }

  @Post('accept-invite')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aceptar invitación y configurar contraseña' })
  async acceptInvite(
    @Body('token') token: string,
    @Body('password') password: string,
  ) {
    const user = await this.usersService.acceptInvite(token, password);
    return { message: 'Invitación aceptada. Ya podés iniciar sesión.', userId: user.id };
  }
}
