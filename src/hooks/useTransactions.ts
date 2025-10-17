import { useCallback, useEffect, useState } from "react";
import {
  useSendTransaction,
  useWaitForTransactionReceipt,
  useSendCalls,
  useCallsStatus,
} from "wagmi";
import type { Address } from "viem";

export type TransactionCall = {
  to: Address;
  data: `0x${string}`;
  value?: bigint;
};

type TransactionOptions = {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
};

/**
 * Hook for handling single transactions
 */
export const useSingleTransaction = (options?: TransactionOptions) => {
  const {
    sendTransaction,
    data: hash,
    isPending: isSending,
    error: sendError,
    reset,
  } = useSendTransaction();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const [hasNotified, setHasNotified] = useState(false);

  // Handle success callback
  useEffect(() => {
    if (isConfirmed && !hasNotified && hash) {
      options?.onSuccess?.({ hash });
      setHasNotified(true);
    }
  }, [isConfirmed, hasNotified, hash, options]);

  // Handle error callback
  useEffect(() => {
    const error = sendError || confirmError;
    if (error) {
      options?.onError?.(error as Error);
    }
  }, [sendError, confirmError, options]);

  const send = useCallback(
    (call: TransactionCall) => {
      setHasNotified(false);
      sendTransaction({
        to: call.to,
        data: call.data,
        value: call.value || 0n,
      });
    },
    [sendTransaction]
  );

  const resetTransaction = useCallback(() => {
    reset();
    setHasNotified(false);
  }, [reset]);

  return {
    send,
    reset: resetTransaction,
    hash,
    isPending: isSending || isConfirming,
    isSending,
    isConfirming,
    isSuccess: isConfirmed,
    error: sendError || confirmError,
  };
};

/**
 * Hook for handling batch transactions (calls)
 */
export const useBatchTransaction = (options?: TransactionOptions) => {
  const {
    sendCalls,
    data: callsId,
    isPending: isSending,
    error: sendError,
    reset,
  } = useSendCalls();

  const { data: callsStatus, error: statusError } = useCallsStatus({
    id: callsId?.id || "",
    query: {
      enabled: !!callsId,
      refetchInterval: (data) => {
        // Stop refetching once we have a final status
        return data?.state.data?.status === "success" ? false : 1000;
      },
    },
  });

  const [hasNotified, setHasNotified] = useState(false);

  const isConfirmed = callsStatus?.status === "success";
  const isPending = callsStatus?.status === "pending";

  // Handle success callback
  useEffect(() => {
    if (isConfirmed && !hasNotified && callsId) {
      options?.onSuccess?.({
        callsId,
        receipts: callsStatus?.receipts,
      });
      setHasNotified(true);
    }
  }, [isConfirmed, hasNotified, callsId, callsStatus, options]);

  // Handle error callback
  useEffect(() => {
    const error = sendError || statusError;
    if (error) {
      options?.onError?.(error as Error);
    }
  }, [sendError, statusError, options]);

  const send = useCallback(
    (calls: TransactionCall[]) => {
      setHasNotified(false);
      sendCalls({
        calls: calls.map((call) => ({
          to: call.to,
          data: call.data,
          value: call.value || 0n,
        })),
      });
    },
    [sendCalls]
  );

  const resetCalls = useCallback(() => {
    reset();
    setHasNotified(false);
  }, [reset]);

  return {
    send,
    reset: resetCalls,
    callsId,
    isPending: isSending || isPending,
    isSending,
    isConfirming: isPending,
    isSuccess: isConfirmed,
    status: callsStatus?.status,
    receipts: callsStatus?.receipts,
    error: sendError || statusError,
  };
};

/**
 * Unified hook that can handle both single and batch transactions
 */
export const useTransaction = (options?: TransactionOptions) => {
  const singleTx = useSingleTransaction(options);
  const batchTx = useBatchTransaction(options);

  const sendTransaction = useCallback(
    (call: TransactionCall) => {
      singleTx.send(call);
    },
    [singleTx]
  );

  const sendBatchTransaction = useCallback(
    (calls: TransactionCall[]) => {
      batchTx.send(calls);
    },
    [batchTx]
  );

  return {
    // Single transaction methods
    sendTransaction,
    singleTx: {
      ...singleTx,
      send: sendTransaction,
    },

    // Batch transaction methods
    sendBatchTransaction,
    batchTx: {
      ...batchTx,
      send: sendBatchTransaction,
    },
  };
};
