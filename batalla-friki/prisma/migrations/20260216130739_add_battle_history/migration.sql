/*
  Warnings:

  - You are about to drop the `BattleHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "BattleHistory";

-- CreateTable
CREATE TABLE "Battle" (
    "id" SERIAL NOT NULL,
    "winnerId" INTEGER NOT NULL,
    "loserId" INTEGER NOT NULL,
    "log" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Battle_pkey" PRIMARY KEY ("id")
);
