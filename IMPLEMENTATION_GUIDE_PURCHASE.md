# 💰 Marketplace Purchase Implementation Guide

## Overview
This guide explains how to implement client-side NFT purchasing with atomic swap (NFT + HBAR in single transaction).

---

## 🎯 What is Atomic Swap?

An **atomic swap** ensures both parts happen together or not at all:

1. NFT transfers from seller → buyer
2. HBAR transfers from buyer → seller

**If either fails, both fail** (transaction reverts). This prevents:
- Buyer paying but not receiving NFT
- Buyer receiving NFT but not paying

---

## 📁 Files to Create

### 1. **API Route: Complete Purchase**
**File:** `app/api/marketplace/complete-purchase/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Finalize purchase after successful blockchain transaction
 */
export async function POST(req: NextRequest) {
  try {
    const { 
      listingId,
      buyerAddress,
      purchaseTransactionId
    } = await req.json()

    if (!listingId || !buyerAddress || !purchaseTransactionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get listing with NFT
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: listingId },
      include: {
        nftAsset: true,
        seller: true
      }
    })

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Get or create buyer business
    let buyer = await prisma.business.findFirst({
      where: { walletAddress: buyerAddress }
    })

    if (!buyer) {
      buyer = await prisma.business.create({
        data: {
          name: `Buyer - ${buyerAddress.slice(0, 10)}`,
          walletAddress: buyerAddress,
          email: `${buyerAddress}@hedera.local`,
          phone: 'N/A',
          address: 'N/A',
          city: 'N/A',
          state: 'N/A',
          businessType: 'SOLE_PROPRIETORSHIP',
          industry: 'OTHER',
          status: 'ACTIVE'
        }
      })
    }

    // Update database in transaction
    const result = await prisma.$transaction([
      // Update listing status
      prisma.marketplaceListing.update({
        where: { id: listingId },
        data: {
          status: 'SOLD',
          soldAt: new Date(),
          buyerId: buyer.id
        }
      }),

      // Update NFT ownership
      prisma.nFTAsset.update({
        where: { id: listing.nftAsset.id },
        data: {
          ownerId: buyer.id,
          status: 'SOLD',
          lastSalePrice: listing.priceHbar
        }
      }),

      // Create transaction record
      prisma.transaction.create({
        data: {
          type: 'PURCHASE',
          status: 'COMPLETED',
          amount: listing.priceHbar,
          currency: 'HBAR',
          fromUserId: buyer.id,
          toUserId: listing.sellerId,
          nftAssetId: listing.nftAsset.id,
          marketplaceListingId: listing.id,
          transactionHash: purchaseTransactionId,
          completedAt: new Date()
        }
      })
    ])

    return NextResponse.json({
      success: true,
      message: 'Purchase completed successfully',
      listing: result[0],
      nft: result[1],
      transaction: result[2]
    })

  } catch (error: any) {
    console.error('❌ [PURCHASE] Error:', error)
    return NextResponse.json(
      { error: 'Failed to complete purchase', details: error.message },
      { status: 500 }
    )
  }
}
```

---

### 2. **Component: Purchase Modal**
**File:** `components/purchase-modal.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useWallet } from '@/hooks/use-wallet'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TransferTransaction, AccountId, TokenId, NftId, Hbar } from '@hashgraph/sdk'
import { toast } from 'sonner'

interface PurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  listing: {
    id: string
    nftAsset: {
      tokenId: string
      serialNumber: number
      name: string
      imageUrl?: string
    }
    priceHbar: number
    seller: string
  }
  onSuccess: () => void
}

export function PurchaseModal({
  isOpen,
  onClose,
  listing,
  onSuccess
}: PurchaseModalProps) {
  const { accountId, hashconnect, provider } = useWallet()
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [step, setStep] = useState<'validate' | 'execute' | 'finalize'>('validate')

  const handlePurchase = async () => {
    if (!accountId || !hashconnect || !provider) {
      toast.error('Please connect your wallet first')
      return
    }

    setIsPurchasing(true)

    try {
      // Step 1: Validate purchase
      setStep('validate')
      console.log('🔍 [PURCHASE] Validating purchase...')

      const validateResponse = await fetch('/api/marketplace/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          buyerAddress: accountId
        })
      })

      if (!validateResponse.ok) {
        const error = await validateResponse.json()
        throw new Error(error.error || 'Validation failed')
      }

      const validation = await validateResponse.json()
      console.log('✅ [PURCHASE] Validation passed:', validation)

      // Step 2: Execute atomic swap transaction
      setStep('execute')
      console.log('🔄 [PURCHASE] Creating atomic swap transaction...')

      const { tokenId, serialNumber, sellerAddress, priceHbar } = validation.transaction

      // Create NFT ID
      const nftId = new NftId(
        TokenId.fromString(tokenId),
        serialNumber
      )

      // Build atomic swap
      const transaction = new TransferTransaction()
        // NFT: seller → buyer (using approved allowance)
        .addApprovedNftTransfer(
          nftId,
          AccountId.fromString(sellerAddress),
          AccountId.fromString(accountId)
        )
        // HBAR: buyer → seller
        .addHbarTransfer(
          AccountId.fromString(accountId),
          Hbar.from(-priceHbar)
        )
        .addHbarTransfer(
          AccountId.fromString(sellerAddress),
          Hbar.from(priceHbar)
        )

      console.log('📝 [PURCHASE] Transaction details:', {
        nft: `${tokenId}@${serialNumber}`,
        from: sellerAddress,
        to: accountId,
        price: `${priceHbar} HBAR`
      })

      // Sign and execute with HashConnect
      const signer = hashconnect.getSigner(AccountId.fromString(accountId))
      await transaction.freezeWithSigner(signer)
      const txResponse = await transaction.executeWithSigner(signer)

      console.log('✅ [PURCHASE] Transaction submitted:', txResponse.transactionId.toString())

      // Wait for receipt
      const receipt = await provider.getTransactionReceipt(txResponse.transactionId.toString())

      if (receipt.status.toString() !== 'SUCCESS') {
        throw new Error(`Transaction failed: ${receipt.status.toString()}`)
      }

      console.log('✅ [PURCHASE] Transaction confirmed')

      // Step 3: Finalize in database
      setStep('finalize')
      console.log('💾 [PURCHASE] Updating database...')

      const finalizeResponse = await fetch('/api/marketplace/complete-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          buyerAddress: accountId,
          purchaseTransactionId: txResponse.transactionId.toString()
        })
      })

      if (!finalizeResponse.ok) {
        throw new Error('Failed to finalize purchase in database')
      }

      console.log('✅ [PURCHASE] Purchase complete!')

      toast.success(`Successfully purchased ${listing.nftAsset.name}!`)
      onSuccess()
      onClose()

    } catch (error: any) {
      console.error('❌ [PURCHASE] Error:', error)
      
      let errorMessage = error.message
      if (error.message.includes('INSUFFICIENT_ACCOUNT_BALANCE')) {
        errorMessage = `Insufficient HBAR balance. You need ${listing.priceHbar} HBAR plus gas fees.`
      } else if (error.message.includes('allowance')) {
        errorMessage = 'Seller has not granted allowance. Please contact seller.'
      }
      
      toast.error(`Purchase failed: ${errorMessage}`)
    } finally {
      setIsPurchasing(false)
      setStep('validate')
    }
  }

  const getStepMessage = () => {
    switch (step) {
      case 'validate':
        return 'Validating purchase...'
      case 'execute':
        return 'Executing transaction on Hedera...'
      case 'finalize':
        return 'Finalizing purchase...'
      default:
        return 'Processing...'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Purchase NFT</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* NFT Preview */}
          {listing.nftAsset.imageUrl && (
            <img
              src={listing.nftAsset.imageUrl}
              alt={listing.nftAsset.name}
              className="w-full h-48 object-cover rounded-lg"
            />
          )}

          {/* Details */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">{listing.nftAsset.name}</h3>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Price</span>
              <span className="font-semibold">{listing.priceHbar} ℏ</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">NFT ID</span>
              <span className="text-xs">{listing.nftAsset.tokenId}#{listing.nftAsset.serialNumber}</span>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              ⚠️ This will transfer <strong>{listing.priceHbar} HBAR</strong> from your wallet and receive the NFT in return.
            </p>
          </div>

          {/* Progress */}
          {isPurchasing && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {getStepMessage()}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPurchasing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePurchase}
            disabled={isPurchasing || !accountId}
            className="flex-1"
          >
            {isPurchasing ? getStepMessage() : `Buy for ${listing.priceHbar} ℏ`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

---

### 3. **Update: Enhanced NFT Card**

Add purchase button to marketplace cards:

**File:** `components/enhanced-nft-card.tsx`

```typescript
'use client'

import { useState } from 'react'
import { PurchaseModal } from './purchase-modal'
import { Button } from './ui/button'

export function EnhancedNFTCard({ listing }: { listing: any }) {
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)

  return (
    <div className="border rounded-lg p-4">
      {/* Existing card content */}
      <img src={listing.nftAsset.imageUrl} alt={listing.nftAsset.name} />
      <h3>{listing.nftAsset.name}</h3>
      <p>{listing.priceHbar} ℏ</p>

      {/* Purchase Button */}
      {listing.status === 'ACTIVE' && listing.allowanceGranted && (
        <Button 
          onClick={() => setShowPurchaseModal(true)}
          className="w-full mt-4"
        >
          Buy Now
        </Button>
      )}

      {!listing.allowanceGranted && (
        <p className="text-sm text-yellow-600 mt-2">
          ⚠️ Awaiting seller approval
        </p>
      )}

      {/* Purchase Modal */}
      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        listing={listing}
        onSuccess={() => {
          // Refresh page or update listing state
          window.location.reload()
        }}
      />
    </div>
  )
}
```

---

## 🔄 Complete Purchase Flow

1. **Buyer clicks "Buy Now"** → Purchase modal opens
2. **Validation** → API checks:
   - Listing is active
   - Allowance is granted
   - Seller wallet is valid
   - Not self-purchase
3. **Execute Transaction** → HashConnect signs atomic swap:
   - NFT transfer (seller → buyer using allowance)
   - HBAR transfer (buyer → seller)
4. **Confirm on Hedera** → Wait for transaction receipt
5. **Finalize** → API updates:
   - Listing status → `SOLD`
   - NFT owner → buyer
   - Create transaction record
6. **Success** → Buyer now owns NFT!

---

## 🧪 Testing Checklist

### **Pre-Purchase**
- [ ] Listing exists with `allowanceGranted: true`
- [ ] Buyer wallet has sufficient HBAR (price + ~0.1 for gas)
- [ ] Seller wallet is different from buyer wallet

### **Purchase Flow**
- [ ] Click "Buy Now" → Modal opens
- [ ] Modal shows correct NFT and price
- [ ] Click purchase → HashConnect prompts for signature
- [ ] Approve in wallet → Transaction submits
- [ ] See "Executing transaction..." message
- [ ] Transaction confirms (check Hedera explorer)
- [ ] Database updates successfully
- [ ] Success message appears
- [ ] Listing disappears from marketplace

### **Post-Purchase**
- [ ] Check buyer wallet → NFT appears
- [ ] Check seller wallet → HBAR received
- [ ] Check database → Listing status is `SOLD`
- [ ] Check database → NFT owner is buyer
- [ ] Check database → Transaction record created

---

## 🐛 Common Issues

### **Issue: "Insufficient account balance"**
**Cause:** Buyer doesn't have enough HBAR  
**Solution:** Ensure buyer has `priceHbar + 0.1 HBAR` (gas buffer)

### **Issue: "NFT allowance not granted"**
**Cause:** Seller didn't grant allowance or it expired  
**Solution:** Check `allowanceGranted` in database, seller must re-approve

### **Issue: "INVALID_SIGNATURE"**
**Cause:** Transaction not properly signed by buyer  
**Solution:** Check HashConnect signer setup, ensure wallet is connected

### **Issue: "Transaction times out"**
**Cause:** Network congestion or HashConnect issue  
**Solution:** Increase timeout, check Hedera network status

### **Issue: "Database update fails but blockchain succeeds"**
**Cause:** API error after successful transaction  
**Solution:** Implement retry logic, check transaction ID manually

---

## 🔒 Security Considerations

1. **Validate on Backend:** Always re-validate on server before finalizing
2. **Transaction ID:** Store blockchain transaction ID for audit trail
3. **Atomic Swap:** Use `TransferTransaction` to ensure atomicity
4. **Error Handling:** Handle partial failures gracefully
5. **Rate Limiting:** Prevent spam purchases on same listing

---

## 📊 Transaction Gas Costs

- **Allowance Approval:** ~0.01-0.05 HBAR
- **Purchase (Atomic Swap):** ~0.05-0.1 HBAR
- **Total Buyer Cost:** `priceHbar + ~0.15 HBAR`

---

## ✅ Next Steps

After purchase flow is working:

1. **Test Edge Cases:**
   - Buyer = Seller (should fail)
   - Insufficient balance (should fail)
   - No allowance (should fail)
   - Network timeout (should retry)

2. **Add Features:**
   - Purchase history page
   - Transaction explorer link
   - Email notifications
   - Offer/bidding system

3. **Optimize:**
   - Cache validation results
   - Parallel transaction checks
   - Better error messages
   - Loading states

---

**Status:** 🟡 Not Implemented  
**Priority:** 🔴 CRITICAL (blocks all purchases)  
**Estimated Time:** 3-4 hours  
**Dependencies:** Allowance approval must be implemented first
