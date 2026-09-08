import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // Parol (hash) hech qaysi javobda qaytmasligi uchun select ishlatilgan.
  private readonly publicFields = {
    id: true,
    email: true,
    fullName: true,
    role: true,
    createdAt: true,
  };

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { id: 'asc' },
      select: this.publicFields,
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.publicFields,
    });
    if (!user) {
      throw new NotFoundException(`${id} idli foydalanuvchi topilmadi`);
    }
    return user;
  }
}
