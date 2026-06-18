import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company, CompanyStatus } from '../users/entities/company.entity';
import { CompanyUser, UserRole } from '../users/entities/company-user.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(CompanyUser)
    private readonly userRepo: Repository<CompanyUser>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async getStats() {
    const [totalCompanies, activeCompanies, pendingCompanies, totalUsers, totalOrders, orders] =
      await Promise.all([
        this.companyRepo.count(),
        this.companyRepo.count({ where: { status: CompanyStatus.ACTIVE } }),
        this.companyRepo.count({ where: { status: CompanyStatus.PENDING } }),
        this.userRepo.count({ where: { isActive: true } }),
        this.orderRepo.count(),
        this.orderRepo.find({
          where: { status: OrderStatus.ENTREGADO },
          select: ['totalAmount'],
        }),
      ]);

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

    return { totalCompanies, activeCompanies, pendingCompanies, totalUsers, totalOrders, totalRevenue };
  }

  // ── Companies ────────────────────────────────────────────────────────────

  async listCompanies(status?: CompanyStatus) {
    const where = status ? { status } : {};
    const companies = await this.companyRepo.find({
      where,
      relations: ['users'],
      order: { createdAt: 'DESC' },
    });

    return companies.map((c) => ({
      id: c.id,
      cuit: c.cuit,
      razonSocial: c.razonSocial,
      email: c.email,
      phone: c.phone,
      city: c.city,
      province: c.province,
      status: c.status,
      usersCount: c.users?.length ?? 0,
      approvedAt: c.approvedAt,
      approvedBy: c.approvedBy,
      createdAt: c.createdAt,
    }));
  }

  async getCompanyDetail(id: string) {
    const company = await this.companyRepo.findOne({ where: { id }, relations: ['users'] });
    if (!company) throw new NotFoundException('Empresa no encontrada');
    const orderCount = await this.orderRepo.count({ where: { companyId: id } });
    return { ...company, orderCount };
  }

  async updateCompanyStatus(id: string, status: CompanyStatus, approvedBy: string): Promise<Company> {
    const company = await this.companyRepo.findOne({ where: { id } });
    if (!company) throw new NotFoundException('Empresa no encontrada');
    company.status = status;
    if (status === CompanyStatus.ACTIVE) {
      company.approvedAt = new Date();
      company.approvedBy = approvedBy;
    }
    return this.companyRepo.save(company);
  }

  async deleteCompany(id: string): Promise<void> {
    const company = await this.companyRepo.findOne({ where: { id } });
    if (!company) throw new NotFoundException('Empresa no encontrada');
    await this.companyRepo.remove(company);
  }

  // ── Users ────────────────────────────────────────────────────────────────

  async listUsers(search?: string) {
    const qb = this.userRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.company', 'company')
      .orderBy('u.createdAt', 'DESC');

    if (search) {
      qb.where(
        '(u.email ILIKE :s OR u.firstName ILIKE :s OR u.lastName ILIKE :s OR company.razonSocial ILIKE :s)',
        { s: `%${search}%` },
      );
    }

    const users = await qb.getMany();

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      companyId: u.companyId,
      companyName: u.company?.razonSocial ?? '—',
    }));
  }

  async updateUser(id: string, data: { role?: UserRole; isActive?: boolean }): Promise<CompanyUser> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (data.role !== undefined) user.role = data.role;
    if (data.isActive !== undefined) user.isActive = data.isActive;
    return this.userRepo.save(user);
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    await this.userRepo.remove(user);
  }

  // ── Orders ───────────────────────────────────────────────────────────────

  async listOrders(params: { status?: string; search?: string; page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    const qb = this.orderRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.company', 'company')
      .orderBy('o.createdAt', 'DESC');

    if (params.status) qb.andWhere('o.status = :status', { status: params.status });

    if (params.search) {
      qb.andWhere(
        '(o.orderNumber ILIKE :s OR o.buyerName ILIKE :s OR company.razonSocial ILIKE :s)',
        { s: `%${params.search}%` },
      );
    }

    const [orders, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        totalAmount: o.totalAmount,
        buyerName: o.buyerName,
        buyerEmail: o.buyerEmail,
        companyId: o.companyId,
        companyName: (o as any).company?.razonSocial ?? '—',
        scheduledDeliveryDate: o.scheduledDeliveryDate,
        createdAt: o.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async deleteOrder(id: string): Promise<void> {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    await this.orderRepo.remove(order);
  }

  // ── Products ─────────────────────────────────────────────────────────────

  async listProducts(params: { search?: string; page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    const qb = this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.company', 'company')
      .orderBy('p.createdAt', 'DESC');

    if (params.search) {
      qb.where(
        '(p.name ILIKE :s OR p.sku ILIKE :s OR company.razonSocial ILIKE :s)',
        { s: `%${params.search}%` },
      );
    }

    const [products, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        brand: p.brand,
        isActive: p.isActive,
        companyId: p.companyId,
        companyName: (p as any).company?.razonSocial ?? '—',
        createdAt: p.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async toggleProduct(id: string, isActive: boolean): Promise<void> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Producto no encontrado');
    product.isActive = isActive;
    await this.productRepo.save(product);
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Producto no encontrado');
    await this.productRepo.remove(product);
  }
}
