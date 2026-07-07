/*
  Warnings:

  - You are about to drop the column `address_id` on the `delivery_points` table. All the data in the column will be lost.
  - You are about to drop the `addresses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `customer_delivery_points` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `customer_locations` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `location_id` to the `delivery_points` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "addresses" DROP CONSTRAINT "addresses_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "assets" DROP CONSTRAINT "assets_delivery_point_id_fkey";

-- DropForeignKey
ALTER TABLE "assets" DROP CONSTRAINT "assets_location_id_fkey";

-- DropForeignKey
ALTER TABLE "customer_delivery_points" DROP CONSTRAINT "customer_delivery_points_location_id_fkey";

-- DropForeignKey
ALTER TABLE "customer_locations" DROP CONSTRAINT "customer_locations_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "delivery_points" DROP CONSTRAINT "delivery_points_address_id_fkey";

-- AlterTable
ALTER TABLE "delivery_points" DROP COLUMN "address_id",
ADD COLUMN     "location_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN     "location_id" INTEGER;

-- DropTable
DROP TABLE "addresses";

-- DropTable
DROP TABLE "customer_delivery_points";

-- DropTable
DROP TABLE "customer_locations";

-- CreateTable
CREATE TABLE "locations" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "customer_id" INTEGER,
    "type" VARCHAR(30) NOT NULL DEFAULT 'customer_site',
    "name" VARCHAR(150) NOT NULL,
    "address" VARCHAR(200),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "country" VARCHAR(100),
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_points" ADD CONSTRAINT "delivery_points_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_delivery_point_id_fkey" FOREIGN KEY ("delivery_point_id") REFERENCES "delivery_points"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
