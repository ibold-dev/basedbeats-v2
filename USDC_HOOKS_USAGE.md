# USDC Hooks Usage Guide

## Overview

Comprehensive hooks for interacting with the USDC (ERC20) token contract.

## Hooks Available

### Write Functions (`useUSDCWrite`)

- `transfer(to, amount)` - Transfer USDC to another address
- `approve(spender, amount)` - Approve spender to use your USDC
- `transferFrom(from, to, amount)` - Transfer USDC on behalf of another address

### Read Functions

- `useBalanceOf(account)` - Get USDC balance of an address
- `useAllowance(owner, spender)` - Get approved amount
- `useTotalSupply()` - Get total USDC supply
- `useTokenName()` - Get token name
- `useTokenSymbol()` - Get token symbol
- `useTokenDecimals()` - Get token decimals

### Batch Read Functions

- `useTokenInfo()` - Get name, symbol, decimals, and totalSupply in one call
- `useBalanceAndAllowance(owner, spender)` - Get balance and allowance in one call

## Usage Examples

### 1. Transfer USDC

```typescript
import { useUSDCWrite } from "@/hooks/useUSDC";
import { useSingleTransaction } from "@/hooks/useTransactions";
import { USDC } from "@/lib/usdc";
import { parseUnits } from "viem";
import { toast } from "sonner";

function TransferUSDC() {
  const { transfer } = useUSDCWrite();

  const { send, isPending } = useSingleTransaction({
    onSuccess: () => toast.success("USDC transferred!"),
    onError: (error) => toast.error(error.message),
  });

  const handleTransfer = (to: `0x${string}`, amount: string) => {
    send({
      to: USDC.address,
      data: transfer(to, parseUnits(amount, USDC.decimals)),
      value: 0n,
    });
  };

  return (
    <button
      onClick={() => handleTransfer("0x123...", "10")}
      disabled={isPending}
    >
      {isPending ? "Sending..." : "Send 10 USDC"}
    </button>
  );
}
```

### 2. Approve + Transfer in One Transaction (Batch)

```typescript
import { useUSDCWrite } from "@/hooks/useUSDC";
import { useBatchTransaction } from "@/hooks/useTransactions";
import { useBasedBeatsWrite } from "@/hooks/useBasedBeats";
import { USDC } from "@/lib/usdc";
import { BasedBeats } from "@/lib/basedbeats";
import { parseUnits } from "viem";

function TipTrackWithApproval() {
  const { approve } = useUSDCWrite();
  const { tip } = useBasedBeatsWrite();

  const { send, isPending } = useBatchTransaction({
    onSuccess: () => toast.success("Tip sent!"),
    onError: (error) => toast.error(error.message),
  });

  const handleTip = (trackId: bigint, amount: string) => {
    const amountWei = parseUnits(amount, USDC.decimals);

    send([
      {
        to: USDC.address,
        data: approve(BasedBeats.address, amountWei),
        value: 0n,
      },
      {
        to: BasedBeats.address,
        data: tip(trackId),
        value: 0n,
      },
    ]);
  };

  return (
    <button
      onClick={() => handleTip(1n, "1")}
      disabled={isPending}
    >
      {isPending ? "Tipping..." : "Tip 1 USDC"}
    </button>
  );
}
```

### 3. Check Balance

```typescript
import { useBalanceOf } from "@/hooks/useUSDC";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { USDC } from "@/lib/usdc";

function BalanceDisplay() {
  const { address } = useAccount();
  const { data: balance, isLoading } = useBalanceOf(address!);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      Balance: {formatUnits(balance || 0n, USDC.decimals)} USDC
    </div>
  );
}
```

### 4. Check Allowance

```typescript
import { useAllowance } from "@/hooks/useUSDC";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { USDC, BasedBeats } from "@/lib";

function AllowanceDisplay() {
  const { address } = useAccount();

  const { data: allowance, isLoading } = useAllowance(
    address!,
    BasedBeats.address
  );

  if (isLoading) return <div>Loading...</div>;

  const hasAllowance = (allowance || 0n) > 0n;

  return (
    <div>
      {hasAllowance ? (
        <span>Approved: {formatUnits(allowance!, USDC.decimals)} USDC</span>
      ) : (
        <span>No approval</span>
      )}
    </div>
  );
}
```

### 5. Get Token Info (Batch)

```typescript
import { useTokenInfo } from "@/hooks/useUSDC";

function TokenInfo() {
  const { data } = useTokenInfo();

  if (!data) return <div>Loading...</div>;

  const [name, symbol, decimals, totalSupply] = data;

  return (
    <div>
      <p>Name: {name.result}</p>
      <p>Symbol: {symbol.result}</p>
      <p>Decimals: {decimals.result}</p>
      <p>Total Supply: {totalSupply.result?.toString()}</p>
    </div>
  );
}
```

### 6. Check Balance & Allowance Together

```typescript
import { useBalanceAndAllowance } from "@/hooks/useUSDC";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { USDC, BasedBeats } from "@/lib";

function BalanceAndAllowance() {
  const { address } = useAccount();

  const { data } = useBalanceAndAllowance(
    address!,
    BasedBeats.address
  );

  if (!data) return <div>Loading...</div>;

  const [balance, allowance] = data;

  return (
    <div>
      <p>Balance: {formatUnits(balance.result || 0n, USDC.decimals)} USDC</p>
      <p>Allowance: {formatUnits(allowance.result || 0n, USDC.decimals)} USDC</p>
    </div>
  );
}
```

### 7. Complete Example: Approve Button with Allowance Check

```typescript
import { useAllowance } from "@/hooks/useUSDC";
import { useUSDCWrite } from "@/hooks/useUSDC";
import { useSingleTransaction } from "@/hooks/useTransactions";
import { useAccount } from "wagmi";
import { parseUnits } from "viem";
import { USDC, BasedBeats } from "@/lib";
import { toast } from "sonner";

function ApproveButton({ amount }: { amount: string }) {
  const { address } = useAccount();
  const { approve } = useUSDCWrite();

  const { data: allowance } = useAllowance(
    address!,
    BasedBeats.address
  );

  const { send, isPending } = useSingleTransaction({
    onSuccess: () => toast.success("Approval successful!"),
    onError: (error) => toast.error(error.message),
  });

  const amountWei = parseUnits(amount, USDC.decimals);
  const hasEnoughAllowance = (allowance || 0n) >= amountWei;

  const handleApprove = () => {
    send({
      to: USDC.address,
      data: approve(BasedBeats.address, amountWei),
      value: 0n,
    });
  };

  if (hasEnoughAllowance) {
    return <span className="text-green-500">✓ Approved</span>;
  }

  return (
    <button onClick={handleApprove} disabled={isPending}>
      {isPending ? "Approving..." : `Approve ${amount} USDC`}
    </button>
  );
}
```

## API Reference

### useUSDCWrite

```typescript
const { transfer, approve, transferFrom } = useUSDCWrite();

// Returns encoded function data for transactions
transfer(to: Address, amount: bigint): `0x${string}`
approve(spender: Address, amount: bigint): `0x${string}`
transferFrom(from: Address, to: Address, amount: bigint): `0x${string}`
```

### Read Hooks

All read hooks return a wagmi `useReadContract` result:

```typescript
{
  data: T | undefined,
  isLoading: boolean,
  isError: boolean,
  error: Error | null,
  refetch: () => void,
}
```

## Helper Functions

Don't forget to use viem's utility functions:

```typescript
import { parseUnits, formatUnits } from "viem";
import { USDC } from "@/lib/usdc";

// Convert string to wei (bigint)
const amountWei = parseUnits("10.5", USDC.decimals); // 10500000n

// Convert wei to string
const amountStr = formatUnits(10500000n, USDC.decimals); // "10.5"
```

## Token Info

- **Address**: `0x036cbd53842c5426634e7929541ec2318f3dcf7e` (Base Sepolia)
- **Symbol**: USDC
- **Decimals**: 6

## Best Practices

1. **Always use `parseUnits`** when converting user input to wei
2. **Check allowance** before calling functions that use `transferFrom`
3. **Batch approve + transfer** for better UX (one transaction instead of two)
4. **Enable/disable hooks** based on wallet connection state
5. **Handle errors** gracefully with toast notifications

## Combining with BasedBeats

```typescript
import { useUSDCWrite } from "@/hooks/useUSDC";
import { useBasedBeatsWrite } from "@/hooks/useBasedBeats";
import { useBatchTransaction } from "@/hooks/useTransactions";

// Approve USDC and tip track in one transaction
const { approve } = useUSDCWrite();
const { tip } = useBasedBeatsWrite();
const { send } = useBatchTransaction();

send([
  { to: USDC.address, data: approve(...) },
  { to: BasedBeats.address, data: tip(...) },
]);
```
