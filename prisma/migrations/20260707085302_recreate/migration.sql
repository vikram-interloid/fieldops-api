-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "photo_url" VARCHAR(500);

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "region" VARCHAR(120),
ADD COLUMN     "type" VARCHAR(20) NOT NULL DEFAULT 'customer';

-- CreateTable
CREATE TABLE "email_otps" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_otps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_otps_email_purpose_idx" ON "email_otps"("email", "purpose");
