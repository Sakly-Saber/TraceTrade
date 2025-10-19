/*
  Warnings:

  - A unique constraint covering the columns `[auctionId,bidderId,amountHbar]` on the table `bids` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "bids" ADD COLUMN "amountHbar" REAL;
ALTER TABLE "bids" ADD COLUMN "status" TEXT DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "marketplace_listings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nftAssetId" TEXT NOT NULL,
    "seller" TEXT NOT NULL,
    "sellerBusinessId" TEXT,
    "priceHbar" REAL NOT NULL,
    "priceNaira" REAL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "buyerLockId" TEXT,
    "buyerLockExpiry" DATETIME,
    "sellerSignature" TEXT,
    "signatureExpiry" DATETIME,
    "views" INTEGER NOT NULL DEFAULT 0,
    "favorites" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "soldAt" DATETIME,
    CONSTRAINT "marketplace_listings_nftAssetId_fkey" FOREIGN KEY ("nftAssetId") REFERENCES "nft_assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "marketplace_listings_sellerBusinessId_fkey" FOREIGN KEY ("sellerBusinessId") REFERENCES "businesses" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "txHash" TEXT NOT NULL,
    "buyer" TEXT NOT NULL,
    "seller" TEXT NOT NULL,
    "nftName" TEXT NOT NULL,
    "nftTokenId" TEXT NOT NULL,
    "nftSerial" INTEGER NOT NULL,
    "amountHbar" REAL NOT NULL,
    "feesHbar" REAL NOT NULL,
    "totalHbar" REAL NOT NULL,
    "pdfUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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
    "startingPriceHbar" REAL,
    "currentBidHbar" REAL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "tokenId" TEXT,
    "nftContract" TEXT,
    "metadataUri" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isSettled" BOOLEAN NOT NULL DEFAULT false,
    "winnerId" TEXT,
    "highestBidder" TEXT,
    "bidCount" INTEGER NOT NULL DEFAULT 0,
    "minBidIncrementPct" REAL NOT NULL DEFAULT 5,
    "autoSettled" BOOLEAN NOT NULL DEFAULT false,
    "sellerSignature" TEXT,
    "feeBps" INTEGER NOT NULL DEFAULT 250,
    "businessId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "auctions_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "auctions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "business_users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_auctions" ("businessId", "category", "certifications", "commodityType", "createdAt", "createdById", "currency", "currentBid", "description", "endTime", "feeBps", "id", "isSettled", "location", "metadataUri", "nftContract", "quality", "quantity", "reservePrice", "startTime", "status", "title", "tokenId", "unit", "updatedAt", "winnerId") SELECT "businessId", "category", "certifications", "commodityType", "createdAt", "createdById", "currency", "currentBid", "description", "endTime", "feeBps", "id", "isSettled", "location", "metadataUri", "nftContract", "quality", "quantity", "reservePrice", "startTime", "status", "title", "tokenId", "unit", "updatedAt", "winnerId" FROM "auctions";
DROP TABLE "auctions";
ALTER TABLE "new_auctions" RENAME TO "auctions";
CREATE TABLE "new_nft_collections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "description" TEXT,
    "tokenId" TEXT,
    "treasuryId" TEXT,
    "supplyKey" TEXT,
    "adminKey" TEXT,
    "supplyKeyDisplayed" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "maxSupply" INTEGER NOT NULL DEFAULT 1000000,
    "currentSupply" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "businessId" TEXT NOT NULL,
    "imageUrl" TEXT,
    "metadataUri" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT "nft_collections_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_nft_collections" ("adminKey", "assetType", "businessId", "category", "createdAt", "currentSupply", "description", "id", "imageUrl", "maxSupply", "metadataUri", "name", "status", "supplyKey", "symbol", "tokenId", "treasuryId", "updatedAt") SELECT "adminKey", "assetType", "businessId", "category", "createdAt", "currentSupply", "description", "id", "imageUrl", "maxSupply", "metadataUri", "name", "status", "supplyKey", "symbol", "tokenId", "treasuryId", "updatedAt" FROM "nft_collections";
DROP TABLE "nft_collections";
ALTER TABLE "new_nft_collections" RENAME TO "nft_collections";
CREATE UNIQUE INDEX "nft_collections_tokenId_key" ON "nft_collections"("tokenId");
CREATE TABLE "new_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "amountHbar" REAL,
    "feesHbar" REAL,
    "confirmedAt" DATETIME,
    "invoiceUrl" TEXT,
    "txHash" TEXT,
    "blockNumber" INTEGER,
    "gasUsed" TEXT,
    "gasPrice" TEXT,
    "businessId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "auctionId" TEXT,
    "nftAssetId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "transactions_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "business_users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transactions_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "auctions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transactions_nftAssetId_fkey" FOREIGN KEY ("nftAssetId") REFERENCES "nft_assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_transactions" ("amount", "auctionId", "blockNumber", "businessId", "createdAt", "currency", "gasPrice", "gasUsed", "id", "status", "txHash", "type", "updatedAt", "userId") SELECT "amount", "auctionId", "blockNumber", "businessId", "createdAt", "currency", "gasPrice", "gasUsed", "id", "status", "txHash", "type", "updatedAt", "userId" FROM "transactions";
DROP TABLE "transactions";
ALTER TABLE "new_transactions" RENAME TO "transactions";
CREATE INDEX "transactions_type_createdAt_idx" ON "transactions"("type", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_listings_nftAssetId_key" ON "marketplace_listings"("nftAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_listings_buyerLockId_key" ON "marketplace_listings"("buyerLockId");

-- CreateIndex
CREATE INDEX "marketplace_listings_status_createdAt_idx" ON "marketplace_listings"("status", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_listings_seller_idx" ON "marketplace_listings"("seller");

-- CreateIndex
CREATE INDEX "marketplace_listings_priceHbar_idx" ON "marketplace_listings"("priceHbar");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_txHash_key" ON "invoices"("txHash");

-- CreateIndex
CREATE INDEX "invoices_buyer_idx" ON "invoices"("buyer");

-- CreateIndex
CREATE INDEX "invoices_seller_idx" ON "invoices"("seller");

-- CreateIndex
CREATE INDEX "bids_auctionId_amountHbar_idx" ON "bids"("auctionId", "amountHbar" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "bids_auctionId_bidderId_amountHbar_key" ON "bids"("auctionId", "bidderId", "amountHbar");
