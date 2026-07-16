/*
  Warnings:

  - Changed the type of `purpose` on the `email_otps` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('REGISTER', 'RESET_PASSWORD');

-- AlterTable
ALTER TABLE "email_otps" DROP COLUMN "purpose",
ADD COLUMN     "purpose" "OtpPurpose" NOT NULL;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "verification_note" VARCHAR(300),
ADD COLUMN     "verification_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
ADD COLUMN     "verified_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "email_otps_email_purpose_idx" ON "email_otps"("email", "purpose");
