-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "ShiftExpenseType" AS ENUM ('REFUND', 'INTERNAL_SPEND', 'PURCHASE', 'OTHER');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "shiftId" TEXT;

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "status" "ShiftStatus" NOT NULL DEFAULT 'OPEN',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "shiftDateYmd" TEXT NOT NULL,
    "openedById" TEXT NOT NULL,
    "closedById" TEXT,
    "openingCash" DECIMAL(12,2) NOT NULL,
    "expectedCash" DECIMAL(12,2),
    "actualCash" DECIMAL(12,2),
    "cashSalesAtClose" DECIMAL(12,2),
    "expensesAtClose" DECIMAL(12,2),
    "difference" DECIMAL(12,2),
    "differenceReason" TEXT,
    "approvedByManagerId" TEXT,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftExpense" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" "ShiftExpenseType" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "ShiftExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Shift_status_idx" ON "Shift"("status");

-- CreateIndex
CREATE INDEX "Shift_shiftDateYmd_idx" ON "Shift"("shiftDateYmd");

-- CreateIndex
CREATE INDEX "Shift_openedAt_idx" ON "Shift"("openedAt");

-- CreateIndex
CREATE INDEX "ShiftExpense_shiftId_idx" ON "ShiftExpense"("shiftId");

-- CreateIndex
CREATE INDEX "ShiftExpense_createdAt_idx" ON "ShiftExpense"("createdAt");

-- CreateIndex
CREATE INDEX "Order_shiftId_idx" ON "Order"("shiftId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_approvedByManagerId_fkey" FOREIGN KEY ("approvedByManagerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftExpense" ADD CONSTRAINT "ShiftExpense_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftExpense" ADD CONSTRAINT "ShiftExpense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
