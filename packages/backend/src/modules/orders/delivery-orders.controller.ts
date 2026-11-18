import { Controller, Get, Post, Put, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { DeliveryJwtAuthGuard } from '../delivery/guards/delivery-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

// Endpoints de pedidos del lado delivery independiente -- separados de
// OrdersController (backoffice del vendedor) y de la lógica de Driver interno
// (logistics/) para no tocar sus guards/rutas existentes. Ver ADR-026.
@ApiTags('delivery-orders')
@ApiBearerAuth()
@UseGuards(DeliveryJwtAuthGuard)
@Controller('delivery-orders')
export class DeliveryOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('available')
  @ApiOperation({ summary: 'Listar pedidos disponibles para reclamar (todo el marketplace)' })
  async findAvailable() {
    return this.ordersService.findAvailableForDelivery();
  }

  @Get('mine')
  @ApiOperation({ summary: 'Listar los pedidos reclamados por el delivery logueado' })
  async findMine(@CurrentUser() delivery: any) {
    return this.ordersService.findAllForDelivery(delivery.id);
  }

  @Post(':id/claim')
  @ApiOperation({ summary: 'Reclamar un pedido disponible' })
  async claim(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() delivery: any) {
    return this.ordersService.claimOrderForDelivery(id, delivery.id);
  }

  @Put(':id/unassign')
  @ApiOperation({ summary: 'Liberar un pedido reclamado' })
  async unassign(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() delivery: any) {
    return this.ordersService.unassignOrderForDelivery(id, delivery.id);
  }

  @Put(':id/delivered')
  @ApiOperation({ summary: 'Marcar un pedido propio como entregado' })
  async delivered(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() delivery: any) {
    const deliveryName = `${delivery.firstName ?? ''} ${delivery.lastName ?? ''}`.trim();
    return this.ordersService.markDeliveredByDelivery(id, delivery.id, deliveryName);
  }
}
