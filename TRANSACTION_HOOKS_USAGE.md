# Transaction Hooks Usage Guide

## Overview

Three hooks are available for handling blockchain transactions:

1. **`useSingleTransaction`** - For single transactions
2. **`useBatchTransaction`** - For batch/multiple transactions (calls)
3. **`useTransaction`** - Unified hook that provides both

## Installation

Already installed in `src/hooks/useTransactions.ts`

## Usage Examples

### 1. Single Transaction

```typescript
import { useSingleTransaction } from "@/hooks/useTransactions";
import { useBasedBeatsWrite } from "@/hooks/useBasedBeats";
import { BasedBeats } from "@/lib/basedbeats";
import { toast } from "sonner";

function MyComponent() {
  const { createTrack } = useBasedBeatsWrite();

  const { send, isPending, isSuccess, hash } = useSingleTransaction({
    onSuccess: (data) => {
      toast.success("Track created!", {
        description: `Transaction: ${data.hash}`,
      });
    },
    onError: (error) => {
      toast.error("Failed to create track", {
        description: error.message,
      });
    },
  });

  const handleCreateTrack = () => {
    send({
      to: BasedBeats.address,
      data: createTrack("ipfs://QmXxx..."),
      value: 0n,
    });
  };

  return (
    <button onClick={handleCreateTrack} disabled={isPending}>
      {isPending ? "Creating..." : "Create Track"}
    </button>
  );
}
```

### 2. Batch Transaction (Multiple Calls)

```typescript
import { useBatchTransaction } from "@/hooks/useTransactions";
import { useBasedBeatsWrite } from "@/hooks/useBasedBeats";
import { BasedBeats } from "@/lib/basedbeats";
import { USDC, erc20Abi } from "@/lib/usdc";
import { encodeFunctionData, parseUnits } from "viem";
import { toast } from "sonner";

function TipTrack() {
  const { tip } = useBasedBeatsWrite();

  const { send, isPending, isSuccess, receipts } = useBatchTransaction({
    onSuccess: (data) => {
      toast.success("Tip sent successfully!", {
        description: `Calls ID: ${data.callsId}`,
      });
    },
    onError: (error) => {
      toast.error("Failed to tip", {
        description: error.message,
      });
    },
  });

  const handleTip = () => {
    const approveData = encodeFunctionData({
      abi: erc20Abi,
      functionName: "approve",
      args: [BasedBeats.address, parseUnits("1", USDC.decimals)],
    });

    const tipData = tip(1n); // Tip track ID 1

    // Send batch transaction
    send([
      {
        to: USDC.address,
        data: approveData,
        value: 0n,
      },
      {
        to: BasedBeats.address,
        data: tipData,
        value: 0n,
      },
    ]);
  };

  return (
    <button onClick={handleTip} disabled={isPending}>
      {isPending ? "Tipping..." : "Tip 1 USDC"}
    </button>
  );
}
```

### 3. Unified Hook (Both Single and Batch)

```typescript
import { useTransaction } from "@/hooks/useTransactions";
import { useBasedBeatsWrite } from "@/hooks/useBasedBeats";
import { BasedBeats } from "@/lib/basedbeats";
import { USDC, erc20Abi } from "@/lib/usdc";
import { encodeFunctionData, parseUnits } from "viem";
import { toast } from "sonner";

function UnifiedExample() {
  const { createTrack, like } = useBasedBeatsWrite();

  const { sendTransaction, sendBatchTransaction, singleTx, batchTx } = useTransaction({
    onSuccess: (data) => {
      toast.success("Success!");
      console.log("Transaction data:", data);
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  // Single transaction
  const handleLike = () => {
    sendTransaction({
      to: BasedBeats.address,
      data: like(1n),
      value: 0n,
    });
  };

  // Batch transaction
  const handleCreateAndLike = () => {
    const createData = createTrack("ipfs://QmXxx...");
    const likeData = like(1n);

    sendBatchTransaction([
      {
        to: BasedBeats.address,
        data: createData,
        value: 0n,
      },
      {
        to: BasedBeats.address,
        data: likeData,
        value: 0n,
      },
    ]);
  };

  return (
    <div>
      <button onClick={handleLike} disabled={singleTx.isPending}>
        {singleTx.isPending ? "Liking..." : "Like Track"}
      </button>

      <button onClick={handleCreateAndLike} disabled={batchTx.isPending}>
        {batchTx.isPending ? "Processing..." : "Create & Like"}
      </button>
    </div>
  );
}
```

## API Reference

### useSingleTransaction

```typescript
const {
  send, // (call: TransactionCall) => void
  reset, // () => void - Reset transaction state
  hash, // Transaction hash
  isPending, // Is sending or confirming
  isSending, // Is sending transaction
  isConfirming, // Is waiting for confirmation
  isSuccess, // Transaction confirmed
  error, // Error if any
} = useSingleTransaction(options);
```

### useBatchTransaction

```typescript
const {
  send, // (calls: TransactionCall[]) => void
  reset, // () => void - Reset calls state
  callsId, // Calls ID
  isPending, // Is sending or confirming
  isSending, // Is sending calls
  isConfirming, // Is waiting for confirmation
  isSuccess, // Calls confirmed
  status, // Call status: 'pending' | 'success' | 'failure'
  receipts, // Transaction receipts
  error, // Error if any
} = useBatchTransaction(options);
```

### Options

```typescript
type TransactionOptions = {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
};
```

### TransactionCall Type

```typescript
type TransactionCall = {
  to: Address; // Contract address
  data: `0x${string}`; // Encoded function data
  value?: bigint; // ETH value (optional, defaults to 0n)
};
```

## Benefits

✅ **Consistent API** for both single and batch transactions  
✅ **Auto status tracking** with `useCallsStatus` for batch calls  
✅ **Callbacks** for success/error/settled states  
✅ **Loading states** to disable buttons during transactions  
✅ **TypeScript support** with proper types  
✅ **Works with sub-accounts** through wagmi's `useSendCalls`

## Notes

- Batch transactions use EIP-5792 (wallet_sendCalls) which is supported by smart wallets
- Single transactions work with all wallets
- The hooks automatically handle transaction receipts and status updates
- Use `reset()` to clear transaction state after completion
