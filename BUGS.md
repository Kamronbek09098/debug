# 🐞 Topilishi kerak bo'lgan xatolar

Jami **23 ta** xato. Har biri uchun: **belgisi (symptom)** va **qanday
bo'lishi kerakligi** yozilgan. Sabab va fayl nomi ataylab yozilmagan.

Tartib muhim: **A → B → C → D**. Yuqoridagi xatolar pastdagilarni yashiradi.

Ishlatiladigan akkauntlar: `admin@shop.uz / admin123`, `ali@shop.uz / user123`,
`vali@shop.uz / user123`.

---

## A. Autentifikatsiya va Swagger sozlamalari

### `[ ]` A1 — Swaggerda tokenni yuborib bo'lmaydi

**Belgisi:** `http://localhost:3000/api/docs` da o'ng yuqorida **Authorize**
tugmasi yo'q. Login qilib token olsangiz ham, uni Swagger orqali yubora
olmaysiz. Shuningdek `POST /api/products` uchun "Request body" sxemasi
**bo'sh** ko'rinadi — qanday maydon yuborish kerakligi yozilmagan.

**Kerak:** Authorize tugmasi bo'lsin, himoyalangan endpointlarda qulf
belgisi chiqsin, `POST /api/products` body sxemasi to'liq ko'rinsin.

---

### `[x]` A2 — To'g'ri token bilan ham 401 Unauthorized

**Belgisi:** `POST /api/auth/login` muvaffaqiyatli token qaytaradi, lekin
o'sha tokenni `Authorization: Bearer <token>` sarlavhasida yuborsangiz —
`GET /api/auth/profile` **401 Unauthorized** beradi. Token muddati
tugamagan, formati to'g'ri (jwt.io da ochib ko'ring).

**Kerak:** yangi olingan token bilan barcha himoyalangan endpointlar ishlasin.

---

### `[x]` A3 — ADMIN foydalanuvchi ham 403 Forbidden oladi

**Belgisi:** `admin@shop.uz` bilan kirasiz (bazada `role = ADMIN`), lekin
`GET /api/users` → **403 Forbidden**. Xuddi shu holat `POST /api/products`,
`DELETE /api/categories/:id` da ham.

**Kerak:** ADMIN — ruxsat, oddiy USER — 403.

---

### `[x]` A4 — Parol hashi API javoblarida ko'rinadi

**Belgisi:** `POST /api/auth/register`, `POST /api/auth/login`,
`GET /api/users`, `GET /api/users/me` javoblarida `"password":
"$2a$10$..."` maydoni bor.

**Kerak:** parol (hash bo'lsa ham) hech qaysi javobda bo'lmasin.

---

### `[x]` A5 — Mavjud email bilan ro'yxatdan o'tish 500 beradi

**Belgisi:** `POST /api/auth/register` ga bazada bor emailni yuborsangiz →
**500 Internal Server Error**. Serverda `Unique constraint failed on the
fields: (email)` xatosi.

**Kerak:** **409 Conflict** va tushunarli xabar.

---

## B. Validatsiya va HTTP status kodlari

### `[x]` B1 — DTO validatsiyasi umuman ishlamaydi

**Belgisi:** DTO larda `@IsEmail()`, `@MinLength()`, `@Min(0)` yozilgan,
lekin ular hech nimani tekshirmaydi:

- `POST /api/auth/register` → `{"email": "emasEmail", "password": "1",
  "fullName": "x"}` **201** bilan qabul qilinadi;
- `POST /api/products` → `{"price": -500, "stock": -3}` bazaga yozib
  yuboriladi;
- `POST /api/products` → `{"price": "juda qimmat"}` **500** beradi.

**Kerak:** barcha uch holatda ham **400 Bad Request** va qaysi maydon
xato ekani yozilgan xabar.

---

### `[x]` B2 — Mahsulot yaratilganda 201 emas, 200 qaytadi

**Belgisi:** `POST /api/products` muvaffaqiyatli bo'lsa **200 OK** qaytaradi.
Swaggerda ham "200" deb hujjatlangan.

**Kerak:** yangi resurs yaratilganda **201 Created**.

---

### `[x]` B3 — Raqam bo'lmagan id → 500

**Belgisi:** `GET /api/products/abc` → **500 Internal Server Error**.

**Kerak:** **400 Bad Request** ("Validation failed (numeric string is
expected)").

---

### `[x]` B4 — Mavjud bo'lmagan mahsulot → bo'sh 200

**Belgisi:** `GET /api/products/9999` → **200 OK**, javob tanasi bo'sh.

**Kerak:** **404 Not Found**.

---

## C. Ma'lumotlar bazasi so'rovlari (Prisma)

### `[x]` C1 — Sahifalash birinchi sahifani tashlab ketadi

**Belgisi:** `GET /api/products?page=1&limit=5` → id lari **6,7,8,9,10**
bo'lgan mahsulotlar qaytadi. `page=0` yozsangiz ham o'zgarmaydi.
`GET /api/products` (default) esa faqat 4 ta mahsulot qaytaradi, holbuki
bazada 14 ta.

**Kerak:** `page=1` → birinchi 5 ta (id 1..5).

---

### `[x]` C2 — `meta.total` noto'g'ri

**Belgisi:** `GET /api/products?limit=5` javobida `meta.total` = 5.
`limit=10` bo'lsa `total` = 10. Ya'ni "total" har doim shu sahifadagi
elementlar soniga teng.

**Kerak:** `total` — filtrga mos **jami** mahsulotlar soni (sahifadagisi emas).
Qo'shimcha: `totalPages` ham qo'shing.

---

### `[x]` C3 — Qidiruv katta-kichik harfni farqlaydi

*(Bu xatoni C1 tuzatilgandan keyin ko'rasiz)*

**Belgisi:** `GET /api/products?search=iPhone` → 2 ta natija;
`GET /api/products?search=iphone` → **0 ta**.

**Kerak:** registrdan qat'i nazar bir xil natija.

---

### `[x]` C4 — Bitta mahsulotda kategoriya ma'lumoti yo'q

**Belgisi:** `GET /api/products/1` javobida faqat `categoryId: 1` bor,
`category` obyekti yo'q. Frontend kategoriya nomini ko'rsata olmaydi.

**Kerak:** javobda `category: { id, name, slug }` bo'lsin.

---

### `[x]` C5 — O'chirilgan mahsulot ro'yxatda ko'rinadi

**Belgisi:** ro'yxatda `"Nokia 3310 (sotuvdan olingan)"` bor, holbuki uning
`deletedAt` maydoni to'ldirilgan. `DELETE /api/products/:id` chaqirsangiz
ham mahsulot ro'yxatdan yo'qolmaydi.

**Kerak:** `deletedAt` to'ldirilgan mahsulotlar ro'yxatda ham,
`GET /api/products/:id` da ham chiqmasin (404 bersin).

---

### `[x]` C6 — PATCH eski ma'lumotni qaytaradi

**Belgisi:** `PATCH /api/products/1` bilan `{"price": 1111}` yuborasiz —
javobda hali ham eski narx (`1299`) turadi. Lekin keyin
`GET /api/products/1` qilsangiz — narx **haqiqatan o'zgargan**.

**Kerak:** PATCH javobida yangilangan obyekt qaytsin.

---

### `[x]` C7 — Savatga bir xil mahsulotni ikkinchi marta qo'shsa 500

**Belgisi:** `POST /api/cart` → `{"productId": 2, "quantity": 3}` — ishlaydi.
Xuddi shu so'rovni qayta yuborsangiz → **500** (`Unique constraint failed
on the fields: (userId, productId)`).

**Kerak:** miqdor **qo'shilsin** (3 + 2 = 5), yangi qator yaratilmasin.

---

### `[x]` C8 — Kategoriyani o'chirishda 500

**Belgisi:** `DELETE /api/categories/1` (ichida mahsulotlari bor) →
**500**, serverda `Foreign key constraint violated`.

**Kerak:** **409 Conflict** va "bu kategoriyada N ta mahsulot bor" degan
tushunarli xabar.

---

## D. Biznes-logika (eng qiyin qismi)

### `[ ]` D1 — Buyurtma summasi noto'g'ri

**Belgisi:** savatda `iPhone 14` (899, 3 dona) va `AirPods Pro 2` (249,
2 dona) bor. `GET /api/cart` → `total: 3195` (to'g'ri).
`POST /api/orders` → `total: 1148`.

**Kerak:** buyurtma summasi savatnikiga teng bo'lsin (3195).

---

### `[ ]` D2 — Zaxiradan ko'p buyurtma berish mumkin

**Belgisi:** `ASUS ROG Strix G16` zaxirasi **2 ta**. Savatga **50 ta**
qo'shib buyurtma bersangiz — buyurtma **201** bilan yaratiladi, mahsulot
zaxirasi esa **-48** bo'lib qoladi.

Qo'shimcha muammo: buyurtma bir nechta mahsulotdan iborat bo'lsa va
o'rtada xatolik yuz bersa, birinchi mahsulotning zaxirasi allaqachon
kamaytirilgan bo'ladi — baza **yarim o'zgargan** holatda qoladi.

**Kerak:** zaxira yetmasa **400 Bad Request**, hech narsa o'zgarmasin.
Buyurtma yaratish + zaxira kamaytirish + savatni tozalash — **bitta
tranzaksiya** ichida bo'lsin (hammasi bo'ladi yoki hech nimasi).

---

### `[ ]` D3 — Buyurtmadan keyin savat tozalanmaydi

**Belgisi:** `POST /api/orders` muvaffaqiyatli o'tadi, lekin `GET /api/cart`
hali ham o'sha mahsulotlarni ko'rsatadi. Kodda savatni tozalash qatori
**bor**, lekin ishlamayapti.

**Maslahat:** Prisma so'rovlari **lazy** — ular faqat `await` qilinganda
(yoki `.then()` chaqirilganda) bazaga yuboriladi.

**Kerak:** buyurtmadan keyin savat bo'sh bo'lsin.

---

### `[ ]` D4 — Boshqa odamning buyurtmasini ko'rish mumkin

**Belgisi:** `ali@shop.uz` buyurtma beradi (masalan id = 2). Keyin
`vali@shop.uz` bilan kirib `GET /api/orders/2` chaqirsangiz — **Ali ning
buyurtmasi to'liq ko'rinadi** (IDOR zaifligi).

**Kerak:** o'zining buyurtmasi bo'lmasa **403 Forbidden**. ADMIN esa
hammasini ko'ra olsin.

---

### `[ ]` D5 — Sana bo'yicha filtr har doim bo'sh

**Belgisi:** `GET /api/orders` → 2 ta buyurtma.
`GET /api/orders?date=2026-09-07` (bugungi sana) → **0 ta**.
Qaysi sanani yozsangiz ham natija bo'sh.

**Kerak:** o'sha kuni berilgan buyurtmalar qaytsin.

---

### `[ ]` D6 — N+1 so'rov muammosi

**Belgisi:** `GET /api/orders` chaqirganda terminaldagi `prisma:query`
loglarini sanang. Buyurtmalar va ulardagi mahsulotlar soni ortgan sari
so'rovlar soni ham **chiziqli o'sadi** (masalan 2 ta buyurtma, 3 ta
mahsulot uchun 5 ta SQL).

**Kerak:** buyurtmalar soni qancha bo'lsa ham, so'rovlar soni **o'zgarmas**
qolsin (Prisma `include` yordamida).

---

## ✅ Tugatgandan keyin

Hammasi tuzatilganda quyidagilar ishlashi kerak:

```
GET  /api/products?page=1&limit=5      → id 1..5,  meta.total = 13
GET  /api/products?search=iphone       → 2 ta natija
GET  /api/products/1                   → category obyekti bilan
GET  /api/products/9999                → 404
GET  /api/products/abc                 → 400
POST /api/products (admin)             → 201
POST /api/products (manfiy narx)       → 400
POST /api/auth/register (mavjud email) → 409
GET  /api/auth/profile (token bilan)   → 200
GET  /api/users (admin)                → 200, parolsiz
GET  /api/users (oddiy user)           → 403
POST /api/cart (2 marta bir xil)       → miqdor qo'shiladi
POST /api/orders                       → savat totaliga teng, savat bo'shaydi
POST /api/orders (zaxiradan ko'p)      → 400, zaxira o'zgarmaydi
GET  /api/orders/:id (begona)          → 403
GET  /api/orders?date=<bugun>          → buyurtmalar qaytadi
DELETE /api/categories/1               → 409
```
