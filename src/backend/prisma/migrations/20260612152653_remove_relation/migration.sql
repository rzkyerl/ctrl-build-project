/*
  Warnings:

  - You are about to drop the column `userId` on the `Portfolio` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Portfolio" DROP CONSTRAINT "Portfolio_userId_fkey";

-- AlterTable
ALTER TABLE "Portfolio" DROP COLUMN "userId";
