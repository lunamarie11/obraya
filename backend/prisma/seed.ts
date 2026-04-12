import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
  const dely = await prisma.user.create({
    data: {
      email: "dely@obraya.com",
      password: "$2b$10$dummy_hashed_password_for_seed",
      name: "Dely Navarro",
      phone: "+52 55 1234 5678",
      role: "BUYER",
    },
  });

  const juan = await prisma.user.create({
    data: {
      email: "juan@obraya.com",
      password: "$2b$10$dummy_hashed_password_for_seed",
      name: "Juan Ramirez",
      phone: "+52 55 2345 6789",
      role: "CONTRACTOR",
    },
  });

  const maria = await prisma.user.create({
    data: {
      email: "maria@obraya.com",
      password: "$2b$10$dummy_hashed_password_for_seed",
      name: "Maria Castillo",
      role: "CONTRACTOR",
    },
  });

  const pedro = await prisma.user.create({
    data: {
      email: "pedro@obraya.com",
      password: "$2b$10$dummy_hashed_password_for_seed",
      name: "Pedro Lopez",
      role: "CONTRACTOR",
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: "admin@obraya.com",
      password: "$2b$10$dummy_hashed_password_for_seed",
      name: "Admin ObraYa",
      role: "ADMIN",
    },
  });

  // ── Address ──────────────────────────────────────────────────────────────
  await prisma.address.create({
    data: {
      userId: dely.id,
      label: "Casa",
      street: "Av. Insurgentes Sur 1234",
      city: "CDMX",
      province: "Ciudad de Mexico",
      zipCode: "03100",
      isDefault: true,
    },
  });

  // ── Categories ───────────────────────────────────────────────────────────
  const catCemento = await prisma.category.create({
    data: { name: "Cemento y Concreto", slug: "cemento-concreto", emoji: "🧱" },
  });
  const catAcero = await prisma.category.create({
    data: { name: "Acero y Varilla", slug: "acero-varilla", emoji: "🔩" },
  });
  const catElectrico = await prisma.category.create({
    data: { name: "Material Electrico", slug: "material-electrico", emoji: "⚡" },
  });
  const catPlomeria = await prisma.category.create({
    data: { name: "Plomeria", slug: "plomeria", emoji: "🔧" },
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
      name: "Corralon El Constructor",
      cuit: "30-12345678-9",
      email: "ventas@elconstructor.com",
      phone: "+52 55 3456 7890",
      address: "Av. Tlahuac 456, CDMX",
      rating: 4.8,
    },
  });
  const supplier2 = await prisma.supplier.create({
    data: {
      name: "Materiales del Sur",
      cuit: "30-98765432-1",
      email: "info@materialdelsur.com",
      rating: 4.5,
    },
  });

  // ── Products ─────────────────────────────────────────────────────────────
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: "Cemento Portland 50kg",
        slug: "cemento-portland-50kg",
        brand: "Cruz Azul",
        emoji: "🧱",
        price: 189,
        proPrice: 175,
        unit: "bulto",
        stock: 500,
        isActive: true,
        isPromo: true,
        promoPrice: 169,
        badge: "Oferta",
        categoryId: catCemento.id,
        supplierId: supplier1.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Varilla Corrugada 3/8\" 12m",
        slug: "varilla-corrugada-3-8",
        brand: "Deacero",
        emoji: "🔩",
        price: 95,
        unit: "pieza",
        stock: 1000,
        categoryId: catAcero.id,
        supplierId: supplier1.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Cable THW Cal.12 (100m)",
        slug: "cable-thw-cal12",
        brand: "Condumex",
        emoji: "⚡",
        price: 890,
        unit: "rollo",
        stock: 200,
        categoryId: catElectrico.id,
        supplierId: supplier2.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Tubo PVC 4\" (6m)",
        slug: "tubo-pvc-4-pulgadas",
        brand: "Amanco",
        emoji: "🔧",
        price: 320,
        unit: "pieza",
        stock: 300,
        categoryId: catPlomeria.id,
        supplierId: supplier1.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Pintura Vinilica 19L",
        slug: "pintura-vinilica-19l",
        brand: "Comex",
        emoji: "🎨",
        price: 1250,
        unit: "cubeta",
        stock: 150,
        isPromo: true,
        promoPrice: 1099,
        badge: "-12%",
        categoryId: catPintura.id,
        supplierId: supplier2.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Taladro Percutor 1/2\"",
        slug: "taladro-percutor",
        brand: "DeWalt",
        emoji: "🔨",
        price: 2890,
        unit: "pieza",
        stock: 45,
        categoryId: catHerramientas.id,
        supplierId: supplier2.id,
      },
    }),
  ]);

  // ── Projects ─────────────────────────────────────────────────────────────
  const project1 = await prisma.project.create({
    data: {
      name: "Casa Familia Lopez",
      type: "Residencial",
      area: "180m2",
      location: "Col. Del Valle, CDMX",
      budget: 850000,
      spent: 623500,
      progress: 75,
      status: "ON_TRACK",
      startDate: new Date("2026-01-15"),
      endDate: new Date("2026-06-30"),
      ownerId: dely.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: "Edificio Reforma 45",
      type: "Comercial",
      area: "1200m2",
      location: "Paseo de la Reforma, CDMX",
      budget: 4200000,
      spent: 4536000,
      progress: 42,
      status: "AT_RISK",
      startDate: new Date("2026-02-01"),
      endDate: new Date("2026-11-30"),
      ownerId: dely.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: "Remodelacion Oficinas TechCo",
      type: "Corporativo",
      area: "500m2",
      location: "Santa Fe, CDMX",
      budget: 1100000,
      spent: 1045000,
      progress: 90,
      status: "ON_TRACK",
      startDate: new Date("2025-11-01"),
      endDate: new Date("2026-05-15"),
      ownerId: dely.id,
    },
  });

  const project4 = await prisma.project.create({
    data: {
      name: "Plaza Comercial Sur",
      type: "Comercial",
      area: "3000m2",
      location: "Tlalpan, CDMX",
      budget: 8500000,
      spent: 1275000,
      progress: 15,
      status: "DELAYED",
      startDate: new Date("2026-03-01"),
      endDate: new Date("2027-03-31"),
      ownerId: dely.id,
    },
  });

  // ── Tasks (for project1) ─────────────────────────────────────────────────
  const taskData = [
    { title: "Instalar ventanas PB", status: "BACKLOG" as const, priority: "MEDIUM" as const, assignedTo: juan.id, dueDate: new Date("2026-04-15") },
    { title: "Pintura exterior fachada", status: "BACKLOG" as const, priority: "LOW" as const, assignedTo: maria.id, dueDate: new Date("2026-04-22") },
    { title: "Revision instalacion electrica", status: "BACKLOG" as const, priority: "HIGH" as const, assignedTo: pedro.id, dueDate: new Date("2026-04-12") },
    { title: "Solicitar piso ceramico", status: "BACKLOG" as const, priority: "LOW" as const, assignedTo: dely.id, dueDate: new Date("2026-04-18") },
    { title: "Plomeria banos 2do piso", status: "IN_PROGRESS" as const, priority: "HIGH" as const, assignedTo: juan.id, dueDate: new Date("2026-04-10"), progress: 60 },
    { title: "Impermeabilizacion azotea", status: "IN_PROGRESS" as const, priority: "MEDIUM" as const, assignedTo: maria.id, dueDate: new Date("2026-04-14"), progress: 30 },
    { title: "Acabados cocina integral", status: "IN_PROGRESS" as const, priority: "MEDIUM" as const, assignedTo: dely.id, dueDate: new Date("2026-04-08"), progress: 80 },
    { title: "Cimentacion losa PA", status: "REVIEW" as const, priority: "HIGH" as const, assignedTo: pedro.id, dueDate: new Date("2026-04-05") },
    { title: "Instalacion gas natural", status: "REVIEW" as const, priority: "MEDIUM" as const, assignedTo: juan.id, dueDate: new Date("2026-04-06") },
    { title: "Excavacion y nivelacion", status: "DONE" as const, priority: "HIGH" as const, assignedTo: juan.id, dueDate: new Date("2026-04-02"), completedDate: new Date("2026-04-02") },
    { title: "Estructura metalica PB", status: "DONE" as const, priority: "HIGH" as const, assignedTo: maria.id, dueDate: new Date("2026-04-05"), completedDate: new Date("2026-04-05") },
    { title: "Muros de block 1er piso", status: "DONE" as const, priority: "MEDIUM" as const, assignedTo: pedro.id, dueDate: new Date("2026-04-07"), completedDate: new Date("2026-04-07") },
  ];

  for (const t of taskData) {
    await prisma.task.create({
      data: { ...t, projectId: project1.id },
    });
  }

  // ── Expenses (for project1) ──────────────────────────────────────────────
  const expenseData = [
    { concept: "Cable electrico calibre 12 (200m)", category: "Electricidad", amount: 4800, registeredBy: "Pedro L.", date: new Date("2026-04-11") },
    { concept: 'Tuberia PVC 4" (lote)', category: "Plomeria", amount: 3200, registeredBy: "Juan R.", date: new Date("2026-04-10") },
    { concept: "Jornales albanileria semana 14", category: "Albanileria", amount: 12000, registeredBy: "Marco C.", date: new Date("2026-04-09") },
    { concept: "Cemento 50kg x30 bultos", category: "Albanileria", amount: 5400, registeredBy: "Juan R.", date: new Date("2026-04-08") },
    { concept: "Pintura interior (20L x5)", category: "Acabados", amount: 7500, registeredBy: "Maria C.", date: new Date("2026-04-07") },
    { concept: "Estructura metalica planta baja", category: "Estructura", amount: 85000, registeredBy: "Juan R.", date: new Date("2026-03-15") },
    { concept: "Block concreto x500", category: "Albanileria", amount: 25000, registeredBy: "Juan R.", date: new Date("2026-03-10") },
    { concept: "Arena y grava (10 viajes)", category: "Estructura", amount: 35000, registeredBy: "Pedro L.", date: new Date("2026-02-28") },
  ];

  for (const e of expenseData) {
    await prisma.expense.create({
      data: { ...e, projectId: project1.id },
    });
  }

  // ── Sample Order ─────────────────────────────────────────────────────────
  const order = await prisma.order.create({
    data: {
      orderNumber: "OBY-2026-04719",
      userId: dely.id,
      status: "IN_TRANSIT",
      subtotal: 2695,
      shipping: 150,
      total: 2845,
      paymentMethod: "card",
      items: {
        create: [
          { productId: products[0].id, qty: 5, price: 169, subtotal: 845 },
          { productId: products[1].id, qty: 20, price: 95, subtotal: 1900 },
        ],
      },
      tracking: {
        create: [
          { status: "PENDING", message: "Pedido recibido", createdAt: new Date("2026-04-11T09:14:00") },
          { status: "CONFIRMED", message: "Pago acreditado", createdAt: new Date("2026-04-11T09:15:00") },
          { status: "PREPARING", message: "En preparacion en deposito", location: "Corralon El Constructor", createdAt: new Date("2026-04-11T09:32:00") },
          { status: "IN_TRANSIT", message: "Carlos en camino", location: "3.2km de destino", createdAt: new Date("2026-04-11T10:05:00") },
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
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
