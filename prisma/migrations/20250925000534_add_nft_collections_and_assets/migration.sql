-- CreateTable
CREATE TABLE "nft_collections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "description" TEXT,
    "tokenId" TEXT,
    "treasuryId" TEXT,
    "supplyKey" TEXT,
    "adminKey" TEXT,
    "category" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "maxSupply" INTEGER NOT NULL DEFAULT 1000000,
    "currentSupply" INTEGER NOT NULL DEFAULT 0,
    "businessId" TEXT NOT NULL,
    "imageUrl" TEXT,
    "metadataUri" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT "nft_collections_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "nft_assets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "serialNumber" INTEGER NOT NULL,
    "assetData" TEXT NOT NULL,
    "quantity" REAL,
    "unit" TEXT,
    "quality" TEXT,
    "location" TEXT,
    "certifications" TEXT,
    "imageUrl" TEXT,
    "aiImageUrl" TEXT,
    "aiImageCID" TEXT,
    "documentUrls" TEXT,
    "metadataUri" TEXT,
    "metadataHash" TEXT,
    "createdBy" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "auctionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "currentPrice" REAL,
    "lastSalePrice" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "nft_assets_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "nft_collections" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "nft_assets_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "businesses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "nft_assets_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "auctions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletAddress" TEXT NOT NULL,
    "walletType" TEXT NOT NULL,
    "displayName" TEXT,
    "email" TEXT,
    "avatar" TEXT,
    "businessId" TEXT,
    "createdAssets" INTEGER NOT NULL DEFAULT 0,
    "ownedAssets" INTEGER NOT NULL DEFAULT 0,
    "totalValue" REAL NOT NULL DEFAULT 0,
    "notifications" BOOLEAN NOT NULL DEFAULT true,
    "publicProfile" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastActiveAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "nft_collections_tokenId_key" ON "nft_collections"("tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "nft_assets_tokenId_serialNumber_key" ON "nft_assets"("tokenId", "serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "users_walletAddress_key" ON "users"("walletAddress");
