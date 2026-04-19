import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdminUser() {
  console.log('Starting admin user creation...');
  try {
    // Verificar si ya existe
    const existing = await prisma.user.findUnique({
      where: { email: 'admin@obraya.com' },
    });

    if (existing) {
      console.log('✅ Admin user already exists:', existing.email);
      return;
    }

    console.log('Creating admin user...');
    // Crear usuario admin
    const hash = await bcrypt.hash('obraya123', 10);
    const admin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'admin@obraya.com',
        password: hash,
        role: 'ADMIN',
      },
    });

    console.log('✅ Admin user created successfully:', admin.email);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser().then(() => {
  console.log('Script completed');
});