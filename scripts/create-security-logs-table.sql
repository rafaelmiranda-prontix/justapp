-- Script SQL para criar a tabela security_logs manualmente
-- Execute este script diretamente no banco de dados se o Prisma não conseguir aplicar

-- Verificar se a tabela já existe antes de criar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'security_logs'
    ) THEN
        -- CreateTable
        CREATE TABLE "security_logs" (
            "id" TEXT NOT NULL,
            "action" TEXT NOT NULL,
            "actorId" TEXT NOT NULL,
            "actorEmail" TEXT NOT NULL,
            "actorName" TEXT NOT NULL,
            "actorRole" TEXT NOT NULL,
            "targetType" TEXT NOT NULL,
            "targetId" TEXT NOT NULL,
            "targetIdentifier" TEXT,
            "changes" JSONB,
            "metadata" JSONB,
            "severity" TEXT NOT NULL DEFAULT 'INFO',
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "security_logs_pkey" PRIMARY KEY ("id")
        );

        -- CreateIndex
        CREATE INDEX "security_logs_action_idx" ON "security_logs"("action");
        CREATE INDEX "security_logs_actorId_idx" ON "security_logs"("actorId");
        CREATE INDEX "security_logs_targetType_targetId_idx" ON "security_logs"("targetType", "targetId");
        CREATE INDEX "security_logs_createdAt_idx" ON "security_logs"("createdAt");
        CREATE INDEX "security_logs_severity_idx" ON "security_logs"("severity");

        RAISE NOTICE 'Tabela security_logs criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela security_logs já existe.';
    END IF;
END $$;
