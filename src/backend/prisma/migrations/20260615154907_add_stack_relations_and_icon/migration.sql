/*
  Warnings:

  - You are about to drop the column `techStack` on the `Portfolio` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Portfolio" DROP COLUMN "techStack";

-- AlterTable
ALTER TABLE "Stack" ADD COLUMN     "icon" TEXT;

-- CreateTable
CREATE TABLE "_PortfolioToStack" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_PortfolioToStack_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PortfolioToStack_B_index" ON "_PortfolioToStack"("B");

-- AddForeignKey
ALTER TABLE "_PortfolioToStack" ADD CONSTRAINT "_PortfolioToStack_A_fkey" FOREIGN KEY ("A") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PortfolioToStack" ADD CONSTRAINT "_PortfolioToStack_B_fkey" FOREIGN KEY ("B") REFERENCES "Stack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
