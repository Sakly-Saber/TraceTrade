# Transaction ID Testing Guide 🧪

## Quick Test Endpoint

I've created a test endpoint to help diagnose the transaction ID format issue without doing a full purchase.

### Test Your Transaction ID

**Option 1: Browser (GET)**
```
http://localhost:3000/api/test-transaction-id?transactionId=YOUR_TX_ID_HERE
```

**Option 2: Command Line (POST)**
```powershell
# PowerShell
$body = @{
    transactionId = "0.0.7023264@1760833407.656981994"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/test-transaction-id" -Method POST -Body $body -ContentType "application/json"
```

**Option 3: Fetch API (Browser Console)**
```javascript
fetch('http://localhost:3000/api/test-transaction-id', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    transactionId: "0.0.7023264@1760833407.656981994"
  })
})
.then(r => r.json())
.then(console.log)
```

## What The Test Does

1. ✅ Shows how the transaction ID will be converted
2. ✅ Validates the final format
3. ✅ Tests the actual Mirror Node query
4. ✅ Shows detailed breakdown of the conversion

## Example Response

```json
{
  "success": true,
  "conversion": {
    "input": "0.0.7023264@1760833407.656981994",
    "output": "0.0.7023264-1760833407-656981994",
    "method": "converted-from-@",
    "valid": true,
    "pattern": "0.0.xxx-seconds-nanoseconds"
  },
  "mirrorNode": {
    "url": "https://testnet.mirrornode.hedera.com/api/v1/transactions/0.0.7023264-1760833407-656981994",
    "success": true,
    "status": 200,
    "statusText": "OK",
    "error": null,
    "foundTransaction": true
  },
  "parts": {
    "original": ["0.0.7023264", "1760833407", "656981994"],
    "hasCorrectParts": true
  }
}
```

## How to Use This for Debugging

### Step 1: Get the Transaction ID from Your Console
After clicking "Buy Now" and approving in HashPack, look for:
```
✅ [BUY NOW] Payment sent to seller: <COPY_THIS_ID>
```

### Step 2: Test the Conversion
Paste the transaction ID into the test endpoint:
```
http://localhost:3000/api/test-transaction-id?transactionId=<PASTE_HERE>
```

### Step 3: Check the Response

**If conversion.valid = true:**
- ✅ Format conversion is working
- The issue might be elsewhere (retry logic, network, etc.)

**If conversion.valid = false:**
- ❌ Format conversion is failing
- Check `conversion.method` to see what went wrong
- Check `conversion.output` to see what format it tried to create

**If mirrorNode.success = false:**
- ❌ Mirror Node rejected the format
- Check `mirrorNode.error` for the exact error
- This is the same error you'd get in the real purchase flow

### Step 4: Share Results

If still getting errors, share the full response from the test endpoint. This will show:
- Exact input format
- How it was converted
- What Mirror Node returned
- Whether the format is valid

## Common Test Scenarios

### Test 1: Standard Hedera SDK Format
```
?transactionId=0.0.7023264@1760833407.656981994
```
**Expected**: Converts to `0.0.7023264-1760833407-656981994` ✅

### Test 2: Already Formatted
```
?transactionId=0.0.7023264-1760833407-656981994
```
**Expected**: Uses as-is ✅

### Test 3: Missing Account ID (FAIL)
```
?transactionId=1760833407.656981994
```
**Expected**: Error - "Missing account ID" ❌

### Test 4: Unknown Format (FAIL)
```
?transactionId=invalid-format
```
**Expected**: Error - "Unknown format" ❌

## Debugging Checklist

- [ ] Restart development server
- [ ] Get transaction ID from console after "Buy Now"
- [ ] Test transaction ID using the test endpoint
- [ ] Check if `conversion.valid = true`
- [ ] Check if `mirrorNode.success = true`
- [ ] If both true, the format is correct (issue is elsewhere)
- [ ] If either false, check the error messages
- [ ] Share the full test response for further debugging

## What This Tells Us

**If test endpoint works but purchase fails:**
- The format conversion is correct
- Issue is in the retry logic or timing
- Transaction might not be indexed yet

**If test endpoint fails:**
- Format conversion has a bug
- Transaction ID from HashPack is unexpected
- Need to adjust the parsing logic

## Next Steps

1. **Restart your server** to load the new code
2. **Try a test transaction ID** using the endpoint
3. **Try a real purchase** and test the actual transaction ID
4. **Share the results** if still getting errors

---

**Test Endpoint**: `/api/test-transaction-id`
**Methods**: GET (with query param) or POST (with JSON body)
**Purpose**: Debug transaction ID format conversion without full purchase
