-- AlterTable
ALTER TABLE "mensagens" ADD COLUMN     "isEdited" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "mensagens" ADD COLUMN     "editedAt" TIMESTAMP(3);
ALTER TABLE "mensagens" ADD COLUMN     "editCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "mensagens" ADD COLUMN     "lastEditedByUserId" TEXT;
ALTER TABLE "mensagens" ADD COLUMN     "deletedAt" TIMESTAMP(3);
ALTER TABLE "mensagens" ADD COLUMN     "blockedForReview" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "message_edit_history" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "previousContent" TEXT NOT NULL,
    "newContent" TEXT NOT NULL,
    "editedByUserId" TEXT NOT NULL,
    "editedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_edit_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "message_edit_history_messageId_idx" ON "message_edit_history"("messageId");

-- CreateIndex
CREATE INDEX "message_edit_history_editedAt_idx" ON "message_edit_history"("editedAt");

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_lastEditedByUserId_fkey" FOREIGN KEY ("lastEditedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_edit_history" ADD CONSTRAINT "message_edit_history_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "mensagens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_edit_history" ADD CONSTRAINT "message_edit_history_editedByUserId_fkey" FOREIGN KEY ("editedByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
