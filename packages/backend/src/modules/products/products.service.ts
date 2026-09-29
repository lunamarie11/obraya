import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { parse as csvParse } from 'csv-parse/sync';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { StorageService } from './storage.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { SearchService, ProductSearchDoc } from '../search/search.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    private readonly storageService: StorageService,
    private readonly searchService: SearchService,
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

  async importFromCsv(companyId: string, fileBuffer: Buffer): Promise<{
    created: number;
    updated: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    let rows: Record<string, string>[];
    try {
      rows = csvParse(fileBuffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch {
      throw new BadRequestException('El archivo CSV tiene formato inválido');
    }

    const results = { created: 0, updated: 0, errors: [] as Array<{ row: number; error: string }> };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 porque row 1 es el header

      try {
        if (!row.name) {
          results.errors.push({ row: rowNum, error: 'Campo "name" requerido' });
          continue;
        }

        // Buscar por SKU si viene en el CSV
        const existing = row.sku
          ? await this.productRepo.findOne({ where: { sku: row.sku, companyId } })
          : null;

        if (existing) {
          await this.productRepo.update(existing.id, {
            name: row.name,
            description: row.description || existing.description,
            category: row.category || existing.category,
            brand: row.brand || existing.brand,
            unitOfMeasure: row.unit_of_measure || existing.unitOfMeasure,
          });
          results.updated++;
        } else {
          await this.productRepo.save(
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
      } catch (err) {
        results.errors.push({ row: rowNum, error: err.message });
      }
    }

    return results;
  }
}
