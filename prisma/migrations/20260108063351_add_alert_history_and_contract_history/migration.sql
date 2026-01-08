-- CreateTable
CREATE TABLE "AlertHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "voucherCount" INTEGER NOT NULL,
    "contractCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ContractHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "originalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "amount" REAL,
    "startDate" DATETIME,
    "endDate" DATETIME NOT NULL,
    "contactInfo" TEXT,
    "notes" TEXT,
    "categoryName" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "renewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL
);
