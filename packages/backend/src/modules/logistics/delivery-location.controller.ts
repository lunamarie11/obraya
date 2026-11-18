import { Body, Controller, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LogisticsService } from './logistics.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { DeliveryJwtAuthGuard } from '../delivery/guards/delivery-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

// Espejo de "PUT /logistics/location" (ADR-018) pero para la identidad
// Delivery independiente (ADR-026), que no tiene rol de CompanyUser y por
// lo tanto no puede pasar por JwtAuthGuard/RolesGuard. Se mantiene bajo el
// prefijo "delivery-orders" (igual que DeliveryOrdersController) para que
// todo lo que consume el delivery independiente quede agrupado. Ver
// ADR-027 / docs/specs/fase4e-tracking-google-maps.md.
@ApiTags('delivery-orders')
@ApiBearerAuth()
@UseGuards(DeliveryJwtAuthGuard)
@Controller('delivery-orders')
export class DeliveryLocationController {
  constructor(private readonly logisticsService: LogisticsService) {}

  @Put('location')
  @ApiOperation({ summary: 'Reportar la posicion actual del delivery independiente autenticado' })
  async updateLocation(@Body() dto: UpdateLocationDto, @CurrentUser() delivery: any) {
    await this.logisticsService.upsertDeliveryLocation(delivery.id, dto);
    return { ok: true };
  }
}
