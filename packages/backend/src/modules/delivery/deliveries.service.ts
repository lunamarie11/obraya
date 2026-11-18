import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Delivery } from './entities/delivery.entity';
import { RegisterDeliveryDto } from './dto/register-delivery.dto';

@Injectable()
export class DeliveriesService {
  constructor(
    @InjectRepository(Delivery)
    private readonly deliveryRepo: Repository<Delivery>,
  ) {}

  async register(dto: RegisterDeliveryDto): Promise<Delivery> {
    const existing = await this.deliveryRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const delivery = this.deliveryRepo.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      vehicleType: dto.vehicleType,
      licensePlate: dto.licensePlate,
      isActive: true,
    });
    return this.deliveryRepo.save(delivery);
  }

  async validateDelivery(email: string, password: string): Promise<Delivery> {
    const delivery = await this.deliveryRepo.findOne({ where: { email } });
    if (!delivery) throw new UnauthorizedException('Credenciales inválidas');
    if (!delivery.isActive) throw new UnauthorizedException('Cuenta inactiva');

    const passwordMatch = await bcrypt.compare(password, delivery.passwordHash);
    if (!passwordMatch) throw new UnauthorizedException('Credenciales inválidas');

    return delivery;
  }

  async findByEmail(email: string): Promise<Delivery | null> {
    return this.deliveryRepo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<Delivery | null> {
    return this.deliveryRepo.findOne({ where: { id } });
  }

  async updateLastLogin(deliveryId: string): Promise<void> {
    await this.deliveryRepo.update(deliveryId, { lastLoginAt: new Date() });
  }
}
