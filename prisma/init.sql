-- ZAXIRA VARIANT: agar "npx prisma db push" ishlamasa (masalan internet
-- Prisma engine faylini yuklab ololmasa), jadvallarni shu SQL bilan yarating:
--   psql "postgresql://shop:shop123@localhost:5432/debug_shop" -f prisma/init.sql
-- Odatdagi holatda bu fayl kerak emas - "npm run setup" hammasini o'zi qiladi.

DROP TABLE IF EXISTS "OrderItem" CASCADE;
DROP TABLE IF EXISTS "Order" CASCADE;
DROP TABLE IF EXISTS "CartItem" CASCADE;
DROP TABLE IF EXISTS "Product" CASCADE;
DROP TABLE IF EXISTS "Category" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TYPE IF EXISTS "OrderStatus";
DROP TYPE IF EXISTS "Role";

CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'SHIPPED', 'CANCELLED');

CREATE TABLE "User" (
  "id"        SERIAL       NOT NULL,
  "email"     TEXT         NOT NULL,
  "password"  TEXT         NOT NULL,
  "fullName"  TEXT         NOT NULL,
  "role"      "Role"       NOT NULL DEFAULT 'USER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Category" (
  "id"   SERIAL NOT NULL,
  "name" TEXT   NOT NULL,
  "slug" TEXT   NOT NULL,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

CREATE TABLE "Product" (
  "id"          SERIAL           NOT NULL,
  "title"       TEXT             NOT NULL,
  "description" TEXT,
  "price"       DOUBLE PRECISION NOT NULL,
  "stock"       INTEGER          NOT NULL DEFAULT 0,
  "categoryId"  INTEGER          NOT NULL,
  "deletedAt"   TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Product"
  ADD CONSTRAINT "Product_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "CartItem" (
  "id"        SERIAL       NOT NULL,
  "userId"    INTEGER      NOT NULL,
  "productId" INTEGER      NOT NULL,
  "quantity"  INTEGER      NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CartItem_userId_productId_key" ON "CartItem"("userId", "productId");
ALTER TABLE "CartItem"
  ADD CONSTRAINT "CartItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CartItem"
  ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Order" (
  "id"        SERIAL           NOT NULL,
  "userId"    INTEGER          NOT NULL,
  "total"     DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status"    "OrderStatus"    NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Order"
  ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "OrderItem" (
  "id"        SERIAL           NOT NULL,
  "orderId"   INTEGER          NOT NULL,
  "productId" INTEGER          NOT NULL,
  "quantity"  INTEGER          NOT NULL,
  "price"     DOUBLE PRECISION NOT NULL,
  CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
