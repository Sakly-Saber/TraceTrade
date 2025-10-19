-- AlterTable
ALTER TABLE "marketplace_listings" ADD COLUMN "soldAt" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_auctions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "commodityType" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "quality" TEXT,
    "location" TEXT NOT NULL,
    "certifications" TEXT,
    "reservePrice" REAL,
    "currentBid" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'HBAR',
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "tokenId" TEXT,
    "nftContract" TEXT,
    "metadataUri" TEXT,
    "seller" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isSettled" BOOLEAN NOT NULL DEFAULT false,
    "winnerId" TEXT,
    "allowanceGranted" BOOLEAN NOT NULL DEFAULT false,
    "allowanceTransactionId" TEXT,
    "feeBps" INTEGER NOT NULL DEFAULT 250,
    "businessId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "auctions_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "auctions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "business_users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_auctions" ("allowanceGranted", "allowanceTransactionId", "businessId", "category", "certifications", "commodityType", "createdAt", "createdById", "currency", "currentBid", "description", "endTime", "feeBps", "id", "isSettled", "location", "metadataUri", "nftContract", "quality", "quantity", "reservePrice", "startTime", "status", "title", "tokenId", "unit", "updatedAt", "winnerId") SELECT "allowanceGranted", "allowanceTransactionId", "businessId", "category", "certifications", "commodityType", "createdAt", "createdById", "currency", "currentBid", "description", "endTime", "feeBps", "id", "isSettled", "location", "metadataUri", "nftContract", "quality", "quantity", "reservePrice", "startTime", "status", "title", "tokenId", "unit", "updatedAt", "winnerId" FROM "auctions";
DROP TABLE "auctions";
ALTER TABLE "new_auctions" RENAME TO "auctions";
CREATE TABLE "new_bids" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "amountHbar" REAL,
    "currency" TEXT NOT NULL DEFAULT 'HBAR',
    "txHash" TEXT,
    "auctionId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "bidderId" TEXT NOT NULL,
    "isWinning" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bids_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "auctions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bids_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bids_bidderId_fkey" FOREIGN KEY ("bidderId") REFERENCES "business_users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_bids" ("amount", "amountHbar", "auctionId", "bidderId", "businessId", "createdAt", "currency", "id", "isActive", "isWinning", "txHash") SELECT "amount", "amountHbar", "auctionId", "bidderId", "businessId", "createdAt", "currency", "id", "isActive", "isWinning", "txHash" FROM "bids";
DROP TABLE "bids";
ALTER TABLE "new_bids" RENAME TO "bids";
CREATE TABLE "new_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'HBAR',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "txHash" TEXT,
    "blockNumber" INTEGER,
    "gasUsed" TEXT,
    "gasPrice" TEXT,
    "businessId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "auctionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "transactions_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "business_users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transactions_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "auctions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_transactions" ("amount", "auctionId", "blockNumber", "businessId", "createdAt", "currency", "gasPrice", "gasUsed", "id", "status", "txHash", "type", "updatedAt", "userId") SELECT "amount", "auctionId", "blockNumber", "businessId", "createdAt", "currency", "gasPrice", "gasUsed", "id", "status", "txHash", "type", "updatedAt", "userId" FROM "transactions";
DROP TABLE "transactions";
ALTER TABLE "new_transactions" RENAME TO "transactions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
