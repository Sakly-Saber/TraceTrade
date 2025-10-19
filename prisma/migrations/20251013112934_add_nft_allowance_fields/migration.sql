-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_marketplace_listings" (
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
    "allowanceGranted" BOOLEAN NOT NULL DEFAULT false,
    "allowanceTransactionId" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "favorites" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "soldAt" DATETIME,
    CONSTRAINT "marketplace_listings_nftAssetId_fkey" FOREIGN KEY ("nftAssetId") REFERENCES "nft_assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "marketplace_listings_sellerBusinessId_fkey" FOREIGN KEY ("sellerBusinessId") REFERENCES "businesses" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_marketplace_listings" ("buyerLockExpiry", "buyerLockId", "createdAt", "favorites", "id", "nftAssetId", "priceHbar", "priceNaira", "seller", "sellerBusinessId", "sellerSignature", "signatureExpiry", "soldAt", "status", "updatedAt", "views") SELECT "buyerLockExpiry", "buyerLockId", "createdAt", "favorites", "id", "nftAssetId", "priceHbar", "priceNaira", "seller", "sellerBusinessId", "sellerSignature", "signatureExpiry", "soldAt", "status", "updatedAt", "views" FROM "marketplace_listings";
DROP TABLE "marketplace_listings";
ALTER TABLE "new_marketplace_listings" RENAME TO "marketplace_listings";
CREATE UNIQUE INDEX "marketplace_listings_nftAssetId_key" ON "marketplace_listings"("nftAssetId");
CREATE UNIQUE INDEX "marketplace_listings_buyerLockId_key" ON "marketplace_listings"("buyerLockId");
CREATE INDEX "marketplace_listings_status_createdAt_idx" ON "marketplace_listings"("status", "createdAt");
CREATE INDEX "marketplace_listings_seller_idx" ON "marketplace_listings"("seller");
CREATE INDEX "marketplace_listings_priceHbar_idx" ON "marketplace_listings"("priceHbar");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
