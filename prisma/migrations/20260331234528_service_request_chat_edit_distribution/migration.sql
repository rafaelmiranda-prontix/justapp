-- CreateEnum
CREATE TYPE "ServiceDistributionBatchStatus" AS ENUM ('OPEN', 'CLOSED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'SERVICE_REQUEST_UPDATED';

-- AlterEnum
ALTER TYPE "ServiceRequestAttachmentKind" ADD VALUE 'CHAT';

-- AlterTable
ALTER TABLE "service_request_messages" ADD COLUMN     "attachmentId" TEXT;

-- AlterTable
ALTER TABLE "service_requests" ADD COLUMN     "solicitorNotes" TEXT;

-- CreateTable
CREATE TABLE "service_request_field_changes" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "changedByUserId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL DEFAULT 'update',
    "fieldName" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_request_field_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_distribution_rules" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "monthlyOpportunityQuota" INTEGER NOT NULL DEFAULT 100,
    "batchSize" INTEGER NOT NULL DEFAULT 30,
    "priorityWeight" INTEGER NOT NULL DEFAULT 0,
    "acceptanceWindowMinutes" INTEGER NOT NULL DEFAULT 1440,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_distribution_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_distribution_quota_usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "referenceMonth" TEXT NOT NULL,
    "opportunitiesDelivered" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_distribution_quota_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_distribution_batches" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "batchNumber" INTEGER NOT NULL,
    "distributedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptanceWindowEndsAt" TIMESTAMP(3) NOT NULL,
    "status" "ServiceDistributionBatchStatus" NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "service_distribution_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_distribution_candidates" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "advogadoId" TEXT NOT NULL,
    "priorityScore" INTEGER NOT NULL DEFAULT 0,
    "deliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_distribution_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_request_participant_reads" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadMessageId" TEXT,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_request_participant_reads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_request_field_changes_requestId_createdAt_idx" ON "service_request_field_changes"("requestId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "plan_distribution_rules_planId_key" ON "plan_distribution_rules"("planId");

-- CreateIndex
CREATE INDEX "user_distribution_quota_usage_referenceMonth_idx" ON "user_distribution_quota_usage"("referenceMonth");

-- CreateIndex
CREATE UNIQUE INDEX "user_distribution_quota_usage_userId_referenceMonth_key" ON "user_distribution_quota_usage"("userId", "referenceMonth");

-- CreateIndex
CREATE INDEX "service_distribution_batches_requestId_batchNumber_idx" ON "service_distribution_batches"("requestId", "batchNumber");

-- CreateIndex
CREATE INDEX "service_distribution_batches_status_acceptanceWindowEndsAt_idx" ON "service_distribution_batches"("status", "acceptanceWindowEndsAt");

-- CreateIndex
CREATE INDEX "service_distribution_candidates_batchId_idx" ON "service_distribution_candidates"("batchId");

-- CreateIndex
CREATE INDEX "service_distribution_candidates_advogadoId_idx" ON "service_distribution_candidates"("advogadoId");

-- CreateIndex
CREATE UNIQUE INDEX "service_distribution_candidates_requestId_advogadoId_key" ON "service_distribution_candidates"("requestId", "advogadoId");

-- CreateIndex
CREATE UNIQUE INDEX "service_request_participant_reads_requestId_userId_key" ON "service_request_participant_reads"("requestId", "userId");

-- CreateIndex
CREATE INDEX "service_request_messages_attachmentId_idx" ON "service_request_messages"("attachmentId");

-- AddForeignKey
ALTER TABLE "service_request_field_changes" ADD CONSTRAINT "service_request_field_changes_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_request_field_changes" ADD CONSTRAINT "service_request_field_changes_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_distribution_rules" ADD CONSTRAINT "plan_distribution_rules_planId_fkey" FOREIGN KEY ("planId") REFERENCES "planos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_distribution_quota_usage" ADD CONSTRAINT "user_distribution_quota_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_distribution_batches" ADD CONSTRAINT "service_distribution_batches_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_distribution_candidates" ADD CONSTRAINT "service_distribution_candidates_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_distribution_candidates" ADD CONSTRAINT "service_distribution_candidates_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "service_distribution_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_distribution_candidates" ADD CONSTRAINT "service_distribution_candidates_advogadoId_fkey" FOREIGN KEY ("advogadoId") REFERENCES "advogados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_request_participant_reads" ADD CONSTRAINT "service_request_participant_reads_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_request_participant_reads" ADD CONSTRAINT "service_request_participant_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_request_messages" ADD CONSTRAINT "service_request_messages_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "service_request_attachments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
