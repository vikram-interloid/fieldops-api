-- AlterTable
ALTER TABLE "service_cases" ALTER COLUMN "caseNo" SET DEFAULT 'CASE-' || lpad(nextval('service_case_code_seq')::text, 6, '0');

-- AlterTable
ALTER TABLE "work_orders" ALTER COLUMN "workOrderNo" SET DEFAULT 'WO-' || lpad(nextval('work_order_code_seq')::text, 8, '0');
