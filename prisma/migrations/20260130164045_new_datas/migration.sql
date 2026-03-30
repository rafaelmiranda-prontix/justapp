-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PRE_ACTIVE', 'ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CIDADAO', 'ADVOGADO', 'ADMIN');

-- CreateEnum
CREATE TYPE "Plano" AS ENUM ('FREE', 'BASIC', 'PREMIUM');

-- CreateEnum
CREATE TYPE "Urgencia" AS ENUM ('BAIXA', 'NORMAL', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "CasoStatus" AS ENUM ('PENDENTE_ATIVACAO', 'ABERTO', 'EM_ANDAMENTO', 'FECHADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PENDENTE', 'VISUALIZADO', 'ACEITO', 'RECUSADO', 'CONTRATADO', 'EXPIRADO');

-- CreateEnum
CREATE TYPE "ConfiguracaoTipo" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'CONVERTED', 'ABANDONED', 'EXPIRED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "image" TEXT,
    "phone" TEXT,
    "password" TEXT,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "activationToken" TEXT,
    "activationExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "cidadaos" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cidade" TEXT,
    "estado" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cidadaos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advogados" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "oab" TEXT NOT NULL,
    "oabVerificado" BOOLEAN NOT NULL DEFAULT false,
    "bio" TEXT,
    "fotoUrl" TEXT,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "raioAtuacao" INTEGER NOT NULL DEFAULT 50,
    "precoConsulta" DOUBLE PRECISION,
    "aceitaOnline" BOOLEAN NOT NULL DEFAULT true,
    "plano" "Plano" NOT NULL DEFAULT 'FREE',
    "planoExpira" TIMESTAMP(3),
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "leadsRecebidosMes" INTEGER NOT NULL DEFAULT 0,
    "leadsLimiteMes" INTEGER NOT NULL DEFAULT 0,
    "ultimoResetLeads" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isBeta" BOOLEAN NOT NULL DEFAULT false,
    "betaInviteCode" TEXT,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "advogados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "especialidades" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descricao" TEXT,
    "palavrasChave" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "especialidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advogado_especialidades" (
    "advogadoId" TEXT NOT NULL,
    "especialidadeId" TEXT NOT NULL,

    CONSTRAINT "advogado_especialidades_pkey" PRIMARY KEY ("advogadoId","especialidadeId")
);

-- CreateTable
CREATE TABLE "casos" (
    "id" TEXT NOT NULL,
    "cidadaoId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "descricaoIA" TEXT,
    "especialidadeId" TEXT,
    "urgencia" "Urgencia" NOT NULL DEFAULT 'NORMAL',
    "complexidade" INTEGER NOT NULL DEFAULT 1,
    "status" "CasoStatus" NOT NULL DEFAULT 'PENDENTE_ATIVACAO',
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "casos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "casoId" TEXT NOT NULL,
    "advogadoId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "distanciaKm" DOUBLE PRECISION,
    "status" "MatchStatus" NOT NULL DEFAULT 'PENDENTE',
    "enviadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visualizadoEm" TIMESTAMP(3),
    "respondidoEm" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensagens" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "remetenteId" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "anexoUrl" TEXT,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliacoes" (
    "id" TEXT NOT NULL,
    "cidadaoId" TEXT NOT NULL,
    "advogadoId" TEXT NOT NULL,
    "nota" INTEGER NOT NULL,
    "comentario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avaliacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracoes" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "tipo" "ConfiguracaoTipo" NOT NULL DEFAULT 'STRING',
    "descricao" TEXT,
    "categoria" TEXT NOT NULL DEFAULT 'geral',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anonymous_sessions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "mensagens" JSONB[],
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "especialidadeDetectada" TEXT,
    "urgenciaDetectada" TEXT,
    "preQualificationState" JSONB,
    "preQualificationScore" INTEGER,
    "useAI" BOOLEAN NOT NULL DEFAULT false,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "convertedToUserId" TEXT,
    "convertedToCasoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anonymous_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_activationToken_key" ON "users"("activationToken");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "cidadaos_userId_key" ON "cidadaos"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "advogados_userId_key" ON "advogados"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "advogados_oab_key" ON "advogados"("oab");

-- CreateIndex
CREATE UNIQUE INDEX "advogados_stripeCustomerId_key" ON "advogados"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "advogados_stripeSubscriptionId_key" ON "advogados"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "advogados_betaInviteCode_key" ON "advogados"("betaInviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "especialidades_nome_key" ON "especialidades"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "especialidades_slug_key" ON "especialidades"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "casos_sessionId_key" ON "casos"("sessionId");

-- CreateIndex
CREATE INDEX "casos_cidadaoId_idx" ON "casos"("cidadaoId");

-- CreateIndex
CREATE INDEX "casos_especialidadeId_idx" ON "casos"("especialidadeId");

-- CreateIndex
CREATE INDEX "casos_status_idx" ON "casos"("status");

-- CreateIndex
CREATE INDEX "casos_sessionId_idx" ON "casos"("sessionId");

-- CreateIndex
CREATE INDEX "matches_advogadoId_idx" ON "matches"("advogadoId");

-- CreateIndex
CREATE INDEX "matches_status_idx" ON "matches"("status");

-- CreateIndex
CREATE UNIQUE INDEX "matches_casoId_advogadoId_key" ON "matches"("casoId", "advogadoId");

-- CreateIndex
CREATE INDEX "mensagens_matchId_idx" ON "mensagens"("matchId");

-- CreateIndex
CREATE INDEX "mensagens_remetenteId_idx" ON "mensagens"("remetenteId");

-- CreateIndex
CREATE INDEX "avaliacoes_advogadoId_idx" ON "avaliacoes"("advogadoId");

-- CreateIndex
CREATE UNIQUE INDEX "avaliacoes_cidadaoId_advogadoId_key" ON "avaliacoes"("cidadaoId", "advogadoId");

-- CreateIndex
CREATE UNIQUE INDEX "configuracoes_chave_key" ON "configuracoes"("chave");

-- CreateIndex
CREATE INDEX "configuracoes_categoria_idx" ON "configuracoes"("categoria");

-- CreateIndex
CREATE UNIQUE INDEX "anonymous_sessions_sessionId_key" ON "anonymous_sessions"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "anonymous_sessions_convertedToUserId_key" ON "anonymous_sessions"("convertedToUserId");

-- CreateIndex
CREATE UNIQUE INDEX "anonymous_sessions_convertedToCasoId_key" ON "anonymous_sessions"("convertedToCasoId");

-- CreateIndex
CREATE INDEX "anonymous_sessions_sessionId_idx" ON "anonymous_sessions"("sessionId");

-- CreateIndex
CREATE INDEX "anonymous_sessions_status_idx" ON "anonymous_sessions"("status");

-- CreateIndex
CREATE INDEX "anonymous_sessions_createdAt_idx" ON "anonymous_sessions"("createdAt");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cidadaos" ADD CONSTRAINT "cidadaos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advogados" ADD CONSTRAINT "advogados_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advogado_especialidades" ADD CONSTRAINT "advogado_especialidades_advogadoId_fkey" FOREIGN KEY ("advogadoId") REFERENCES "advogados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advogado_especialidades" ADD CONSTRAINT "advogado_especialidades_especialidadeId_fkey" FOREIGN KEY ("especialidadeId") REFERENCES "especialidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casos" ADD CONSTRAINT "casos_cidadaoId_fkey" FOREIGN KEY ("cidadaoId") REFERENCES "cidadaos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casos" ADD CONSTRAINT "casos_especialidadeId_fkey" FOREIGN KEY ("especialidadeId") REFERENCES "especialidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "casos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_advogadoId_fkey" FOREIGN KEY ("advogadoId") REFERENCES "advogados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_cidadaoId_fkey" FOREIGN KEY ("cidadaoId") REFERENCES "cidadaos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_advogadoId_fkey" FOREIGN KEY ("advogadoId") REFERENCES "advogados"("id") ON DELETE CASCADE ON UPDATE CASCADE;
