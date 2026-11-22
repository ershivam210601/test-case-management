/*
  Warnings:

  - Added the required column `updatedAt` to the `TestCase` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TestCase" ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
