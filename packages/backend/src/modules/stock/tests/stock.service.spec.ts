import { DataSource } from 'typeorm';
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
