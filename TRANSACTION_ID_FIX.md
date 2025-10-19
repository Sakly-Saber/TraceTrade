# Transaction ID Format Fix 🔧

## Problem
Mirror Node was rejecting transaction IDs with error:
```
400 Bad Request: Invalid Transaction id. 
Please use "shard.realm.num-sss-nnn" format where sss are seconds and nnn are nanoseconds
```

## Root Cause
**Hedera SDK returns**: `0.0.7023264@1760833407.656981994`
- Format: `accountId@seconds.nanoseconds`

**Mirror Node expects**: `0.0.7023264-1760833407-656981994`
- Format: `shard.realm.num-seconds-nanoseconds` (with dashes)

## Solution
Added transaction ID conversion in `execute-nft-transfer/route.ts`:

```typescript
if (transactionId.includes('@')) {
  // Split: "0.0.7023264@1760833407.656981994"
  const [accountId, timestamp] = transactionId.split('@')
  // accountId = "0.0.7023264"
  // timestamp = "1760833407.656981994"
  
  // Replace dot with dash: "1760833407.656981994" -> "1760833407-656981994"
  const formattedTimestamp = timestamp.replace('.', '-')
  
  // Combine: "0.0.7023264-1760833407-656981994"
  mirrorTxId = `${accountId}-${formattedTimestamp}`
}
```

## Examples

### Example 1:
**Input**: `0.0.7023264@1760833407.656981994`
**Output**: `0.0.7023264-1760833407-656981994`

### Example 2:
**Input**: `0.0.6854036@1234567890.123456789`
**Output**: `0.0.6854036-1234567890-123456789`

## Testing
After this fix, the Mirror Node query should succeed:
```
🔍 Original transaction ID: 0.0.7023264@1760833407.656981994
🔍 Formatted for mirror node: 0.0.7023264-1760833407-656981994
🔍 Querying mirror node: https://testnet.mirrornode.hedera.com/api/v1/transactions/0.0.7023264-1760833407-656981994
✅ Payment verification successful
```

## Files Modified
- ✅ `app/api/marketplace/execute-nft-transfer/route.ts` - Fixed transaction ID parsing
- ✅ `BUY_NOW_SETUP.md` - Updated documentation

## Status
✅ **Fixed** - Ready to test with real purchase flow
