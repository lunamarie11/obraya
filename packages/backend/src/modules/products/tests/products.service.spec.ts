import { BadRequestException } from '@nestjs/common';
import { ILike } from 'typeorm';
import { ProductsService } from '../products.service';

// Bugs de QA del 18/11/2026: #1 (buscador), #2 (precio en la tarjeta) y
// #8 (borrar/reordenar fotos).
function setup(product: any = { id: 'p1', companyId: 'c1', images: ['a.jpg', 'b.jpg', 'c.jpg'] }) {
  const productRepo = {
    findAndCount: jest.fn().mockResolvedValue([[{ id: 'p1' }, { id: 'p2' }], 2]),
    findOne: jest.fn().mockResolvedValue(product),
    save: jest.fn(async (e) => e),
  };
  const searchService = { indexProduct: jest.fn() };
  const pricesService = { findCurrentPrices: jest.fn().mockResolvedValue(new Map([['p1', 150000]])) };
  const service = new ProductsService(
    productRepo as any, {} as any, {} as any, searchService as any, pricesService as any, {} as any,
  );
  return { service, productRepo, searchService, pricesService };
}

describe('ProductsService.findAll()', () => {
  it('#1: busca sin distinguir mayúsculas, en nombre y SKU, y recorta espacios', async () => {
    const { service, productRepo } = setup();
    await service.findAll('c1', { search: '  yes1 ' } as any);
    const where = productRepo.findAndCount.mock.calls[0][0].where;
    expect(where).toEqual([
      { companyId: 'c1', name: ILike('%yes1%') },
      { companyId: 'c1', sku: ILike('%yes1%') },
    ]);
  });

  it('#2: agrega currentPrice (centavos) y null si no tiene precio', async () => {
    const { service, pricesService } = setup();
    const res = await service.findAll('c1', {} as any);
    expect(pricesService.findCurrentPrices).toHaveBeenCalledWith(['p1', 'p2']);
    expect(res.data).toEqual([
      { id: 'p1', currentPrice: 150000 },
      { id: 'p2', currentPrice: null },
    ]);
  });
});

describe('ProductsService.setImages()', () => {
  it('#8: reordena (la primera pasa a ser la principal) y reindexa', async () => {
    const { service, productRepo, searchService } = setup();
    const res = await service.setImages('p1', 'c1', ['c.jpg', 'a.jpg', 'b.jpg']);
    expect(res.images).toEqual(['c.jpg', 'a.jpg', 'b.jpg']);
    expect(productRepo.save).toHaveBeenCalled();
    expect(searchService.indexProduct).toHaveBeenCalled();
  });

  it('#8: borra una foto', async () => {
    const { service } = setup();
    const res = await service.setImages('p1', 'c1', ['a.jpg', 'c.jpg']);
    expect(res.images).toEqual(['a.jpg', 'c.jpg']);
  });

  it('rechaza URLs que el producto no tiene (no se pueden inyectar imágenes externas)', async () => {
    const { service, productRepo } = setup();
    await expect(service.setImages('p1', 'c1', ['a.jpg', 'https://otro.sitio/x.jpg'])).rejects.toThrow(BadRequestException);
    expect(productRepo.save).not.toHaveBeenCalled();
  });

  it('ignora duplicados', async () => {
    const { service } = setup();
    const res = await service.setImages('p1', 'c1', ['a.jpg', 'a.jpg']);
    expect(res.images).toEqual(['a.jpg']);
  });
});
