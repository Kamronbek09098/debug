import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: number) {
    const items = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { id: 'asc' },
    });

    const total = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );

    return { items, total };
  }

  async addItem(userId: number, dto: AddToCartDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException(`${dto.productId} idli mahsulot topilmadi`);
    }

    const quantity = dto.quantity || 1;

    // Bir xil mahsulot bo'lsa yangi qator emas, mavjud miqdorga qo'shiladi
    // (userId + productId — unique).
    return this.prisma.cartItem.upsert({
      where: {
        userId_productId: { userId, productId: dto.productId },
      },
      create: {
        userId,
        productId: dto.productId,
        quantity,
      },
      update: {
        quantity: { increment: quantity },
      },
    });
  }

  async removeItem(userId: number, itemId: number) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, userId },
    });

    if (!item) {
      throw new NotFoundException('Savatda bunday element yo‘q');
    }

    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return { message: 'Savatdan o‘chirildi' };
  }

  async clear(userId: number) {
    const result = await this.prisma.cartItem.deleteMany({ where: { userId } });
    return { message: `${result.count} ta element o‘chirildi` };
  }
}
