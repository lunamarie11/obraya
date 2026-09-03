import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Buyer } from './entities/buyer.entity';
import { RegisterBuyerDto } from './dto/register-buyer.dto';

@Injectable()
export class BuyersService {
  constructor(
    @InjectRepository(Buyer)
    private readonly buyerRepo: Repository<Buyer>,
  ) {}

  async register(dto: RegisterBuyerDto): Promise<Buyer> {
    const existing = await this.buyerRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const buyer = this.buyerRepo.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      isActive: true,
    });
    return this.buyerRepo.save(buyer);
  }

  async validateBuyer(email: string, password: string): Promise<Buyer> {
    const buyer = await this.buyerRepo.findOne({ where: { email } });
    if (!buyer) throw new UnauthorizedException('Credenciales inválidas');
    if (!buyer.isActive) throw new UnauthorizedException('Cuenta inactiva');

    const passwordMatch = await bcrypt.compare(password, buyer.passwordHash);
    if (!passwordMatch) throw new UnauthorizedException('Credenciales inválidas');

    return buyer;
  }

  async findByEmail(email: string): Promise<Buyer | null> {
    return this.buyerRepo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<Buyer | null> {
    return this.buyerRepo.findOne({ where: { id } });
  }

  async updateLastLogin(buyerId: string): Promise<void> {
    await this.buyerRepo.update(buyerId, { lastLoginAt: new Date() });
  }
}
