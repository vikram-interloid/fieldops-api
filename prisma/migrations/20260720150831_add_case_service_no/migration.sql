/*
  Warnings:

  - You are about to drop the column `caseNo` on the `service_case_events` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[caseNo]` on the table `service_cases` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `caseNo` to the `service_cases` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "service_case_events_caseNo_key";

-- AlterTable
ALTER TABLE "service_case_events" DROP COLUMN "caseNo";

-- AlterTable
ALTER TABLE "service_cases" ADD COLUMN     "caseNo" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "service_cases_caseNo_key" ON "service_cases"("caseNo");
