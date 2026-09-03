import { Controller, Get, Post, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
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
}
