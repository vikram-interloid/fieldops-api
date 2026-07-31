CREATE SEQUENCE IF NOT EXISTS customer_code_seq START 1;
CREATE SEQUENCE IF NOT EXISTS technician_code_seq START 1;
CREATE SEQUENCE IF NOT EXISTS asset_code_seq START 1;
CREATE SEQUENCE IF NOT EXISTS work_order_code_seq START 1;
CREATE SEQUENCE IF NOT EXISTS service_case_code_seq START 1;

CREATE OR REPLACE FUNCTION next_customer_no()
RETURNS TEXT AS $$
BEGIN
    RETURN 'CUS-' || LPAD(nextval('customer_code_seq')::text, 6, '0');
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION next_technician_no()
RETURNS TEXT AS $$
BEGIN
    RETURN 'TECH-' || LPAD(nextval('technician_code_seq')::text, 6, '0');
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION next_asset_no()
RETURNS TEXT AS $$
BEGIN
    RETURN 'AST-' || LPAD(nextval('asset_code_seq')::text, 6, '0');
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION next_work_order_no()
RETURNS TEXT AS $$
BEGIN
    RETURN 'WO-' || LPAD(nextval('work_order_code_seq')::text, 6, '0');
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION next_service_case_no()
RETURNS TEXT AS $$
BEGIN
    RETURN 'CASE-' || LPAD(nextval('service_case_code_seq')::text, 6, '0');
END;
$$ LANGUAGE plpgsql;



-- AlterTable
ALTER TABLE "assets" ALTER COLUMN "assetNo" SET DEFAULT next_asset_no();

-- AlterTable
ALTER TABLE "customers" ALTER COLUMN "customerNo" SET DEFAULT next_customer_no();

-- AlterTable
ALTER TABLE "service_cases" ALTER COLUMN "caseNo" SET DEFAULT next_service_case_no();

-- AlterTable
ALTER TABLE "technicians" ALTER COLUMN "technicianNo" SET DEFAULT next_technician_no();

-- AlterTable
ALTER TABLE "work_orders" ALTER COLUMN "workOrderNo" SET DEFAULT next_work_order_no();
