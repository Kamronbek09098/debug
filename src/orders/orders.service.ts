import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FindOrdersDto } from './dto/find-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number) {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      throw new BadRequestException('Savat bo‘sh, buyurtma berib bo‘lmaydi');
    }

    let total = 0;
    for (const item of cartItems) {
      total += item.product.price;
    }

    const order = await this.prisma.order.create({
      data: {
        userId,
        total,
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          })),
        },
      },
      include: { items: true },
    });

    for (const item of cartItems) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    this.prisma.cartItem.deleteMany({ where: { userId } });

    return order;
  }

  async findAll(userId: number, query: FindOrdersDto) {
    const where: any = { userId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.date) {
      const day = new Date(query.date);
      where.createdAt = { gte: day, lte: day };
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { id: 'desc' },
    });

    const result = [];
    for (const order of orders) {
      const itemsWithProduct = [];
      for (const item of order.items) {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
        });
        itemsWithProduct.push({ ...item, product });
      }
      result.push({ ...order, items: itemsWithProduct });
    }

    return result;
  }

  async findOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      throw new NotFoundException(`${id} idli buyurtma topilmadi`);
    }

    return order;
  }

  async updateStatus(id: number, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException(`${id} idli buyurtma topilmadi`);
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
    });
  }
}
