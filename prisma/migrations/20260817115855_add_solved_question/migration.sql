-- CreateTable
CREATE TABLE "SolvedQuestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentBlockId" TEXT NOT NULL,
    "solvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pointsAwarded" INTEGER NOT NULL,
    "firstTryCorrect" BOOLEAN NOT NULL,

    CONSTRAINT "SolvedQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SolvedQuestion_userId_idx" ON "SolvedQuestion"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SolvedQuestion_userId_contentBlockId_key" ON "SolvedQuestion"("userId", "contentBlockId");

-- AddForeignKey
ALTER TABLE "SolvedQuestion" ADD CONSTRAINT "SolvedQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolvedQuestion" ADD CONSTRAINT "SolvedQuestion_contentBlockId_fkey" FOREIGN KEY ("contentBlockId") REFERENCES "ContentBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
