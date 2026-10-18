import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LogisticsService } from './logistics.service';
import { DriversService } from './drivers.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UpdateDriverProfileDto } from './dto/update-driver-profile.dto';
import { UpdateDriverAvailabilityDto } from './dto/update-driver-availability.dto';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { RolesGuard } from '../users/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/company-user.entity';

@ApiTags('logistics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('logistics')
export class LogisticsController {
  constructor(
    private readonly logisticsService: LogisticsService,
    private readonly driversService: DriversService,
  ) {}

  @Put('location')
  @ApiOperation({ summary: 'Reportar la posicion actual del repartidor autenticado (ver ADR-018)' })
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  async updateLocation(@Body() dto: UpdateLocationDto, @CurrentUser() user: any) {
    await this.logisticsService.upsertLocation(user.id, user.companyId, dto);
    return { ok: true };
  }

  @Get('locations')
  @ApiOperation({ summary: 'Listar la ultima posicion de repartidores con pedido activo asignado' })
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  async getLocations(@CurrentUser() user: any) {
    return this.logisticsService.getActiveDriverLocations(user.companyId);
  }

  @Get('drivers/me')
  @ApiOperation({ summary: 'Ver el perfil de repartidor propio (ver fase4c-entidad-driver.md)' })
  @Roles(UserRole.LOGISTICA)
  async getMyProfile(@CurrentUser() user: any) {
    return this.driversService.getProfile(user.id);
  }

  @Put('drivers/me')
  @ApiOperation({ summary: 'Actualizar vehiculo/patente/telefono del repartidor propio' })
  @Roles(UserRole.LOGISTICA)
  async updateMyProfile(@Body() dto: UpdateDriverProfileDto, @CurrentUser() user: any) {
    return this.driversService.updateProfile(user.id, user.companyId, dto);
  }

  @Put('drivers/me/availability')
  @ApiOperation({ summary: 'Marcarse disponible/no disponible para recibir pedidos' })
  @Roles(UserRole.LOGISTICA)
  async updateMyAvailability(@Body() dto: UpdateDriverAvailabilityDto, @CurrentUser() user: any) {
    return this.driversService.setAvailability(user.id, user.companyId, dto.isAvailable);
  }

  @Get('drivers')
  @ApiOperation({ summary: 'Listar repartidores de la empresa con su perfil' })
  @Roles(UserRole.ADMIN)
  async listDrivers(@CurrentUser() user: any) {
    return this.driversService.listForCompany(user.companyId);
  }
}
