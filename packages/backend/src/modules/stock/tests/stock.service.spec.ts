import { DataSource } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { StockService } from '../stock.service';
import { Stock } from '../entities/stock.entity';
import { StockMovement, MovementType } from '../entities/stock-movement.entity';

// Ver bug #13 (QA 18/11/2026): al aceptar un pedido el stock quedaba en 0.
// applyOrderMovement reemplaza esa lógica: reserva al aceptar, descuenta al
// despachar y libera la reserva al cancelar.
function makeStock(overrides: Partial<Stock> = {}): Stock {
  const s = new Stock();
  Object.assign(s, {
    id: 'stock-1',
    productId: 'prod-yeso',
    variantId: null,
    warehouseId: 'principal',
    quantity: 100,
    reservedQuantity: 0,
    minimumAlert: 5,
    alertEnabled: true,
    ...overrides,
  });
  return s;
}

function makeManager(rows: Stock[]) {
  const qb: any = {
    setLock: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(rows),
  };
  const stockRepo = {
    createQueryBuilder: jest.fn(() => qb),
    save: jest.fn(async (e) => e),
  };
  const movementRepo = {
    create: jest.fn((d) => d),
    save: jest.fn(async (e) => e),
  };
  const manager: any = {
    getRepository: (entity: any) => (entity === Stock ? stockRepo : movementRepo),
  };
  return { manager, stockRepo, movementRepo, qb };
}

describe('StockService.applyOrderMovement()', () => {
  const service = new StockService({} as any, {} as any, {} as DataSource);
  const order = { id: 'order-1', orderNumber: 'OBY-TEST-001' };
  const items = [{ productId: 'prod-yeso', variantId: null, quantity: 1 }];

  it('reserve: vender 1 de 100 deja Total 100 y Disponible 99 (no 0)', async () => {
    const stock = makeStock();
    const { manager, movementRepo } = makeManager([stock]);

    await service.applyOrderMovement(manager, 'reserve', items, order, 'user-1');

    expect(stock.quantity).toBe(100);
    expect(stock.reservedQuantity).toBe(1);
    expect(stock.availableQuantity).toBe(99);
    expect(movementRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ type: MovementType.RESERVA, quantity: 1, quantityAfter: 100, orderId: 'order-1' }),
    );
  });

  it('consume: al despachar descuenta 1 del total y libera la reserva', async () => {
    const stock = makeStock({ reservedQuantity: 1 });
    const { manager, movementRepo } = makeManager([stock]);

    await service.applyOrderMovement(manager, 'consume', items, order, 'user-1');

    expect(stock.quantity).toBe(99);
    expect(stock.reservedQuantity).toBe(0);
    expect(movementRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ type: MovementType.SALIDA, quantity: 1, quantityAfter: 99 }),
    );
  });

  it('release: cancelar un pedido aceptado devuelve la reserva', async () => {
    const stock = makeStock({ reservedQuantity: 3 });
    const { manager, movementRepo } = makeManager([stock]);

    await service.applyOrderMovement(manager, 'release', [{ ...items[0], quantity: 3 }], order, 'user-1');

    expect(stock.quantity).toBe(100);
    expect(stock.reservedQuantity).toBe(0);
    expect(movementRepo.save).toHaveBeenCalledWith(expect.objectContaining({ type: MovementType.LIBERACION, quantity: 3 }));
  });

  it('consume de un pedido aceptado con el código viejo (sin reserva): no deja reservado negativo', async () => {
    const stock = makeStock({ reservedQuantity: 0 });
    const { manager } = makeManager([stock]);

    await service.applyOrderMovement(manager, 'consume', items, order, 'user-1');

    expect(stock.quantity).toBe(99);
    expect(stock.reservedQuantity).toBe(0);
  });

  it('nunca deja el total negativo', async () => {
    const stock = makeStock({ quantity: 0 });
    const { manager } = makeManager([stock]);

    await service.applyOrderMovement(manager, 'consume', items, order, 'user-1');

    expect(stock.quantity).toBe(0);
  });

  it('con varios depósitos usa el principal', async () => {
    const other = makeStock({ id: 'stock-2', warehouseId: 'sucursal', quantity: 50 });
    const principal = makeStock();
    const { manager } = makeManager([other, principal]);

    await service.applyOrderMovement(manager, 'consume', items, order, 'user-1');

    expect(principal.quantity).toBe(99);
    expect(other.quantity).toBe(50);
  });

  it('producto sin stock registrado: no falla ni registra movimiento', async () => {
    const { manager, stockRepo, movementRepo } = makeManager([]);

    await expect(service.applyOrderMovement(manager, 'reserve', items, order, 'user-1')).resolves.toBeUndefined();
    expect(stockRepo.save).not.toHaveBeenCalled();
    expect(movementRepo.save).not.toHaveBeenCalled();
  });

  it('con variante filtra por variantId', async () => {
    const stock = makeStock({ variantId: 'var-1' });
    const { manager, qb } = makeManager([stock]);

    await service.applyOrderMovement(manager, 'reserve', [{ productId: 'prod-yeso', variantId: 'var-1', quantity: 2 }], order, 'u');

    expect(qb.andWhere).toHaveBeenCalledWith('stock.variantId = :variantId', { variantId: 'var-1' });
    expect(stock.reservedQuantity).toBe(2);
  });
});

// Bug #9 (QA 18/11): el import de stock exigía product_id; ahora acepta SKU.
describe('StockService.bulkUpdateFromCsv()', () => {
  function setup(products: Array<{ id: string; sku: string; companyId: string }>) {
    const productRepo = {
      findOne: jest.fn(async ({ where }) =>
        products.find(
          (p) => p.companyId === where.companyId && (where.sku ? p.sku === where.sku : p.id === where.id),
        ) ?? null,
      ),
    };
    const dataSource = { getRepository: (e: any) => (e === Product ? productRepo : null) } as any;
    const service = new StockService({} as any, {} as any, dataSource);
    const updateStock = jest.spyOn(service, 'updateStock').mockResolvedValue({} as any);
    return { service, updateStock };
  }
  const csv = (s: string) => Buffer.from(s, 'utf-8');

  it('actualiza por SKU (encabezados en español)', async () => {
    const { service, updateStock } = setup([{ id: 'p-yeso', sku: 'YES1', companyId: 'c1' }]);
    const res = await service.bulkUpdateFromCsv('c1', csv('SKU;Cantidad\nYES1;100\n'), 'u1', 'stock.csv');
    expect(res).toEqual({ updated: 1, errors: [] });
    expect(updateStock).toHaveBeenCalledWith('p-yeso', 'c1', expect.objectContaining({ quantity: 100 }), 'u1');
  });

  it('SKU inexistente o de otra empresa: error por fila, no actualiza', async () => {
    const { service, updateStock } = setup([{ id: 'p-x', sku: 'OTRO', companyId: 'c2' }]);
    const res = await service.bulkUpdateFromCsv('c1', csv('sku,quantity\nOTRO,5\n'), 'u1', 'stock.csv');
    expect(res.updated).toBe(0);
    expect(res.errors).toEqual([{ row: 2, error: 'No existe un producto con SKU "OTRO"' }]);
    expect(updateStock).not.toHaveBeenCalled();
  });

  it('sigue aceptando product_id, pero solo de la propia empresa', async () => {
    const { service, updateStock } = setup([
      { id: 'p-mio', sku: 'A', companyId: 'c1' },
      { id: 'p-ajeno', sku: 'B', companyId: 'c2' },
    ]);
    const res = await service.bulkUpdateFromCsv('c1', csv('product_id,quantity\np-mio,3\np-ajeno,3\n'), 'u1', 'stock.csv');
    expect(res.updated).toBe(1);
    expect(res.errors).toEqual([{ row: 3, error: 'No existe un producto con ID "p-ajeno"' }]);
    expect(updateStock).toHaveBeenCalledTimes(1);
  });

  it('cantidad 0 es válida (no es "falta la columna")', async () => {
    const { service } = setup([{ id: 'p-yeso', sku: 'YES1', companyId: 'c1' }]);
    const res = await service.bulkUpdateFromCsv('c1', csv('SKU,Cantidad\nYES1,0\n'), 'u1', 'stock.csv');
    expect(res).toEqual({ updated: 1, errors: [] });
  });

  it('sin SKU ni product_id: error claro', async () => {
    const { service } = setup([]);
    const res = await service.bulkUpdateFromCsv('c1', csv('Nombre,Cantidad\nYeso,1\n'), 'u1', 'stock.csv');
    expect(res.errors[0].error).toBe('Se requieren las columnas SKU y Cantidad');
  });
});
