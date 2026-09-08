import {
  BadRequestException,
  ForbiddenException,
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

    // D2 — avval har bir mahsulotning holati va zaxirasi tekshiriladi.
    // Bironta yaroqsiz bo'lsa, hech narsa o'zgarmasdan 400 qaytadi.
    for (const item of cartItems) {
      if (item.product.deletedAt) {
        throw new BadRequestException(
          `"${item.product.title}" sotuvdan olingan`,
        );
      }
      if (item.product.stock < item.quantity) {
        throw new BadRequestException(
          `"${item.product.title}" uchun zaxira yetarli emas ` +
            `(bor: ${item.product.stock}, so‘ralgan: ${item.quantity})`,
        );
      }
    }

    // D1 — summa har bir qatorning narx * miqdor yig'indisiga teng.
    const total = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );

    // D2 + D3 — buyurtma yaratish + zaxira kamaytirish + savatni tozalash
    // bitta tranzaksiya ichida (hammasi bo'ladi yoki hech nimasi).
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
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
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      await tx.cartItem.deleteMany({ where: { userId } });

      return order;
    });
  }

  async findAll(userId: number, query: FindOrdersDto) {
    const where: any = { userId };

    if (query.status) {
      where.status = query.status;
    }

    // D5 — sana bo'yicha filtr: o'sha kunning boshidan keyingi kun boshigacha
    // bo'lgan oraliq (gte start, lt end), aynan yarim tun emas.
    if (query.date) {
      const start = new Date(`${query.date}T00:00:00.000Z`);
      if (Number.isNaN(start.getTime())) {
        throw new BadRequestException('Sana formati noto‘g‘ri (YYYY-MM-DD)');
      }
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      where.createdAt = { gte: start, lt: end };
    }

    // D6 — N+1 yo'q: mahsulotlar bitta include bilan olinadi, buyurtmalar
    // soni ortsa ham SQL so'rovlar soni o'zgarmaydi.
    return this.prisma.order.findMany({
      where,
      include: { items: { include: { product: true } } },
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: number, user: { id: number; role: string }) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      throw new NotFoundException(`${id} idli buyurtma topilmadi`);
    }

    // D4 — o'zining buyurtmasi bo'lmasa 403. ADMIN hammasini ko'ra oladi.
    if (order.userId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException('Bu buyurtma sizga tegishli emas');
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
