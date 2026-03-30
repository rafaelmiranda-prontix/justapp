-- AlterTable
ALTER TABLE "matches" ADD COLUMN "notificadoEm" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "matches_notificadoEm_idx" ON "matches"("notificadoEm");
