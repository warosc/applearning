-- CreateTable
CREATE TABLE "CalculatorSetting" (
    "id" TEXT NOT NULL,
    "examId" TEXT,
    "allowedOps" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalculatorSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CalculatorSetting_examId_key" ON "CalculatorSetting"("examId");
