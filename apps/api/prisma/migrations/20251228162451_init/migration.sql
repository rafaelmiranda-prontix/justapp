-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'LAWYER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UrgencyLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('PENDING_ANALYSIS', 'OPEN', 'MATCHED', 'CLOSED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lawyers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "oabNumber" TEXT NOT NULL,
    "oabState" TEXT NOT NULL,
    "bio" TEXT,
    "specialties" TEXT[],
    "credits" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lawyers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "rawText" TEXT,
    "audioUrl" TEXT,
    "category" TEXT,
    "subCategory" TEXT,
    "technicalSummary" TEXT,
    "urgency" "UrgencyLevel" NOT NULL DEFAULT 'MEDIUM',
    "aiConfidence" INTEGER,
    "status" "CaseStatus" NOT NULL DEFAULT 'PENDING_ANALYSIS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "lawyerId" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "lawyers_userId_key" ON "lawyers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "lawyers_oabNumber_key" ON "lawyers"("oabNumber");

-- CreateIndex
CREATE INDEX "cases_clientId_idx" ON "cases"("clientId");

-- CreateIndex
CREATE INDEX "cases_status_idx" ON "cases"("status");

-- CreateIndex
CREATE INDEX "cases_category_idx" ON "cases"("category");

-- CreateIndex
CREATE INDEX "matches_lawyerId_idx" ON "matches"("lawyerId");

-- CreateIndex
CREATE UNIQUE INDEX "matches_caseId_lawyerId_key" ON "matches"("caseId", "lawyerId");

-- AddForeignKey
ALTER TABLE "lawyers" ADD CONSTRAINT "lawyers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "lawyers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
