-- AlterTable
ALTER TABLE "advogados"
ADD COLUMN "freeLeadsBonusMes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "freeLeadsBonusRef" VARCHAR(7);
