import { AppDataSource } from '../database/data-source';
import { Company, CompanyStatus } from '../modules/users/entities/company.entity';
import { CompanyUser, UserRole } from '../modules/users/entities/company-user.entity';
import * as bcrypt from 'bcrypt';
import { Product } from '../modules/products/entities/product.entity';
import { ProductVariant } from '../modules/products/entities/product-variant.entity';
import { Price, PriceType } from '../modules/prices/entities/price.entity';
import { Stock } from '../modules/stock/entities/stock.entity';
import { StockMovement, MovementType } from '../modules/stock/entities/stock-movement.entity';
import { Order, OrderStatus } from '../modules/orders/entities/order.entity';
import { OrderItem } from '../modules/orders/entities/order-item.entity';
import { OrderMessage, MessageSender } from '../modules/orders/entities/order-message.entity';

const COMPANY_EMAIL = 'contacto@obraya.com';

async function seed() {
  const dataSource = await AppDataSource.initialize();
  try {
    const companyRepo = dataSource.getRepository(Company);
    const productRepo = dataSource.getRepository(Product);
    const variantRepo = dataSource.getRepository(ProductVariant);
    const priceRepo = dataSource.getRepository(Price);
    const stockRepo = dataSource.getRepository(Stock);
    const stockMovRepo = dataSource.getRepository(StockMovement);
    const orderRepo = dataSource.getRepository(Order);
    const orderItemRepo = dataSource.getRepository(OrderItem);
    const orderMsgRepo = dataSource.getRepository(OrderMessage);

    // Create multiple ferreterías (companies) with vendor users
    const stores = [
      { email: 'ferreteria1@obraya.com', razonSocial: 'Ferretería La Unión', phone: '+54 11 1111 0001', city: 'CABA' },
      { email: 'ferreteria2@obraya.com', razonSocial: 'Ferretería Central', phone: '+54 11 1111 0002', city: 'CABA' },
      { email: 'ferreteria3@obraya.com', razonSocial: 'Distribuidora Norte', phone: '+54 11 1111 0003', city: 'San Isidro' },
      { email: 'ferreteria4@obraya.com', razonSocial: 'Materiales del Sur', phone: '+54 11 1111 0004', city: 'Lanús' },
    ];

    const productsData = [
      { name: 'Cemento Portland 25kg', sku: 'CEM-25', category: 'Cemento', brand: 'CementoPro' },
      { name: 'Ladrillo Cerámico', sku: 'LAD-01', category: 'Ladrillos', brand: 'Ladrillera' },
      { name: 'Baldosa Porcelanato 60x60', sku: 'BAL-6060', category: 'Revestimientos', brand: 'Porcela' },
      { name: 'Cemento Cola 1kg', sku: 'COLA-1', category: 'Pegamentos', brand: 'FixIt' },
      { name: 'Pintura Látex 10L', sku: 'PINT-10', category: 'Pintura', brand: 'ColorMax' },
      { name: 'Yeso 20kg', sku: 'YES-20', category: 'Yesos', brand: 'YesoMax' },
      { name: 'Cemento Albañilería 40kg', sku: 'CEM-40', category: 'Cemento', brand: 'Constru' },
    ];

    const createdProducts = [] as Product[];
    const createdVariantMap: Record<string, string> = {};

    const userRepo = dataSource.getRepository(CompanyUser);
    const defaultPasswordHash = await bcrypt.hash('obraya123', 12);

    // For each store, create company, vendor user, and products
    for (const s of stores) {
      let store = await companyRepo.findOne({ where: { email: s.email } });
      if (!store) {
        store = companyRepo.create({
          cuit: `30500010${Math.floor(Math.random() * 900) + 100}`,
          razonSocial: s.razonSocial,
          email: s.email,
          phone: s.phone,
          status: CompanyStatus.ACTIVE,
          address: `${s.city} - Dirección Demo`,
          city: s.city,
          province: 'Buenos Aires',
        });
        await companyRepo.save(store);
        console.log('Created store company', store.email);
      }

      // create a vendor user for the store
      const vendorEmail = `vendedor+${store.id.slice(0,6)}@obraya.com`;
      const existingVendor = await userRepo.findOne({ where: { email: vendorEmail } });
      if (!existingVendor) {
        const vendor = userRepo.create({ companyId: store.id, email: vendorEmail, passwordHash: defaultPasswordHash, firstName: 'Vendedor', lastName: store.razonSocial, role: UserRole.VENDEDOR, isActive: true });
        await userRepo.save(vendor);
        console.log('Created vendor user', vendor.email);
      }

      // add a subset of products for this store
      for (let i = 0; i < 5; i++) {
        const pd = productsData[(Math.floor(Math.random() * productsData.length))];
        const prodName = `${pd.name} - ${store.razonSocial}`;
        const existing = await productRepo.findOne({ where: { name: prodName, companyId: store.id } });
        if (existing) {
          createdProducts.push(existing);
          continue;
        }
        const prod = productRepo.create({ companyId: store.id, name: prodName, sku: `${pd.sku}-${store.email.split('@')[0]}`, description: `${pd.name} de la marca ${pd.brand}`, category: pd.category, brand: pd.brand, images: [], unitOfMeasure: 'unidad' });
        await productRepo.save(prod);
        createdProducts.push(prod);
        console.log('Created product', prod.name);

        const variant = variantRepo.create({ productId: prod.id, name: `${pd.sku}`, skuVariant: `${pd.sku}-${store.email.split('@')[0]}`, attributes: {} });
        await variantRepo.save(variant);
        createdVariantMap[prod.id] = variant.id;

        const base = Math.floor(Math.random() * 10000) + 3000;
        const priceB2C = priceRepo.create({ productId: prod.id, variantId: variant.id, type: PriceType.B2C, basePrice: base });
        const priceB2B = priceRepo.create({ productId: prod.id, variantId: variant.id, type: PriceType.B2B, basePrice: Math.floor(base * 0.9) });
        await priceRepo.save([priceB2C, priceB2B]);

        const stock = stockRepo.create({ productId: prod.id, variantId: variant.id, warehouseId: 'principal', warehouseName: 'Depósito Principal', quantity: Math.floor(Math.random() * 200) + 20, reservedQuantity: 0 });
        await stockRepo.save(stock);
      }
    }

    // (Products already created per store above)

    // Create a couple of sample orders
    const buyerEmail = 'buyer@obraya.com';
    for (let i = 1; i <= 3; i++) {
      const prod = createdProducts[(i - 1) % createdProducts.length];
      const price = await priceRepo.findOne({ where: { productId: prod.id, type: PriceType.B2C } });
      const unit = price?.basePrice ?? 5000;

      const orderNumber = `O-${Date.now().toString().slice(-6)}-${i}`;
      const order = orderRepo.create({
        companyId: prod.companyId,
        buyerId: 'buyer-test',
        buyerName: 'Cliente Demo',
        buyerEmail,
        buyerPhone: '+54 11 5555 0000',
        orderNumber,
        status: OrderStatus.NUEVO,
        items: [],
        totalAmount: 0,
        currency: 'ARS',
        deliveryAddress: { street: 'Av. Demo 123', city: 'CABA', province: 'Buenos Aires', postalCode: 'C1000' },
      });
      await orderRepo.save(order);

      const qty = i * 2;
      const subtotal = BigInt(unit) * BigInt(qty);
      const variantForProduct = createdVariantMap[prod.id];
      const item = orderItemRepo.create({
        orderId: order.id,
        productId: prod.id,
        variantId: variantForProduct,
        productName: prod.name,
        productSku: prod.sku,
        quantity: qty,
        unitPrice: unit,
        subtotal: Number(subtotal),
        discountPercent: 0,
      });
      await orderItemRepo.save(item);

      // update order totals
      order.items = [item];
      order.totalAmount = Number(subtotal);
      await orderRepo.save(order);

      // add a message
      const msg = orderMsgRepo.create({ orderId: order.id, sender: MessageSender.BUYER, senderName: 'Cliente Demo', content: 'Hola, quiero que lo entreguen por la tarde.' });
      await orderMsgRepo.save(msg);

      // reduce stock accordingly
      const stock = await stockRepo.findOne({ where: { productId: prod.id } });
      if (stock) {
        stock.quantity = Math.max(0, stock.quantity - qty);
        await stockRepo.save(stock);
        const movement = stockMovRepo.create({ stockId: stock.id, type: MovementType.SALIDA, quantity: qty, quantityAfter: stock.quantity, orderId: order.id, notes: 'Salida por pedido de prueba' });
        await stockMovRepo.save(movement);
      }

      console.log('Created order', order.orderNumber);
    }

    console.log('Mock data seeding complete.');
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((err) => {
  console.error('Failed to seed mock data', err);
  process.exit(1);
});
