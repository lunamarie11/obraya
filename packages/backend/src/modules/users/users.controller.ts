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

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de empresa' })
  async getCompany(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.findCompanyById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar datos de perfil y bancarios de la empresa (solo Admin)' })
  @Roles(UserRole.ADMIN)
  async updateCompany(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.usersService.updateCompanyProfile(id, dto);
  }

  @Put(':id/delivery-zones')
  @ApiOperation({ summary: 'Actualizar zonas de entrega (Admin o Logistica)' })
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  async updateDeliveryZones(
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryZonesDto,
  ) {
    return this.usersService.updateDeliveryZones(id, dto.deliveryZones);
  }

  @Get(':id/users')
  @ApiOperation({ summary: 'Listar usuarios de la empresa' })
  @Roles(UserRole.ADMIN)
  async getCompanyUsers(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.usersService.getCompanyUsers(id);
  }

  @Post(':id/users/invite')
  @ApiOperation({ summary: 'Invitar usuario a la empresa' })
  @Roles(UserRole.ADMIN)
  @ApiResponse({ status: 201, description: 'Invitación enviada' })
  async inviteUser(@Param('id') id: string, @Body() dto: InviteUserDto) {
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
