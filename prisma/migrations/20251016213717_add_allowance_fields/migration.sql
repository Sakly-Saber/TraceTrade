/*
  Warnings:

  - You are about to drop the `invoices` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `autoSettled` on the `auctions` table. All the data in the column will be lost.
  - You are about to drop the column `bidCount` on the `auctions` table. All the data in the column will be lost.
  - You are about to drop the column `currentBidHbar` on the `auctions` table. All the data in the column will be lost.
  - You are about to drop the column `highestBidder` on the `auctions` table. All the data in the column will be lost.
  - You are about to drop the column `minBidIncrementPct` on the `auctions` table. All the data in the column will be lost.
  - You are about to drop the column `sellerSignature` on the `auctions` table. All the data in the column will be lost.
  - You are about to drop the column `startingPriceHbar` on the `auctions` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `bids` table. All the data in the column will be lost.
  - You are about to drop the column `soldAt` on the `marketplace_listings` table. All the data in the column will be lost.
  - You are about to drop the column `amountHbar` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `confirmedAt` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `feesHbar` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `invoiceUrl` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `nftAssetId` on the `transactions` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "invoices_seller_idx";

-- DropIndex
DROP INDEX "invoices_buyer_idx";

-- DropIndex
DROP INDEX "invoices_txHash_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "invoices";
PRAGMA foreign_keys=on;

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
    "reservePrice" REAL NOT NULL,
    "currentBid" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "tokenId" TEXT,
    "nftContract" TEXT,
    "metadataUri" TEXT,
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
    "currency" TEXT NOT NULL DEFAULT 'NGN',
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
CREATE TABLE "new_marketplace_listings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nftAssetId" TEXT NOT NULL,
    "seller" TEXT NOT NULL,
    "sellerBusinessId" TEXT,
    "priceHbar" REAL NOT NULL,
    "priceNaira" REAL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "views" INTEGER NOT NULL DEFAULT 0,
    "favorites" INTEGER NOT NULL DEFAULT 0,
    "allowanceGranted" BOOLEAN NOT NULL DEFAULT false,
    "allowanceTransactionId" TEXT,
    "sellerSignature" TEXT,
    "signatureExpiry" DATETIME,
    "buyerLockId" TEXT,
    "buyerLockExpiry" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "expiresAt" DATETIME,
    CONSTRAINT "marketplace_listings_nftAssetId_fkey" FOREIGN KEY ("nftAssetId") REFERENCES "nft_assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "marketplace_listings_sellerBusinessId_fkey" FOREIGN KEY ("sellerBusinessId") REFERENCES "businesses" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_marketplace_listings" ("allowanceGranted", "allowanceTransactionId", "buyerLockExpiry", "buyerLockId", "createdAt", "favorites", "id", "nftAssetId", "priceHbar", "priceNaira", "seller", "sellerBusinessId", "sellerSignature", "signatureExpiry", "status", "updatedAt", "views") SELECT "allowanceGranted", "allowanceTransactionId", "buyerLockExpiry", "buyerLockId", "createdAt", "favorites", "id", "nftAssetId", "priceHbar", "priceNaira", "seller", "sellerBusinessId", "sellerSignature", "signatureExpiry", "status", "updatedAt", "views" FROM "marketplace_listings";
DROP TABLE "marketplace_listings";
ALTER TABLE "new_marketplace_listings" RENAME TO "marketplace_listings";
CREATE UNIQUE INDEX "marketplace_listings_nftAssetId_key" ON "marketplace_listings"("nftAssetId");
CREATE TABLE "new_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
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
