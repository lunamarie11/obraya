import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Company, CompanyStatus, CompanyIvaCondition } from './entities/company.entity';
import { CompanyUser, UserRole } from './entities/company-user.entity';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { AfipService } from '../afip/afip.service';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(CompanyUser)
    private readonly companyUserRepo: Repository<CompanyUser>,
    private readonly afipService: AfipService,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
  ) {}

  async registerCompany(dto: RegisterCompanyDto): Promise<{ company: Company; adminUser: CompanyUser }> {
    // Verificar CUIT único
    const existingCompany = await this.companyRepo.findOne({ where: { cuit: dto.cuit } });
    if (existingCompany) {
      throw new ConflictException(`Ya existe una empresa registrada con el CUIT ${dto.cuit}`);
    }

    // Verificar email de empresa único
    const existingEmail = await this.companyRepo.findOne({ where: { email: dto.email } });
    if (existingEmail) {
      throw new ConflictException('El email de empresa ya está registrado');
    }

    // Verificar email de admin único
    const existingAdminEmail = await this.companyUserRepo.findOne({ where: { email: dto.adminEmail } });
    if (existingAdminEmail) {
      throw new ConflictException('El email del administrador ya está en uso');
    }

    // Crear empresa
    const company = this.companyRepo.create({
      cuit: dto.cuit,
      razonSocial: dto.razonSocial,
      email: dto.email,
      phone: dto.phone,
      city: dto.city,
      province: dto.province,
      status: CompanyStatus.PENDING,
      ivaCondition: dto.ivaCondition ?? CompanyIvaCondition.RESPONSABLE_INSCRIPTO,
    });
    await this.companyRepo.save(company);

    // Validación de CUIT contra el padrón de AFIP (ver ADR-010). Best-effort:
    // no bloquea el registro si AFIP no está configurado o el padrón no
    // responde (en homologación no es confiable para CUITs de terceros).
    this.afipService
      .getTaxpayerDetails(dto.cuit)
      .then((info) => {
        if (info) this.logger.log(`Padrón AFIP encontró datos para CUIT ${dto.cuit} al registrar ${company.razonSocial}`);
      })
      .catch((err) => this.logger.warn(`No se pudo validar el CUIT ${dto.cuit} contra AFIP: ${(err as Error).message}`));

    // Crear usuario administrador
    const passwordHash = await bcrypt.hash(dto.adminPassword, 12);
    const adminUser = this.companyUserRepo.create({
      companyId: company.id,
      email: dto.adminEmail,
      passwordHash,
      firstName: dto.adminFirstName,
      lastName: dto.adminLastName,
      role: UserRole.ADMIN,
      isActive: true,
    });
    await this.companyUserRepo.save(adminUser);

    return { company, adminUser };
  }

  async findUserByEmail(email: string): Promise<CompanyUser | null> {
    return this.companyUserRepo.findOne({
      where: { email },
      relations: ['company'],
    });
  }

  async findUserById(id: string): Promise<CompanyUser | null> {
    return this.companyUserRepo.findOne({
      where: { id },
      relations: ['company'],
    });
  }

  async findCompanyById(id: string): Promise<Company | null> {
    return this.companyRepo.findOne({ where: { id } });
  }

  async updateCompany(id: string, dto: Partial<Pick<Company, 'phone' | 'address' | 'city' | 'province' | 'bankingData' | 'deliveryZones'>>): Promise<Company> {
    await this.companyRepo.update(id, dto);
    return this.companyRepo.findOne({ where: { id } }) as Promise<Company>;
  }

  async getCompanyUsers(companyId: string): Promise<CompanyUser[]> {
    return this.companyUserRepo.find({
      where: { companyId },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'lastLoginAt', 'createdAt'],
    });
  }

  async inviteUser(companyId: string, dto: InviteUserDto): Promise<CompanyUser> {
    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Empresa no encontrada');

    const existing = await this.companyUserRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('El email ya está en uso');

    const inviteToken = uuidv4();
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

    const user = this.companyUserRepo.create({
      companyId,
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      passwordHash: '', // Se completa cuando acepta la invitación
      isActive: false,
      inviteToken,
      inviteExpiresAt,
    });
    const saved = await this.companyUserRepo.save(user);

    // Email de invitacion (ver ADR-011). Best-effort: no bloquea la creacion
    // de la invitacion si SES no esta configurado o falla.
    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3002';
    const inviteLink = `${frontendUrl}/accept-invite?token=${inviteToken}`;
    this.emailService
      .sendInviteEmail(dto.email, company.razonSocial, inviteLink)
      .catch((err) => this.logger.warn(`No se pudo enviar el email de invitacion a ${dto.email}: ${(err as Error).message}`));

    return saved;
  }

  async acceptInvite(token: string, password: string): Promise<CompanyUser> {
    const user = await this.companyUserRepo.findOne({ where: { inviteToken: token } });
    if (!user) throw new BadRequestException('Token de invitación inválido');
    if (user.inviteExpiresAt < new Date()) throw new BadRequestException('El token de invitación expiró');

    user.passwordHash = await bcrypt.hash(password, 12);
    user.isActive = true;
    user.inviteToken = null as unknown as string;
    user.inviteExpiresAt = null as unknown as Date;
    return this.companyUserRepo.save(user);
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.companyUserRepo.update(userId, { lastLoginAt: new Date() });
  }
}
