-- AlterTable (IF NOT EXISTS para evitar erro se a coluna já existir)
ALTER TABLE "advogados" ADD COLUMN IF NOT EXISTS "preAprovado" BOOLEAN NOT NULL DEFAULT false;
