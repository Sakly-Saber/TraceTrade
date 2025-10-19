# Auction Settlement System

## 🎯 Overview

This auction system uses **ATOMIC TRANSACTIONS** to ensure secure, simultaneous exchange of NFT and HBAR when auctions end.

## ⚡ Key Features

### 1. **Atomic Settlement**
- NFT transfer and HBAR payment happen in ONE transaction
- If either fails, BOTH fail (all-or-nothing guarantee)
- No risk of sending HBAR without receiving NFT (or vice versa)

### 2. **Automatic Completion**
- Cron job checks every minute for ended auctions
- Automatically executes settlement when timer expires
- No manual intervention required

### 3. **Platform Fee**
- 2.5% platform fee deducted from final bid
- Winner pays full bid amount
- Seller receives 97.5% of final bid

## 📋 Testing Instructions

### Test 1: Expedite an Auction (Set to end in 2 minutes)

```bash
# Get an auction ID from http://localhost:3000/auctions
# Then run:
node scripts/expedite-auction.js <auction-id>

# Example:
node scripts/expedite-auction.js cmgx5akrq0005vagkedzknp2f
```

This will set the auction to end in 2 minutes for quick testing.

### Test 2: Manually Trigger Cron Job

```bash
# Call the cron endpoint manually:
curl -X GET http://localhost:3000/api/auctions/cron/complete \
  -H "Authorization: Bearer your-super-secret-cron-key-change-in-production"
```

### Test 3: Place a Bid

1. Go to auction detail page: `http://localhost:3000/auctions/{auction-id}`
2. Connect wallet with HashPack
3. Place a bid (must be 5% above current bid)
4. Wait for auction to end (or expedite it)
5. Watch logs for automatic settlement

## 🔄 Settlement Flow

```
1. Auction ends (timer reaches 0)
   ↓
2. Cron job detects ended auction
   ↓
3. Get winning bid and auction details
   ↓
4. Create ATOMIC transaction:
   - Transfer NFT: Seller → Winner
   - Transfer HBAR: Winner → Seller (minus 2.5% fee)
   - Platform fee: Winner → Operator
   ↓
5. Execute transaction (all-or-nothing)
   ↓
6. Update database:
   - Auction status: ENDED
   - NFT owner: Winner
   - isSettled: true
```

## 📝 Database Updates After Settlement

- **Auction**: `status='ENDED'`, `isSettled=true`, `winnerId=<winner>`
- **NFT**: `ownerId=<winner>`, `status='MINTED'`, `lastSalePrice=<bid>`
- **Bid**: `txHash=<transaction-id>`

## 🔐 Security

- Cron job requires `Authorization: Bearer <CRON_SECRET>`
- Only platform operator can execute settlements
- Atomic transactions prevent partial transfers
- All transactions recorded on Hedera blockchain

## 🛠️ Environment Variables Required

```env
HEDERA_OPERATOR_ID=0.0.xxxxxx
HEDERA_OPERATOR_KEY=0x...
CRON_SECRET=your-secret-key
```

## 📊 Transaction Details

Example atomic transaction includes:
- 1x NFT transfer (Seller → Winner)
- 2x HBAR transfers:
  - Full bid amount (Winner → Platform escrow)
  - 97.5% of bid (Platform → Seller)
  - 2.5% fee (Platform → Operator)

## 🚀 Production Deployment

### Option 1: Vercel Cron (Recommended)
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/auctions/cron/complete",
    "schedule": "* * * * *"
  }]
}
```

### Option 2: External Cron Service
Use services like:
- GitHub Actions (scheduled workflow)
- Render Cron Jobs
- EasyCron.com
- cron-job.org

Set up to call: `GET /api/auctions/cron/complete` every minute

## 🐛 Troubleshooting

### Auction not settling?
1. Check logs: `npm run dev` terminal
2. Verify `HEDERA_OPERATOR_ID` and `HEDERA_OPERATOR_KEY` in `.env.local`
3. Ensure auction has ended: `endTime < now`
4. Check if auction already settled: `isSettled=false`

### Transaction failed?
- Verify operator has enough HBAR balance
- Check winner has associated the NFT token
- Ensure seller still owns the NFT
- Check Hedera network status

## 📞 Support

Check logs for detailed error messages:
- `[ATOMIC SETTLEMENT]` - Settlement transaction logs
- `[AUCTION COMPLETE]` - Completion process logs
- `[CRON]` - Cron job execution logs
