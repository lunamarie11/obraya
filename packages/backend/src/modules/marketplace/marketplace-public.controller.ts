import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MarketplacePublicService } from './marketplace-public.service';
import { PublicProductQueryDto } from './dto/public-product-query.dto';
import { PublicProductDetailQueryDto } from './dto/public-product-detail-query.dto';
import { PublicReviewQueryDto } from './dto/public-review-query.dto';
import { ShippingQuoteQueryDto } from './dto/shipping-quote-query.dto';

// Sin JwtAuthGuard/RolesGuard a propósito: es el único punto de acceso
// anónimo al catálogo, para que el comprador pueda navegar sin login.
// Ver docs/adrs/ADR-003-endpoint-publico-marketplace.md.

@ApiTags('marketplace-public')
@Controller('public')
export class MarketplacePublicController {
  constructor(private readonly marketplaceService: MarketplacePublicService) {}

  @Get('companies')
  @ApiOperation({ summary: 'Listar empresas activas (directorio público de fabricantes)' })
  async findCompanies() {
    return this.marketplaceService.findActiveCompanies();
  }

  @Get('companies/:id')
  @ApiOperation({ summary: 'Detalle público de una empresa activa' })
  async findCompany(@Param('id', ParseUUIDPipe) id: string) {
    return this.marketplaceService.findActiveCompany(id);
  }

  @Get('companies/:id/products')
  @ApiOperation({ summary: 'Catálogo público de productos de una empresa' })
  async findCompanyProducts(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PublicProductQueryDto,
  ) {
    return this.marketplaceService.findCompanyProducts(id, query);
  }

  @Get('companies/:id/reviews')
  @ApiOperation({ summary: 'Reseñas públicas de una empresa' })
  async findCompanyReviews(@Param('id', ParseUUIDPipe) id: string, @Query() query: PublicReviewQueryDto) {
    return this.marketplaceService.findCompanyReviews(id, query);
  }

  @Get('companies/:id/shipping-quote')
  @ApiOperation({ summary: 'Cotizar envío de una empresa para un código postal (ver ADR-012)' })
  async getShippingQuote(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ShippingQuoteQueryDto,
  ) {
    return this.marketplaceService.getShippingQuote(id, query.postalCode);
  }

  @Get('promotions')
  @ApiOperation({ summary: 'Productos con descuento programado activo ahora (banners dinámicos del home)' })
  async findActivePromotions() {
    return this.marketplaceService.findActivePromotions();
  }

  @Get('products')
  @ApiOperation({ summary: 'Buscar/listar productos públicos cruzando todas las empresas activas' })
  async findAllProducts(@Query() query: PublicProductQueryDto) {
    return this.marketplaceService.findAllProducts(query);
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Detalle público de un producto (precio resuelto por variante/cantidad)' })
  async findProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PublicProductDetailQueryDto,
  ) {
    return this.marketplaceService.findPublicProduct(id, {
      variantId: query.variantId,
      quantity: query.quantity,
    });
  }
}
