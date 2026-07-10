-- AlterTable
ALTER TABLE "service_cases" ADD COLUMN     "assigned_operator_org_id" INTEGER,
ADD COLUMN     "interested_operator_ids" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "preferred_operator_id" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_org_admin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "work_order_events" (
    "id" SERIAL NOT NULL,
    "work_order_id" INTEGER NOT NULL,
    "type" VARCHAR(40) NOT NULL,
    "from_value" VARCHAR(150),
    "to_value" VARCHAR(150),
    "note" TEXT,
    "actor_id" INTEGER,
    "actor_name" VARCHAR(150),
    "actor_role" VARCHAR(40),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_order_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_case_events" (
    "id" SERIAL NOT NULL,
    "service_case_id" INTEGER NOT NULL,
    "type" VARCHAR(40) NOT NULL,
    "from_value" VARCHAR(150),
    "to_value" VARCHAR(150),
    "note" TEXT,
    "actor_id" INTEGER,
    "actor_name" VARCHAR(150),
    "actor_role" VARCHAR(40),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_case_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technician_events" (
    "id" SERIAL NOT NULL,
    "technician_id" INTEGER NOT NULL,
    "type" VARCHAR(40) NOT NULL,
    "from_value" VARCHAR(150),
    "to_value" VARCHAR(150),
    "note" TEXT,
    "actor_id" INTEGER,
    "actor_name" VARCHAR(150),
    "actor_role" VARCHAR(40),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "technician_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "work_order_events_work_order_id_idx" ON "work_order_events"("work_order_id");

-- CreateIndex
CREATE INDEX "service_case_events_service_case_id_idx" ON "service_case_events"("service_case_id");

-- CreateIndex
CREATE INDEX "technician_events_technician_id_idx" ON "technician_events"("technician_id");

-- AddForeignKey
ALTER TABLE "work_order_events" ADD CONSTRAINT "work_order_events_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_case_events" ADD CONSTRAINT "service_case_events_service_case_id_fkey" FOREIGN KEY ("service_case_id") REFERENCES "service_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_events" ADD CONSTRAINT "technician_events_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "technicians"("id") ON DELETE CASCADE ON UPDATE CASCADE;

