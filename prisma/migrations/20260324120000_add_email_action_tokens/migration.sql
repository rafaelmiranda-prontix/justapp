-- Convite beta por e-mail: tokens de aceite/recusa + data de recusa no advogado
ALTER TABLE "advogados" ADD COLUMN IF NOT EXISTS "betaInviteDeclinedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "email_action_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "batchId" TEXT,
    "advogadoId" TEXT NOT NULL,
    "templateType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_action_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_action_tokens_token_key" ON "email_action_tokens"("token");

-- CreateIndex
CREATE INDEX "email_action_tokens_advogadoId_idx" ON "email_action_tokens"("advogadoId");

-- CreateIndex
CREATE INDEX "email_action_tokens_expiresAt_idx" ON "email_action_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "email_action_tokens_batchId_idx" ON "email_action_tokens"("batchId");

-- AddForeignKey
ALTER TABLE "email_action_tokens" ADD CONSTRAINT "email_action_tokens_advogadoId_fkey" FOREIGN KEY ("advogadoId") REFERENCES "advogados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_action_tokens" ADD CONSTRAINT "email_action_tokens_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
