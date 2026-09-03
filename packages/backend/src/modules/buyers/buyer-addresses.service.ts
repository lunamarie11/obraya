import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BuyerAddress } from './entities/buyer-address.entity';
import { CreateBuyerAddressDto } from './dto/create-buyer-address.dto';
import { UpdateBuyerAddressDto } from './dto/update-buyer-address.dto';

@Injectable()
export class BuyerAddressesService {
  constructor(
    @InjectRepository(BuyerAddress)
    private readonly addressRepo: Repository<BuyerAddress>,
  ) {}

  async findAll(buyerId: string): Promise<BuyerAddress[]> {
    return this.addressRepo.find({
      where: { buyerId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async create(buyerId: string, dto: CreateBuyerAddressDto): Promise<BuyerAddress> {
    if (dto.isDefault) {
      await this.addressRepo.update({ buyerId }, { isDefault: false });
    }
    const address = this.addressRepo.create({ ...dto, buyerId });
    return this.addressRepo.save(address);
  }

  async update(id: string, buyerId: string, dto: UpdateBuyerAddressDto): Promise<BuyerAddress> {
    const address = await this.findOneOrFail(id, buyerId);
    if (dto.isDefault) {
      await this.addressRepo.update({ buyerId }, { isDefault: false });
    }
    Object.assign(address, dto);
    return this.addressRepo.save(address);
  }

  async remove(id: string, buyerId: string): Promise<void> {
    const address = await this.findOneOrFail(id, buyerId);
    await this.addressRepo.remove(address);
  }

  private async findOneOrFail(id: string, buyerId: string): Promise<BuyerAddress> {
    const address = await this.addressRepo.findOne({ where: { id, buyerId } });
    if (!address) throw new NotFoundException('Dirección no encontrada');
    return address;
  }
}
