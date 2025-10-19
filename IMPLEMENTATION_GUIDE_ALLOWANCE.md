# 🔐 NFT Allowance Implementation Guide

## Overview
This guide explains how to implement client-side NFT allowance approval for marketplace listings and auctions. **This is the most critical missing piece** that blocks sellers from listing NFTs.

---

## 🎯 What is NFT Allowance?

On Hedera, before someone else (the operator) can transfer your NFT, you must **grant them allowance**. This is like giving permission:

1. Seller lists NFT for sale
2. Seller grants allowance to OPERATOR account (0.0.6854036)
3. When buyer purchases, OPERATOR transfers NFT from seller to buyer
4. Seller receives HBAR payment

**Without allowance:** Operator cannot transfer the NFT, so purchases fail.

---

## 📁 Files to Create

### 1. **API Route: Grant Allowance**
**File:** `app/api/marketplace/grant-allowance/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Update listing/auction with allowance grant information
 */
export async function POST(req: NextRequest) {
  try {
    const { 
      type, // 'listing' or 'auction'
      id, // listing ID or auction ID
      allowanceTransactionId 
    } = await req.json()

    if (!type || !id || !allowanceTransactionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (type === 'listing') {
      // Update marketplace listing
      const listing = await prisma.marketplaceListing.update({
        where: { id },
        data: {
          allowanceGranted: true,
          allowanceTransactionId,
          status: 'ACTIVE' // Make listing active now that allowance is granted
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Allowance granted for marketplace listing',
        listing
      })
    } else if (type === 'auction') {
      // Update auction
      const auction = await prisma.auction.update({
        where: { id },
        data: {
          allowanceGranted: true,
          allowanceTransactionId,
          status: 'ACTIVE' // Make auction active
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Allowance granted for auction',
        auction
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "listing" or "auction"' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('❌ [ALLOWANCE] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update allowance', details: error.message },
      { status: 500 }
    )
  }
}
```

---

### 2. **Component: Allowance Approval Modal**
**File:** `components/allowance-approval-modal.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useWallet } from '@/hooks/use-wallet'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { AccountAllowanceApproveTransaction, AccountId, TokenId, NftId } from '@hashgraph/sdk'
import { toast } from 'sonner'

interface AllowanceApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  tokenId: string
  serialNumber: number
  type: 'listing' | 'auction'
  itemId: string // listing ID or auction ID
  onSuccess: () => void
}

const OPERATOR_ACCOUNT_ID = process.env.NEXT_PUBLIC_OPERATOR_ACCOUNT_ID || '0.0.6854036'

export function AllowanceApprovalModal({
  isOpen,
  onClose,
  tokenId,
  serialNumber,
  type,
  itemId,
  onSuccess
}: AllowanceApprovalModalProps) {
  const { accountId, hashconnect, provider } = useWallet()
  const [isApproving, setIsApproving] = useState(false)

  const handleApproveAllowance = async () => {
    if (!accountId || !hashconnect || !provider) {
      toast.error('Please connect your wallet first')
      return
    }

    setIsApproving(true)

    try {
      // Create NFT ID
      const nftId = new NftId(
        TokenId.fromString(tokenId),
        serialNumber
      )

      // Create allowance approval transaction
      const transaction = new AccountAllowanceApproveTransaction()
        .approveTokenNftAllowance(
          nftId,
          AccountId.fromString(accountId),
          AccountId.fromString(OPERATOR_ACCOUNT_ID)
        )

      console.log('🔐 [ALLOWANCE] Creating approval transaction...', {
        nftId: `${tokenId}@${serialNumber}`,
        owner: accountId,
        spender: OPERATOR_ACCOUNT_ID
      })

      // Sign and execute with HashConnect
      const signer = hashconnect.getSigner(AccountId.fromString(accountId))
      await transaction.freezeWithSigner(signer)
      const txResponse = await transaction.executeWithSigner(signer)

      console.log('✅ [ALLOWANCE] Transaction submitted:', txResponse.transactionId.toString())

      // Wait for receipt
      const receipt = await provider.getTransactionReceipt(txResponse.transactionId.toString())

      if (receipt.status.toString() !== 'SUCCESS') {
        throw new Error(`Transaction failed: ${receipt.status.toString()}`)
      }

      console.log('✅ [ALLOWANCE] Transaction confirmed')

      // Update database via API
      const response = await fetch('/api/marketplace/grant-allowance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          id: itemId,
          allowanceTransactionId: txResponse.transactionId.toString()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update allowance in database')
      }

      toast.success('Allowance granted successfully!')
      onSuccess()
      onClose()

    } catch (error: any) {
      console.error('❌ [ALLOWANCE] Error:', error)
      toast.error(`Failed to grant allowance: ${error.message}`)
    } finally {
      setIsApproving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Grant NFT Allowance</DialogTitle>
          <DialogDescription>
            To list this NFT, you must grant permission for our marketplace operator to transfer it on your behalf when sold.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">What is this?</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You're granting allowance to account <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">{OPERATOR_ACCOUNT_ID}</code> to transfer your NFT <strong>only when someone purchases it</strong>.
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">⚠️ Important</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
              <li>This does NOT transfer your NFT immediately</li>
              <li>You can revoke allowance anytime before sale</li>
              <li>The NFT stays in your wallet until sold</li>
            </ul>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              <strong>NFT:</strong> {tokenId} #{serialNumber}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Type:</strong> {type === 'listing' ? 'Marketplace Listing' : 'Auction'}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isApproving}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleApproveAllowance}
            disabled={isApproving}
            className="flex-1"
          >
            {isApproving ? 'Approving...' : 'Grant Allowance'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

---

### 3. **Update: Create Auction/Listing Pages**

Add allowance approval step after creating listing:

```typescript
'use client'

import { useState } from 'react'
import { AllowanceApprovalModal } from '@/components/allowance-approval-modal'
import { useRouter } from 'next/navigation'

export default function CreateListingPage() {
  const router = useRouter()
  const [showAllowanceModal, setShowAllowanceModal] = useState(false)
  const [createdListing, setCreatedListing] = useState<any>(null)

  const handleCreateListing = async (formData: any) => {
    try {
      // Create listing in database first (status: PENDING)
      const response = await fetch('/api/marketplace/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'PENDING' // Not active until allowance granted
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error)
      }

      // Save listing data
      setCreatedListing(data.listing)

      // Show allowance modal
      setShowAllowanceModal(true)

    } catch (error: any) {
      console.error('Error creating listing:', error)
      toast.error(error.message)
    }
  }

  const handleAllowanceSuccess = () => {
    toast.success('Listing is now active!')
    router.push('/marketplace')
  }

  return (
    <div>
      {/* Your listing form here */}
      <ListingForm onSubmit={handleCreateListing} />

      {/* Allowance Modal */}
      {createdListing && (
        <AllowanceApprovalModal
          isOpen={showAllowanceModal}
          onClose={() => setShowAllowanceModal(false)}
          tokenId={createdListing.nftAsset.tokenId}
          serialNumber={createdListing.nftAsset.serialNumber}
          type="listing"
          itemId={createdListing.id}
          onSuccess={handleAllowanceSuccess}
        />
      )}
    </div>
  )
}
```

---

### 4. **Environment Variables**

Add to `.env.local`:

```env
# Public (client-side accessible)
NEXT_PUBLIC_OPERATOR_ACCOUNT_ID=0.0.6854036

# Private (server-side only)
OPERATOR_ACCOUNT_ID=0.0.6854036
OPERATOR_PRIVATE_KEY=your-private-key-here
```

---

## 🔄 Complete Flow

### **Marketplace Listing**
1. Seller creates listing → Status: `PENDING`
2. Modal opens asking to grant allowance
3. Seller approves allowance via HashConnect
4. Transaction confirms on Hedera
5. API updates listing → Status: `ACTIVE`, `allowanceGranted: true`
6. Listing appears on marketplace

### **Auction**
1. Seller creates auction → Status: `PENDING`
2. Modal opens asking to grant allowance
3. Seller approves allowance via HashConnect
4. Transaction confirms on Hedera
5. API updates auction → Status: `ACTIVE`, `allowanceGranted: true`
6. Auction goes live

---

## 🧪 Testing Checklist

- [ ] Create listing without wallet → Shows error
- [ ] Create listing with wallet → Allowance modal appears
- [ ] Grant allowance → Transaction succeeds
- [ ] Check database → `allowanceGranted: true`
- [ ] Check database → `allowanceTransactionId` populated
- [ ] Listing status → `ACTIVE`
- [ ] Listing appears on marketplace
- [ ] Try purchasing (next step)

---

## 🐛 Common Issues

### **Issue: "Insufficient transaction fee"**
**Solution:** Ensure wallet has enough HBAR for gas (~0.05 HBAR)

### **Issue: "Invalid token ID"**
**Solution:** Verify tokenId format is correct (`0.0.xxxxx`)

### **Issue: "Allowance modal doesn't appear"**
**Solution:** Check console for errors, verify `createdListing` has data

### **Issue: "Transaction times out"**
**Solution:** Increase timeout in HashConnect config, check network

---

## 📚 References

- [Hedera NFT Allowances](https://docs.hedera.com/guides/docs/sdks/tokens/approve-an-allowance)
- [HashConnect Documentation](https://github.com/Hashpack/hashconnect)
- [AccountAllowanceApproveTransaction](https://docs.hedera.com/hedera/sdks-and-apis/sdks/token-service/approve-an-allowance)

---

## ✅ Next Steps After Allowance

Once allowance approval is working:

1. **Implement Purchase Flow** - See `IMPLEMENTATION_GUIDE_PURCHASE.md`
2. **Test End-to-End** - Create listing, grant allowance, purchase
3. **Add Revoke Allowance** - Allow sellers to cancel listings
4. **Document** - Fill in empty .md files with learnings

---

**Status:** 🟡 Not Implemented  
**Priority:** 🔴 CRITICAL (blocks all marketplace/auction functionality)  
**Estimated Time:** 2-3 hours
