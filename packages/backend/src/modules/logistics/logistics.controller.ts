import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LogisticsService } from './logistics.service';
import { UpdateLocationDto } from './dto/update-location.dto';
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
  constructor(private readonly logisticsService: LogisticsService) {}

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
}
