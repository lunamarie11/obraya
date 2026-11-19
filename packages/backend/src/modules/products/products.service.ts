import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { StorageService } from './storage.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { SearchService, ProductSearchDoc } from '../search/search.service';
import { parseSpreadsheet } from '../../common/utils/spreadsheet-parser';
import { PricesService } from '../prices/prices.service';
import { PriceType } from '../prices/entities/price.entity';
import { StockService } from '../stock/stock.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    private readonly storageService: StorageService,
    private readonly searchService: SearchService,
    private readonly pricesService: PricesService,
    private readonly stockService: StockService,
  ) {}

  private toSearchDoc(product: Product): ProductSearchDoc {
    return {
      id: product.id,
      companyId: product.companyId,
      name: product.name,
      brand: product.brand ?? '',
      description: product.description ?? '',
      category: product.category ?? '',
      subcategory: product.subcategory ?? '',
      isActive: product.isActive,
      createdAt: product.createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  // Reindexado masivo (ver ADR-007, riesgo pendiente): si Elasticsearch se levanta
  // despues de tener productos ya cargados en Postgres, esos productos no aparecen
  // en la busqueda hasta que se editen (unico hook de indexado era create()/update()).
  // Pensado para uso operativo desde el panel de super-admin (ver AdminController),
  // no expuesto a fabricantes. En batches para no cargar toda la tabla en memoria.
  async reindexAll(): Promise<{ indexed: number }> {
    if (!this.searchService.isAvailable()) return { indexed: 0 };

    const BATCH_SIZE = 500;
    let indexed = 0;
    let skip = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const products = await this.productRepo.find({
        skip,
        take: BATCH_SIZE,
        order: { id: 'ASC' },
      });
      if (products.length === 0) break;

      await this.searchService.bulkIndex(products.map((p) => this.toSearchDoc(p)));
      indexed += products.length;
      skip += BATCH_SIZE;

      if (products.length < BATCH_SIZE) break;
    }

    return { indexed };
  }

  async findAll(companyId: string, query: ProductQueryDto) {
    const where: FindOptionsWhere<Product> = { companyId };

    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.category) where.category = query.category;
    if (query.brand) where.brand = query.brand;

    // Bug #1 (QA 18/11): Like distingue mayúsculas, "yeso" no encontraba
    // "Yeso" ni "yes1" a "YES1". ILike + trim.
    const search = query.search?.trim();
    const [products, total] = await this.productRepo.findAndCount({
      where: search
        ? [
            { ...where, name: ILike(`%${search}%`) },
            { ...where, sku: ILike(`%${search}%`) },
          ]
        : where,
      relations: ['variants'],
      skip: ((query.page ?? 1) - 1) * (query.limit ?? 20),
      take: query.limit ?? 20,
      order: { createdAt: 'DESC' },
    });

    return {
      data: products,
      total,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      totalPages: Math.ceil(total / (query.limit ?? 20)),
    };
  }

  async findOne(id: string, companyId: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id, companyId },
      relations: ['variants'],
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async create(companyId: string, dto: CreateProductDto): Promise<Product> {
    const product = this.productRepo.create({
      ...dto,
      companyId,
      variants: dto.variants?.map((v) => this.variantRepo.create(v)) || [],
    });
    const saved = await this.productRepo.save(product);
    await this.searchService.indexProduct(this.toSearchDoc(saved));
    return saved;
  }

  async update(id: string, companyId: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id, companyId);

    // Si hay variantes en el update, reemplazar
    if (dto.variants !== undefined) {
      await this.variantRepo.delete({ productId: id });
      product.variants = dto.variants.map((v) => this.variantRepo.create({ ...v, productId: id }));
    }

    Object.assign(product, dto);
    const saved = await this.productRepo.save(product);
    await this.searchService.indexProduct(this.toSearchDoc(saved));
    return saved;
  }

  async remove(id: string, companyId: string): Promise<void> {
    const product = await this.findOne(id, companyId);
    // Soft delete: marcar como inactivo en lugar de borrar (mantiene historial de pedidos)
    product.isActive = false;
    await this.productRepo.save(product);
    await this.searchService.deleteProduct(id);
  }

  async uploadImage(
    id: string,
    companyId: string,
    file: Express.Multer.File,
  ): Promise<Product> {
    const product = await this.findOne(id, companyId);

    if ((product.images?.length || 0) >= 10) {
      throw new BadRequestException('Un producto puede tener máximo 10 imágenes');
    }

    const url = await this.storageService.uploadProductImage(companyId, id, file);
    product.images = [...(product.images || []), url];
    return this.productRepo.save(product);
  }

  async uploadTechnicalSheet(
    id: string,
    companyId: string,
    file: Express.Multer.File,
  ): Promise<Product> {
    const product = await this.findOne(id, companyId);
    const url = await this.storageService.uploadTechnicalSheet(companyId, id, file);
    product.technicalSheetUrl = url;
    return this.productRepo.save(product);
  }

  // Convierte un string de precio en ARS (admite "1234.56" o "1234,56") a
  // centavos (int). Devuelve null si el valor esta vacio o no es numerico.
  private parsePriceToCents(raw: string): number | null {
    const value = raw.trim();
    if (!value) return null;
    const normalized = value.replace(/\./g, '').replace(',', '.');
    const parsed = Number(normalized.includes('.') ? normalized : value);
    if (isNaN(parsed) || parsed < 0) return null;
    return Math.round(parsed * 100);
  }

  // Import masivo de productos (CSV o Excel). Ademas de los datos del
  // producto, si el archivo trae columnas "price" y/o "stock"/"quantity"
  // carga tambien el precio B2C y el stock inicial en el mismo paso, para
  // que un comercio pueda subir todo su catalogo (productos + precios +
  // stock) de una sola vez (ver pedido de soporte: carga masiva de stock).
  async importFromFile(
    companyId: string,
    fileBuffer: Buffer,
    originalName: string,
    userId: string,
  ): Promise<{
    created: number;
    updated: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    const rows = await parseSpreadsheet(fileBuffer, originalName);

    const results = { created: 0, updated: 0, errors: [] as Array<{ row: number; error: string }> };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 porque row 1 es el header

      try {
        if (!row.name) {
          results.errors.push({ row: rowNum, error: 'Campo "name" requerido' });
          continue;
        }

        // Buscar por SKU si viene en el archivo
        const existing = row.sku
          ? await this.productRepo.findOne({ where: { sku: row.sku, companyId } })
          : null;

        let product: Product;
        if (existing) {
          await this.productRepo.update(existing.id, {
            name: row.name,
            description: row.description || existing.description,
            category: row.category || existing.category,
            brand: row.brand || existing.brand,
            unitOfMeasure: row.unit_of_measure || existing.unitOfMeasure,
          });
          product = existing;
          results.updated++;
        } else {
          product = await this.productRepo.save(
            this.productRepo.create({
              companyId,
              name: row.name,
              sku: row.sku || undefined,
              description: row.description || undefined,
              category: row.category || undefined,
              subcategory: row.subcategory || undefined,
              brand: row.brand || undefined,
              unitOfMeasure: row.unit_of_measure || undefined,
            }),
          );
          results.created++;
        }

        // Precio (columna "price", en ARS): opcional, setea precio B2C
        if (row.price) {
          const basePrice = this.parsePriceToCents(row.price);
          if (basePrice === null) {
            results.errors.push({ row: rowNum, error: 'Columna "price" inválida' });
          } else {
            await this.pricesService.setPrice(
              product.id,
              companyId,
              { type: PriceType.B2C, basePrice, reason: 'Importación masiva' },
              userId,
            );
          }
        }

        // Stock (columna "stock" o "quantity"): opcional, setea stock inicial
        const stockRaw = row.stock || row.quantity;
        if (stockRaw) {
          const quantity = parseInt(stockRaw, 10);
          if (isNaN(quantity) || quantity < 0) {
            results.errors.push({ row: rowNum, error: 'Columna "stock" inválida' });
          } else {
            await this.stockService.updateStock(
              product.id,
              companyId,
              { quantity, notes: 'Importación masiva' },
              userId,
            );
          }
        }
      } catch (err) {
        results.errors.push({ row: rowNum, error: err.message });
      }
    }

    return results;
  }
}
