import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
// La librería no trae tipos completos para las opciones de instanciación
// (marca access_token como obligatorio aunque en runtime es opcional, ver
// ADR-010), por eso se importa sin tipar estrictamente el constructor.
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Afip = require('@afipsdk/afip.js');
import { Company, CompanyIvaCondition } from '../users/entities/company.entity';
import { Order } from '../orders/entities/order.entity';

// CUIT público de homologación de AFIP. Funciona contra los servidores
// reales de testing sin certificado propio (ver ADR-010) — permite que
// este módulo funcione out-of-the-box en desarrollo.
const AFIP_TESTING_CUIT = '20409378472';

export interface AfipInvoiceResult {
  cae: string;
  caeExpiration: Date;
  invoiceNumber: string;
  invoiceType: 'B' | 'C';
}

export type AfipTaxpayerInfo = Record<string, unknown>;

// Ver ADR-010: wrapper sobre @afipsdk/afip.js con el mismo patrón best-effort
// de PaymentsService/NotificationsService — si no hay credenciales
// configuradas, el servicio queda deshabilitado y todos los métodos
// devuelven null sin bloquear al resto de la aplicación.
@Injectable()
export class AfipService implements OnModuleInit {
  private readonly logger = new Logger(AfipService.name);
  private client: any;
  private enabled = false;
  private readonly ptoVta: number;

  constructor(private readonly config: ConfigService) {
    this.ptoVta = parseInt(this.config.get<string>('AFIP_PTO_VTA') ?? '1', 10);
  }

  onModuleInit(): void {
    const production = this.config.get<string>('AFIP_ENV') === 'production';
    const configuredCuit = this.config.get<string>('AFIP_CUIT');
    const cuit = configuredCuit || (!production ? AFIP_TESTING_CUIT : undefined);

    if (!cuit) {
      this.logger.warn(
        'AFIP deshabilitado: falta AFIP_CUIT. El registro de empresas y la facturación funcionan igual, sin validación/emisión AFIP.',
      );
      return;
    }

    const { cert, key } = this.readCertificate();

    if (production && (!cert || !key)) {
      this.logger.warn(
        'AFIP deshabilitado: en producción son obligatorios AFIP_CERT_PATH y AFIP_KEY_PATH con archivos válidos.',
      );
      return;
    }

    this.client = new Afip({ CUIT: cuit, cert, key, production });
    this.enabled = true;
    this.logger.log(
      `AfipService inicializado (${production ? 'producción' : 'testing/homologación'}, CUIT ${cuit}).`,
    );
  }

  private readCertificate(): { cert?: string; key?: string } {
    const certPath = this.config.get<string>('AFIP_CERT_PATH');
    const keyPath = this.config.get<string>('AFIP_KEY_PATH');
    if (!certPath || !keyPath) return {};
    try {
      return {
        cert: fs.readFileSync(certPath, 'utf8'),
        key: fs.readFileSync(keyPath, 'utf8'),
      };
    } catch {
      return {};
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // Consulta el padrón de AFIP (best-effort). En testing no es confiable
  // para CUITs de terceros arbitrarios (limitación conocida de AFIP, ver
  // ADR-010) — solo se usa para informar, nunca para bloquear un registro.
  async getTaxpayerDetails(cuit: string): Promise<AfipTaxpayerInfo | null> {
    if (!this.enabled) return null;
    try {
      return await this.client.RegisterInscriptionProof.getTaxpayerDetails(cuit);
    } catch (err) {
      this.logger.warn(`No se pudo consultar el padrón de AFIP para ${cuit}: ${(err as Error).message}`);
      return null;
    }
  }

  // Emite una Factura B (Responsable Inscripto) o C (Monotributo/Exento).
  // Nunca Factura A: Buyer no tiene CUIT propio, siempre es consumidor
  // final sin identificar ante AFIP (ver ADR-010).
  async createInvoice(params: { company: Company; order: Order }): Promise<AfipInvoiceResult | null> {
    if (!this.enabled) return null;

    const { company, order } = params;
    const cbteTipo = company.ivaCondition === CompanyIvaCondition.RESPONSABLE_INSCRIPTO ? 6 : 11;
    const invoiceType: 'B' | 'C' = cbteTipo === 6 ? 'B' : 'C';
    // Sin desglose de IVA en el modelo de precios actual: se informa todo
    // el importe como neto (ver ADR-010, limitación conocida).
    const impTotal = Math.round((Number(order.totalAmount) / 100) * 100) / 100;
    const today = new Date();
    const cbteFch = parseInt(
      `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`,
      10,
    );

    const data = {
      CantReg: 1,
      PtoVta: this.ptoVta,
      CbteTipo: cbteTipo,
      Concepto: 1, // Productos
      DocTipo: 99, // Consumidor final, sin identificar
      DocNro: 0,
      CbteFch: cbteFch,
      ImpTotal: impTotal,
      ImpTotConc: 0,
      ImpNeto: impTotal,
      ImpOpEx: 0,
      ImpIVA: 0,
      ImpTrib: 0,
      MonId: 'PES',
      MonCotiz: 1,
    };

    const result = await this.client.ElectronicBilling.createNextVoucher(data);

    return {
      cae: result.CAE,
      caeExpiration: new Date(result.CAEFchVto),
      invoiceNumber: String(result.voucherNumber),
      invoiceType,
    };
  }
}
