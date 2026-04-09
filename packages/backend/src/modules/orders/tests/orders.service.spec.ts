import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersService } from '../orders.service';
import { Order, OrderStatus } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { OrderMessage, MessageSender } from '../entities/order-message.entity';
import { StockService } from '../../stock/stock.service';

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
};

const mockItemRepo = {};
const mockMessageRepo = {
  create: jest.fn(),
  save: jest.fn(),
};

const mockStockService = {
  updateStock: jest.fn(),
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
        { provide: DataSource, useValue: mockDataSource },
        { provide: StockService, useValue: mockStockService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    jest.clearAllMocks();
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
