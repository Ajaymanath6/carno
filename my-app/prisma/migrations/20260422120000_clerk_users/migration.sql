-- Clerk auth: drop password users and add clerkUserId (existing app users must sign up again via Clerk).
DELETE FROM "User";

ALTER TABLE "User" DROP COLUMN "passwordHash";

ALTER TABLE "User" ADD COLUMN "clerkUserId" TEXT NOT NULL;

CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");
