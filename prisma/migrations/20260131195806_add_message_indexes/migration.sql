-- CreateEnum
CREATE TYPE "StatusAssinatura" AS ENUM ('ATIVA', 'CANCELADA', 'EXPIRADA', 'SUSPENSA');

-- CreateEnum
CREATE TYPE "CanceladoPor" AS ENUM ('USUARIO', 'ADMIN', 'SISTEMA', 'PAGAMENTO_FALHOU');

-- AlterTable
ALTER TABLE "casos" ADD COLUMN     "conversaHistorico" JSONB;

-- CreateTable
CREATE TABLE "planos" (
    "id" TEXT NOT NULL,
    "codigo" "Plano" NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "preco" INTEGER NOT NULL DEFAULT 0,
    "precoDisplay" INTEGER NOT NULL DEFAULT 0,
    "leadsPerMonth" INTEGER NOT NULL DEFAULT 0,
    "features" TEXT[],
    "stripePriceId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_assinaturas" (
    "id" TEXT NOT NULL,
    "advogadoId" TEXT NOT NULL,
    "planoId" TEXT NOT NULL,
    "planoAnteriorId" TEXT,
    "status" "StatusAssinatura" NOT NULL DEFAULT 'ATIVA',
    "precoPago" INTEGER,
    "leadsLimite" INTEGER NOT NULL,
    "inicioEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fimEm" TIMESTAMP(3),
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "motivo" TEXT,
    "canceladoPor" "CanceladoPor",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "historico_assinaturas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "planos_codigo_key" ON "planos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "planos_stripePriceId_key" ON "planos"("stripePriceId");

-- CreateIndex
CREATE INDEX "planos_ativo_idx" ON "planos"("ativo");

-- CreateIndex
CREATE INDEX "planos_ordem_idx" ON "planos"("ordem");

-- CreateIndex
CREATE INDEX "historico_assinaturas_advogadoId_idx" ON "historico_assinaturas"("advogadoId");

-- CreateIndex
CREATE INDEX "historico_assinaturas_planoId_idx" ON "historico_assinaturas"("planoId");

-- CreateIndex
CREATE INDEX "historico_assinaturas_status_idx" ON "historico_assinaturas"("status");

-- CreateIndex
CREATE INDEX "historico_assinaturas_inicioEm_idx" ON "historico_assinaturas"("inicioEm");

-- AddForeignKey
ALTER TABLE "historico_assinaturas" ADD CONSTRAINT "historico_assinaturas_advogadoId_fkey" FOREIGN KEY ("advogadoId") REFERENCES "advogados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_assinaturas" ADD CONSTRAINT "historico_assinaturas_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "planos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
