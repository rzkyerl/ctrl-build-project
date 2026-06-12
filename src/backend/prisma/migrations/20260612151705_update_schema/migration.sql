/*
  Warnings:

  - You are about to drop the column `description` on the `Portfolio` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Portfolio` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `category` to the `Portfolio` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Portfolio` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Portfolio" DROP COLUMN "description",
ADD COLUMN     "architecture" TEXT,
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "features" JSONB,
ADD COLUMN     "goals" TEXT,
ADD COLUMN     "imgUrl" TEXT,
ADD COLUMN     "link" TEXT,
ADD COLUMN     "overview" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "techStack" TEXT[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Portfolio_slug_key" ON "Portfolio"("slug");
