/*
  Warnings:

  - A unique constraint covering the columns `[email,purpose]` on the table `email_otps` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "email_otps_email_purpose_idx";

-- CreateIndex
CREATE UNIQUE INDEX "email_otps_email_purpose_key" ON "email_otps"("email", "purpose");
