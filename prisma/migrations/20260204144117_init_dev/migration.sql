-- AlterEnum
ALTER TYPE "Plano" ADD VALUE 'UNLIMITED';

-- AlterTable
ALTER TABLE "advogados" ADD COLUMN     "aceitaOutrosEstados" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "aprovado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "casosRecebidosHora" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ultimoResetCasosHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "casos" ADD COLUMN     "redistribuicoes" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "planos" ADD COLUMN     "leadsPerHour" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "planos_status_idx" ON "planos"("status");

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_remetenteId_fkey" FOREIGN KEY ("remetenteId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
