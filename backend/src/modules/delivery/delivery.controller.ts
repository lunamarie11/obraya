import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DeliveryService } from './delivery.service';
import type { RegisterDeliveryDto, UpdateDeliveryDto } from './delivery.service';

@Controller('delivery')
@UseGuards(JwtAuthGuard)
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post('register')
  register(@Body() dto: RegisterDeliveryDto, @Request() req) {
    return this.deliveryService.register({ ...dto, userId: req.user.id });
  }

  @Get('profile')
  getProfile(@Request() req) {
    return this.deliveryService.getProfile(req.user.id);
  }

  @Put('profile')
  updateProfile(@Body() dto: UpdateDeliveryDto, @Request() req) {
    return this.deliveryService.updateProfile(req.user.id, dto);
  }

  @Get('orders/available')
  getAvailableOrders() {
    return this.deliveryService.getAvailableOrders();
  }

  @Post('orders/:orderId/accept')
  acceptOrder(@Param('orderId') orderId: string, @Request() req) {
    return this.deliveryService.acceptOrder(req.user.deliveryId, orderId);
  }

  @Post('orders/:orderId/complete')
  completeOrder(@Param('orderId') orderId: string, @Body('tip') tip: number = 0) {
    return this.deliveryService.completeOrder(orderId, tip);
  }

  @Get('earnings')
  getEarnings(@Request() req) {
    return this.deliveryService.getEarnings(req.user.id);
  }
}
