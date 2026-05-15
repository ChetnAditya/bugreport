-- AlterEnum: Replace ADMIN with SUPERADMIN + TEAMLEAD
-- Step 1: Add new values
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUPERADMIN';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'TEAMLEAD';

-- CreateTable Team
CREATE TABLE IF NOT EXISTS "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Team_slug_key" ON "Team"("slug");

-- AlterTable User: add teamId and directManagerId
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "teamId" TEXT,
  ADD COLUMN IF NOT EXISTS "directManagerId" TEXT;

-- AlterTable Bug: add teamId
ALTER TABLE "Bug"
  ADD COLUMN IF NOT EXISTS "teamId" TEXT;

-- CreateIndex on Bug.teamId
CREATE INDEX IF NOT EXISTS "Bug_teamId_idx" ON "Bug"("teamId");

-- AddForeignKey User -> Team
ALTER TABLE "User"
  ADD CONSTRAINT "User_teamId_fkey"
  FOREIGN KEY ("teamId") REFERENCES "Team"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey User -> User (manager)
ALTER TABLE "User"
  ADD CONSTRAINT "User_directManagerId_fkey"
  FOREIGN KEY ("directManagerId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey Bug -> Team
ALTER TABLE "Bug"
  ADD CONSTRAINT "Bug_teamId_fkey"
  FOREIGN KEY ("teamId") REFERENCES "Team"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
