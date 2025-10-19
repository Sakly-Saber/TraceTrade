# ✅ Escrow-Based Atomic Purchase Flow

## Problem with Previous Approach

**❌ Old Flow (Flawed):**
1. Buyer sends HBAR → Seller
2. Backend tries to send NFT → Buyer
3. **ISSUE:** If NFT transfer fails, buyer loses HBAR with no NFT!

## New Escrow Solution

**✅ New Flow (Safe & Atomic):**
1. **Buyer sends HBAR → OPERATOR** (escrow)
2. Backend verifies escrow payment
3. **Backend executes ATOMIC SWAP:**
   - NFT: Seller → Buyer
   - HBAR: Operator → Seller
4. If swap fails, HBAR stays in operator for refund

## How It Works

### Step 1: Frontend - Escrow Payment
**File**: `components/buy-now-modal.tsx`

```typescript
// Buyer sends HBAR to OPERATOR (not seller)
const paymentTransaction = new TransferTransaction()
  .addHbarTransfer(buyer, -price)          // Debit from buyer
  .addHbarTransfer(OPERATOR_ID, +price)    // Credit to OPERATOR escrow

const result = await executeTransaction(paymentTransaction, walletAddress)
```

**What happens:**
- Buyer signs transaction in HashPack
- HBAR moves from buyer → operator
- Frontend receives transaction ID

### Step 2: Backend - Verify Escrow
**File**: `app/api/marketplace/execute-nft-transfer/route.ts`

```typescript
// Verify payment went to OPERATOR (escrow), not seller
const paymentVerified = await verifyPayment(
  transactionId,
  buyerAccountId,
  OPERATOR_ID,  // ← Verify payment to operator
  priceHbar
)
```

**What happens:**
- Query Hedera Mirror Node
- Confirm: buyer sent exact price to operator
- Uses retry mechanism (5 attempts, exponential backoff)

### Step 3: Backend - Atomic Swap
**File**: `app/api/marketplace/execute-nft-transfer/route.ts`

```typescript
// ATOMIC TRANSACTION: Both transfers in single transaction
const atomicSwap = new TransferTransaction()
  // Transfer NFT from seller to buyer (using operator's allowance)
  .addApprovedNftTransfer(tokenId, serialNumber, seller, buyer)
  // Transfer HBAR from operator to seller (completing the swap)
  .addHbarTransfer(operator, -price)  // Debit from operator
  .addHbarTransfer(seller, +price)    // Credit to seller
  .freezeWith(client)

// Sign and execute with operator key
const signedTx = await atomicSwap.sign(operatorPrivateKey)
const txResponse = await signedTx.execute(client)
```

**What happens:**
- **ATOMIC**: Both transfers succeed or both fail
- Operator uses seller's allowance to move NFT
- Operator sends HBAR to seller
- If ANY part fails, entire transaction reverts

## Transaction Flow Diagram

```
┌─────────┐                    ┌──────────┐                    ┌────────┐
│  Buyer  │                    │ Operator │                    │ Seller │
└────┬────┘                    └────┬─────┘                    └───┬────┘
     │                              │                              │
     │  1. Send HBAR (escrow)       │                              │
     │─────────────────────────────>│                              │
     │                              │                              │
     │  2. Verify escrow payment    │                              │
     │<─────────────────────────────│                              │
     │                              │                              │
     │  3. ATOMIC SWAP:             │                              │
     │     ┌────────────────────────┼──────────────────────────┐   │
     │     │ NFT: Seller → Buyer    │                          │   │
     │<────┼────────────────────────┼──────────────────────────┼───┤
     │     │                        │ HBAR: Operator → Seller  │   │
     │     │                        │─────────────────────────>│   │
     │     └────────────────────────┼──────────────────────────┘   │
     │                              │                              │
```

## Safety Guarantees

✅ **Atomic Execution**
- NFT and HBAR transfer in SINGLE transaction
- Both succeed or both fail - no partial states

✅ **Escrow Protection**
- Buyer's HBAR held by operator until swap completes
- If swap fails, HBAR can be refunded

✅ **No Trust Required**
- Buyer doesn't trust seller
- Seller doesn't trust buyer
- Both trust the operator's smart contract logic

✅ **Seller Gets Paid Only When Buyer Gets NFT**
- Atomic swap ensures fairness
- No "HBAR paid but no NFT" scenario

## Database Updates

```typescript
await prisma.marketplaceListing.update({
  where: { id: listingId },
  data: {
    status: 'SOLD',
    soldAt: new Date(),
    transactionId: `${escrowTxId},${swapTxId}` // Both transaction IDs
  }
})

await prisma.nFTAsset.update({
  where: { id: nftAssetId },
  data: {
    ownerId: buyerUserId,  // Update ownership
    updatedAt: new Date()
  }
})
```

## Transaction IDs Stored

**Two transaction IDs are tracked:**
1. **Escrow Transaction**: Buyer → Operator (HBAR payment)
2. **Swap Transaction**: Atomic NFT + HBAR swap

**Success Screen Shows Both:**
```
Escrow Payment: 0.0.7023264@1760823964.757
Atomic Swap: 0.0.5187830@1760823968.123
```

## Error Handling

### Scenario 1: Escrow Payment Fails
- Transaction rejected by wallet
- **Result**: Nothing happens, buyer keeps HBAR

### Scenario 2: Escrow Verified, Swap Fails
- HBAR in operator escrow
- NFT transfer fails (no allowance, seller revoked, etc.)
- **Result**: HBAR stays in operator, can be refunded to buyer

### Scenario 3: Swap Partially Succeeds
- **IMPOSSIBLE**: Hedera transactions are atomic
- If NFT transfer fails, HBAR transfer also fails
- Entire transaction reverts

## Prerequisites

**Before listing NFT:**
1. Seller must grant allowance to operator:
```solidity
// Solidity
approve(OPERATOR_ADDRESS, tokenId)

// Hedera SDK
new AccountAllowanceApproveTransaction()
  .approveTokenNftAllowance(nftId, sellerAccountId, operatorAccountId, [serialNumber])
```

**Operator Account:**
- Account ID: `0.0.5187830`
- Private Key: Stored in environment variable
- Has authority to transfer seller's NFTs (via allowance)

## Testing Checklist

- [ ] Buyer sends HBAR to operator (not seller)
- [ ] Escrow payment verified via Mirror Node
- [ ] Atomic swap executes (NFT + HBAR)
- [ ] Buyer receives NFT
- [ ] Seller receives HBAR
- [ ] Database updated (listing = SOLD, ownership changed)
- [ ] Both transaction IDs displayed in UI
- [ ] Error case: Swap fails → HBAR stays in operator

## Comparison: Old vs New

| Aspect | Old (Flawed) | New (Escrow) |
|--------|-------------|--------------|
| HBAR recipient | Seller | **Operator** (escrow) |
| NFT + HBAR transfer | Separate transactions | **Atomic transaction** |
| Buyer risk | High (can lose HBAR) | **None** (atomic swap) |
| Seller risk | Low | **None** (paid only when NFT sent) |
| Refund possible | No | **Yes** (HBAR in escrow) |
| Transactions | 2 separate | **1 atomic** |

## Benefits

🔒 **Security**: Escrow ensures buyer can't lose funds  
⚛️ **Atomicity**: Single transaction = all-or-nothing  
🔄 **Refundable**: Failed swaps can be refunded from escrow  
✅ **Fair**: Both parties get what they expect simultaneously  
🚀 **Efficient**: Single atomic transaction instead of 2 separate ones  

---

**Implementation Status**: ✅ Complete  
**Last Updated**: October 18, 2025
