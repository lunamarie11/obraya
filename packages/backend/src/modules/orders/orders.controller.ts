import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { RolesGuard } from '../users/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/company-user.entity';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar pedidos con filtros' })
  async findAll(@CurrentUser() user: any, @Query() query: OrderQueryDto) {
    return this.ordersService.findAll(user.companyId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de pedido con items y mensajes' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.ordersService.findOne(id, user.companyId);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Cambiar estado del pedido (valida transiciones)' })
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA, UserRole.VENDEDOR)
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.updateStatus(
      id,
      user.companyId,
      dto,
      user.id,
      `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
    );
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Enviar mensaje al comprador' })
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA, UserRole.VENDEDOR)
  async sendMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.sendMessage(
      id,
      user.companyId,
      dto,
      user.id,
      `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
    );
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Ver historial de mensajes del pedido' })
  async getMessages(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    const order = await this.ordersService.findOne(id, user.companyId);
    return order.messages;
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo pedido' })
  async create(@Body() dto: CreateOrderDto, @CurrentUser() user: any) {
    return this.ordersService.create(user.companyId, user.id, dto);
  }
}
