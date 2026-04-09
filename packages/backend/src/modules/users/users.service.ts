import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Company, CompanyStatus } from './entities/company.entity';
import { CompanyUser, UserRole } from './entities/company-user.entity';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { InviteUserDto } from './dto/invite-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(CompanyUser)
    private readonly companyUserRepo: Repository<CompanyUser>,
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
    });
    await this.companyRepo.save(company);

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
    return this.companyUserRepo.save(user);
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
