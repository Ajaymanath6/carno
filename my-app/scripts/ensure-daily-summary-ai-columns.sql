-- Align database with prisma/migrations/20260422130000_daily_summary_ai/migration.sql
-- Run in Neon SQL Editor if `npx prisma migrate deploy` was skipped, then mark migration applied:
--   npx prisma migrate resolve --applied 20260422130000_daily_summary_ai

ALTER TABLE "DailySummary" ADD COLUMN IF NOT EXISTS "aiArticle" TEXT;
ALTER TABLE "DailySummary" ADD COLUMN IF NOT EXISTS "aiGeneratedAt" TIMESTAMP(3);
