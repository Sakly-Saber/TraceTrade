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
INSERT INTO "new_auctions" ("autoSettled", "bidCount", "businessId", "category", "certifications", "commodityType", "createdAt", "createdById", "currency", "currentBid", "currentBidHbar", "description", "endTime", "feeBps", "highestBidder", "id", "isSettled", "location", "metadataUri", "minBidIncrementPct", "nftContract", "quality", "quantity", "reservePrice", "sellerSignature", "startTime", "startingPriceHbar", "status", "title", "tokenId", "unit", "updatedAt", "winnerId") SELECT "autoSettled", "bidCount", "businessId", "category", "certifications", "commodityType", "createdAt", "createdById", "currency", "currentBid", "currentBidHbar", "description", "endTime", "feeBps", "highestBidder", "id", "isSettled", "location", "metadataUri", "minBidIncrementPct", "nftContract", "quality", "quantity", "reservePrice", "sellerSignature", "startTime", "startingPriceHbar", "status", "title", "tokenId", "unit", "updatedAt", "winnerId" FROM "auctions";
DROP TABLE "auctions";
ALTER TABLE "new_auctions" RENAME TO "auctions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
