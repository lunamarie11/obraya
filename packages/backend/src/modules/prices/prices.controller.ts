import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PricesService } from './prices.service';
import { SetPriceDto } from './dto/set-price.dto';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { RolesGuard } from '../users/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/company-user.entity';
import { PriceType } from './entities/price.entity';

@ApiTags('prices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products/:productId/prices')
export class PricesController {
  constructor(private readonly pricesService: PricesService) {}

  @Get()
  @ApiOperation({ summary: 'Ver precios de un producto (B2C y B2B)' })
  async findByProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @CurrentUser() user: any,
  ) {
    return this.pricesService.findByProduct(productId, user.companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear o actualizar precio (B2C o B2B)' })
  @Roles(UserRole.ADMIN, UserRole.VENDEDOR)
  async setPrice(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: SetPriceDto,
    @CurrentUser() user: any,
  ) {
    return this.pricesService.setPrice(productId, user.companyId, dto, user.id);
  }

  @Get('resolve')
  @ApiOperation({ summary: 'Calcular precio final para una cantidad dada (aplica descuentos)' })
  @ApiQuery({ name: 'type', enum: PriceType })
  @ApiQuery({ name: 'quantity', required: false, type: Number })
  async resolve(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query('type') type: PriceType,
    @Query('quantity') quantity = 1,
    @Query('variantId') variantId?: string,
  ) {
    return this.pricesService.resolve(productId, type, Number(quantity), variantId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Historial de cambios de precio' })
  async getHistory(
    @Param('productId', ParseUUIDPipe) productId: string,
    @CurrentUser() user: any,
  ) {
    return this.pricesService.getHistory(productId, user.companyId);
  }
}
