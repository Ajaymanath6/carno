-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "ConversationPhase" AS ENUM ('CHAT', 'ASK_REACTION', 'ASK_COMPARE_YESTERDAY');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DaySession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "localDate" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "closedAt" TIMESTAMP(3),
    "phase" "ConversationPhase" NOT NULL DEFAULT 'CHAT',
    "pendingFoodEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DaySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodEntry" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "foodNameNormalized" TEXT NOT NULL,
    "quantity" TEXT,
    "unit" TEXT,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "followUpDueAt" TIMESTAMP(3) NOT NULL,
    "followUpPromptSentAt" TIMESTAMP(3),
    "followUpCompletedAt" TIMESTAMP(3),
    "followUpNotifiedAt" TIMESTAMP(3),

    CONSTRAINT "FoodEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReactionEntry" (
    "id" TEXT NOT NULL,
    "foodEntryId" TEXT NOT NULL,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "energyLevel" INTEGER,
    "bloating" INTEGER,
    "gas" INTEGER,
    "stomachDiscomfort" INTEGER,
    "mood" INTEGER,
    "notes" TEXT,
    "ateYesterdaySame" BOOLEAN,
    "feltDifferentNotes" TEXT,
    "symptomsBetterOrWorse" TEXT,

    CONSTRAINT "ReactionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailySummary" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "dayOverallSurvey" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailySummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "DaySession_userId_localDate_idx" ON "DaySession"("userId", "localDate");

-- CreateIndex
CREATE UNIQUE INDEX "DaySession_userId_localDate_key" ON "DaySession"("userId", "localDate");

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_createdAt_idx" ON "ChatMessage"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "FoodEntry_sessionId_idx" ON "FoodEntry"("sessionId");

-- CreateIndex
CREATE INDEX "FoodEntry_followUpDueAt_idx" ON "FoodEntry"("followUpDueAt");

-- CreateIndex
CREATE INDEX "ReactionEntry_foodEntryId_idx" ON "ReactionEntry"("foodEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "DailySummary_sessionId_key" ON "DailySummary"("sessionId");

-- AddForeignKey
ALTER TABLE "DaySession" ADD CONSTRAINT "DaySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DaySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodEntry" ADD CONSTRAINT "FoodEntry_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DaySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReactionEntry" ADD CONSTRAINT "ReactionEntry_foodEntryId_fkey" FOREIGN KEY ("foodEntryId") REFERENCES "FoodEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailySummary" ADD CONSTRAINT "DailySummary_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DaySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
