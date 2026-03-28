-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "confirmationCode" TEXT;
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "checkedInAt" TIMESTAMP(3);

-- Backfill confirmation codes for existing rows (unique per row)
UPDATE "Reservation"
SET "confirmationCode" = upper(substr(md5(id::text), 1, 8))
WHERE "confirmationCode" IS NULL;

ALTER TABLE "Reservation" ALTER COLUMN "confirmationCode" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Reservation_confirmationCode_key" ON "Reservation"("confirmationCode");

-- CreateTable
CREATE TABLE IF NOT EXISTS "StaffNotification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StaffNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "StaffNotification_createdAt_idx" ON "StaffNotification"("createdAt");
