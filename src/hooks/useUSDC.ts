import { encodeFunctionData } from "viem";
import { useReadContract, useReadContracts } from "wagmi";
import { USDC, erc20Abi } from "@/lib/usdc";

// Write function encoders
export const useUSDCWrite = () => {
  const transfer = (to: `0x${string}`, amount: bigint) => {
    return encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [to, amount],
    });
  };

  const approve = (spender: `0x${string}`, amount: bigint) => {
    return encodeFunctionData({
      abi: erc20Abi,
      functionName: "approve",
      args: [spender, amount],
    });
  };

  const transferFrom = (
    from: `0x${string}`,
    to: `0x${string}`,
    amount: bigint
  ) => {
    return encodeFunctionData({
      abi: erc20Abi,
      functionName: "transferFrom",
      args: [from, to, amount],
    });
  };

  return {
    transfer,
    approve,
    transferFrom,
  };
};

// Read hooks
export const useBalanceOf = (account: `0x${string}`, enabled = true) => {
  return useReadContract({
    address: USDC.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [account],
    query: {
      enabled: enabled && !!account,
    },
  });
};

export const useAllowance = (
  owner: `0x${string}`,
  spender: `0x${string}`,
  enabled = true
) => {
  return useReadContract({
    address: USDC.address,
    abi: erc20Abi,
    functionName: "allowance",
    args: [owner, spender],
    query: {
      enabled: enabled && !!owner && !!spender,
    },
  });
};

export const useTotalSupply = (enabled = true) => {
  return useReadContract({
    address: USDC.address,
    abi: erc20Abi,
    functionName: "totalSupply",
    query: {
      enabled,
    },
  });
};

export const useTokenName = (enabled = true) => {
  return useReadContract({
    address: USDC.address,
    abi: erc20Abi,
    functionName: "name",
    query: {
      enabled,
    },
  });
};

export const useTokenSymbol = (enabled = true) => {
  return useReadContract({
    address: USDC.address,
    abi: erc20Abi,
    functionName: "symbol",
    query: {
      enabled,
    },
  });
};

export const useTokenDecimals = (enabled = true) => {
  return useReadContract({
    address: USDC.address,
    abi: erc20Abi,
    functionName: "decimals",
    query: {
      enabled,
    },
  });
};

// Batch read token info
export const useTokenInfo = () => {
  return useReadContracts({
    contracts: [
      {
        address: USDC.address,
        abi: erc20Abi,
        functionName: "name",
      },
      {
        address: USDC.address,
        abi: erc20Abi,
        functionName: "symbol",
      },
      {
        address: USDC.address,
        abi: erc20Abi,
        functionName: "decimals",
      },
      {
        address: USDC.address,
        abi: erc20Abi,
        functionName: "totalSupply",
      },
    ],
  });
};

// Combined hook for checking balance and allowance
export const useBalanceAndAllowance = (
  owner: `0x${string}`,
  spender: `0x${string}`,
  enabled = true
) => {
  return useReadContracts({
    contracts: [
      {
        address: USDC.address,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [owner],
      },
      {
        address: USDC.address,
        abi: erc20Abi,
        functionName: "allowance",
        args: [owner, spender],
      },
    ],
    query: {
      enabled: enabled && !!owner && !!spender,
    },
  });
};
