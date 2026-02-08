-- Aplicar migration de mediação (casos + case_messages)
-- Execute no Supabase: SQL Editor → New query → Cole este conteúdo → Run

-- 1) Novas colunas em casos
ALTER TABLE "casos" ADD COLUMN IF NOT EXISTS "mediatedByAdminId" TEXT;
ALTER TABLE "casos" ADD COLUMN IF NOT EXISTS "mediatedAt" TIMESTAMP(3);
ALTER TABLE "casos" ADD COLUMN IF NOT EXISTS "closedByAdminId" TEXT;
ALTER TABLE "casos" ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMP(3);
ALTER TABLE "casos" ADD COLUMN IF NOT EXISTS "closeSummary" TEXT;
ALTER TABLE "casos" ADD COLUMN IF NOT EXISTS "checklist" JSONB;

-- 2) Enum CloseReason
DO $$ BEGIN
  CREATE TYPE "CloseReason" AS ENUM (
    'RESOLVIDO',
    'SEM_RETORNO_DO_CLIENTE',
    'INCOMPLETO_SEM_DOCUMENTOS',
    'DUPLICADO',
    'FORA_DO_ESCOPO',
    'ENCERRADO_COM_ENCAMINHAMENTO'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "casos" ADD COLUMN IF NOT EXISTS "closeReason" "CloseReason";

-- 3) Novo valor no enum CasoStatus
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'CasoStatus' AND e.enumlabel = 'EM_MEDIACAO'
  ) THEN
    ALTER TYPE "CasoStatus" ADD VALUE 'EM_MEDIACAO';
  END IF;
END $$;

-- 4) Enums para case_messages
DO $$ BEGIN
  CREATE TYPE "CaseMessageSenderRole" AS ENUM ('ADMIN', 'CIDADAO');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  CREATE TYPE "CaseMessageVisibility" AS ENUM ('PUBLIC', 'INTERNAL');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 5) Tabela case_messages
CREATE TABLE IF NOT EXISTS "case_messages" (
  "id" TEXT NOT NULL,
  "casoId" TEXT NOT NULL,
  "senderRole" "CaseMessageSenderRole" NOT NULL,
  "senderId" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "attachmentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "visibility" "CaseMessageVisibility" NOT NULL DEFAULT 'PUBLIC',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "case_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "case_messages_casoId_idx" ON "case_messages"("casoId");
CREATE INDEX IF NOT EXISTS "case_messages_senderId_idx" ON "case_messages"("senderId");
CREATE INDEX IF NOT EXISTS "case_messages_createdAt_idx" ON "case_messages"("createdAt");
CREATE INDEX IF NOT EXISTS "casos_mediatedByAdminId_idx" ON "casos"("mediatedByAdminId");

-- 6) FKs
DO $$ BEGIN
  ALTER TABLE "casos" ADD CONSTRAINT "casos_mediatedByAdminId_fkey" FOREIGN KEY ("mediatedByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "casos" ADD CONSTRAINT "casos_closedByAdminId_fkey" FOREIGN KEY ("closedByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "case_messages" ADD CONSTRAINT "case_messages_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "casos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "case_messages" ADD CONSTRAINT "case_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
