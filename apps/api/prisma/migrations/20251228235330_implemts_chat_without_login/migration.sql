-- CreateEnum
CREATE TYPE "DraftStatus" AS ENUM ('DRAFT', 'PROMOTED');

-- CreateTable
CREATE TABLE "case_drafts" (
    "id" TEXT NOT NULL,
    "rawText" TEXT,
    "audioUrl" TEXT,
    "hasProofs" BOOLEAN,
    "proofTypes" TEXT,
    "hasContract" BOOLEAN,
    "contactedParty" BOOLEAN,
    "desiredOutcome" TEXT,
    "urgency" "UrgencyLevel",
    "status" "DraftStatus" NOT NULL DEFAULT 'DRAFT',
    "promotedCaseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "case_drafts_status_idx" ON "case_drafts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "case_drafts_promotedCaseId_key" ON "case_drafts"("promotedCaseId");

-- AddForeignKey
ALTER TABLE "case_drafts" ADD CONSTRAINT "case_drafts_promotedCaseId_fkey" FOREIGN KEY ("promotedCaseId") REFERENCES "cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
