import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BuyerAddressesService } from './buyer-addresses.service';
import { CreateBuyerAddressDto } from './dto/create-buyer-address.dto';
import { UpdateBuyerAddressDto } from './dto/update-buyer-address.dto';
import { BuyerJwtAuthGuard } from './guards/buyer-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

// Libreta de direcciones del comprador — ver docs/specs/marketplace-comprador.md
// (backlog #3) y ADR-006 (entidad Buyer). Todas las rutas scopeadas por el
// buyerId del JWT, nunca se accede a direcciones de otro comprador.
@ApiTags('buyer-addresses')
@ApiBearerAuth()
@UseGuards(BuyerJwtAuthGuard)
@Controller('buyer-addresses')
export class BuyerAddressesController {
  constructor(private readonly addressesService: BuyerAddressesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar direcciones guardadas del comprador logueado' })
  async findAll(@CurrentUser() buyer: any) {
    return this.addressesService.findAll(buyer.id);
  }

  @Post()
  @ApiOperation({ summary: 'Guardar una nueva dirección' })
  async create(@Body() dto: CreateBuyerAddressDto, @CurrentUser() buyer: any) {
    return this.addressesService.create(buyer.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar una dirección propia' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBuyerAddressDto,
    @CurrentUser() buyer: any,
  ) {
    return this.addressesService.update(id, buyer.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una dirección propia' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() buyer: any) {
    await this.addressesService.remove(id, buyer.id);
    return { success: true };
  }
}
