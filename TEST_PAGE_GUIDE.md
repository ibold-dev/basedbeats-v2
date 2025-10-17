# BasedBeats Test Page Guide

## Overview

The main page (`src/app/page.tsx`) has been converted into a comprehensive testing interface for all BasedBeats and USDC functions.

## Features Tested

### 1. **Account Info Display**

- Shows USDC balance
- Shows current BasedBeats allowance
- Universal account address with copy functionality
- Faucet integration for funding

### 2. **Create Track** (Single Transaction)

- Input: Track CID (IPFS URL or metadata reference)
- Action: Creates a new track on BasedBeats contract
- Uses: `useSingleTransaction` hook

### 3. **Like Track** (Batch Transaction)

- Input: Track ID
- Action: **Approves 1 USDC + Likes track** in ONE transaction
- Batch calls:
  1. `approve(BasedBeats, 1 USDC)`
  2. `like(trackId)`
- Uses: `useBatchTransaction` hook

### 4. **Tip Track** (Batch Transaction)

- Input: Track ID + Tip amount
- Action: **Approves USDC + Tips creator** in ONE transaction
- Batch calls:
  1. `approve(BasedBeats, tipAmount)`
  2. `tip(trackId)`
- Uses: `useBatchTransaction` hook

### 5. **View Track** (Read Function)

- Input: Track ID
- Displays:
  - Creator address
  - Metadata CID
  - Number of likes
- Uses: `useGetTrack` hook

### 6. **All Tracks** (Read Function)

- Displays:
  - Total number of tracks
  - List of track IDs (first 10)
- Uses: `useGetAllTracks` hook

## Key Implementation Details

### Batch Transactions

Both **Like** and **Tip** operations use batch transactions to combine USDC approval with the action:

```typescript
// Like example
likeTx.send([
  {
    to: USDC.address,
    data: approve(BasedBeats.address, parseUnits("1", 6)),
  },
  {
    to: BasedBeats.address,
    data: like(trackId),
  },
]);
```

### Benefits:

✅ **One signature** instead of two  
✅ **Atomic execution** - either both succeed or both fail  
✅ **Better UX** - faster and simpler for users  
✅ **Works with sub-accounts** - Uses EIP-5792 `wallet_sendCalls`

### Hooks Used

#### Write Operations:

- `useBasedBeatsWrite()` - Encode BasedBeats function data
- `useUSDCWrite()` - Encode USDC function data
- `useSingleTransaction()` - Single transaction with confirmation
- `useBatchTransaction()` - Multiple calls in one transaction

#### Read Operations:

- `useBalanceOf()` - Get USDC balance
- `useAllowance()` - Get USDC allowance for BasedBeats
- `useGetTrack()` - Get track details
- `useGetAllTracks()` - Get all track IDs

## Testing Workflow

### 1. Connect Wallet

Click "Connect Wallet" and approve Coinbase Wallet connection

### 2. Fund Account

Click "Fund" to get test USDC from the faucet (if eligible)

### 3. Create a Track

- Enter an IPFS CID or metadata URL
- Click "Create"
- Wait for transaction confirmation

### 4. Like a Track

- Enter track ID (e.g., "1")
- Click "Like"
- **One signature approves USDC and likes the track**

### 5. Tip a Track

- Enter track ID and tip amount (e.g., "1" USDC)
- Click "Tip"
- **One signature approves and tips the creator**

### 6. View Track Info

- Enter track ID in "View Track" section
- See creator, CID, and like count in real-time

### 7. Check All Tracks

- Scroll to "All Tracks" section
- See total count and track IDs

## UI Layout

```
┌─────────────────────────────────────┐
│  Navigation Bar                     │
│  - Title + GitHub link              │
│  - Account info + Fund + Disconnect │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  Account Info                       │
│  - USDC Balance                     │
│  - BasedBeats Allowance             │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  Create Track                       │
│  [Input CID] [Create Button]        │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  Like Track (Batch)                 │
│  [Track ID] [Like Button]           │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  Tip Track (Batch)                  │
│  [Track ID] [Amount] [Tip Button]   │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  View Track                         │
│  [Track ID]                         │
│  - Creator: 0x1234...5678           │
│  - CID: ipfs://...                  │
│  - Likes: 42                        │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  All Tracks                         │
│  - Total: 10                        │
│  - IDs: 1, 2, 3, 4, 5...           │
└─────────────────────────────────────┘
```

## Transaction Status

All operations show toast notifications:

- ⏳ **Pending**: "Creating...", "Liking...", "Tipping..."
- ✅ **Success**: "Track created!", "Track liked!", "Tip sent!"
- ❌ **Error**: Error message with description

## Smart Wallet Features

The page leverages **Coinbase Smart Wallet** capabilities:

- **Sub-accounts**: Uses universal account for all transactions
- **Batch transactions**: Multiple calls in one signature
- **Session keys**: Potential for gasless transactions
- **Account abstraction**: ERC-4337 features

## Next Steps

You can extend this test page by adding:

- Track metadata upload to IPFS
- Audio player integration
- Creator dashboard
- Like/unlike toggle
- Tip history
- User's liked tracks display
