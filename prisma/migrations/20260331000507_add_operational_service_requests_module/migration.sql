-- CreateEnum
CREATE TYPE "OperationalServiceKind" AS ENUM ('AUDIENCIA', 'PROTOCOLO', 'COPIA', 'DILIGENCIA_FORUM', 'DESPACHO', 'PERSONALIZADO');

-- CreateEnum
CREATE TYPE "ServiceRequestStatus" AS ENUM ('PUBLICADO', 'ACEITO', 'EM_ANDAMENTO', 'REALIZADO', 'AGUARDANDO_VALIDACAO', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "ServiceRequestAttachmentKind" AS ENUM ('PUBLICACAO', 'EVIDENCIA');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'SERVICE_REQUEST_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'SERVICE_REQUEST_MESSAGE';
ALTER TYPE "NotificationType" ADD VALUE 'SERVICE_REQUEST_STATUS';
ALTER TYPE "NotificationType" ADD VALUE 'SERVICE_REQUEST_PENDING_COMPLETION';

-- CreateTable
CREATE TABLE "correspondent_profiles" (
    "id" TEXT NOT NULL,
    "advogadoId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "minFeeCents" INTEGER,
    "availabilityJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "correspondent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correspondent_regions" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "cidade" TEXT,
    "estado" TEXT,
    "comarca" TEXT,
    "forum" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "correspondent_regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correspondent_accepted_kinds" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "kind" "OperationalServiceKind" NOT NULL,

    CONSTRAINT "correspondent_accepted_kinds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_requests" (
    "id" TEXT NOT NULL,
    "solicitorAdvogadoId" TEXT NOT NULL,
    "correspondentAdvogadoId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "kind" "OperationalServiceKind" NOT NULL,
    "customKindDescription" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "comarca" TEXT,
    "forum" TEXT,
    "offeredAmountCents" INTEGER,
    "acceptDeadlineAt" TIMESTAMP(3) NOT NULL,
    "status" "ServiceRequestStatus" NOT NULL DEFAULT 'PUBLICADO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_request_attachments" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "kind" "ServiceRequestAttachmentKind" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_request_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_request_messages" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_request_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_request_status_history" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "fromStatus" "ServiceRequestStatus",
    "toStatus" "ServiceRequestStatus" NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "note" TEXT,
    "isAdminOverride" BOOLEAN NOT NULL DEFAULT false,
    "adminReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_request_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_reviews" (
    "id" TEXT NOT NULL,
    "serviceRequestId" TEXT NOT NULL,
    "reviewerAdvogadoId" TEXT NOT NULL,
    "targetAdvogadoId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "correspondent_profiles_advogadoId_key" ON "correspondent_profiles"("advogadoId");

-- CreateIndex
CREATE INDEX "correspondent_regions_profileId_idx" ON "correspondent_regions"("profileId");

-- CreateIndex
CREATE INDEX "correspondent_regions_estado_cidade_idx" ON "correspondent_regions"("estado", "cidade");

-- CreateIndex
CREATE UNIQUE INDEX "correspondent_accepted_kinds_profileId_kind_key" ON "correspondent_accepted_kinds"("profileId", "kind");

-- CreateIndex
CREATE INDEX "service_requests_status_scheduledAt_idx" ON "service_requests"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "service_requests_solicitorAdvogadoId_idx" ON "service_requests"("solicitorAdvogadoId");

-- CreateIndex
CREATE INDEX "service_requests_correspondentAdvogadoId_idx" ON "service_requests"("correspondentAdvogadoId");

-- CreateIndex
CREATE INDEX "service_requests_status_kind_idx" ON "service_requests"("status", "kind");

-- CreateIndex
CREATE INDEX "service_request_attachments_requestId_idx" ON "service_request_attachments"("requestId");

-- CreateIndex
CREATE INDEX "service_request_messages_requestId_createdAt_idx" ON "service_request_messages"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "service_request_status_history_requestId_createdAt_idx" ON "service_request_status_history"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "service_reviews_targetAdvogadoId_idx" ON "service_reviews"("targetAdvogadoId");

-- CreateIndex
CREATE UNIQUE INDEX "service_reviews_serviceRequestId_reviewerAdvogadoId_key" ON "service_reviews"("serviceRequestId", "reviewerAdvogadoId");

-- AddForeignKey
ALTER TABLE "correspondent_profiles" ADD CONSTRAINT "correspondent_profiles_advogadoId_fkey" FOREIGN KEY ("advogadoId") REFERENCES "advogados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correspondent_regions" ADD CONSTRAINT "correspondent_regions_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "correspondent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correspondent_accepted_kinds" ADD CONSTRAINT "correspondent_accepted_kinds_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "correspondent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_solicitorAdvogadoId_fkey" FOREIGN KEY ("solicitorAdvogadoId") REFERENCES "advogados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_correspondentAdvogadoId_fkey" FOREIGN KEY ("correspondentAdvogadoId") REFERENCES "advogados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_request_attachments" ADD CONSTRAINT "service_request_attachments_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_request_attachments" ADD CONSTRAINT "service_request_attachments_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_request_messages" ADD CONSTRAINT "service_request_messages_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_request_messages" ADD CONSTRAINT "service_request_messages_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_request_status_history" ADD CONSTRAINT "service_request_status_history_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_request_status_history" ADD CONSTRAINT "service_request_status_history_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_reviews" ADD CONSTRAINT "service_reviews_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_reviews" ADD CONSTRAINT "service_reviews_reviewerAdvogadoId_fkey" FOREIGN KEY ("reviewerAdvogadoId") REFERENCES "advogados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_reviews" ADD CONSTRAINT "service_reviews_targetAdvogadoId_fkey" FOREIGN KEY ("targetAdvogadoId") REFERENCES "advogados"("id") ON DELETE CASCADE ON UPDATE CASCADE;
