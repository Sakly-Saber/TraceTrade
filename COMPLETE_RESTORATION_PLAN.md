# Complete Restoration Plan - All Lost Features

Based on the documentation files and your description, here's what needs to be restored:

## 🔴 CRITICAL ISSUES TO FIX

### 1. **Marketplace Purchase Flow (Atomic Swaps)**
- ❌ **LOST**: Client-side atomic swap transactions
- ❌ **LOST**: Purchase validation API
- ❌ **LOST**: Purchase confirmation API  
- ❌ **LOST**: Listing ID vs NFT Asset ID fix
- ❌ **LOST**: HashConnect transaction signing

**What Was Working:**
```typescript
// Step 1: Validate purchase
POST /api/marketplace/purchase
→ Returns: { transaction: { fromAccount, tokenId, serialNumber, paymentAmount } }

// Step 2: Build atomic swap (client-side)
TransferTransaction()
  .addHbarTransfer(buyer, -price)
  .addHbarTransfer(seller, +price)
  .addNftTransfer(nft, seller, buyer)

// Step 3: Sign with HashPack
executeTransaction(transaction, address)

// Step 4: Confirm
POST /api/marketplace/purchase/confirm
```

### 2. **NFT Allowance System**
- ❌ **LOST**: AccountAllowanceApproveTransaction during listing
- ❌ **LOST**: `allowanceGranted` and `allowanceTransactionId` fields
- ❌ **LOST**: `addApprovedNftTransfer` usage

**What Was Working:**
- User approves NFT allowance BEFORE creating marketplace listing
- Operator can transfer NFT when purchase happens
- No need for two-step transfer (seller sign → transfer)

### 3. **Auction System**
- ❌ **LOST**: NFT allowance approval during auction creation
- ❌ **LOST**: Automatic auction completion service
- ❌ **LOST**: Self-bid detection
- ❌ **LOST**: Real-time completion (60s interval)
- ❌ **LOST**: Startup offline auction completion

**What Was Working:**
- Auctions auto-complete when time expires
- NFT transfers to winner using approved transfer
- HBAR transfers to seller
- Self-bids detected and marked as ENDED

### 4. **UI Updates**
- ❌ **LOST**: Horizontal filter layout (was vertical before)
- ❌ **LOST**: HashPack wallet connection indicator
- ❌ **LOST**: Balance display
- ❌ **LOST**: Transaction status toasts

### 5. **Schema Changes**
- ❌ **LOST**: MarketplaceListing model (we just restored this!)
- ✅ **RESTORED**: MarketplaceListing with all fields
- ❌ **LOST**: Auction allowance fields
- ❌ **LOST**: Additional marketplace fields

---

## 📋 RESTORATION CHECKLIST

### Phase 1: Database Schema (PRIORITY 1) ✅ COMPLETE
- [x] 1.1 Add auction allowance fields
- [x] 1.2 Add marketplace allowance fields  
- [x] 1.3 Run migration (20251016213717_add_allowance_fields)
- [x] 1.4 Generate Prisma client (v6.16.2)
- [x] 1.5 Create instrumentation.ts for startup hooks

### Phase 1.5: Background Services (PRIORITY 1) ✅ COMPLETE
- [x] 1.5.1 Implement auction-completion-service.ts
- [x] 1.5.2 Add completeOfflineAuctions() function
- [x] 1.5.3 Add startAuctionCompletionService() function (60s interval)
- [x] 1.5.4 Add completeAuction() with self-bid detection
- [x] 1.5.5 Add 4-tier seller wallet resolution
- [x] 1.5.6 Add 2-tier winner wallet resolution
- [x] 1.5.7 Add approved NFT transfer logic
- [x] 1.5.8 Add HBAR transfer to seller
- [x] 1.5.9 Add database updates (SETTLED status)

### Phase 2: Marketplace Backend (PRIORITY 2)
- [ ] 2.1 Create `/api/marketplace/purchase` route (validation)
- [ ] 2.2 Create `/api/marketplace/purchase/confirm` route
- [ ] 2.3 Create `/api/marketplace/list` route (with allowance)
- [ ] 2.4 Create `/api/marketplace/cancel` route
- [ ] 2.5 Create `/api/marketplace/favorites` route

### Phase 3: Marketplace Frontend (PRIORITY 3)
- [ ] 3.1 Fix marketplace page purchase handler
- [ ] 3.2 Add atomic swap transaction building
- [ ] 3.3 Add HashConnect signing integration
- [ ] 3.4 Fix listing ID vs NFT asset ID
- [ ] 3.5 Add transaction confirmation flow

### Phase 4: Auction Backend (PRIORITY 4)
- [ ] 4.1 Update auction creation with allowance
- [ ] 4.2 Create auction completion service
- [ ] 4.3 Add self-bid detection
- [ ] 4.4 Create `/api/auctions/complete` endpoint
- [ ] 4.5 Add startup offline completion

### Phase 5: Auction Frontend (PRIORITY 5)
- [ ] 5.1 Add allowance approval to auction creation
- [ ] 5.2 Update bid form with HashConnect
- [ ] 5.3 Add real-time auction status updates

### Phase 6: UI/UX Improvements (PRIORITY 6)
- [ ] 6.1 Restore horizontal filters
- [ ] 6.2 Add wallet connection status
- [ ] 6.3 Add balance display
- [ ] 6.4 Add transaction toasts

---

## 🗂️ FILES THAT NEED TO BE CREATED/FIXED

### Backend API Routes (Need to Create)
```
app/api/marketplace/
  ├── purchase/
  │   ├── route.ts              ❌ MISSING - Validate purchase
  │   └── confirm/
  │       └── route.ts          ❌ MISSING - Confirm purchase
  ├── list/
  │   └── route.ts              ❌ MISSING - Create listing with allowance
  ├── cancel/
  │   └── route.ts              ❌ MISSING - Cancel listing
  └── favorites/
      └── route.ts              ❌ MISSING - Toggle favorites

app/api/auctions/
  ├── create/
  │   └── route.ts              ❌ NEEDS FIX - Add allowance
  ├── complete/
  │   └── route.ts              ❌ MISSING - Complete auctions
  └── bid/
      └── route.ts              ❌ NEEDS CHECK - Verify bid logic
```

### Frontend Pages (Need to Fix)
```
app/marketplace/
  └── page.tsx                  ❌ NEEDS FIX - Purchase flow broken

app/auctions/
  └── page.tsx                  ❌ NEEDS CHECK - Allowance missing?

app/tokenization/
  └── page.tsx                  ❌ NEEDS CHECK - Connected wallet logic
```

### Components (Need to Fix/Check)
```
components/
  ├── nft-collection.tsx        ❌ NEEDS FIX - Allowance approval
  ├── bid-form.tsx              ❌ NEEDS CHECK - HashConnect signing
  ├── wallet-connect.tsx        ✅ WORKING - Based on WALLET_FIXED.md
  └── marketplace-sidebar.tsx   ❌ NEEDS CHECK - Filter layout
```

### Services (Need to Create)
```
lib/services/
  ├── auction-completion-service.ts  ❌ MISSING - Auto-complete auctions
  └── marketplaceService.ts          ❌ NEEDS CHECK - Listing ID fix
```

### Infrastructure (Need to Fix)
```
instrumentation.ts                   ❌ MISSING - Startup auction completion
```

---

## 🔍 WHAT WE KNOW FROM DOCUMENTATION

### From AUCTION_NFT_TRANSFER_TESTING_GUIDE.md:
1. Auction schema has `allowanceGranted` and `allowanceTransactionId`
2. Auction creation requests `AccountAllowanceApproveTransaction`
3. Completion uses `addApprovedNftTransfer`
4. Self-bid detection works
5. Real-time completion service (60s interval)
6. Startup offline completion

### From WALLET_FIXED.md:
1. No treasury credentials needed in .env
2. Uses connected wallet directly
3. HashConnect signing integration

### From SCHEMA_RESTORATION.md:
1. MarketplaceListing model structure
2. ListingStatus enum
3. Relations between models

---

## 🎯 RECOMMENDED APPROACH

### Step 1: Start with Schema (Done ✅)
We already restored the MarketplaceListing model. Now need to add auction allowance fields.

### Step 2: Focus on Marketplace First
Marketplace is simpler than auctions:
1. Create purchase validation API
2. Create purchase confirmation API
3. Fix frontend purchase handler
4. Add atomic swap logic
5. Test with HashPack

### Step 3: Then Fix Auctions
After marketplace works:
1. Add allowance fields to schema
2. Update auction creation
3. Create completion service
4. Add startup completion
5. Test full auction flow

### Step 4: UI Polish
After functionality works:
1. Fix filters
2. Add status indicators
3. Add toasts
4. Improve UX

---

## 🚀 NEXT STEPS

**Tell me which part you want me to start with:**

1. **"Fix marketplace purchases first"** - I'll restore the atomic swap purchase flow
2. **"Fix auctions first"** - I'll restore the auction allowance and completion
3. **"Fix both together"** - I'll work on both simultaneously
4. **"Show me what's currently broken"** - I'll analyze current code and show specific issues

Which would you like me to tackle first?

---

## 📊 ESTIMATED EFFORT

| Feature | Difficulty | Time | Priority |
|---------|-----------|------|----------|
| Schema fixes | Easy | 10 min | ⭐⭐⭐⭐⭐ |
| Marketplace purchase | Medium | 30 min | ⭐⭐⭐⭐⭐ |
| Auction allowance | Medium | 20 min | ⭐⭐⭐⭐ |
| Auction completion | Hard | 45 min | ⭐⭐⭐⭐ |
| UI fixes | Easy | 15 min | ⭐⭐⭐ |

**Total restoration time: ~2 hours** (if we work efficiently)

Let me know where to start! 🚀
