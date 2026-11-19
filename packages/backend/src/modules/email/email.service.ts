import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { OrderEmailData, renderOrderStatusEmail } from './order-email.template';

// Ver ADR-011: email transaccional via AWS SES. Best-effort, mismo patron que
// NotificationsService (FCM) y AfipService: si faltan credenciales, el
// servicio se deshabilita silenciosamente y nunca bloquea el flujo principal
// (invitar un usuario o cambiar el estado de un pedido no debe fallar por un
// problema de SES).
@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private client: SESClient | null = null;
  private fromAddress = '';
  private replyTo: string | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const region = this.config.get<string>('AWS_SES_REGION') ?? this.config.get<string>('AWS_S3_REGION');
    const from = this.config.get<string>('EMAIL_FROM');

    if (!region || !from) {
      this.logger.warn('AWS SES no configurado (falta region/EMAIL_FROM) — envio de email deshabilitado');
      return;
    }

    // Sin `credentials` explicitas: usa el provider chain default del SDK
    // (variables de entorno o, en la instancia EC2, el IAM role -- mismo
    // patron que StorageService con S3). El role ya tiene ses:SendEmail/
    // ses:SendRawEmail (ver iam.tf).
    this.client = new SESClient({ region });
    this.fromAddress = EmailService.withDisplayName(from);
    this.replyTo = this.supportEmail();
    this.logger.log('AWS SES inicializado');
  }

  // Bug #10 (QA 18/11): el remitente figuraba como "no-reply". Si EMAIL_FROM
  // es solo la dirección, se le agrega el nombre visible "ObraYa".
  static withDisplayName(from: string): string {
    return from.includes('<') ? from : `ObraYa <${from.trim()}>`;
  }

  // Contacto que se muestra en los mails y al que van las respuestas. Solo si
  // SUPPORT_EMAIL está configurado explícitamente: debe ser una casilla que
  // reciba mails de verdad (SES solo envía; obraya.com.ar no tiene casillas
  // de entrada). Sin esto, el mail sale sin línea de contacto ni Reply-To.
  private supportEmail(): string | null {
    return this.config.get<string>('SUPPORT_EMAIL')?.trim() || null;
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!this.client || !to) return;
    try {
      await this.client.send(
        new SendEmailCommand({
          Source: this.fromAddress,
          Destination: { ToAddresses: [to] },
          ...(this.replyTo ? { ReplyToAddresses: [this.replyTo] } : {}),
          Message: {
            Subject: { Data: subject, Charset: 'UTF-8' },
            Body: { Html: { Data: html, Charset: 'UTF-8' } },
          },
        }),
      );
    } catch (err) {
      this.logger.warn(`Envio de email a ${to} fallo: ${(err as Error).message}`);
    }
  }

  async sendRegistrationReceivedEmail(to: string, companyName: string): Promise<void> {
    const html = `
      <p>Recibimos el registro de <strong>${companyName}</strong> en ObraYa.</p>
      <p>Tu cuenta esta pendiente de aprobacion. Te avisamos por este mismo medio en cuanto este activa y puedas cargar tu catalogo de materiales.</p>
    `;
    await this.sendEmail(to, `Registro recibido - ${companyName}`, html);
  }

  async sendCompanyApprovedEmail(to: string, companyName: string): Promise<void> {
    const html = `
      <p>Tu empresa <strong>${companyName}</strong> fue aprobada en ObraYa.</p>
      <p>Ya podes ingresar y cargar tu catalogo de materiales.</p>
    `;
    await this.sendEmail(to, `${companyName} fue aprobada en ObraYa`, html);
  }

  async sendNewCompanyAdminAlert(to: string, companyName: string, cuit: string): Promise<void> {
    const html = `
      <p>Se registro una nueva empresa pendiente de aprobacion: <strong>${companyName}</strong> (CUIT ${cuit}).</p>
      <p>Revisa y aproba desde el panel de SuperAdmin.</p>
    `;
    await this.sendEmail(to, `Nueva empresa pendiente de aprobacion: ${companyName}`, html);
  }

  async sendInviteEmail(to: string, companyName: string, inviteLink: string): Promise<void> {
    const html = `
      <p>Te invitaron a sumarte al equipo de <strong>${companyName}</strong> en ObraYa.</p>
      <p><a href="${inviteLink}">Aceptar invitacion</a></p>
      <p>El link vence en 7 dias.</p>
    `;
    await this.sendEmail(to, `Invitacion a ${companyName} en ObraYa`, html);
  }

  async sendOrderStatusEmail(to: string, data: OrderEmailData): Promise<void> {
    const msg = renderOrderStatusEmail(data, {
      frontendUrl: this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3002',
      supportEmail: this.supportEmail(),
    });
    if (msg) await this.sendEmail(to, msg.subject, msg.html);
  }
}
