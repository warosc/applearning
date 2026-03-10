-- Add calculatorEnabled to Exam
ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "calculatorEnabled" BOOLEAN NOT NULL DEFAULT true;

-- Add isMarkedForReview and updatedAt to Answer
ALTER TABLE "Answer" ADD COLUMN IF NOT EXISTS "isMarkedForReview" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Answer" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
