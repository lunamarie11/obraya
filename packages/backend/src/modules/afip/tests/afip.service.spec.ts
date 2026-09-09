import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AfipService } from '../afip.service';
import { Company, CompanyIvaCondition, CompanyStatus } from '../../users/entities/company.entity';
import { Order, OrderStatus } from '../../orders/entities/order.entity';

const mockCreateNextVoucher = jest.fn();
const mockGetTaxpayerDetails = jest.fn();

jest.mock('@afipsdk/afip.js', () => {
  return jest.fn().mockImplementation(() => ({
    ElectronicBilling: { createNextVoucher: mockCreateNextVoucher },
    RegisterInscriptionProof: { getTaxpayerDetails: mockGetTaxpayerDetails },
  }));
});

function makeCompany(overrides: Partial<Company> = {}): Company {
  const c = new Company();
  c.id = 'company-uuid-1';
  c.cuit = '20409378472';
  c.razonSocial = 'Empresa de prueba';
  c.status = CompanyStatus.ACTIVE;
  c.ivaCondition = CompanyIvaCondition.RESPONSABLE_INSCRIPTO;
  return Object.assign(c, overrides);
}

function makeOrder(overrides: Partial<Order> = {}): Order {
  const o = new Order();
  o.id = 'order-uuid-1';
  o.orderNumber = 'OBY-TEST-001';
  o.companyId = 'company-uuid-1';
  o.buyerId = 'buyer-uuid-1';
  o.status = OrderStatus.DESPACHADO;
  o.totalAmount = 150000; // $1500,00 en centavos
  o.currency = 'ARS';
  return Object.assign(o, overrides);
}

async function buildService(env: Record<string, string | undefined>): Promise<AfipService> {
  const mockConfig = { get: (key: string) => env[key] };
  const module: TestingModule = await Test.createTestingModule({
    providers: [AfipService, { provide: ConfigService, useValue: mockConfig }],
  }).compile();

  const service = module.get<AfipService>(AfipService);
  service.onModuleInit();
  return service;
}

describe('AfipService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('se habilita en modo testing sin configuración (usa el CUIT público de homologación)', async () => {
    const service = await buildService({ AFIP_ENV: 'testing' });
    expect(service.isEnabled()).toBe(true);
  });

  it('se deshabilita en producción si falta el certificado', async () => {
    const service = await buildService({ AFIP_ENV: 'production', AFIP_CUIT: '30500010912' });
    expect(service.isEnabled()).toBe(false);
  });

  it('devuelve null en createInvoice/getTaxpayerDetails si está deshabilitado', async () => {
    const service = await buildService({ AFIP_ENV: 'production' });
    await expect(service.createInvoice({ company: makeCompany(), order: makeOrder() })).resolves.toBeNull();
    await expect(service.getTaxpayerDetails('20409378472')).resolves.toBeNull();
    expect(mockCreateNextVoucher).not.toHaveBeenCalled();
  });

  it('emite Factura B (CbteTipo 6) para Responsable Inscripto', async () => {
    mockCreateNextVoucher.mockResolvedValue({
      CAE: '75123456789012',
      CAEFchVto: '2026-09-13',
      voucherNumber: 42,
    });

    const service = await buildService({ AFIP_ENV: 'testing' });
    const result = await service.createInvoice({
      company: makeCompany({ ivaCondition: CompanyIvaCondition.RESPONSABLE_INSCRIPTO }),
      order: makeOrder(),
    });

    expect(mockCreateNextVoucher).toHaveBeenCalledWith(
      expect.objectContaining({ CbteTipo: 6, ImpTotal: 1500 }),
    );
    expect(result).toEqual({
      cae: '75123456789012',
      caeExpiration: new Date('2026-09-13'),
      invoiceNumber: '42',
      invoiceType: 'B',
    });
  });

  it('emite Factura C (CbteTipo 11) para Monotributo', async () => {
    mockCreateNextVoucher.mockResolvedValue({
      CAE: '75123456789099',
      CAEFchVto: '2026-09-13',
      voucherNumber: 7,
    });

    const service = await buildService({ AFIP_ENV: 'testing' });
    const result = await service.createInvoice({
      company: makeCompany({ ivaCondition: CompanyIvaCondition.MONOTRIBUTO }),
      order: makeOrder(),
    });

    expect(mockCreateNextVoucher).toHaveBeenCalledWith(expect.objectContaining({ CbteTipo: 11 }));
    expect(result?.invoiceType).toBe('C');
  });

  it('propaga el error si AFIP rechaza el comprobante', async () => {
    mockCreateNextVoucher.mockRejectedValue(new Error('CAE rechazado'));

    const service = await buildService({ AFIP_ENV: 'testing' });
    await expect(
      service.createInvoice({ company: makeCompany(), order: makeOrder() }),
    ).rejects.toThrow('CAE rechazado');
  });

  it('getTaxpayerDetails no lanza si el padrón falla, devuelve null', async () => {
    mockGetTaxpayerDetails.mockRejectedValue(new Error('timeout'));

    const service = await buildService({ AFIP_ENV: 'testing' });
    await expect(service.getTaxpayerDetails('20409378472')).resolves.toBeNull();
  });
});
