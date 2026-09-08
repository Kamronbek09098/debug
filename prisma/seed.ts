import { PrismaClient, Role } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seed boshlandi...');

  // Eski ma'lumotlarni tozalash
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Foydalanuvchilar
  const passwordHash = await bcrypt.hash('admin123', 10);
  const userHash = await bcrypt.hash('user123', 10);

  await prisma.user.create({
    data: {
      email: 'admin@shop.uz',
      password: passwordHash,
      fullName: 'Admin Adminov',
      role: Role.ADMIN,
    },
  });

  await prisma.user.create({
    data: {
      email: 'ali@shop.uz',
      password: userHash,
      fullName: 'Ali Valiyev',
      role: Role.USER,
    },
  });

  await prisma.user.create({
    data: {
      email: 'vali@shop.uz',
      password: userHash,
      fullName: 'Vali Aliyev',
      role: Role.USER,
    },
  });

  // Kategoriyalar
  const phones = await prisma.category.create({
    data: { name: 'Telefonlar', slug: 'telefonlar' },
  });
  const laptops = await prisma.category.create({
    data: { name: 'Noutbuklar', slug: 'noutbuklar' },
  });
  const accessories = await prisma.category.create({
    data: { name: 'Aksessuarlar', slug: 'aksessuarlar' },
  });

  // Mahsulotlar
  const products = [
    { title: 'iPhone 15 Pro', price: 1299.0, stock: 10, categoryId: phones.id, description: 'Titanium korpus, A17 Pro' },
    { title: 'iPhone 14', price: 899.0, stock: 15, categoryId: phones.id, description: 'Eski avlod, arzonroq' },
    { title: 'Samsung Galaxy S24', price: 1099.0, stock: 8, categoryId: phones.id, description: 'Snapdragon 8 Gen 3' },
    { title: 'Xiaomi Redmi Note 13', price: 249.0, stock: 40, categoryId: phones.id, description: 'Byudjet variant' },
    { title: 'Google Pixel 8', price: 799.0, stock: 5, categoryId: phones.id, description: 'Toza Android' },
    { title: 'MacBook Air M3', price: 1399.0, stock: 6, categoryId: laptops.id, description: '13 dyuym, 16GB RAM' },
    { title: 'MacBook Pro 14', price: 2199.0, stock: 3, categoryId: laptops.id, description: 'M3 Pro chip' },
    { title: 'Lenovo ThinkPad X1', price: 1599.0, stock: 4, categoryId: laptops.id, description: 'Biznes uchun' },
    { title: 'ASUS ROG Strix G16', price: 1799.0, stock: 2, categoryId: laptops.id, description: 'Geyming noutbuk' },
    { title: 'AirPods Pro 2', price: 249.0, stock: 30, categoryId: accessories.id, description: 'Shovqin bostirish' },
    { title: 'Anker PowerBank 20000', price: 59.0, stock: 100, categoryId: accessories.id, description: '20000 mAh' },
    { title: 'Logitech MX Master 3S', price: 99.0, stock: 25, categoryId: accessories.id, description: 'Ergonomik sichqoncha' },
    { title: 'USB-C Kabel 2m', price: 12.0, stock: 200, categoryId: accessories.id, description: '100W quvvat' },
  ];

  for (const p of products) {
    await prisma.product.create({ data: p });
  }

  // Ataylab "o'chirilgan" (soft-deleted) mahsulot
  await prisma.product.create({
    data: {
      title: 'Nokia 3310 (sotuvdan olingan)',
      description: 'Bu mahsulot o‘chirilgan, ro‘yxatda ko‘rinmasligi kerak',
      price: 39.0,
      stock: 0,
      categoryId: phones.id,
      deletedAt: new Date(),
    },
  });

  const count = await prisma.product.count();
  console.log(`Seed tugadi: ${count} ta mahsulot, 3 ta kategoriya, 3 ta foydalanuvchi.`);
  console.log('Login: admin@shop.uz / admin123  |  ali@shop.uz / user123  |  vali@shop.uz / user123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
