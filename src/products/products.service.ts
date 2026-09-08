import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FindProductsDto } from './dto/find-products.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // Bitta mahsulot javobida qaytadigan kategoriya maydonlari.
  private readonly categorySelect = {
    select: { id: true, name: true, slug: true },
  };

  async findAll(query: FindProductsDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    // Soft-delete qilingan mahsulotlar ro'yxatda ko'rinmasin.
    const where: any = { deletedAt: null };

    if (query.search) {
      // Registrdan qat'i nazar bir xil natija.
      where.title = { contains: query.search, mode: 'insensitive' };
    }

    if (query.categoryId) {
      where.categoryId = Number(query.categoryId);
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { id: 'asc' },
        include: { category: this.categorySelect },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: { category: this.categorySelect },
    });

    if (!product) {
      throw new NotFoundException(`${id} idli mahsulot topilmadi`);
    }

    return product;
  }

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }

  async update(id: number, dto: UpdateProductDto) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    if (!product) {
      throw new NotFoundException(`${id} idli mahsulot topilmadi`);
    }

    // PATCH javobida yangilangan obyekt qaytsin (eski emas).
    return this.prisma.product.update({
      where: { id },
      data: { ...dto },
      include: { category: this.categorySelect },
    });
  }

  async remove(id: number) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    if (!product) {
      throw new NotFoundException(`${id} idli mahsulot topilmadi`);
    }

    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: `"${product.title}" o‘chirildi` };
  }
}
