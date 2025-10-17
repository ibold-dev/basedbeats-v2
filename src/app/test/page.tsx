"use client";

import { Button } from "@/components/ui/button";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
  useConnections,
} from "wagmi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, useCallback, useMemo } from "react";
import { parseUnits, formatUnits } from "viem";
import { toast } from "sonner";
import { USDC } from "@/lib/usdc";
import { BasedBeats } from "@/lib/basedbeats";
import { useFaucet } from "@/hooks/useFaucet";
import { useFaucetEligibility } from "@/hooks/useFaucetEligibility";
import {
  useBasedBeatsWrite,
  useGetTrack,
  useGetAllTracks,
} from "@/hooks/useBasedBeats";
import { useUSDCWrite, useBalanceOf, useAllowance } from "@/hooks/useUSDC";
import {
  useSingleTransaction,
  useBatchTransaction,
} from "@/hooks/useTransactions";

function App() {
  const account = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const connections = useConnections();

  const [_subAccount, universalAccount] = useMemo(() => {
    return connections.flatMap((connection) => connection.accounts);
  }, [connections]);

  // Get universal account balance
  const { data: universalBalance } = useBalance({
    address: universalAccount,
    token: USDC.address,
    query: {
      refetchInterval: 1000,
      enabled: !!universalAccount,
    },
  });

  // Get USDC balance and allowance
  const { data: usdcBalance } = useBalanceOf(
    universalAccount!,
    !!universalAccount
  );
  const { data: allowance, refetch: refetchAllowance } = useAllowance(
    universalAccount!,
    BasedBeats.address,
    !!universalAccount
  );

  // Check faucet eligibility
  const faucetEligibility = useFaucetEligibility(universalBalance?.value);
  const faucetMutation = useFaucet();

  // State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [trackCid, setTrackCid] = useState("");
  const [trackIdToLike, setTrackIdToLike] = useState("1");
  const [trackIdToTip, setTrackIdToTip] = useState("1");
  const [trackIdToView, setTrackIdToView] = useState("1");
  const [tipAmount, setTipAmount] = useState("1");

  // Hooks
  const { createTrack, like, tip } = useBasedBeatsWrite();
  const { transfer } = useUSDCWrite();

  // Get track info
  const { data: trackData } = useGetTrack(BigInt(trackIdToView), true);
  const { data: allTracksData } = useGetAllTracks(0n, 10n, true);

  // Transaction hooks
  const createTrackTx = useSingleTransaction({
    onSuccess: (data) => {
      toast.success("Track created!", {
        description: `Transaction: ${data.hash?.slice(0, 10)}...`,
      });
      setTrackCid("");
    },
    onError: (error) => {
      toast.error("Failed to create track", {
        description: error.message,
      });
    },
  });

  const likeTx = useBatchTransaction({
    onSuccess: () => {
      toast.success("Track liked!", {
        description: "Transferred USDC and liked track in one transaction",
      });
      refetchAllowance();
    },
    onError: (error) => {
      toast.error("Failed to like track", {
        description: error.message,
      });
    },
  });

  const tipTx = useBatchTransaction({
    onSuccess: () => {
      toast.success("Tip sent!", {
        description: `Sent ${tipAmount} USDC tip`,
      });
      refetchAllowance();
    },
    onError: (error) => {
      toast.error("Failed to tip", {
        description: error.message,
      });
    },
  });

  // Handlers
  const handleCreateTrack = useCallback(() => {
    if (!trackCid) {
      toast.error("Please enter a track CID");
      return;
    }

    createTrackTx.send({
      to: BasedBeats.address,
      data: createTrack(trackCid),
      value: 0n,
    });
  }, [trackCid, createTrackTx, createTrack]);

  const handleLike = useCallback(() => {
    if (!trackIdToLike) {
      toast.error("Please enter a track ID");
      return;
    }

    const trackId = BigInt(trackIdToLike);
    const transferAmount = parseUnits("0.0001", USDC.decimals);

    // Batch: Transfer USDC + Like track
    likeTx.send([
      {
        to: USDC.address,
        data: transfer(BasedBeats.address, transferAmount),
        value: 0n,
      },
      {
        to: BasedBeats.address,
        data: like(trackId),
        value: 0n,
      },
    ]);
  }, [trackIdToLike, likeTx, transfer, like]);

  const handleTip = useCallback(() => {
    if (!trackIdToTip || !tipAmount) {
      toast.error("Please enter track ID and tip amount");
      return;
    }

    const trackId = BigInt(trackIdToTip);
    const tipAmountWei = parseUnits(tipAmount, USDC.decimals);

    // Batch: Transfer USDC + Tip
    tipTx.send([
      {
        to: USDC.address,
        data: transfer(BasedBeats.address, tipAmountWei),
        value: 0n,
      },
      {
        to: BasedBeats.address,
        data: tip(trackId),
        value: 0n,
      },
    ]);
  }, [trackIdToTip, tipAmount, tipTx, transfer, tip]);

  const handleFundAccount = useCallback(async () => {
    if (!universalAccount) {
      toast.error("No universal account found", {
        description: "Please make sure your wallet is properly connected",
      });
      return;
    }

    if (!faucetEligibility.isEligible) {
      toast.error("Not eligible for faucet", {
        description: faucetEligibility.reason,
      });
      return;
    }

    const fundingToastId = toast.loading("Requesting USDC from faucet...", {
      description: "This may take a few moments",
    });

    faucetMutation.mutate(
      { address: universalAccount },
      {
        onSuccess: (data) => {
          toast.dismiss(fundingToastId);
          toast.success("Account funded successfully!", {
            description: (
              <div className="flex flex-col gap-1">
                <span>USDC has been sent to your wallet</span>
                <a
                  href={data.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs underline hover:opacity-80"
                >
                  View transaction
                </a>
              </div>
            ),
            duration: 5000,
          });
        },
        onError: (error) => {
          toast.dismiss(fundingToastId);
          const errorMessage =
            error instanceof Error ? error.message : "Please try again later";
          toast.error("Failed to fund account", {
            description: errorMessage,
          });
        },
      }
    );
  }, [universalAccount, faucetMutation, faucetEligibility]);

  return (
    <main className="flex min-h-screen flex-col items-center px-4 pb-8 md:px-8">
      <div className="w-full max-w-4xl mx-auto">
        {/* Navigation */}
        <nav className="flex justify-between items-center sticky top-0 bg-background z-10 py-4 border-b">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">BasedBeats Test</h1>
            <a
              href="https://github.com/stephancill/sub-accounts-fc-demo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
            >
              Github
            </a>
          </div>
          {account.status === "connected" ? (
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end gap-0.5 text-xs">
                <button
                  type="button"
                  className="text-muted-foreground cursor-pointer hover:opacity-80"
                  onClick={() => {
                    navigator.clipboard.writeText(universalAccount || "");
                    toast.success("Address copied!");
                  }}
                  title="Click to copy universal account address"
                >
                  {universalAccount?.slice(0, 6)}...
                  {universalAccount?.slice(-4)}
                </button>
                <span className="text-muted-foreground">
                  {universalBalance?.formatted.slice(0, 6)}{" "}
                  {universalBalance?.symbol}
                </span>
              </div>

              <Button
                variant="outline"
                onClick={handleFundAccount}
                size="sm"
                disabled={
                  faucetMutation.isPending || !faucetEligibility.isEligible
                }
                title={
                  !faucetEligibility.isEligible
                    ? faucetEligibility.reason
                    : undefined
                }
              >
                {faucetMutation.isPending ? "Funding..." : "Fund"}
              </Button>

              <Button variant="outline" onClick={() => disconnect()} size="sm">
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              {connectors.slice(0, 1).map((connector) => (
                <Button
                  key={connector.uid}
                  onClick={() => connect({ connector })}
                  size="sm"
                >
                  {connector.name}
                </Button>
              ))}
            </div>
          )}
        </nav>

        {/* Content */}
        <div className="grid gap-6 mt-6">
          {/* Balance Info */}
          <div className="p-4 rounded-lg border bg-card">
            <h2 className="text-lg font-semibold mb-3">Account Info</h2>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">USDC Balance:</span>
                <span className="font-mono">
                  {usdcBalance ? formatUnits(usdcBalance, USDC.decimals) : "0"}{" "}
                  USDC
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  BasedBeats Allowance:
                </span>
                <span className="font-mono">
                  {allowance ? formatUnits(allowance, USDC.decimals) : "0"} USDC
                </span>
              </div>
            </div>
          </div>

          {/* Create Track */}
          <div className="p-4 rounded-lg border bg-card">
            <h2 className="text-lg font-semibold mb-3">Create Track</h2>
            <div className="flex gap-2">
              <Input
                placeholder="Track CID (e.g., ipfs://QmXxx...)"
                value={trackCid}
                onChange={(e) => setTrackCid(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleCreateTrack}
                disabled={createTrackTx.isPending || !trackCid}
              >
                {createTrackTx.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>

          {/* Like Track */}
          <div className="p-4 rounded-lg border bg-card">
            <h2 className="text-lg font-semibold mb-3">Like Track</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Batch transaction: Transfer 0.1 USDC + Like track
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Track ID"
                value={trackIdToLike}
                onChange={(e) => setTrackIdToLike(e.target.value)}
                type="number"
                className="flex-1"
              />
              <Button
                onClick={handleLike}
                disabled={likeTx.isPending || !trackIdToLike}
              >
                {likeTx.isPending ? "Liking..." : "Like"}
              </Button>
            </div>
          </div>

          {/* Tip Track */}
          <div className="p-4 rounded-lg border bg-card">
            <h2 className="text-lg font-semibold mb-3">Tip Track</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Batch transaction: Transfer USDC + Tip track creator
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Track ID"
                value={trackIdToTip}
                onChange={(e) => setTrackIdToTip(e.target.value)}
                type="number"
                className="flex-1"
              />
              <Input
                placeholder="Amount (USDC)"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                type="number"
                step="0.01"
                className="flex-1"
              />
              <Button
                onClick={handleTip}
                disabled={tipTx.isPending || !trackIdToTip || !tipAmount}
              >
                {tipTx.isPending ? "Tipping..." : "Tip"}
              </Button>
            </div>
          </div>

          {/* View Track */}
          <div className="p-4 rounded-lg border bg-card">
            <h2 className="text-lg font-semibold mb-3">View Track</h2>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="Track ID"
                value={trackIdToView}
                onChange={(e) => setTrackIdToView(e.target.value)}
                type="number"
                className="flex-1"
              />
            </div>
            {trackData && trackData.exists ? (
              <div className="space-y-2 text-sm bg-muted p-3 rounded">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Creator:</span>
                  <span className="font-mono text-xs">
                    {trackData.creator.slice(0, 6)}...
                    {trackData.creator.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CID:</span>
                  <span className="font-mono text-xs break-all">
                    {trackData.metadataCid}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Likes:</span>
                  <span className="font-semibold">
                    {trackData.likes.toString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Track not found or doesn't exist
              </div>
            )}
          </div>

          {/* All Tracks */}
          <div className="p-4 rounded-lg border bg-card">
            <h2 className="text-lg font-semibold mb-3">All Tracks</h2>
            {allTracksData ? (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Total tracks: {allTracksData[1].toString()}
                </div>
                <div className="text-sm font-mono">
                  Track IDs:{" "}
                  {allTracksData[0].map((id) => id.toString()).join(", ")}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Loading...</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
