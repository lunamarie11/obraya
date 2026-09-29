import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

const INDEX = 'obraya_products';

export interface ProductSearchDoc {
  id: string;
  companyId: string;
  name: string;
  brand: string;
  description: string;
  category: string;
  subcategory: string;
  isActive: boolean;
  createdAt: string;
}

export interface SearchFilters {
  q?: string;
  category?: string;
  companyId?: string;
  from?: number;
  size?: number;
}

// Ver ADR-007: búsqueda full-text del marketplace público con Elasticsearch.
// Solo se indexan campos de texto/relevancia (nombre, marca, categoría);
// precio/stock siguen resolviéndose en Postgres vía PricesService/StockService
// (dependen de tipo de precio, cantidad y reservas — no son estáticos por producto).
// Si Elasticsearch no está disponible, MarketplacePublicService cae a búsqueda
// ILIKE sobre Postgres (ver isAvailable()).
@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private available = false;

  constructor(private readonly es: ElasticsearchService) {}

  async onModuleInit() {
    try {
      await this.es.ping();
      await this.ensureIndex();
      this.available = true;
      this.logger.log('Elasticsearch conectado');
    } catch {
      this.logger.warn('Elasticsearch no disponible — usando búsqueda Postgres como fallback');
    }
  }

  isAvailable(): boolean {
    return this.available;
  }

  private async ensureIndex() {
    const exists = await this.es.indices.exists({ index: INDEX });
    if (exists) return;

    await this.es.indices.create({
      index: INDEX,
      mappings: {
        properties: {
          id:           { type: 'keyword' },
          companyId:    { type: 'keyword' },
          name:         { type: 'text', analyzer: 'spanish', fields: { keyword: { type: 'keyword' } } },
          brand:        { type: 'text', analyzer: 'spanish', fields: { keyword: { type: 'keyword' } } },
          description:  { type: 'text', analyzer: 'spanish' },
          category:     { type: 'keyword' },
          subcategory:  { type: 'keyword' },
          isActive:     { type: 'boolean' },
          createdAt:    { type: 'date' },
        },
      },
      settings: { number_of_shards: 1, number_of_replicas: 0 },
    });
    this.logger.log(`Índice ${INDEX} creado`);
  }

  async indexProduct(doc: ProductSearchDoc): Promise<void> {
    if (!this.available) return;
    try {
      await this.es.index({ index: INDEX, id: doc.id, document: doc });
    } catch (err) {
      this.logger.warn(`Error indexando producto ${doc.id}: ${(err as Error).message}`);
    }
  }

  async deleteProduct(id: string): Promise<void> {
    if (!this.available) return;
    try {
      await this.es.delete({ index: INDEX, id });
    } catch {
      // El producto puede no estar indexado todavía — no es un error real.
    }
  }

  async bulkIndex(docs: ProductSearchDoc[]): Promise<void> {
    if (!this.available || docs.length === 0) return;
    const operations = docs.flatMap((doc) => [{ index: { _index: INDEX, _id: doc.id } }, doc]);
    const result = await this.es.bulk({ operations, refresh: true });
    this.logger.log(`Bulk index: ${docs.length} productos, errores: ${result.errors}`);
  }

  // Devuelve solo IDs ordenados por relevancia — la verificación de empresa
  // activa y el precio final se resuelven en Postgres (fuente de verdad).
  async search(filters: SearchFilters): Promise<{ ids: string[]; total: number }> {
    const { q, category, companyId, from = 0, size = 50 } = filters;

    const must: any[] = [{ term: { isActive: true } }];
    const filter: any[] = [];

    if (q) {
      must.push({
        multi_match: {
          query: q,
          fields: ['name^3', 'brand^2', 'category^1.5', 'description'],
          fuzziness: 'AUTO',
          operator: 'or',
        },
      });
    }

    if (category) filter.push({ term: { category } });
    if (companyId) filter.push({ term: { companyId } });

    const sort: any[] = [{ _score: 'desc' }, { createdAt: 'desc' }];

    const response = await this.es.search<ProductSearchDoc>({
      index: INDEX,
      from,
      size,
      sort,
      query: { bool: { must, filter } },
    });

    const ids = response.hits.hits.map((h) => h._id as string);
    const total = typeof response.hits.total === 'number'
      ? response.hits.total
      : (response.hits.total?.value ?? 0);

    return { ids, total };
  }
}
