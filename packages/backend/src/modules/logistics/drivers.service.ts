import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Driver } from './entities/driver.entity';
import { CompanyUser, UserRole } from '../users/entities/company-user.entity';
import { UpdateDriverProfileDto } from './dto/update-driver-profile.dto';

export interface DriverProfileDto {
  vehicleType: Driver['vehicleType'];
  licensePlate: string | null;
  phone: string | null;
  isAvailable: boolean;
}

export interface CompanyDriverDto extends DriverProfileDto {
  companyUserId: string;
  firstName: string;
  lastName: string;
  email: string;
}

const DEFAULT_PROFILE: DriverProfileDto = {
  vehicleType: null,
  licensePlate: null,
  phone: null,
  isAvailable: true,
};

// Ver docs/specs/fase4c-entidad-driver.md. Perfil 1:1 de un CompanyUser con
// rol Logistica — creacion perezosa, no hay fila hasta el primer guardado.
@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private readonly driverRepo: Repository<Driver>,
    @InjectRepository(CompanyUser)
    private readonly userRepo: Repository<CompanyUser>,
  ) {}

  async getProfile(companyUserId: string): Promise<DriverProfileDto> {
    const driver = await this.driverRepo.findOne({ where: { companyUserId } });
    if (!driver) return DEFAULT_PROFILE;
    return {
      vehicleType: driver.vehicleType,
      licensePlate: driver.licensePlate,
      phone: driver.phone,
      isAvailable: driver.isAvailable,
    };
  }

  async updateProfile(companyUserId: string, companyId: string, dto: UpdateDriverProfileDto): Promise<DriverProfileDto> {
    await this.driverRepo.upsert(
      { companyUserId, companyId, ...dto },
      ['companyUserId'],
    );
    return this.getProfile(companyUserId);
  }

  async setAvailability(companyUserId: string, companyId: string, isAvailable: boolean): Promise<DriverProfileDto> {
    await this.driverRepo.upsert({ companyUserId, companyId, isAvailable }, ['companyUserId']);
    return this.getProfile(companyUserId);
  }

  // Ver OrdersService.claimOrder (inyectado via forwardRef, mismo patron
  // de comunicacion entre modulos que OrdersService.findActiveAssignments
  // usa en sentido inverso, ver ADR-018). Sin fila = disponible (default).
  async isAvailable(companyUserId: string): Promise<boolean> {
    const driver = await this.driverRepo.findOne({ where: { companyUserId } });
    return driver ? driver.isAvailable : true;
  }

  // Ver GET /logistics/drivers (Admin): lista los repartidores de la
  // empresa con su perfil, incluso los que nunca lo completaron (aparecen
  // con los valores default, no se excluyen).
  async listForCompany(companyId: string): Promise<CompanyDriverDto[]> {
    const drivers = await this.userRepo.find({
      where: { companyId, role: UserRole.LOGISTICA, isActive: true },
    });
    if (!drivers.length) return [];

    const profiles = await this.driverRepo.find({
      where: { companyUserId: In(drivers.map((d) => d.id)) },
    });
    const profileById = new Map(profiles.map((p) => [p.companyUserId, p]));

    return drivers.map((d) => {
      const profile = profileById.get(d.id);
      return {
        companyUserId: d.id,
        firstName: d.firstName,
        lastName: d.lastName,
        email: d.email,
        vehicleType: profile?.vehicleType ?? DEFAULT_PROFILE.vehicleType,
        licensePlate: profile?.licensePlate ?? DEFAULT_PROFILE.licensePlate,
        phone: profile?.phone ?? DEFAULT_PROFILE.phone,
        isAvailable: profile?.isAvailable ?? DEFAULT_PROFILE.isAvailable,
      };
    });
  }
}
