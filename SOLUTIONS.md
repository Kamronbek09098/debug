# 🔑 JAVOBLAR KALITI (faqat o'qituvchi uchun)

> ⚠️ **O'quvchilarga berishdan oldin shu faylni o'chiring:**
> ```bash
> rm SOLUTIONS.md
> ```

Har bir xato uchun: **fayl → sabab → tuzatish**.

---

## A. Autentifikatsiya va Swagger

### A1 — Swaggerda Authorize tugmasi yo'q

**Fayllar:** `src/main.ts`, `src/products/dto/create-product.dto.ts`,
barcha controllerlar.

**Sabab:** `DocumentBuilder` da `.addBearerAuth()` chaqirilmagan,
controllerlarda `@ApiBearerAuth()` yo'q. `CreateProductDto` da esa
`@ApiProperty()` dekoratorlari umuman qo'yilmagan — shuning uchun Swagger
sxemani bo'sh ko'rsatadi.

**Tuzatish — `src/main.ts`:**
```ts
const config = new DocumentBuilder()
  .setTitle('Debug Shop API')
  .setVersion('1.0.0')
  .addBearerAuth()          // <-- qo'shildi
  .build();
```

**Har bir himoyalangan endpoint / controller ustiga:**
```ts
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
```

**`create-product.dto.ts` — har bir maydonga `@ApiProperty()`:**
```ts
@ApiProperty({ example: 'Samsung Galaxy A55' })
@IsString()
@MinLength(2)
title: string;

@ApiPropertyOptional({ example: 'O‘rta byudjet telefon' })
@IsOptional()
@IsString()
description?: string;

@ApiProperty({ example: 399 })
@IsNumber()
@Min(0)
price: number;

@ApiProperty({ example: 12 })
@IsInt()
@Min(0)
stock: number;

@ApiProperty({ example: 1 })
@IsInt()
categoryId: number;
```

---

### A2 — To'g'ri token bilan ham 401

**Fayl:** `src/auth/jwt.strategy.ts`

**Sabab:** token `JWT_SECRET` bilan **imzolanadi** (`auth.module.ts`), lekin
strategiya `JWT_SECRET_KEY` degan **boshqa** (`.env` da umuman mavjud
bo'lmagan) o'zgaruvchini o'qiydi va `'default-jwt-secret'` zaxira qiymatiga
tushib qoladi. Imzo va tekshiruv kalitlari mos kelmaydi → doim 401.

```ts
// BOR (xato):
secretOrKey: config.get<string>('JWT_SECRET_KEY') || 'default-jwt-secret',

// KERAK:
secretOrKey: config.get<string>('JWT_SECRET') || 'men-juda-maxfiy-kalitman',
```

> 💡 **Dars:** kalit nomlarini ikki joyda qo'lda yozish — klassik xato.
> Yaxshi amaliyot: `ConfigService` uchun tiplangan konfiguratsiya yoki
> `JwtModule` bilan bitta manbadan olish.

---

### A3 — ADMIN ham 403 oladi

**Fayllar:** `src/auth/auth.service.ts`, `src/auth/jwt.strategy.ts`

**Sabab:** JWT payloadida `role` yo'q, `validate()` ham uni qaytarmaydi.
`RolesGuard` esa `user.role` ni tekshiradi → `undefined` → hech qachon
mos kelmaydi.

**`auth.service.ts` → `login()`:**
```ts
const payload = {
  sub: user.id,
  email: user.email,
  role: user.role,        // <-- qo'shildi
};
```

**`jwt.strategy.ts` → `validate()`:**
```ts
async validate(payload: any) {
  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role,   // <-- qo'shildi
  };
}
```

> Muqobil (xavfsizroq) yechim: `validate()` ichida foydalanuvchini bazadan
> o'qib olish — shunda rol o'zgarsa, eski token bilan eski rol ishlamaydi.

---

### A4 — Parol javoblarda ko'rinadi

**Fayllar:** `src/auth/auth.service.ts`, `src/users/users.service.ts`

**Tuzatish (Prisma 7 `omit`):**
```ts
// users.service.ts
return this.prisma.user.findMany({
  orderBy: { id: 'asc' },
  omit: { password: true },
});

const user = await this.prisma.user.findUnique({
  where: { id },
  omit: { password: true },
});
```

```ts
// auth.service.ts -> register()
const user = await this.prisma.user.create({
  data: { email: dto.email, password: hashed, fullName: dto.fullName },
  omit: { password: true },
});

// auth.service.ts -> login() (parolni solishtirish uchun kerak edi)
const { password, ...safeUser } = user;
return { access_token: accessToken, user: safeUser };
```

> Muqobil: `class-transformer` ning `@Exclude()` si + global
> `ClassSerializerInterceptor`, yoki `select: { id: true, email: true, ... }`.
> Eng ishonchlisi — butun loyiha bo'yicha bitta usulni tanlash.

---

### A5 — Takroriy email → 500

**Fayl:** `src/auth/auth.service.ts`

**Sabab:** Prisma `P2002` (unique constraint) xatosi ushlanmagan.

```ts
async register(dto: RegisterDto) {
  const hashed = await bcrypt.hash(dto.password, 10);

  const exists = await this.prisma.user.findUnique({
    where: { email: dto.email },
  });
  if (exists) {
    throw new ConflictException('Bu email allaqachon ro‘yxatdan o‘tgan');
  }
  ...
}
```

> Muqobil (yaxshiroq, race conditionsiz): `try/catch` bilan `P2002` kodini
> ushlash, yoki global `PrismaExceptionFilter` yozib, `P2002 → 409`,
> `P2003 → 409`, `P2025 → 404` deb bir joyda o'girish.

---

## B. Validatsiya va status kodlar

### B1 — Validatsiya ishlamaydi

**Fayl:** `src/main.ts`

**Sabab:** global `ValidationPipe` ulanmagan (kod izohga olingan). DTO
dekoratorlari o'z-o'zidan ishlamaydi.

```ts
import { ValidationPipe } from '@nestjs/common';

app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,              // DTO da yo'q maydonlarni tashlab yuboradi
    forbidNonWhitelisted: true,   // ortiqcha maydon bo'lsa 400
    transform: true,              // query/param larni DTO tipiga o'giradi
    transformOptions: { enableImplicitConversion: true },
  }),
);
```

---

### B2 — POST 201 emas, 200

**Fayl:** `src/products/products.controller.ts`

```ts
// BOR (xato):
@Post()
@HttpCode(HttpStatus.OK)

// KERAK: @HttpCode ni butunlay olib tashlash
@Post()
```
NestJS `@Post()` uchun standart status kodi allaqachon **201**.
(`HttpCode`, `HttpStatus` importlarini ham tozalang.)

---

### B3 — `/products/abc` → 500

**Fayl:** `src/products/products.controller.ts`

```ts
// BOR (xato):
findOne(@Param('id') id: string) {
  return this.productsService.findOne(Number(id));   // 'abc' -> NaN -> Prisma 500
}

// KERAK:
findOne(@Param('id', ParseIntPipe) id: number) {
  return this.productsService.findOne(id);
}
```

---

### B4 — Topilmagan mahsulot → bo'sh 200

**Fayl:** `src/products/products.service.ts` → `findOne()`

```ts
if (!product) {
  throw new NotFoundException(`${id} idli mahsulot topilmadi`);
}
```

---

## C. Prisma so'rovlari

### C1 — Sahifalash off-by-one

**Fayl:** `src/products/products.service.ts` → `findAll()`

```ts
// BOR (xato):
skip: page * limit,      // page=1, limit=5 -> 5 ta yozuv o'tkazib yuboriladi

// KERAK:
skip: (page - 1) * limit,
```

---

### C2 — `meta.total` noto'g'ri

**Fayl:** `src/products/products.service.ts` → `findAll()`

```ts
// BOR (xato):
total: items.length,

// KERAK:
const [items, total] = await Promise.all([
  this.prisma.product.findMany({ where, skip: (page - 1) * limit, take: limit,
    orderBy: { id: 'asc' }, include: { category: true } }),
  this.prisma.product.count({ where }),
]);

return {
  data: items,
  meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
};
```

---

### C3 — Qidiruv registrga sezgir

**Fayl:** `src/products/products.service.ts` → `findAll()`

```ts
// BOR (xato):
where.title = { contains: query.search };

// KERAK (PostgreSQL):
where.title = { contains: query.search, mode: 'insensitive' };
```

---

### C4 — `category` qaytmaydi

**Fayl:** `src/products/products.service.ts` → `findOne()`

```ts
include: { category: true },
```

---

### C5 — Soft delete e'tiborsiz qolgan

**Fayl:** `src/products/products.service.ts`

`remove()` mahsulotni o'chirmaydi, faqat `deletedAt` ni to'ldiradi — lekin
`findAll()` va `findOne()` bu maydonni tekshirmaydi.

```ts
// findAll() ichida:
where.deletedAt = null;

// findOne() ichida (findUnique -> findFirst):
const product = await this.prisma.product.findFirst({
  where: { id, deletedAt: null },
  include: { category: true },
});
```

> 💡 Real loyihalarda buni har safar qo'lda yozmaslik uchun Prisma
> **client extension** yoki alohida repository qatlami ishlatiladi.

---

### C6 — PATCH eski ma'lumot qaytaradi

**Fayl:** `src/products/products.service.ts` → `update()`

```ts
// BOR (xato):
await this.prisma.product.update({ where: { id }, data: { ...dto } });
return product;              // <-- yangilashdan OLDIN o'qilgan obyekt

// KERAK:
return this.prisma.product.update({ where: { id }, data: { ...dto } });
```

---

### C7 — Savatga takroriy qo'shish → 500

**Fayl:** `src/cart/cart.service.ts` → `addItem()`

**Sabab:** `schema.prisma` da `@@unique([userId, productId])` bor, kod esa
har safar `create` qiladi.

```ts
const quantity = dto.quantity || 1;

return this.prisma.cartItem.upsert({
  where: { userId_productId: { userId, productId: dto.productId } },
  update: { quantity: { increment: quantity } },
  create: { userId, productId: dto.productId, quantity },
});
```

---

### C8 — Kategoriya o'chirishda 500

**Fayl:** `src/categories/categories.service.ts` → `remove()`

**Sabab:** `Product.categoryId` majburiy foreign key (Prisma standarti —
`onDelete: Restrict`), xato ushlanmagan.

```ts
const productCount = await this.prisma.product.count({
  where: { categoryId: id },
});
if (productCount > 0) {
  throw new ConflictException(
    `Bu kategoriyada ${productCount} ta mahsulot bor, avval ularni o‘chiring`,
  );
}
await this.prisma.category.delete({ where: { id } });
```

---

## D. Biznes-logika

### D1 — Buyurtma summasi noto'g'ri

**Fayl:** `src/orders/orders.service.ts` → `create()`

```ts
// BOR (xato):
total += item.product.price;

// KERAK:
total += item.product.price * item.quantity;
```

---

### D2 — Zaxira tekshirilmaydi, tranzaksiya yo'q

**Fayl:** `src/orders/orders.service.ts` → `create()`

```ts
// 1) Avval tekshirish
for (const item of cartItems) {
  if (item.product.deletedAt) {
    throw new BadRequestException(`"${item.product.title}" sotuvdan olingan`);
  }
  if (item.product.stock < item.quantity) {
    throw new BadRequestException(
      `"${item.product.title}" uchun zaxira yetarli emas ` +
      `(bor: ${item.product.stock}, so‘ralgan: ${item.quantity})`,
    );
  }
}

// 2) Keyin hammasi bitta tranzaksiyada
return this.prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ ...  });

  for (const item of cartItems) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }

  await tx.cartItem.deleteMany({ where: { userId } });

  return order;
});
```

> 💡 **Qo'shimcha savol o'quvchilarga:** bir vaqtning o'zida ikki kishi
> oxirgi 1 dona mahsulotni buyursa nima bo'ladi? (Javob: tekshirish va
> kamaytirish orasida race condition bor. Yechim — shartli update:
> `updateMany({ where: { id, stock: { gte: qty } }, data: {...} })` va
> `count === 0` bo'lsa xato tashlash, yoki tranzaksiya izolyatsiya darajasi.)

---

### D3 — Savat tozalanmaydi

**Fayl:** `src/orders/orders.service.ts` → `create()`

```ts
// BOR (xato):
this.prisma.cartItem.deleteMany({ where: { userId } });

// KERAK:
await this.prisma.cartItem.deleteMany({ where: { userId } });
```

**Nima uchun:** Prisma qaytaradigan `PrismaPromise` — **lazy**. U faqat
`await` qilinganda (yoki `.then()` chaqirilganda) bazaga yuboriladi.
Oddiy `Promise` dan farqi shu: `await` qo'yilmasa, so'rov **umuman
bajarilmaydi**. Shuning uchun xato ham chiqmaydi, log ham yozilmaydi —
topish qiyin bo'ladi.

> D2 dagi tranzaksiyaga o'tsangiz, bu qator `await tx.cartItem.deleteMany(...)`
> ko'rinishida tranzaksiya ichiga kiradi.

---

### D4 — IDOR (begona buyurtmani ko'rish)

**Fayllar:** `src/orders/orders.service.ts`, `src/orders/orders.controller.ts`

```ts
// service
async findOne(id: number, user: { id: number; role: string }) {
  const order = await this.prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });

  if (!order) {
    throw new NotFoundException(`${id} idli buyurtma topilmadi`);
  }

  if (order.userId !== user.id && user.role !== 'ADMIN') {
    throw new ForbiddenException('Bu buyurtma sizga tegishli emas');
  }

  return order;
}

// controller
findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
  return this.ordersService.findOne(id, user);
}
```

> 💡 **Dars:** JWT bilan himoyalash — bu faqat "kim ekanligini" bilish
> (authentication). "Nimaga haqli" (authorization) alohida tekshiriladi.
> IDOR — OWASP Top 10 dagi eng ko'p uchraydigan zaifliklardan biri.

---

### D5 — Sana filtri bo'sh natija

**Fayl:** `src/orders/orders.service.ts` → `findAll()`

**Sabab:** `new Date('2026-09-07')` → `2026-09-07T00:00:00.000Z`, ya'ni
kunning **boshi**. `gte: day` va `lte: day` sharti faqat aynan yarim
tunda (millisekundigacha) yaratilgan yozuvlarni topadi.

```ts
// BOR (xato):
const day = new Date(query.date);
where.createdAt = { gte: day, lte: day };

// KERAK:
const start = new Date(`${query.date}T00:00:00.000Z`);
const end = new Date(start);
end.setUTCDate(end.getUTCDate() + 1);
where.createdAt = { gte: start, lt: end };
```

> 💡 Vaqt mintaqasi haqida savol: server UTC da, foydalanuvchi
> `Asia/Tashkent` (UTC+5) da. "Bugun" kimning bugungi kuni? Real loyihada
> mijoz timezone ni yuboradi yoki hamma narsa UTC da hisoblanadi.

---

### D6 — N+1 so'rov

**Fayl:** `src/orders/orders.service.ts` → `findAll()`

```ts
// BOR (xato): har bir order item uchun alohida so'rov
const orders = await this.prisma.order.findMany({ where, include: { items: true } });
for (const order of orders) {
  for (const item of order.items) {
    const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
    ...
  }
}

// KERAK: bitta include bilan
return this.prisma.order.findMany({
  where,
  include: { items: { include: { product: true } } },
  orderBy: { id: 'desc' },
});
```

**Qanday ko'rsatish kerak:** tuzatishdan oldin va keyin terminaldagi
`prisma:query` qatorlarini sanang. Xatoli versiyada 2 ta buyurtma +
3 ta mahsulot = **5 ta** so'rov; buyurtmalar ko'paysa so'rovlar ham
ko'payaveradi. Tuzatilgandan keyin — **3 ta** va bu son o'zgarmaydi.

---

## 📊 Xatolar jadvali

| # | Xato | Fayl | Daraja |
|---|---|---|---|
| A1 | Swagger bearer auth + ApiProperty | `main.ts`, controllerlar, `create-product.dto.ts` | oson |
| A2 | JWT secret nomi mos emas | `auth/jwt.strategy.ts` | o'rta |
| A3 | JWT payloadda `role` yo'q | `auth/auth.service.ts`, `auth/jwt.strategy.ts` | o'rta |
| A4 | Parol javobda | `auth/auth.service.ts`, `users/users.service.ts` | oson |
| A5 | P2002 ushlanmagan | `auth/auth.service.ts` | o'rta |
| B1 | Global ValidationPipe yo'q | `main.ts` | oson |
| B2 | `@HttpCode(200)` | `products/products.controller.ts` | oson |
| B3 | `ParseIntPipe` yo'q | `products/products.controller.ts` | oson |
| B4 | `NotFoundException` yo'q | `products/products.service.ts` | oson |
| C1 | `skip` off-by-one | `products/products.service.ts` | o'rta |
| C2 | `total: items.length` | `products/products.service.ts` | o'rta |
| C3 | `mode: 'insensitive'` yo'q | `products/products.service.ts` | o'rta |
| C4 | `include` yo'q | `products/products.service.ts` | o'rta |
| C5 | `deletedAt` filtri yo'q | `products/products.service.ts` | o'rta |
| C6 | Eski obyekt qaytadi | `products/products.service.ts` | o'rta |
| C7 | `create` o'rniga `upsert` | `cart/cart.service.ts` | o'rta |
| C8 | FK xatosi (P2003) | `categories/categories.service.ts` | o'rta |
| D1 | `* quantity` yo'q | `orders/orders.service.ts` | qiyin |
| D2 | Zaxira tekshiruvi + `$transaction` | `orders/orders.service.ts` | qiyin |
| D3 | `await` yo'q (lazy PrismaPromise) | `orders/orders.service.ts` | qiyin |
| D4 | IDOR | `orders/orders.service.ts`, `orders.controller.ts` | qiyin |
| D5 | Sana oralig'i noto'g'ri | `orders/orders.service.ts` | qiyin |
| D6 | N+1 | `orders/orders.service.ts` | qiyin |

---

## 🎓 Dars o'tish bo'yicha maslahatlar

**1-dars (A + B, ~2 soat).** Swagger bilan tanishish, 401/403/400/404/409
status kodlari, `ValidationPipe`, `ParseIntPipe`. Bu yerda asosiy ko'nikma —
**xatoni takrorlash** (reproduce) va serverdagi log bilan ishlash.

**2-dars (C, ~2 soat).** Prisma so'rovlari. Terminaldagi `prisma:query`
loglarini o'qishni o'rgating: SQL da `OFFSET`, `LIMIT`, `WHERE` bandlarini
ko'rsatib bering. O'quvchilar `console.log(where)` qo'yib, qanday obyekt
Prisma ga borayotganini ko'rishsin.

**3-dars (D, ~2-3 soat).** Biznes-logika va xavfsizlik. D2 (tranzaksiya) va
D4 (IDOR) — muhokama uchun eng qimmatli mavzular. D3 (lazy promise) —
"kod bor, lekin ishlamaydi" turidagi xatolarga yaxshi misol.

**Baholash g'oyasi:** har bir xato uchun o'quvchi 3 narsani ko'rsatsin —
(1) xatoni qanday takrorladi, (2) sababni qayerdan topdi, (3) tuzatgandan
keyingi Swagger javobi.
