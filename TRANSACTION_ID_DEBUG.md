# Transaction ID Format Debugging Guide 🔍

## Current Issue
Mirror Node is rejecting transaction IDs with error:
```
400 Bad Request: Invalid Transaction id. 
Please use "shard.realm.num-sss-nnn" format where sss are seconds and nnn are nanoseconds
```

## Expected Formats

### Mirror Node Expects:
- Format: `0.0.xxx-seconds-nanoseconds`
- Example: `0.0.7023264-1760833407-656981994`
- Pattern: `shard.realm.num-seconds-nanoseconds` (all parts separated by dashes)

### Common Formats We Might Receive:

1. **Hedera SDK Format** (with @):
   - `0.0.7023264@1760833407.656981994`
   - Parts: `accountId@seconds.nanoseconds`

2. **Already Formatted** (with dashes):
   - `0.0.7023264-1760833407-656981994`
   - Parts: `shard.realm.num-seconds-nanoseconds`

3. **Timestamp Only** (missing account):
   - `1760833407.656981994`
   - Parts: `seconds.nanoseconds`
   - ⚠️ This format is INVALID (missing account ID)

## Detection Strategy

The updated code now handles all formats:

```typescript
// Check if already correct
if (transactionId.match(/^\d+\.\d+\.\d+-\d+-\d+$/)) {
  // Already formatted: 0.0.xxx-sss-nnn
  mirrorTxId = transactionId
}
// Format with @: 0.0.xxx@seconds.nanoseconds
else if (transactionId.includes('@')) {
  const [accountId, timestamp] = transactionId.split('@')
  const formattedTimestamp = timestamp.replace('.', '-')
  mirrorTxId = `${accountId}-${formattedTimestamp}`
}
// Invalid: missing account ID
else if (transactionId.match(/^\d+\.\d+$/)) {
  return { success: false, error: 'Missing account ID' }
}
```

## Debugging Steps

### 1. Check Frontend Logs
After clicking "Buy Now" and approving in HashPack, check console:

```
✅ [BUY NOW] Payment sent to seller: <transaction-id>
🔍 [BUY NOW] Transaction ID type: string
🔍 [BUY NOW] Transaction ID format check: {
  hasAt: true/false,
  hasDash: true/false,
  hasDot: true/false,
  length: XX
}
```

**What to look for:**
- If `hasAt: true` → Format is `0.0.xxx@seconds.nanoseconds` ✅ Will be converted
- If `hasDash: true` and `hasAt: false` → Already correct format ✅
- If only `hasDot: true` → May be missing account ID ❌

### 2. Check Backend Logs
The backend will log the received transaction ID:

```
🔐 [NFT TRANSFER] Processing NFT transfer... {
  listingId: xxx,
  buyer: 0.0.xxx,
  paymentTx: <transaction-id>,
  paymentTxType: string,
  paymentTxLength: XX
}
```

Then during payment verification:

```
🔍 Original transaction ID: <original-format>
🔍 Transaction ID type: string
🔍 Formatted for mirror node: <converted-format>
```

**Expected conversion:**
```
🔍 Original transaction ID: 0.0.7023264@1760833407.656981994
🔄 Converted from @ format
🔍 Formatted for mirror node: 0.0.7023264-1760833407-656981994
```

### 3. Check Mirror Node Query
The backend will log the actual URL being queried:

```
🔍 Querying mirror node: https://testnet.mirrornode.hedera.com/api/v1/transactions/0.0.7023264-1760833407-656981994
```

**Verify:**
- URL contains 3 parts: `0.0.xxx-seconds-nanoseconds`
- All parts separated by dashes (no @ or extra dots)
- Seconds and nanoseconds are numeric

### 4. If Still Getting 400 Error

**A. Transaction ID has wrong format:**
Check the frontend logs - the transaction ID from HashPack might be:
- Missing the account ID portion
- In an unexpected format
- Corrupted or truncated

**B. Transaction not found yet:**
The transaction might not be indexed yet. The code retries 5 times with delays:
- Attempt 1: Immediate
- Attempt 2: Wait 1 second
- Attempt 3: Wait 2 seconds
- Attempt 4: Wait 3 seconds
- Attempt 5: Wait 5 seconds

Check if you see:
```
⏳ [NFT TRANSFER] Retry X/4 - waiting XXXXms...
```

**C. Transaction ID from HashConnect is unexpected:**
The `executeTransaction` function tries multiple ways to extract the ID:
```typescript
// It checks:
result.transactionId
result.response?.transactionId
result.id
result.receipt?.transactionId
result.toString()
result._transactionId
```

Add this to `executeTransaction` in `lib/hashconnect.ts` to see what's actually returned:
```typescript
console.log('🔍 Raw HashConnect result:', JSON.stringify(result, null, 2))
```

## Testing the Fix

### Test 1: Normal Purchase Flow
1. Click "Buy Now" on a listing
2. Approve payment in HashPack
3. Check console for logs
4. Verify transaction ID format in logs
5. Wait for backend to verify payment
6. Check for success or error

### Test 2: Check Transaction on HashScan
After payment, copy the transaction ID from logs and check:
```
https://hashscan.io/testnet/transaction/<transaction-id>
```

Try both formats:
- Original format from HashPack
- Converted format for Mirror Node

Both should work on HashScan (it's forgiving with formats).

### Test 3: Manual Mirror Node Query
Test the Mirror Node API directly:
```bash
curl "https://testnet.mirrornode.hedera.com/api/v1/transactions/0.0.7023264-1760833407-656981994"
```

**Expected response:**
- Status 200 with transaction data
- Transaction shows HBAR transfers
- Buyer → Seller with correct amount

**If 400 error:**
- Format is still wrong
- Check the actual format being sent

## Common Issues & Solutions

### Issue 1: "Invalid Transaction id" 400 Error
**Cause:** Transaction ID format doesn't match `shard.realm.num-seconds-nanoseconds`

**Solution:**
- Check frontend logs for format
- Verify conversion is happening
- Ensure no extra dots or @ symbols in final format

### Issue 2: Transaction Not Found
**Cause:** Transaction not indexed yet on Mirror Node

**Solution:**
- Wait longer (code retries 5 times)
- Check transaction exists on HashScan
- Verify network (testnet vs mainnet)

### Issue 3: Payment Verification Fails
**Cause:** Transaction found but doesn't match expected transfers

**Solution:**
- Check amounts match (including transaction fees)
- Verify buyer and seller account IDs
- Check transaction actually succeeded (not FAILED)

## Files Modified

✅ `app/api/marketplace/execute-nft-transfer/route.ts`
- Added comprehensive transaction ID format detection
- Added detailed logging for debugging
- Handles multiple input formats

✅ `components/buy-now-modal.tsx`
- Added transaction ID format logging
- Shows format characteristics (hasAt, hasDash, etc.)

## Next Steps After Restarting Server

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Restart development server**
3. **Test purchase flow**
4. **Watch console logs carefully**
5. **Copy all logs if error persists**

## Quick Diagnostic Command

Run this in browser console after getting the error:

```javascript
// Check what transaction ID was sent
const txId = "<paste-transaction-id-from-error>";
console.log({
  original: txId,
  hasAt: txId.includes('@'),
  hasDash: txId.includes('-'),
  splitByAt: txId.split('@'),
  splitByDash: txId.split('-'),
  format: txId.match(/^\d+\.\d+\.\d+-\d+-\d+$/) ? 'CORRECT' : 'WRONG'
});
```

---

**Status**: ✅ Enhanced transaction ID parsing with comprehensive logging
**Next**: Restart server and test purchase flow with detailed logs
