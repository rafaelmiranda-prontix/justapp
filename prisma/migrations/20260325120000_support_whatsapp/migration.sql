-- CreateEnum
CREATE TYPE "SupportContactSource" AS ENUM ('WHATSAPP', 'FORM', 'OTHER');

-- CreateEnum
CREATE TYPE "SupportChannel" AS ENUM ('WHATSAPP', 'OTHER');

-- CreateEnum
CREATE TYPE "SupportConversationStatus" AS ENUM ('OPEN', 'PENDING', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SupportMessageSenderType" AS ENUM ('BOT', 'USER', 'AGENT');

-- CreateTable
CREATE TABLE "support_contacts" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "crm" TEXT,
    "userId" TEXT,
    "source" "SupportContactSource" NOT NULL DEFAULT 'WHATSAPP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_conversations" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "userId" TEXT,
    "channel" "SupportChannel" NOT NULL DEFAULT 'WHATSAPP',
    "status" "SupportConversationStatus" NOT NULL DEFAULT 'OPEN',
    "whatsappWaId" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderType" "SupportMessageSenderType" NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "externalMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "support_contacts_email_idx" ON "support_contacts"("email");

-- CreateIndex
CREATE INDEX "support_contacts_phone_idx" ON "support_contacts"("phone");

-- CreateIndex
CREATE INDEX "support_contacts_crm_idx" ON "support_contacts"("crm");

-- CreateIndex
CREATE INDEX "support_contacts_userId_idx" ON "support_contacts"("userId");

-- CreateIndex
CREATE INDEX "support_conversations_contactId_idx" ON "support_conversations"("contactId");

-- CreateIndex
CREATE INDEX "support_conversations_userId_idx" ON "support_conversations"("userId");

-- CreateIndex
CREATE INDEX "support_conversations_status_idx" ON "support_conversations"("status");

-- CreateIndex
CREATE INDEX "support_conversations_lastMessageAt_idx" ON "support_conversations"("lastMessageAt");

-- CreateIndex
CREATE INDEX "support_conversations_whatsappWaId_idx" ON "support_conversations"("whatsappWaId");

-- CreateIndex
CREATE UNIQUE INDEX "support_messages_externalMessageId_key" ON "support_messages"("externalMessageId");

-- CreateIndex
CREATE INDEX "support_messages_conversationId_createdAt_idx" ON "support_messages"("conversationId", "createdAt");

-- AddForeignKey
ALTER TABLE "support_contacts" ADD CONSTRAINT "support_contacts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_conversations" ADD CONSTRAINT "support_conversations_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "support_contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_conversations" ADD CONSTRAINT "support_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "support_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
