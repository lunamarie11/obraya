import { Test, TestingModule } from '@nestjs/testing';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { SearchService, ProductSearchDoc } from '../search.service';

const mockEs = {
  ping: jest.fn(),
  indices: {
    exists: jest.fn(),
    create: jest.fn(),
  },
  index: jest.fn(),
  delete: jest.fn(),
  bulk: jest.fn(),
  search: jest.fn(),
};

function makeDoc(overrides: Partial<ProductSearchDoc> = {}): ProductSearchDoc {
  return {
    id: 'product-1',
    companyId: 'company-1',
    name: 'Cemento Portland',
    brand: 'Loma Negra',
    description: 'Bolsa 50kg',
    category: 'cemento',
    subcategory: 'portland',
    isActive: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

async function buildService(): Promise<SearchService> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [SearchService, { provide: ElasticsearchService, useValue: mockEs }],
  }).compile();
  return module.get(SearchService);
}

describe('SearchService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('queda disponible y crea el indice si no existe', async () => {
      mockEs.ping.mockResolvedValue(undefined);
      mockEs.indices.exists.mockResolvedValue(false);
      mockEs.indices.create.mockResolvedValue(undefined);

      const service = await buildService();
      await service.onModuleInit();

      expect(service.isAvailable()).toBe(true);
      expect(mockEs.indices.create).toHaveBeenCalledWith(
        expect.objectContaining({ index: 'obraya_products' }),
      );
    });

    it('no recrea el indice si ya existe', async () => {
      mockEs.ping.mockResolvedValue(undefined);
      mockEs.indices.exists.mockResolvedValue(true);

      const service = await buildService();
      await service.onModuleInit();

      expect(service.isAvailable()).toBe(true);
      expect(mockEs.indices.create).not.toHaveBeenCalled();
    });

    it('queda no disponible (fallback a Postgres) si Elasticsearch no responde', async () => {
      mockEs.ping.mockRejectedValue(new Error('connection refused'));

      const service = await buildService();
      await service.onModuleInit();

      expect(service.isAvailable()).toBe(false);
    });
  });

  describe('con Elasticsearch disponible', () => {
    let service: SearchService;

    beforeEach(async () => {
      mockEs.ping.mockResolvedValue(undefined);
      mockEs.indices.exists.mockResolvedValue(true);
      service = await buildService();
      await service.onModuleInit();
    });

    it('indexProduct indexa el documento', async () => {
      const doc = makeDoc();
      await service.indexProduct(doc);

      expect(mockEs.index).toHaveBeenCalledWith({ index: 'obraya_products', id: doc.id, document: doc });
    });

    it('indexProduct no lanza si Elasticsearch falla (best-effort)', async () => {
      mockEs.index.mockRejectedValue(new Error('timeout'));
      await expect(service.indexProduct(makeDoc())).resolves.toBeUndefined();
    });

    it('deleteProduct elimina el documento por id', async () => {
      mockEs.delete.mockResolvedValue(undefined);
      await service.deleteProduct('product-1');

      expect(mockEs.delete).toHaveBeenCalledWith({ index: 'obraya_products', id: 'product-1' });
    });

    it('deleteProduct no lanza si el documento no existe', async () => {
      mockEs.delete.mockRejectedValue(new Error('not found'));
      await expect(service.deleteProduct('product-1')).resolves.toBeUndefined();
    });

    it('bulkIndex arma las operaciones de bulk correctamente', async () => {
      mockEs.bulk.mockResolvedValue({ errors: false });
      const docs = [makeDoc({ id: 'p1' }), makeDoc({ id: 'p2' })];

      await service.bulkIndex(docs);

      expect(mockEs.bulk).toHaveBeenCalledWith({
        operations: [
          { index: { _index: 'obraya_products', _id: 'p1' } },
          docs[0],
          { index: { _index: 'obraya_products', _id: 'p2' } },
          docs[1],
        ],
        refresh: true,
      });
    });

    it('bulkIndex no llama a Elasticsearch si la lista esta vacia', async () => {
      await service.bulkIndex([]);
      expect(mockEs.bulk).not.toHaveBeenCalled();
    });

    it('search arma la query con texto, categoria y empresa, y devuelve ids + total', async () => {
      mockEs.search.mockResolvedValue({
        hits: { hits: [{ _id: 'p1' }, { _id: 'p2' }], total: { value: 2 } },
      });

      const result = await service.search({ q: 'cemento', category: 'cemento', companyId: 'company-1' });

      expect(mockEs.search).toHaveBeenCalledWith(
        expect.objectContaining({
          index: 'obraya_products',
          query: expect.objectContaining({
            bool: expect.objectContaining({
              must: expect.arrayContaining([
                { term: { isActive: true } },
                expect.objectContaining({ multi_match: expect.objectContaining({ query: 'cemento' }) }),
              ]),
              filter: expect.arrayContaining([{ term: { category: 'cemento' } }, { term: { companyId: 'company-1' } }]),
            }),
          }),
        }),
      );
      expect(result).toEqual({ ids: ['p1', 'p2'], total: 2 });
    });

    it('search sin filtros solo exige isActive y no aplica filtros extra', async () => {
      mockEs.search.mockResolvedValue({ hits: { hits: [], total: 0 } });

      const result = await service.search({});

      expect(mockEs.search).toHaveBeenCalledWith(
        expect.objectContaining({
          query: { bool: { must: [{ term: { isActive: true } }], filter: [] } },
        }),
      );
      expect(result).toEqual({ ids: [], total: 0 });
    });
  });

  describe('sin Elasticsearch disponible', () => {
    let service: SearchService;

    beforeEach(async () => {
      mockEs.ping.mockRejectedValue(new Error('connection refused'));
      service = await buildService();
      await service.onModuleInit();
    });

    it('indexProduct no hace nada', async () => {
      await service.indexProduct(makeDoc());
      expect(mockEs.index).not.toHaveBeenCalled();
    });

    it('deleteProduct no hace nada', async () => {
      await service.deleteProduct('product-1');
      expect(mockEs.delete).not.toHaveBeenCalled();
    });

    it('bulkIndex no hace nada', async () => {
      await service.bulkIndex([makeDoc()]);
      expect(mockEs.bulk).not.toHaveBeenCalled();
    });
  });
});
