import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrdersService } from '../orders.service';
import { Order, OrderStatus } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { OrderMessage, MessageSender } from '../entities/order-message.entity';
import { StockService } from '../../stock/stock.service';
import { PaymentsService } from '../../payments/payments.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { EmailService } from '../../email/email.service';
import { BuyersService } from '../../buyers/buyers.service';
import { AfipService } from '../../afip/afip.service';
import { Company, FleetType } from '../../users/entities/company.entity';
import { UserRole } from '../../users/entities/company-user.entity';

function makeOrder(overrides: Partial<Order> = {}): Order {
  const o = new Order();
  o.id = 'order-uuid-1';
  o.companyId = 'company-uuid-1';
  o.buyerId = 'buyer-uuid-1';
  o.buyerName = 'Juan Comprador';
  o.orderNumber = 'OBY-TEST-001';
  o.status = OrderStatus.NUEVO;
  o.items = [];
  o.messages = [];
  o.totalAmount = 500000;
  o.currency = 'ARS';
  return Object.assign(o, overrides);
}

const mockOrderRepo = {
  findOne: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
  create: jest.fn((data) => data),
  save: jest.fn(async (entity) => entity),
  // Ver ADR-017: claimOrder() usa un UPDATE atómico vía query builder.
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  execute: jest.fn(),
};

const mockItemRepo = {
  create: jest.fn((data) => data),
};
const mockMessageRepo = {
  create: jest.fn(),
  save: jest.fn(),
};

const mockStockService = {
  updateStock: jest.fn(),
};

const mockPaymentsService = {
  createPreference: jest.fn(),
  getPaymentInfo: jest.fn(),
};

const mockNotificationsService = {
  notifyOrderStatus: jest.fn(),
};

const mockEmailService = {
  sendOrderStatusEmail: jest.fn(),
};

const mockBuyersService = {
  findById: jest.fn().mockResolvedValue(null),
};

const mockAfipService = {
  createInvoice: jest.fn().mockResolvedValue(null),
  getTaxpayerDetails: jest.fn().mockResolvedValue(null),
};

const mockCompanyRepo = {
  findOne: jest.fn().mockResolvedValue(null),
};

// DataSource mock que ejecuta el callback con repos mockeados
const mockDataSource = {
  transaction: jest.fn(async (cb) => {
    const orderRepo = {
      findOne: mockOrderRepo.findOne,
      save: jest.fn(async (entity) => entity),
    };
    const messageRepo = {
      create: jest.fn((data) => ({ ...data })),
      save: jest.fn(async (entity) => entity),
    };
    return cb({ getRepository: (entity: any) => {
      if (entity === Order) return orderRepo;
      if (entity === Company) return mockCompanyRepo;
      return messageRepo;
    }});
  }),
};

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
        { provide: getRepositoryToken(OrderItem), useValue: mockItemRepo },
        { provide: getRepositoryToken(OrderMessage), useValue: mockMessageRepo },
        { provide: getRepositoryToken(Company), useValue: mockCompanyRepo },
        { provide: DataSource, useValue: mockDataSource },
        { provide: StockService, useValue: mockStockService },
        { provide: PaymentsService, useValue: mockPaymentsService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: BuyersService, useValue: mockBuyersService },
        { provide: AfipService, useValue: mockAfipService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    jest.clearAllMocks();
  });

  describe('create() — cálculo de envío server-side (ver ADR-012)', () => {
    const baseDto = {
      companyId: 'company-uuid-1',
      items: [{ productId: 'p1', productName: 'Cemento', quantity: 2, unitPrice: 10000 }],
      buyerName: 'Juan',
      buyerEmail: 'juan@test.com',
      deliveryAddress: { street: 'Calle 1', city: 'CABA', province: 'CABA', postalCode: '1000' },
    } as any;

    it('sin zonas configuradas: shippingCost 0 y totalAmount = suma de items', async () => {
      mockCompanyRepo.findOne.mockResolvedValueOnce(null);

      const order = await service.create('company-uuid-1', 'buyer-uuid-1', baseDto);

      expect(order.shippingCost).toBe(0);
      expect(order.totalAmount).toBe(20000);
    });

    it('con zona matcheando el código postal: suma shippingCost al total', async () => {
      mockCompanyRepo.findOne.mockResolvedValueOnce({
        deliveryZones: [{
          id: 'zone-1', name: 'CABA', zipCodes: ['1000'],
          promisedHours: 24, fleetType: FleetType.PROPIA, shippingCost: 5000,
        }],
      });

      const order = await service.create('company-uuid-1', 'buyer-uuid-1', baseDto);

      expect(order.shippingCost).toBe(5000);
      expect(order.shippingZoneName).toBe('CABA');
      expect(order.totalAmount).toBe(25000);
    });

    it('código postal fuera de zona: no bloquea, shippingCost 0', async () => {
      mockCompanyRepo.findOne.mockResolvedValueOnce({
        deliveryZones: [{
          id: 'zone-1', name: 'CABA', zipCodes: ['9999'],
          promisedHours: 24, fleetType: FleetType.PROPIA, shippingCost: 5000,
        }],
      });

      const order = await service.create('company-uuid-1', 'buyer-uuid-1', baseDto);

      expect(order.shippingCost).toBe(0);
      expect(order.totalAmount).toBe(20000);
    });
  });

  describe('updateStatus() — transiciones válidas', () => {
    it('Nuevo → Aceptado: transición válida', async () => {
      mockOrderRepo.findOne.mockResolvedValueOnce(makeOrder({ status: OrderStatus.NUEVO }));
      mockOrderRepo.findOne.mockResolvedValueOnce(makeOrder({ status: OrderStatus.ACEPTADO }));

      const result = await service.updateStatus(
        'order-uuid-1', 'company-uuid-1',
        { status: OrderStatus.ACEPTADO },
        'user-1', 'Admin ObraYa',
      );
      expect(result.status).toBe(OrderStatus.ACEPTADO);
    });

    it('Aceptado → Preparacion: transición válida', async () => {
      mockOrderRepo.findOne.mockResolvedValueOnce(makeOrder({ status: OrderStatus.ACEPTADO }));
      mockOrderRepo.findOne.mockResolvedValueOnce(makeOrder({ status: OrderStatus.PREPARACION }));

      const result = await service.updateStatus(
        'order-uuid-1', 'company-uuid-1',
        { status: OrderStatus.PREPARACION },
        'user-1', 'Admin',
      );
      expect(result.status).toBe(OrderStatus.PREPARACION);
    });

    it('Preparacion → Despachado: transición válida', async () => {
      mockOrderRepo.findOne.mockResolvedValueOnce(makeOrder({ status: OrderStatus.PREPARACION }));
      mockOrderRepo.findOne.mockResolvedValueOnce(makeOrder({ status: OrderStatus.DESPACHADO }));

      const result = await service.updateStatus(
        'order-uuid-1', 'company-uuid-1',
        { status: OrderStatus.DESPACHADO },
        'user-1', 'Admin',
      );
      expect(result.status).toBe(OrderStatus.DESPACHADO);
    });

    it('Despachado → Entregado: transición válida', async () => {
      mockOrderRepo.findOne.mockResolvedValueOnce(makeOrder({ status: OrderStatus.DESPACHADO }));
      mockOrderRepo.findOne.mockResolvedValueOnce(makeOrder({ status: OrderStatus.ENTREGADO }));

      const result = await service.updateStatus(
        'order-uuid-1', 'company-uuid-1',
        { status: OrderStatus.ENTREGADO },
        'user-1', 'Admin',
      );
      expect(result.status).toBe(OrderStatus.ENTREGADO);
    });
  });

  describe('updateStatus() — transiciones inválidas', () => {
    it('Nuevo → Despachado: lanza BadRequestException', async () => {
      mockOrderRepo.findOne.mockResolvedValue(makeOrder({ status: OrderStatus.NUEVO }));

      await expect(
        service.updateStatus('order-uuid-1', 'company-uuid-1', { status: OrderStatus.DESPACHADO }, 'u1', 'Admin'),
      ).rejects.toThrow(BadRequestException);
    });

    it('Entregado → Aceptado: lanza BadRequestException (estado final)', async () => {
      mockOrderRepo.findOne.mockResolvedValue(makeOrder({ status: OrderStatus.ENTREGADO }));

      await expect(
        service.updateStatus('order-uuid-1', 'company-uuid-1', { status: OrderStatus.ACEPTADO }, 'u1', 'Admin'),
      ).rejects.toThrow(BadRequestException);
    });

    it('Cancelado → Nuevo: lanza BadRequestException (estado terminal)', async () => {
      mockOrderRepo.findOne.mockResolvedValue(makeOrder({ status: OrderStatus.CANCELADO }));

      await expect(
        service.updateStatus('order-uuid-1', 'company-uuid-1', { status: OrderStatus.NUEVO }, 'u1', 'Admin'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus() — cancelación', () => {
    it('Cancelar sin motivo: lanza BadRequestException', async () => {
      mockOrderRepo.findOne.mockResolvedValue(makeOrder({ status: OrderStatus.NUEVO }));

      await expect(
        service.updateStatus(
          'order-uuid-1', 'company-uuid-1',
          { status: OrderStatus.CANCELADO }, // sin rejectionReason
          'u1', 'Admin',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('Cancelar con motivo: transición válida desde Nuevo', async () => {
      mockOrderRepo.findOne.mockResolvedValueOnce(makeOrder({ status: OrderStatus.NUEVO }));
      mockOrderRepo.findOne.mockResolvedValueOnce(makeOrder({ status: OrderStatus.CANCELADO, rejectionReason: 'Sin stock' }));

      const result = await service.updateStatus(
        'order-uuid-1', 'company-uuid-1',
        { status: OrderStatus.CANCELADO, rejectionReason: 'Sin stock' },
        'u1', 'Admin',
      );
      expect(result.status).toBe(OrderStatus.CANCELADO);
    });

    it('Cancelar desde Entregado: lanza BadRequestException (estado final)', async () => {
      mockOrderRepo.findOne.mockResolvedValue(makeOrder({ status: OrderStatus.ENTREGADO }));

      await expect(
        service.updateStatus(
          'order-uuid-1', 'company-uuid-1',
          { status: OrderStatus.CANCELADO, rejectionReason: 'Error' },
          'u1', 'Admin',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus() — pedido no encontrado', () => {
    it('lanza NotFoundException si el pedido no existe o no pertenece a la empresa', async () => {
      mockOrderRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateStatus('no-existe', 'company-uuid-1', { status: OrderStatus.ACEPTADO }, 'u1', 'Admin'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus() — chequeo de propiedad para Logistica (ver ADR-017)', () => {
    it('Logistica marca Entregado su propio pedido asignado: transición válida', async () => {
      mockOrderRepo.findOne.mockResolvedValueOnce(
        makeOrder({ status: OrderStatus.DESPACHADO, assignedDriverId: 'driver-1' }),
      );
      mockOrderRepo.findOne.mockResolvedValueOnce(
        makeOrder({ status: OrderStatus.ENTREGADO, assignedDriverId: 'driver-1' }),
      );

      const result = await service.updateStatus(
        'order-uuid-1', 'company-uuid-1',
        { status: OrderStatus.ENTREGADO },
        'driver-1', 'Repartidor Uno', UserRole.LOGISTICA,
      );
      expect(result.status).toBe(OrderStatus.ENTREGADO);
    });

    it('Logistica intenta marcar Entregado un pedido asignado a otro repartidor: ForbiddenException', async () => {
      mockOrderRepo.findOne.mockResolvedValue(
        makeOrder({ status: OrderStatus.DESPACHADO, assignedDriverId: 'driver-2' }),
      );

      await expect(
        service.updateStatus(
          'order-uuid-1', 'company-uuid-1',
          { status: OrderStatus.ENTREGADO },
          'driver-1', 'Repartidor Uno', UserRole.LOGISTICA,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Logistica intenta marcar Entregado un pedido sin asignar: ForbiddenException', async () => {
      mockOrderRepo.findOne.mockResolvedValue(
        makeOrder({ status: OrderStatus.DESPACHADO, assignedDriverId: null }),
      );

      await expect(
        service.updateStatus(
          'order-uuid-1', 'company-uuid-1',
          { status: OrderStatus.ENTREGADO },
          'driver-1', 'Repartidor Uno', UserRole.LOGISTICA,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Admin marca Entregado un pedido asignado a otro repartidor: override permitido', async () => {
      mockOrderRepo.findOne.mockResolvedValueOnce(
        makeOrder({ status: OrderStatus.DESPACHADO, assignedDriverId: 'driver-2' }),
      );
      mockOrderRepo.findOne.mockResolvedValueOnce(
        makeOrder({ status: OrderStatus.ENTREGADO, assignedDriverId: 'driver-2' }),
      );

      const result = await service.updateStatus(
        'order-uuid-1', 'company-uuid-1',
        { status: OrderStatus.ENTREGADO },
        'admin-1', 'Admin ObraYa', UserRole.ADMIN,
      );
      expect(result.status).toBe(OrderStatus.ENTREGADO);
    });
  });

  describe('claimOrder() — reclamo atómico de un pedido (ver ADR-017)', () => {
    it('reclama un pedido Despachado sin asignar', async () => {
      mockOrderRepo.execute.mockResolvedValueOnce({ affected: 1 });
      mockOrderRepo.findOne.mockResolvedValueOnce(
        makeOrder({ status: OrderStatus.DESPACHADO, assignedDriverId: 'driver-1' }),
      );

      const result = await service.claimOrder('order-uuid-1', 'company-uuid-1', 'driver-1');
      expect(result.assignedDriverId).toBe('driver-1');
    });

    it('el UPDATE no afecta filas porque ya lo tomó otro: ConflictException', async () => {
      mockOrderRepo.execute.mockResolvedValueOnce({ affected: 0 });
      mockOrderRepo.findOne.mockResolvedValueOnce(
        makeOrder({ status: OrderStatus.DESPACHADO, assignedDriverId: 'driver-2' }),
      );

      await expect(
        service.claimOrder('order-uuid-1', 'company-uuid-1', 'driver-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('el pedido no existe: NotFoundException', async () => {
      mockOrderRepo.execute.mockResolvedValueOnce({ affected: 0 });
      mockOrderRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.claimOrder('no-existe', 'company-uuid-1', 'driver-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('unassignOrder() — liberar un pedido asignado (ver ADR-017)', () => {
    it('Logistica libera su propio pedido', async () => {
      mockOrderRepo.findOne.mockResolvedValueOnce(
        makeOrder({ status: OrderStatus.DESPACHADO, assignedDriverId: 'driver-1' }),
      );

      const result = await service.unassignOrder('order-uuid-1', 'company-uuid-1', 'driver-1', UserRole.LOGISTICA);
      expect(result.assignedDriverId).toBeNull();
      expect(result.assignedAt).toBeNull();
    });

    it('Logistica intenta liberar el pedido de otro repartidor: ForbiddenException', async () => {
      mockOrderRepo.findOne.mockResolvedValueOnce(
        makeOrder({ status: OrderStatus.DESPACHADO, assignedDriverId: 'driver-2' }),
      );

      await expect(
        service.unassignOrder('order-uuid-1', 'company-uuid-1', 'driver-1', UserRole.LOGISTICA),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Admin libera el pedido de cualquier repartidor', async () => {
      mockOrderRepo.findOne.mockResolvedValueOnce(
        makeOrder({ status: OrderStatus.DESPACHADO, assignedDriverId: 'driver-2' }),
      );

      const result = await service.unassignOrder('order-uuid-1', 'company-uuid-1', 'admin-1', UserRole.ADMIN);
      expect(result.assignedDriverId).toBeNull();
    });

    it('pedido no encontrado: NotFoundException', async () => {
      mockOrderRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.unassignOrder('no-existe', 'company-uuid-1', 'driver-1', UserRole.LOGISTICA),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('sendMessage()', () => {
    it('lanza BadRequestException en pedido Entregado', async () => {
      mockOrderRepo.findOne.mockResolvedValue(makeOrder({ status: OrderStatus.ENTREGADO }));

      await expect(
        service.sendMessage('order-uuid-1', 'company-uuid-1', { content: 'Hola' }, 'u1', 'Admin'),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException en pedido Cancelado', async () => {
      mockOrderRepo.findOne.mockResolvedValue(makeOrder({ status: OrderStatus.CANCELADO }));

      await expect(
        service.sendMessage('order-uuid-1', 'company-uuid-1', { content: 'Hola' }, 'u1', 'Admin'),
      ).rejects.toThrow(BadRequestException);
    });

    it('permite enviar mensaje en pedido Nuevo', async () => {
      mockOrderRepo.findOne.mockResolvedValue(makeOrder({ status: OrderStatus.NUEVO }));
      mockMessageRepo.create.mockReturnValue({ content: 'Hola', sender: MessageSender.COMPANY });
      mockMessageRepo.save.mockResolvedValue({ id: 'msg-1', content: 'Hola', sender: MessageSender.COMPANY });

      const msg = await service.sendMessage(
        'order-uuid-1', 'company-uuid-1',
        { content: 'Hola', isPredefined: false },
        'u1', 'Admin',
      );
      expect(msg.content).toBe('Hola');
      expect(msg.sender).toBe(MessageSender.COMPANY);
    });
  });
});
