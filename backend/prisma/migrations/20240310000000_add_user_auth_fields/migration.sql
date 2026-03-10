-- AlterTable: add auth fields to User
ALTER TABLE "User" ADD COLUMN "username" TEXT;
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;

-- Set defaults for any existing rows (should be none)
UPDATE "User" SET "username" = "id", "passwordHash" = '' WHERE "username" IS NULL;

-- Make columns required
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "passwordHash" SET NOT NULL;

-- Add unique constraint
ALTER TABLE "User" ADD CONSTRAINT "User_username_key" UNIQUE ("username");
