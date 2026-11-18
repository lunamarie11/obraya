import { Controller, Get, Post, Body, Param, UseGuards, ParseUUIDPipe, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { BuyerJwtAuthGuard } from '../buyers/guards/buyer-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

// Endpoints de pedidos del lado comprador — separados de OrdersController (backoffice
// del vendedor) para no tocar sus guards/rutas existentes. Ver ADR-006.
@ApiTags('buyer-orders')
@ApiBearerAuth()
@UseGuards(BuyerJwtAuthGuard)
@Controller('buyer-orders')
export class BuyerOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un pedido para el fabricante indicado (dto.companyId)' })
  async create(@Body() dto: CreateOrderDto, @CurrentUser() buyer: any) {
    return this.ordersService.createForBuyer(buyer.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar los pedidos del comprador logueado' })
  async findAll(@CurrentUser() buyer: any) {
    return this.ordersService.findAllForBuyer(buyer.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un pedido propio' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() buyer: any) {
    return this.ordersService.findOneForBuyer(id, buyer.id);
  }

  // Ver ADR-027 / fase4e-tracking-google-maps.md: 404 si el pedido todavia
  // no tiene tracking disponible (no esta Despachado, sin repartidor
  // asignado, o sin posicion reportada todavia) -- el frontend lo
  // interpreta como "mostrar solo el stepper, sin mapa".
  @Get(':id/tracking')
  @ApiOperation({ summary: 'Posicion en tiempo real del repartidor asignado + ruta (si esta disponible)' })
  async getTracking(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() buyer: any) {
    const tracking = await this.ordersService.getTrackingForBuyer(id, buyer.id);
    if (!tracking) throw new NotFoundException('Todavia no hay tracking disponible para este pedido');
    return tracking;
  }
}
