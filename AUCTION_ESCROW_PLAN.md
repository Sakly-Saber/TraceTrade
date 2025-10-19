# 🎯 AUCTION ESCROW IMPLEMENTATION PLAN

## 📋 Overview

Implement **English Auction** with escrow system where:
- Operator holds HBAR from bidders in escrow
- Outbid bidders get refunded automatically
- When auction ends, atomic transfer: NFT → winner, HBAR → seller

---

## 🔑 Key Requirements

### 1. **Auction Variables:**
- **Starting Price** (reserve price)
- **Duration** (in hours)
- **Min Bid Increment**: +5% from current highest bid
- **Automatic Settlement**: When timer expires

### 2. **Security Checks:**
- ✅ Wallet connected
- ✅ Bidder ≠ auction owner
- ✅ Bid ≥ starting price (first bid)
- ✅ Bid ≥ highest bid + 5% (subsequent bids)
- ✅ Sufficient balance (bid amount + gas fees)

### 3. **Escrow Logic:**
```
Bid Flow:
1. User places bid → HBAR sent to OPERATOR (escrow)
2. Previous bidder exists? → OPERATOR refunds previous bidder
3. Update auction: new highest bidder + bid amount
4. Store bid in database
```

---

## 📁 Files to Create/Update

### 1. **BID MODAL** (NEW)
**File:** `components/bid-modal-with-escrow.tsx`

```typescript
interface BidModalWithEscrowProps {
  isOpen: boolean
  onClose: () => void
  auction: {
    id: string
    name: string
    image: string
    currentBidHbar: number
    startingBid: number
    minBidIncrementPct: number
    seller: string
    endsAt: Date
  }
  bidderAccountId?: string
  onSuccess?: () => void
}

export function BidModalWithEscrow({ ... }) {
  // Calculate minimum bid
  const minBid = auction.currentBidHbar > 0 
    ? auction.currentBidHbar * 1.05  // +5% from current
    : auction.startingBid

  const handleBid = async () => {
    // 1. Check wallet connection
    await initHashConnect()
    const hashconnect = getHashConnectInstance()
    
    // 2. Check bidder ≠ seller
    if (bidderAccountId === auction.seller) {
      throw new Error('You cannot bid on your own auction')
    }
    
    // 3. Check balance
    const balance = await fetchBalance(bidderAccountId)
    if (balance < bidAmount + 0.5) {
      throw new Error('Insufficient balance')
    }
    
    // 4. Create escrow transaction
    const transaction = new TransferTransaction()
      .addHbarTransfer(
        AccountId.fromString(bidderAccountId),
        Hbar.fromString(`-${bidAmount}`)
      )
      .addHbarTransfer(
        AccountId.fromString(OPERATOR_ACCOUNT_ID),
        Hbar.fromString(`${bidAmount}`)
      )
      .setTransactionMemo(`Bid on auction ${auction.id}`)
    
    // 5. Execute via HashConnect
    const result = await executeTransaction(transaction, bidderAccountId)
    
    // 6. Update database via API
    await fetch('/api/auctions/bid', {
      method: 'POST',
      body: JSON.stringify({
        auctionId: auction.id,
        bidderAccountId,
        bidAmountHbar: bidAmount,
        escrowTransactionId: result.transactionId
      })
    })
  }
}
```

---

### 2. **BID API ROUTE** (UPDATE)
**File:** `app/api/auctions/bid/route.ts`

**Add Escrow Logic:**
```typescript
export async function POST(req: NextRequest) {
  const { auctionId, bidderAccountId, bidAmountHbar, escrowTransactionId } = await req.json()
  
  // Find auction
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: { bids: { orderBy: { createdAt: 'desc' }, take: 1 } }
  })
  
  // Validate bid amount
  const currentHighestBid = auction.currentBidHbar || 0
  const minBid = currentHighestBid > 0 
    ? currentHighestBid * 1.05 
    : auction.startingBid
  
  if (bidAmountHbar < minBid) {
    return NextResponse.json({
      success: false,
      error: `Minimum bid is ${minBid.toFixed(2)} HBAR`
    }, { status: 400 })
  }
  
  // Get previous highest bidder
  const previousBid = auction.bids[0]
  
  // ⚠️ CRITICAL: If there's a previous bidder, operator must refund them
  if (previousBid && previousBid.bidderId !== bidderAccountId) {
    // This should be done by operator account server-side
    // For now, we'll record it and handle in settlement service
    console.log('🔄 [BID] Previous bidder needs refund:', {
      bidder: previousBid.bidderId,
      amount: previousBid.bidAmountHbar
    })
    
    // TODO: Implement automatic refund via operator account
    // const refundTransaction = new TransferTransaction()
    //   .addHbarTransfer(operatorAccountId, Hbar.fromString(`-${previousBid.bidAmountHbar}`))
    //   .addHbarTransfer(AccountId.fromString(previousBid.bidderId), Hbar.fromString(`${previousBid.bidAmountHbar}`))
  }
  
  // Create new bid record
  const newBid = await prisma.bid.create({
    data: {
      auctionId,
      bidderId: bidderAccountId,
      bidAmountHbar,
      escrowTransactionId,
      status: 'ACTIVE'
    }
  })
  
  // Update auction with new highest bid
  await prisma.auction.update({
    where: { id: auctionId },
    data: {
      currentBidHbar: bidAmountHbar,
      currentBidderId: bidderAccountId
    }
  })
  
  return NextResponse.json({
    success: true,
    bid: newBid
  })
}
```

---

### 3. **AUCTION SETTLEMENT SERVICE** (NEW)
**File:** `lib/auction-settlement-service.ts`

**Cron Job to Auto-Settle Expired Auctions:**
```typescript
import { prisma } from './prisma'
import { TransferTransaction, AccountId, TokenId, NftId, Hbar, PrivateKey } from '@hashgraph/sdk'

const OPERATOR_ACCOUNT_ID = process.env.OPERATOR_ACCOUNT_ID!
const OPERATOR_PRIVATE_KEY = process.env.OPERATOR_PRIVATE_KEY!

export async function settleExpiredAuctions() {
  console.log('🔍 [SETTLEMENT] Checking for expired auctions...')
  
  // Find all active auctions that have ended
  const expiredAuctions = await prisma.auction.findMany({
    where: {
      status: 'ACTIVE',
      endsAt: { lte: new Date() },
      allowanceGranted: true
    },
    include: {
      bids: {
        orderBy: { bidAmountHbar: 'desc' },
        take: 1
      },
      nftAssets: true
    }
  })
  
  console.log(`📋 [SETTLEMENT] Found ${expiredAuctions.length} expired auctions`)
  
  for (const auction of expiredAuctions) {
    const winningBid = auction.bids[0]
    
    if (!winningBid) {
      // No bids - just mark as ended
      await prisma.auction.update({
        where: { id: auction.id },
        data: { status: 'ENDED' }
      })
      continue
    }
    
    try {
      console.log('💰 [SETTLEMENT] Settling auction:', auction.id)
      
      const nft = auction.nftAssets[0]
      const nftId = new NftId(
        TokenId.fromString(nft.tokenId),
        nft.serialNumber
      )
      
      // Create atomic settlement transaction
      const transaction = new TransferTransaction()
        // Operator sends HBAR to seller
        .addHbarTransfer(
          AccountId.fromString(OPERATOR_ACCOUNT_ID),
          Hbar.fromString(`-${winningBid.bidAmountHbar}`)
        )
        .addHbarTransfer(
          AccountId.fromString(auction.seller),
          Hbar.fromString(`${winningBid.bidAmountHbar}`)
        )
        // Operator transfers NFT to winner (using allowance)
        .addApprovedNftTransfer(
          nftId,
          AccountId.fromString(auction.seller),
          AccountId.fromString(winningBid.bidderId)
        )
        .setTransactionMemo(`Settle auction ${auction.id}`)
      
      // Sign with operator private key
      const operatorKey = PrivateKey.fromStringED25519(OPERATOR_PRIVATE_KEY)
      transaction.sign(operatorKey)
      
      // Execute transaction
      const client = ... // Initialize Hedera client
      const response = await transaction.execute(client)
      const receipt = await response.getReceipt(client)
      
      console.log('✅ [SETTLEMENT] Transaction successful:', receipt.transactionId.toString())
      
      // Update database
      await prisma.auction.update({
        where: { id: auction.id },
        data: {
          status: 'SETTLED',
          winnerId: winningBid.bidderId,
          finalPriceHbar: winningBid.bidAmountHbar,
          settlementTransactionId: receipt.transactionId.toString()
        }
      })
      
      // Update NFT ownership
      await prisma.nFTAsset.update({
        where: { id: nft.id },
        data: {
          ownerId: winningBid.bidderId,
          status: 'SOLD'
        }
      })
      
      console.log('✅ [SETTLEMENT] Auction settled successfully')
      
    } catch (error) {
      console.error('❌ [SETTLEMENT] Error settling auction:', error)
      // Mark auction as failed settlement
      await prisma.auction.update({
        where: { id: auction.id },
        data: { status: 'ENDED' } // Or create FAILED status
      })
    }
  }
}

// Run every minute
export function startAuctionSettlementCron() {
  setInterval(async () => {
    try {
      await settleExpiredAuctions()
    } catch (error) {
      console.error('❌ [SETTLEMENT] Cron error:', error)
    }
  }, 60000) // Every 60 seconds
}
```

---

### 4. **DATABASE SCHEMA UPDATES**
**File:** `prisma/schema.prisma`

**Add to Bid model:**
```prisma
model Bid {
  id                    String   @id @default(cuid())
  
  // ... existing fields
  
  escrowTransactionId   String?  // Transaction ID when HBAR sent to operator
  refundTransactionId   String?  // Transaction ID if bidder was outbid and refunded
  status                BidStatus @default(ACTIVE)
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

enum BidStatus {
  ACTIVE      // Current highest bid, HBAR in escrow
  OUTBID      // Was outbid, HBAR refunded
  WON         // Won auction, HBAR sent to seller
  REFUNDED    // Auction cancelled, HBAR refunded
}
```

**Add to Auction model:**
```prisma
model Auction {
  // ... existing fields
  
  winnerId                String?   // Account ID of winning bidder
  finalPriceHbar          Float?    // Final winning bid amount
  settlementTransactionId String?   // Transaction ID of settlement
}
```

---

## 🔄 Complete Auction Flow

### Phase 1: Auction Creation (✅ DONE)
```
1. Owner lists NFT for auction
2. Sets starting bid and duration
3. Grants allowance to operator
4. Auction goes ACTIVE
```

### Phase 2: Bidding (⚠️ TO IMPLEMENT)
```
1. User A bids 10 HBAR
   → 10 HBAR sent to operator (escrow)
   → Auction.currentBidHbar = 10
   → Auction.currentBidderId = User A

2. User B bids 11 HBAR (≥ 10 * 1.05 = 10.5)
   → 11 HBAR sent to operator (escrow)
   → Operator refunds User A's 10 HBAR
   → Auction.currentBidHbar = 11
   → Auction.currentBidderId = User B

3. User C bids 12 HBAR (≥ 11 * 1.05 = 11.55)
   → 12 HBAR sent to operator (escrow)
   → Operator refunds User B's 11 HBAR
   → Auction.currentBidHbar = 12
   → Auction.currentBidderId = User C
```

### Phase 3: Auto-Settlement (⚠️ TO IMPLEMENT)
```
When timer expires:
1. Cron job detects expired auction
2. User C is highest bidder with 12 HBAR
3. Operator executes atomic transaction:
   - Operator → Seller: 12 HBAR
   - Seller → User C: NFT (using allowance)
4. Database updated:
   - Auction.status = SETTLED
   - Auction.winnerId = User C
   - NFT.ownerId = User C
```

---

## ⚠️ CRITICAL IMPLEMENTATION NOTES

### 1. **Operator Private Key Security**
```env
# .env (NEVER commit this!)
OPERATOR_ACCOUNT_ID=0.0.6854036
OPERATOR_PRIVATE_KEY=302e020100300506032b657004220420...
```

### 2. **Refund Logic**
When a bidder is outbid, operator MUST refund immediately:
```typescript
// Option A: Refund in same transaction as new bid (complex)
// Option B: Separate refund transaction (easier, costs more gas)
// Option C: Batch refunds every few minutes (efficient)
```

### 3. **Gas Fees**
- Bidding: ~0.05 HBAR
- Refund: ~0.05 HBAR (paid by operator)
- Settlement: ~0.1 HBAR (paid by operator)

**Solution:** Operator needs HBAR balance for refunds and settlements

### 4. **Edge Cases**
- What if no bids? → Mark auction as ENDED
- What if reserve price not met? → Configurable (cancel or sell anyway)
- What if settlement fails? → Retry mechanism needed

---

## 📊 Testing Checklist

### Escrow Bidding:
- [ ] User A bids starting price
- [ ] HBAR sent to operator
- [ ] Bid recorded in database
- [ ] User B bids 5% more
- [ ] User A refunded automatically
- [ ] User B's HBAR in escrow
- [ ] Auction timer counts down

### Auto-Settlement:
- [ ] Wait for auction to expire
- [ ] Cron job triggers
- [ ] Atomic transaction executes
- [ ] Winner receives NFT
- [ ] Seller receives HBAR
- [ ] Database updated correctly

---

## 🎯 Priority Order

1. **HIGH**: Implement bidding with escrow (`bid-modal-with-escrow.tsx`)
2. **HIGH**: Update bid API route (`app/api/auctions/bid/route.ts`)
3. **MEDIUM**: Add database schema updates (Bid.escrowTransactionId, Auction.winnerId)
4. **MEDIUM**: Implement settlement service (`lib/auction-settlement-service.ts`)
5. **LOW**: Add refund mechanism for outbid users
6. **LOW**: Error handling and edge cases

---

**Status:** 📋 Ready to Implement
**Estimated Time:** 4-6 hours
**Dependencies:** Operator account with private key access
