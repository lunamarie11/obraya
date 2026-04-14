import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// bcrypt hash of "obraya123" (rounds=10)
const PASSWORD_HASH = "$2b$10$HtS7FgM3/Ci4PvLmLSEAoOAzEtQ3eeHtUOouS2C5qz3j0Kw7gtaK.";

async function main() {
  console.log("Seeding ObraYa database...");

  // ── Clean existing data ──────────────────────────────────────────────────
  await prisma.expense.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.tracking.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ────────────────────────────────────────────────────────────────
  const arquitecto = await prisma.user.create({
    data: {
      email: "arq@obraya.com",
      password: PASSWORD_HASH,
      name: "Ana Martínez",
      phone: "+54 11 4567 8901",
      role: "ARQUITECTO",
    },
  });

  const comercio = await prisma.user.create({
    data: {
      email: "comercio@obraya.com",
      password: PASSWORD_HASH,
      name: "Carlos Pinturería",
      phone: "+54 11 5678 9012",
      role: "COMERCIO",
    },
  });

  const helper1 = await prisma.user.create({
    data: {
      email: "juan@obraya.com",
      password: PASSWORD_HASH,
      name: "Juan Ramirez",
      phone: "+54 11 2345 6789",
      role: "ARQUITECTO",
    },
  });

  const helper2 = await prisma.user.create({
    data: {
      email: "maria@obraya.com",
      password: PASSWORD_HASH,
      name: "Maria Castillo",
      role: "ARQUITECTO",
    },
  });

  const helper3 = await prisma.user.create({
    data: {
      email: "pedro@obraya.com",
      password: PASSWORD_HASH,
      name: "Pedro Lopez",
      role: "ARQUITECTO",
    },
  });

  // ── Address ──────────────────────────────────────────────────────────────
  await prisma.address.create({
    data: {
      userId: arquitecto.id,
      label: "Estudio",
      street: "Av. Santa Fe 1234",
      city: "Buenos Aires",
      province: "CABA",
      zipCode: "C1425",
      isDefault: true,
    },
  });

  // ── Categories ───────────────────────────────────────────────────────────
  const catCemento = await prisma.category.create({
    data: { name: "Cemento y Hormigón", slug: "cemento-hormigon", emoji: "🧱" },
  });
  const catAcero = await prisma.category.create({
    data: { name: "Acero y Hierro", slug: "acero-hierro", emoji: "🔩" },
  });
  const catElectrico = await prisma.category.create({
    data: { name: "Material Eléctrico", slug: "material-electrico", emoji: "⚡" },
  });
  const catPlomeria = await prisma.category.create({
    data: { name: "Plomería", slug: "plomeria", emoji: "🔧" },
  });
  const catPintura = await prisma.category.create({
    data: { name: "Pintura y Acabados", slug: "pintura-acabados", emoji: "🎨" },
  });
  const catHerramientas = await prisma.category.create({
    data: { name: "Herramientas", slug: "herramientas", emoji: "🔨" },
  });

  // ── Suppliers ────────────────────────────────────────────────────────────
  const supplier1 = await prisma.supplier.create({
    data: {
      name: "Corralón El Constructor",
      cuit: "30-12345678-9",
      email: "ventas@elconstructor.com",
      phone: "+54 11 3456 7890",
      address: "Av. San Martín 456, CABA",
      rating: 4.8,
    },
  });
  const supplier2 = await prisma.supplier.create({
    data: {
      name: "Materiales del Sur",
      cuit: "30-98765432-1",
      email: "info@materialesdelsur.com",
      rating: 4.5,
    },
  });

  // ── Products ─────────────────────────────────────────────────────────────
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: "Cemento Portland 50kg",
        slug: "cemento-portland-50kg",
        brand: "Loma Negra",
        emoji: "🧱",
        price: 8500,
        proPrice: 7800,
        unit: "bolsa",
        stock: 500,
        isActive: true,
        isPromo: true,
        promoPrice: 7500,
        badge: "Oferta",
        categoryId: catCemento.id,
        supplierId: supplier1.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Hierro Corrugado 12mm x 12m',
        slug: "hierro-corrugado-12mm",
        brand: "Acindar",
        emoji: "🔩",
        price: 4200,
        unit: "barra",
        stock: 1000,
        categoryId: catAcero.id,
        supplierId: supplier1.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Cable Unipolar 2.5mm (100m)",
        slug: "cable-unipolar-2-5mm",
        brand: "Prysmian",
        emoji: "⚡",
        price: 18900,
        unit: "rollo",
        stock: 200,
        categoryId: catElectrico.id,
        supplierId: supplier2.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Caño PVC 110mm (3m)',
        slug: "cano-pvc-110mm",
        brand: "Plastiferro",
        emoji: "🔧",
        price: 3200,
        unit: "unidad",
        stock: 300,
        categoryId: catPlomeria.id,
        supplierId: supplier1.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Pintura Látex Interior 20L",
        slug: "pintura-latex-20l",
        brand: "Sherwin Williams",
        emoji: "🎨",
        price: 28000,
        unit: "lata",
        stock: 150,
        isPromo: true,
        promoPrice: 24500,
        badge: "-12%",
        categoryId: catPintura.id,
        supplierId: supplier2.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Taladro Percutor 13mm',
        slug: "taladro-percutor-13mm",
        brand: "DeWalt",
        emoji: "🔨",
        price: 85000,
        unit: "unidad",
        stock: 45,
        categoryId: catHerramientas.id,
        supplierId: supplier2.id,
      },
    }),
  ]);

  // ── Projects ─────────────────────────────────────────────────────────────
  const project1 = await prisma.project.create({
    data: {
      name: "Casa Familia López",
      type: "Residencial",
      area: "180m2",
      location: "Palermo, CABA",
      budget: 8500000,
      spent: 6235000,
      progress: 75,
      status: "ON_TRACK",
      startDate: new Date("2026-01-15"),
      endDate: new Date("2026-06-30"),
      ownerId: arquitecto.id,
    },
  });

  await prisma.project.create({
    data: {
      name: "Edificio Corrientes 1200",
      type: "Comercial",
      area: "1200m2",
      location: "San Nicolás, CABA",
      budget: 42000000,
      spent: 45360000,
      progress: 42,
      status: "AT_RISK",
      startDate: new Date("2026-02-01"),
      endDate: new Date("2026-11-30"),
      ownerId: arquitecto.id,
    },
  });

  await prisma.project.create({
    data: {
      name: "Remodelación Oficinas StartCo",
      type: "Corporativo",
      area: "500m2",
      location: "Puerto Madero, CABA",
      budget: 11000000,
      spent: 10450000,
      progress: 90,
      status: "ON_TRACK",
      startDate: new Date("2025-11-01"),
      endDate: new Date("2026-05-15"),
      ownerId: arquitecto.id,
    },
  });

  await prisma.project.create({
    data: {
      name: "Plaza Comercial Sur",
      type: "Comercial",
      area: "3000m2",
      location: "Lomas de Zamora, GBA",
      budget: 85000000,
      spent: 12750000,
      progress: 15,
      status: "DELAYED",
      startDate: new Date("2026-03-01"),
      endDate: new Date("2027-03-31"),
      ownerId: arquitecto.id,
    },
  });

  // ── Tasks (for project1) ─────────────────────────────────────────────────
  const taskData = [
    { title: "Instalar ventanas PB", status: "BACKLOG" as const, priority: "MEDIUM" as const, assignedTo: helper1.id, dueDate: new Date("2026-04-15") },
    { title: "Pintura exterior fachada", status: "BACKLOG" as const, priority: "LOW" as const, assignedTo: helper2.id, dueDate: new Date("2026-04-22") },
    { title: "Revisión instalación eléctrica", status: "BACKLOG" as const, priority: "HIGH" as const, assignedTo: helper3.id, dueDate: new Date("2026-04-12") },
    { title: "Solicitar piso cerámico", status: "BACKLOG" as const, priority: "LOW" as const, assignedTo: arquitecto.id, dueDate: new Date("2026-04-18") },
    { title: "Plomería baños 2do piso", status: "IN_PROGRESS" as const, priority: "HIGH" as const, assignedTo: helper1.id, dueDate: new Date("2026-04-10"), progress: 60 },
    { title: "Impermeabilización azotea", status: "IN_PROGRESS" as const, priority: "MEDIUM" as const, assignedTo: helper2.id, dueDate: new Date("2026-04-14"), progress: 30 },
    { title: "Acabados cocina integral", status: "IN_PROGRESS" as const, priority: "MEDIUM" as const, assignedTo: arquitecto.id, dueDate: new Date("2026-04-08"), progress: 80 },
    { title: "Cimentación losa PA", status: "REVIEW" as const, priority: "HIGH" as const, assignedTo: helper3.id, dueDate: new Date("2026-04-05") },
    { title: "Instalación gas natural", status: "REVIEW" as const, priority: "MEDIUM" as const, assignedTo: helper1.id, dueDate: new Date("2026-04-06") },
    { title: "Excavación y nivelación", status: "DONE" as const, priority: "HIGH" as const, assignedTo: helper1.id, dueDate: new Date("2026-04-02"), completedDate: new Date("2026-04-02") },
    { title: "Estructura metálica PB", status: "DONE" as const, priority: "HIGH" as const, assignedTo: helper2.id, dueDate: new Date("2026-04-05"), completedDate: new Date("2026-04-05") },
    { title: "Muros de ladrillo 1er piso", status: "DONE" as const, priority: "MEDIUM" as const, assignedTo: helper3.id, dueDate: new Date("2026-04-07"), completedDate: new Date("2026-04-07") },
  ];

  for (const t of taskData) {
    await prisma.task.create({
      data: { ...t, projectId: project1.id },
    });
  }

  // ── Expenses (for project1) ──────────────────────────────────────────────
  const expenseData = [
    { concept: "Cable unipolar 2.5mm (200m)", category: "Electricidad", amount: 37800, registeredBy: "Pedro L.", date: new Date("2026-04-11") },
    { concept: "Caño PVC 110mm (lote)", category: "Plomería", amount: 32000, registeredBy: "Juan R.", date: new Date("2026-04-10") },
    { concept: "Jornales albañilería semana 14", category: "Mano de obra", amount: 120000, registeredBy: "Ana M.", date: new Date("2026-04-09") },
    { concept: "Cemento 50kg x30 bolsas", category: "Albañilería", amount: 225000, registeredBy: "Juan R.", date: new Date("2026-04-08") },
    { concept: "Pintura látex interior (20L x5)", category: "Acabados", amount: 122500, registeredBy: "María C.", date: new Date("2026-04-07") },
    { concept: "Estructura metálica planta baja", category: "Estructura", amount: 850000, registeredBy: "Juan R.", date: new Date("2026-03-15") },
    { concept: "Ladrillo x1000 unidades", category: "Albañilería", amount: 250000, registeredBy: "Juan R.", date: new Date("2026-03-10") },
    { concept: "Arena y ripio (10 viajes)", category: "Estructura", amount: 350000, registeredBy: "Pedro L.", date: new Date("2026-02-28") },
  ];

  for (const e of expenseData) {
    await prisma.expense.create({
      data: { ...e, projectId: project1.id },
    });
  }

  // ── Sample Order ─────────────────────────────────────────────────────────
  await prisma.order.create({
    data: {
      orderNumber: "OBY-2026-04719",
      userId: arquitecto.id,
      status: "IN_TRANSIT",
      subtotal: 26900,
      shipping: 1500,
      total: 28400,
      paymentMethod: "card",
      items: {
        create: [
          { productId: products[0].id, qty: 2, price: 7500, subtotal: 15000 },
          { productId: products[1].id, qty: 2, price: 4200, subtotal: 8400 },
        ],
      },
      tracking: {
        create: [
          { status: "PENDING", message: "Pedido recibido", createdAt: new Date("2026-04-11T09:14:00") },
          { status: "CONFIRMED", message: "Pago acreditado", createdAt: new Date("2026-04-11T09:15:00") },
          { status: "PREPARING", message: "En preparación en depósito", location: "Corralón El Constructor", createdAt: new Date("2026-04-11T09:32:00") },
          { status: "IN_TRANSIT", message: "En camino a destino", location: "3.2km del destino", createdAt: new Date("2026-04-11T10:05:00") },
        ],
      },
    },
  });

  console.log("Seed completed!");
  console.log(`  Users: 5`);
  console.log(`  Projects: 4`);
  console.log(`  Tasks: ${taskData.length}`);
  console.log(`  Expenses: ${expenseData.length}`);
  console.log(`  Products: ${products.length}`);
  console.log(`  Categories: 6`);
  console.log(`  Suppliers: 2`);
  console.log(`  Orders: 1`);
  console.log("");
  console.log("Test credentials:");
  console.log("  Arquitecto → arq@obraya.com / obraya123");
  console.log("  Comercio   → comercio@obraya.com / obraya123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
