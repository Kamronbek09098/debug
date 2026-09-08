# 🐞 Debug Shop API — backend debugging mashqlari

Bu loyiha **ataylab buzilgan**. Ichida 23 ta xato bor: HTTP status kodlaridan
tortib, autentifikatsiya, Prisma so'rovlari va biznes-logikagacha.

Sizning vazifangiz — loyihani ishga tushirish, **Swagger** orqali har bir
endpointni test qilish, xatolarni topish va tuzatish.

**Stack:** NestJS 10 · Prisma 7 · PostgreSQL 16 · Swagger (OpenAPI) · JWT

---

## 1. Talablar

| Nima kerak | Versiya |
|---|---|
| Node.js | 20 yoki undan yuqori (`node -v`) |
| npm | 10+ |
| PostgreSQL | 14+ (yoki Docker) |

## 2. Ma'lumotlar bazasini ko'tarish

**Variant A — Docker (tavsiya etiladi):**

```bash
docker compose up -d
```

Bu `localhost:5432` da `debug_shop` bazasini ko'taradi
(user: `shop`, parol: `shop123`).

**Variant B — o'zingizdagi PostgreSQL:**

```sql
CREATE USER shop WITH PASSWORD 'shop123';
CREATE DATABASE debug_shop OWNER shop;
```

## 3. Loyihani ishga tushirish

```bash
# 1) .env faylini tayyorlang (agar hali yo'q bo'lsa)
cp .env.example .env

# 2) paketlarni o'rnating
npm install

# 3) Prisma client + jadvallar + boshlang'ich ma'lumot
npm run setup

# 4) serverni ishga tushiring
npm run start:dev
```

Ochiladigan manzillar:

- **Swagger UI → http://localhost:3000/api/docs**
- API bazasi → `http://localhost:3000/api`

> **Agar `npm run setup` "prisma db push" bosqichida internet muammosi
> tufayli to'xtasa**, jadvallarni qo'lda yarating:
> ```bash
> npx prisma generate
> psql "postgresql://shop:shop123@localhost:5432/debug_shop" -f prisma/init.sql
> npm run db:seed
> ```

## 4. Test akkauntlar

| Email | Parol | Rol |
|---|---|---|
| `admin@shop.uz` | `admin123` | ADMIN |
| `ali@shop.uz` | `user123` | USER |
| `vali@shop.uz` | `user123` | USER |

## 5. Foydali buyruqlar

```bash
npm run start:dev     # watch rejimida server
npm run build         # TypeScript kompilyatsiya
npm run db:reset      # bazani tozalab qaytadan to'ldirish
npm run db:studio     # Prisma Studio (bazani brauzerda ko'rish)
npm run db:seed       # faqat seed
```

---

## 6. Vazifa

1. **`BUGS.md`** faylini oching — u yerda 23 ta xatoning **belgilari
   (symptom)** yozilgan. Sabab yoki fayl nomi ko'rsatilmagan — o'zingiz
   topasiz.
2. Har bir xatoni Swagger orqali **takrorlang** (reproduce).
3. Sababni toping va tuzating.
4. Tuzatgandan keyin **yana Swaggerda tekshiring**.
5. `BUGS.md` dagi `[ ]` katakchalarni belgilab boring.

### Tavsiya etiladigan tartib

Xatolar bir-birini **yashiradi**. Masalan, autentifikatsiya ishlamasa,
himoyalangan endpointlarni umuman test qila olmaysiz; sahifalash buzuq
bo'lsa, qidiruv ham bo'sh natija qaytaradi va siz qidiruvni aybdor deb
o'ylaysiz.

Shuning uchun shu tartibda boring: **A → B → C → D**.

---

## 7. Debugging qurollari

### 7.1. Terminal — Prisma query loglari

`PrismaService` da query loglari yoqilgan. Har bir so'rov konsolda
`prisma:query SELECT ...` ko'rinishida chiqadi. Bu bilan:

- qaysi SQL yuborilayotganini,
- bitta endpoint uchun **nechta** so'rov ketayotganini (N+1 muammosi),
- `WHERE` shartlari to'g'ri qo'yilganini

ko'rasiz.

### 7.2. VS Code debugger

`.vscode/launch.json` tayyor. `F5` bosing — server debug rejimida ishga
tushadi, kodga breakpoint qo'yib, o'zgaruvchilarni ko'ra olasiz.

Yoki terminalda:

```bash
npm run start:dev -- --debug
```

### 7.3. console.log ham qurol

Servis ichida `console.log(query, where, result)` qo'yish — eng tez usul.
Ishlatib bo'lgach o'chirishni unutmang.

### 7.4. Swagger — asosiy ish maydoni

Har bir endpointni "Try it out" orqali chaqiring va quyidagilarga qarang:

- **status kodi** to'g'rimi? (201 / 400 / 401 / 403 / 404 / 409 / 500)
- javob **tanasi** kutilganidek to'lami?
- javobda **ortiqcha** narsa yo'qmi? (masalan, parol)
- serverdagi log nima deydi?

> **500 Internal Server Error** — deyarli har doim kodni to'g'rilash kerak
> degani. Foydalanuvchi noto'g'ri ma'lumot yuborsa 400, ruxsati bo'lmasa
> 401/403, topilmasa 404, ziddiyat bo'lsa 409 qaytishi kerak.

---

## 8. Loyiha tuzilishi

```
src/
├── main.ts                 # bootstrap, global sozlamalar, Swagger
├── app.module.ts
├── prisma/                 # PrismaService (query loglar shu yerda)
├── common/
│   ├── decorators/         # @Roles, @CurrentUser
│   ├── guards/             # JwtAuthGuard, RolesGuard
│   └── dto/                # PaginationDto
├── auth/                   # register, login, JWT strategy
├── users/
├── categories/
├── products/
├── cart/
└── orders/

prisma/
├── schema.prisma           # ma'lumotlar bazasi modeli
├── seed.ts                 # boshlang'ich ma'lumotlar
└── init.sql                # zaxira variant (db push ishlamasa)
```

## 9. Ma'lumotlar modeli

```
User 1──* CartItem *──1 Product *──1 Category
User 1──* Order    1──* OrderItem *──1 Product
```

- `Product.deletedAt` — mahsulot butunlay o'chirilmaydi, faqat "o'chirilgan"
  deb belgilanadi (**soft delete**).
- `CartItem` da `(userId, productId)` juftligi **unique** — bir foydalanuvchi
  savatida bitta mahsulot faqat bir marta bo'lishi mumkin.

---

Omad! Xato topish — dasturchining eng muhim ko'nikmasi. 🔍
