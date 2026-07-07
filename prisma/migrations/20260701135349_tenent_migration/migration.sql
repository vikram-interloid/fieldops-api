-- AlterTable
ALTER TABLE "locations" ADD COLUMN     "region" VARCHAR(80);

-- AlterTable
ALTER TABLE "service_cases" ADD COLUMN     "category" VARCHAR(40),
ADD COLUMN     "location_id" INTEGER,
ADD COLUMN     "operator_id" INTEGER;

-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN     "operator_id" INTEGER,
ADD COLUMN     "resolved_at" TIMESTAMP(3),
ADD COLUMN     "responded_at" TIMESTAMP(3),
ADD COLUMN     "sla_paused_at" TIMESTAMP(3),
ADD COLUMN     "sla_paused_ms" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "operators" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "tenant_organization_id" INTEGER,
    "name" VARCHAR(150) NOT NULL,
    "categories" TEXT[],
    "status" VARCHAR(30) NOT NULL DEFAULT 'Active',
    "contact_name" VARCHAR(150),
    "email" VARCHAR(150),
    "phone" VARCHAR(30),
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "region" VARCHAR(80),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_areas" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "operator_id" INTEGER NOT NULL,
    "category" VARCHAR(40) NOT NULL,
    "region" VARCHAR(80),
    "postal_prefix" VARCHAR(12),
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "radius_km" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sla_policies" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "priority" VARCHAR(20) NOT NULL,
    "response_minutes" INTEGER NOT NULL,
    "resolution_minutes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sla_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" SERIAL NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sla_policies_organization_id_priority_key" ON "sla_policies"("organization_id", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- AddForeignKey
ALTER TABLE "operators" ADD CONSTRAINT "operators_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_areas" ADD CONSTRAINT "service_areas_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_areas" ADD CONSTRAINT "service_areas_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sla_policies" ADD CONSTRAINT "sla_policies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "operators"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_cases" ADD CONSTRAINT "service_cases_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "operators"("id") ON DELETE SET NULL ON UPDATE CASCADE;
