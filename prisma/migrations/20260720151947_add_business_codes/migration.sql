-- Create sequences
CREATE SEQUENCE work_order_code_seq START 1;
CREATE SEQUENCE service_case_code_seq START 1;

-- AlterTable
ALTER TABLE "service_cases" ALTER COLUMN "caseNo" SET DEFAULT 'CASE-' || lpad(nextval('service_case_code_seq')::text, 6, '0');

-- AlterTable
ALTER TABLE "work_orders" ALTER COLUMN "workOrderNo" SET DEFAULT 'WO-' || lpad(nextval('work_order_code_seq')::text, 8, '0');

ALTER TABLE "work_orders"
ADD CONSTRAINT "work_orders_work_order_no_key"
UNIQUE ("workOrderNo");

ALTER TABLE "service_cases"
ADD CONSTRAINT "service_cases_case_no_key"
UNIQUE ("caseNo");