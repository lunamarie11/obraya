import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Company, CompanyStatus, resolveDeliveryZone } from '../users/entities/company.entity';
import { Product } from '../products/entities/product.entity';
import { Stock } from '../stock/entities/stock.entity';
import { PricesService } from '../prices/prices.service';
import { Price, PriceType } from '../prices/entities/price.entity';
import { PublicProductQueryDto } from './dto/public-product-query.dto';
import { SearchService } from '../search/search.service';
import { ReviewsService, ReviewAggregate } from '../reviews/reviews.service';

// Endpoint de solo lectura, sin JWT (ver docs/adrs/ADR-003-endpoint-publico-marketplace.md).
// El rating (averageRating/reviewCount) es un dato real desde ADR-008: se agrega
// en batch desde ReviewsService. El ETA de entrega (min/maxPromisedHours) es un
// dato real desde ADR-012: agregado (min/max) de Company.deliveryZones, ya que
// en este listado no hay un código postal de comprador para resolver una zona
// puntual (eso sigue siendo el endpoint /shipping-quote).

@Injectable()
export class MarketplacePublicService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Stock)
    private readonly stockRepo: Repository<Stock>,
    @InjectRepository(Price)
    private readonly priceRepo: Repository<Price>,
    private readonly pricesService: PricesService,
    private readonly searchService: SearchService,
    private readonly reviewsService: ReviewsService,
  ) {}

  private toPublicCompany(company: Company, aggregate?: ReviewAggregate) {
    const promisedHours = (company.deliveryZones ?? [])
      .map((zone) => zone.promisedHours)
      .filter((hours) => Number.isFinite(hours));

    return {
      id: company.id,
      razonSocial: company.razonSocial,
      logoUrl: company.logoUrl,
      city: company.city,
      province: company.province,
      coverageZones: company.coverageZones,
      averageRating: aggregate?.averageRating ?? 0,
      reviewCount: aggregate?.reviewCount ?? 0,
      minPromisedHours: promisedHours.length ? Math.min(...promisedHours) : undefined,
      maxPromisedHours: promisedHours.length ? Math.max(...promisedHours) : undefined,
    };
  }

  async findActiveCompanies() {
    const companies = await this.companyRepo.find({
      where: { status: CompanyStatus.ACTIVE },
      order: { razonSocial: 'ASC' },
    });
    const aggregates = await this.reviewsService.getAggregatesForCompanies(companies.map((c) => c.id));
    return companies.map((c) => this.toPublicCompany(c, aggregates.get(c.id)));
  }

  async findActiveCompany(id: string) {
    const company = await this.companyRepo.findOne({
      where: { id, status: CompanyStatus.ACTIVE },
    });
    if (!company) throw new NotFoundException('Empresa no encontrada');
    const aggregate = await this.reviewsService.getAggregateForCompany(id);
    return this.toPublicCompany(company, aggregate);
  }

  async findCompanyReviews(id: string, opts?: { page?: number; limit?: number }) {
    await this.findActiveCompany(id);
    return this.reviewsService.findByCompany(id, opts);
  }

  // Cotización de envío (ver ADR-012). Solo lectura: el checkout vuelve a
  // resolver esto server-side en OrdersService.create para no confiar en lo
  // que mande el cliente. Devuelve available:false si la empresa no
  // configuró zonas o el código postal no matchea ninguna (no bloquea).
  async getShippingQuote(companyId: string, postalCode: string) {
    const company = await this.companyRepo.findOne({
      where: { id: companyId, status: CompanyStatus.ACTIVE },
    });
    if (!company) throw new NotFoundException('Empresa no encontrada');

    const zone = resolveDeliveryZone(company.deliveryZones, postalCode);
    if (!zone) return { available: false as const };

    return {
      available: true as const,
      zoneName: zone.name,
      promisedHours: zone.promisedHours,
      fleetType: zone.fleetType,
      shippingCost: zone.shippingCost,
    };
  }

  // Banners dinámicos del home (backlog #5 marketplace-comprador.md): en vez de
  // crear una entidad/CMS de banners, se reutiliza el `scheduledDiscount` que ya
  // existe en Price (usado para resolver el precio final, ver PricesService.resolve).
  // Un producto "está en promo" si tiene un scheduledDiscount cuyo rango de fechas
  // incluye "ahora". Evita inventar datos falsos: si nadie programó un descuento,
  // no hay banners reales que mostrar (el frontend cae a contenido genérico).
  async findActivePromotions(limit = 6) {
    const now = new Date();
    const prices = await this.priceRepo
      .createQueryBuilder('price')
      .innerJoinAndSelect('price.product', 'product')
      .innerJoin('product.company', 'company')
      .addSelect(['company.id', 'company.razonSocial'])
      .where('price.isActive = true')
      .andWhere('price.type = :type', { type: PriceType.B2C })
      .andWhere('price.scheduledDiscount IS NOT NULL')
      .andWhere('product.isActive = true')
      .andWhere('company.status = :status', { status: CompanyStatus.ACTIVE })
      .andWhere("(price.scheduledDiscount->>'startDate')::timestamptz <= :now", { now })
      .andWhere("(price.scheduledDiscount->>'endDate')::timestamptz >= :now", { now })
      .orderBy('price.updatedAt', 'DESC')
      .take(limit)
      .getMany();

    return prices.map((price) => ({
      productId: price.productId,
      productName: price.product.name,
      image: price.product.images?.[0],
      companyId: price.product.companyId,
      companyName: price.product.company?.razonSocial,
      label: price.scheduledDiscount?.label,
      discountPercent: price.scheduledDiscount?.discountPercent ?? 0,
      basePrice: price.basePrice,
      finalPrice: Math.round(price.basePrice * (1 - (price.scheduledDiscount?.discountPercent ?? 0) / 100)),
    }));
  }

  private async attachPrice(
    product: Product,
    companyName?: string,
    opts?: { variantId?: string; quantity?: number },
  ) {
    const resolved = await this.pricesService.resolve(
      product.id,
      PriceType.B2C,
      opts?.quantity ?? 1,
      opts?.variantId,
    );
    return {
      id: product.id,
      companyId: product.companyId,
      companyName,
      name: product.name,
      category: product.category,
      images: product.images,
      price: resolved
        ? {
            basePrice: resolved.basePrice,
            finalPrice: resolved.finalPrice,
            discountPercent: resolved.discountPercent,
          }
        : undefined,
    };
  }

  async findCompanyProducts(companyId: string, query: PublicProductQueryDto) {
    const company = await this.findActiveCompany(companyId);

    const where: any = { companyId, isActive: true };
    if (query.category) where.category = query.category;

    const [products, total] = await this.productRepo.findAndCount({
      where: query.search
        ? [
            { ...where, name: Like(`%${query.search}%`) },
            { ...where, sku: Like(`%${query.search}%`) },
          ]
        : where,
      relations: ['variants'],
      skip: ((query.page ?? 1) - 1) * (query.limit ?? 20),
      take: query.limit ?? 20,
      order: { createdAt: 'DESC' },
    });

    return {
      data: await Promise.all(products.map((p) => this.attachPrice(p, company.razonSocial))),
      total,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      totalPages: Math.ceil(total / (query.limit ?? 20)),
    };
  }

  // Búsqueda/listado cruzando todas las empresas activas (equivalente al "buscar
  // en todos los fabricantes" de Rappi). A diferencia de findCompanyProducts,
  // acá se necesita el join con Company para filtrar por status = ACTIVE.
  async findAllProducts(query: PublicProductQueryDto) {
    // Ver ADR-007: si Elasticsearch está disponible y hay término de búsqueda,
    // se usa para relevancia/full-text; la verificación de empresa activa y el
    // precio final siempre se resuelven contra Postgres (fuente de verdad).
    if (query.search && this.searchService.isAvailable()) {
      return this.findAllProductsViaSearch(query);
    }
    return this.findAllProductsViaPostgres(query);
  }

  private async findAllProductsViaSearch(query: PublicProductQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const { ids, total } = await this.searchService.search({
      q: query.search,
      category: query.category,
      from: (page - 1) * limit,
      size: limit,
    });

    if (ids.length === 0) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    const products = await this.productRepo
      .createQueryBuilder('product')
      .innerJoinAndSelect('product.company', 'company')
      .leftJoinAndSelect('product.variants', 'variants')
      .where('product.id IN (:...ids)', { ids })
      .andWhere('company.status = :status', { status: CompanyStatus.ACTIVE })
      .getMany();

    // Preservar el orden de relevancia devuelto por Elasticsearch
    const byId = new Map(products.map((p) => [p.id, p]));
    const ordered = ids.map((id) => byId.get(id)).filter((p): p is Product => !!p);

    return {
      data: await Promise.all(ordered.map((p) => this.attachPrice(p, p.company?.razonSocial))),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async findAllProductsViaPostgres(query: PublicProductQueryDto) {
    const qb = this.productRepo
      .createQueryBuilder('product')
      .innerJoinAndSelect('product.company', 'company')
      .leftJoinAndSelect('product.variants', 'variants')
      .where('product.isActive = true')
      .andWhere('company.status = :status', { status: CompanyStatus.ACTIVE });

    if (query.category) qb.andWhere('product.category = :category', { category: query.category });
    if (query.search) {
      qb.andWhere('(product.name ILIKE :search OR product.sku ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const [products, total] = await qb
      .orderBy('product.createdAt', 'DESC')
      .skip(((query.page ?? 1) - 1) * (query.limit ?? 20))
      .take(query.limit ?? 20)
      .getManyAndCount();

    return {
      data: await Promise.all(products.map((p) => this.attachPrice(p, p.company?.razonSocial))),
      total,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      totalPages: Math.ceil(total / (query.limit ?? 20)),
    };
  }

  // GET /stock/:productId (módulo Stock) scopea por companyId del JWT — pensado
  // para que cada empresa vea solo su propio inventario. Reutilizarlo tal cual
  // desde el detalle público rompía el flujo de compra: un usuario logueado
  // (staff de OTRA empresa) veía "sin stock" en cualquier producto ajeno,
  // aunque sí tuviera stock real. Acá se agrega la única suma que hace falta
  // (sin exponer depósitos/alertas internas) para que funcione igual logueado
  // o anónimo.
  private async getAvailableStock(productId: string, variantId?: string): Promise<number> {
    const where: any = { productId };
    if (variantId) where.variantId = variantId;
    const rows = await this.stockRepo.find({ where });
    return rows.reduce((sum, s) => sum + Math.max(0, s.quantity - s.reservedQuantity), 0);
  }

  async findPublicProduct(id: string, opts?: { variantId?: string; quantity?: number }) {
    const product = await this.productRepo.findOne({
      where: { id, isActive: true },
      relations: ['variants', 'company'],
    });
    if (!product || product.company?.status !== CompanyStatus.ACTIVE) {
      throw new NotFoundException('Producto no encontrado');
    }
    const companyName = product.company?.razonSocial;
    const { company, ...rest } = product;
    return {
      ...(await this.attachPrice(rest as Product, companyName, opts)),
      variants: product.variants,
      availableStock: await this.getAvailableStock(id, opts?.variantId),
    };
  }
}
