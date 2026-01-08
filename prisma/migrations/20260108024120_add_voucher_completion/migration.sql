/*
  Warnings:

  - You are about to drop the column `completedAt` on the `Voucher` table. All the data in the column will be lost.
  - You are about to drop the column `isCompleted` on the `Voucher` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "VoucherCompletion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "voucherId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VoucherCompletion_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Voucher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "amount" REAL,
    "vatAmount" REAL,
    "accountName" TEXT NOT NULL,
    "repeatDay" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Voucher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Voucher" ("accountName", "amount", "createdAt", "deletedAt", "description", "id", "repeatDay", "updatedAt", "userId", "vatAmount") SELECT "accountName", "amount", "createdAt", "deletedAt", "description", "id", "repeatDay", "updatedAt", "userId", "vatAmount" FROM "Voucher";
DROP TABLE "Voucher";
ALTER TABLE "new_Voucher" RENAME TO "Voucher";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "VoucherCompletion_voucherId_year_month_key" ON "VoucherCompletion"("voucherId", "year", "month");
