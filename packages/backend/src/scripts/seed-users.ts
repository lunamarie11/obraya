import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../database/data-source';
import { Company, CompanyStatus } from '../modules/users/entities/company.entity';
import { CompanyUser, UserRole } from '../modules/users/entities/company-user.entity';
import { Buyer } from '../modules/buyers/entities/buyer.entity';

const DEFAULT_PASSWORD = 'obraya123';
const COMPANY_EMAIL = 'contacto@obraya.com';

const testUsers = [
  {
    email: 'delyanave@gmail.com',
    firstName: 'Dely',
    lastName: 'ObraYa',
    role: UserRole.SUPER_ADMIN,
  },
  {
    email: 'buyer@obraya.com',
    firstName: 'Buyer',
    lastName: 'ObraYa',
    role: UserRole.VENDEDOR,
  },
  {
    email: 'delivery@obraya.com',
    firstName: 'Delivery',
    lastName: 'ObraYa',
    role: UserRole.LOGISTICA,
  },
  {
    email: 'arq@obraya.com',
    firstName: 'Arq',
    lastName: 'ObraYa',
    role: UserRole.ADMIN,
  },
  {
    email: 'comercio@obraya.com',
    firstName: 'Comercio',
    lastName: 'ObraYa',
    role: UserRole.CONTABILIDAD,
  },
];

async function seedUsers() {
  const dataSource = await AppDataSource.initialize();
  try {
    const companyRepo = dataSource.getRepository(Company);
    const userRepo = dataSource.getRepository(CompanyUser);

    let company = await companyRepo.findOne({ where: { email: COMPANY_EMAIL } });
    if (!company) {
      console.log(`Creating company ${COMPANY_EMAIL}`);
      company = companyRepo.create({
        cuit: '30500010912',
        razonSocial: 'ObraYa S.A.',
        email: COMPANY_EMAIL,
        phone: '+54 11 4000 0000',
        status: CompanyStatus.ACTIVE,
        address: 'CABA, Argentina',
        city: 'Buenos Aires',
        province: 'Buenos Aires',
      });
      await companyRepo.save(company);
    } else {
      console.log(`Company ${COMPANY_EMAIL} already exists, using existing record`);
    }

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

    for (const userData of testUsers) {
      const existingUser = await userRepo.findOne({ where: { email: userData.email } });
      if (existingUser) {
        console.log(`User ${userData.email} already exists, skipping`);
        continue;
      }

      const user = userRepo.create({
        companyId: company.id,
        email: userData.email,
        passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        isActive: true,
      });
      await userRepo.save(user);
      console.log(`Created user ${user.email} (${user.role})`);
    }

    // Comprador demo (entidad Buyer, ver ADR-006) — reemplaza el uso de
    // buyer@obraya.com (CompanyUser) para probar el flujo de marketplace.
    const buyerRepo = dataSource.getRepository(Buyer);
    const existingBuyer = await buyerRepo.findOne({ where: { email: 'comprador@obraya.com' } });
    if (!existingBuyer) {
      const buyer = buyerRepo.create({
        email: 'comprador@obraya.com',
        passwordHash,
        firstName: 'Comprador',
        lastName: 'Demo',
        isActive: true,
      });
      await buyerRepo.save(buyer);
      console.log(`Created buyer ${buyer.email}`);
    } else {
      console.log('Buyer comprador@obraya.com already exists, skipping');
    }

    console.log('Test user seeding complete.');
  } finally {
    await dataSource.destroy();
  }
}

seedUsers().catch((error) => {
  console.error('Failed to seed users:', error);
  process.exit(1);
});
