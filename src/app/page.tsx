"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
  useConnections,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { toast } from "sonner";
import { USDC } from "@/lib/usdc";
import { BasedBeats } from "@/lib/basedbeats";
import { useFaucet } from "@/hooks/useFaucet";
import { useFaucetEligibility } from "@/hooks/useFaucetEligibility";
import {
  useBasedBeatsWrite,
  useGetAllTracks,
  useGetTracksBatch,
  useHasLiked,
} from "@/hooks/useBasedBeats";
import { useBalanceOf } from "@/hooks/useUSDC";
import { useBatchTransaction } from "@/hooks/useTransactions";
import { useUSDCWrite } from "@/hooks/useUSDC";
import { useMusicStore, type Track } from "@/stores/useMusicStore";
import { MusicPlayer } from "@/components/MusicPlayer";
import { TrackList } from "@/components/TrackList";
import { TransactionLoader } from "@/components/TransactionLoader";
import { Music, Wallet, LogOut } from "lucide-react";
import Image from "next/image";

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

  // Get USDC balance
  const { data: usdcBalance } = useBalanceOf(
    universalAccount!,
    !!universalAccount
  );

  // Check faucet eligibility
  const faucetEligibility = useFaucetEligibility(universalBalance?.value);
  const faucetMutation = useFaucet();

  // Dialog state
  const [isTipDialogOpen, setIsTipDialogOpen] = useState(false);
  const [selectedTrackForTip, setSelectedTrackForTip] = useState<string | null>(
    null
  );
  const [tipAmount, setTipAmount] = useState("1");

  // Music store
  const { addToQueue, queue } = useMusicStore();

  // Hooks
  const { like, tip } = useBasedBeatsWrite();
  const { transfer } = useUSDCWrite();

  // Get all tracks from contract
  const { data: allTracksData, refetch: refetchTracks } = useGetAllTracks(
    0n,
    100n,
    true
  );

  // Memoize track IDs to prevent unnecessary re-renders
  const trackIds = useMemo(() => allTracksData?.[0] || [], [allTracksData]);

  // Get track details
  const { data: tracksDetails, refetch: refetchTrackDetails } =
    useGetTracksBatch(trackIds as bigint[], trackIds.length > 0);

  // Check which tracks the user has liked
  const likedTracks = useMemo(() => {
    if (!universalAccount || !trackIds.length) return new Set<string>();

    const likedSet = new Set<string>();
    trackIds.forEach((trackId) => {
      // We'll check this in the component using useHasLiked hook
      likedSet.add(trackId.toString());
    });
    return likedSet;
  }, [universalAccount, trackIds]);

  // Transaction hooks
  const likeTx = useBatchTransaction({
    onSuccess: () => {
      toast.success("Track liked!", {
        description: "Your like has been recorded on-chain",
      });
      refetchTracks();
      refetchTrackDetails();
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
        description: `Successfully sent ${tipAmount} USDC to the artist`,
      });
      setIsTipDialogOpen(false);
      setSelectedTrackForTip(null);
      setTipAmount("1");
      refetchTracks();
      refetchTrackDetails();
    },
    onError: (error) => {
      toast.error("Failed to send tip", {
        description: error.message,
      });
    },
  });

  // Auto-close tip modal when transaction starts processing
  useEffect(() => {
    if (tipTx.isPending) {
      setIsTipDialogOpen(false);
    }
  }, [tipTx.isPending]);

  // Load tracks from contract - using a stable approach
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);

  useEffect(() => {
    const loadTracks = async () => {
      if (!tracksDetails || tracksDetails.length === 0 || isLoadingTracks) {
        return;
      }

      setIsLoadingTracks(true);

      try {
        // Filter only existing tracks
        const existingTracks = tracksDetails.filter((track) => track.exists);

        // Fetch metadata for each track from CID
        const trackPromises = existingTracks.map(
          async (onChainTrack, index) => {
            try {
              // Determine the metadata URL based on CID format
              let metadataUrl: string;

              if (onChainTrack.metadataCid.startsWith("ipfs://")) {
                // IPFS URL - convert to HTTP gateway
                metadataUrl = onChainTrack.metadataCid.replace(
                  "ipfs://",
                  "https://ipfs.io/ipfs/"
                );
              } else if (
                onChainTrack.metadataCid.startsWith("http://") ||
                onChainTrack.metadataCid.startsWith("https://")
              ) {
                // Already a full URL - use as is
                metadataUrl = onChainTrack.metadataCid;
              } else if (onChainTrack.metadataCid.startsWith("/")) {
                // Absolute path - use as is
                metadataUrl = onChainTrack.metadataCid;
              } else {
                // Relative path - prepend /tracks/
                metadataUrl = `/tracks/${onChainTrack.metadataCid}`;
              }

              const response = await fetch(metadataUrl);
              const metadata = await response.json();

              return {
                id: trackIds[tracksDetails.indexOf(onChainTrack)].toString(),
                title: metadata.title || "Unknown Track",
                artist: metadata.artist || "Unknown Artist",
                album: metadata.album || "Unknown Album",
                albumArt: metadata.albumArt || "",
                duration: metadata.duration || 0,
                explicit: metadata.explicit || false,
                audioUrl: metadata.audioUrl || "",
                likes: Number(onChainTrack.likes),
                creator: onChainTrack.creator,
                metadataCid: onChainTrack.metadataCid,
              };
            } catch (error) {
              console.error(
                `Failed to load metadata for track ${index}:`,
                error
              );
              // Return a placeholder track if metadata fails to load
              return {
                id: trackIds[tracksDetails.indexOf(onChainTrack)].toString(),
                title: "Unknown Track",
                artist: "Unknown Artist",
                album: "Unknown Album",
                albumArt: "",
                duration: 0,
                explicit: false,
                audioUrl: "",
                likes: Number(onChainTrack.likes),
                creator: onChainTrack.creator,
                metadataCid: onChainTrack.metadataCid,
              };
            }
          }
        );

        const loadedTracks = await Promise.all(trackPromises);
        addToQueue(loadedTracks);
      } catch (error) {
        console.error("Failed to load tracks:", error);
        toast.error("Failed to load tracks from contract");
      } finally {
        setIsLoadingTracks(false);
      }
    };

    loadTracks();
  }, [tracksDetails, trackIds]);

  // Handlers
  const handleLike = useCallback(
    (trackId: string) => {
      if (!universalAccount) {
        toast.error("Please connect your wallet first");
        return;
      }

      const trackIdBigInt = BigInt(trackId);
      const transferAmount = parseUnits("0.001", USDC.decimals);

      // Batch: Transfer USDC + Like track
      likeTx.send([
        {
          to: USDC.address,
          data: transfer(BasedBeats.address, transferAmount),
          value: 0n,
        },
        {
          to: BasedBeats.address,
          data: like(trackIdBigInt),
          value: 0n,
        },
      ]);
    },
    [universalAccount, likeTx, transfer, like]
  );

  const handleTip = useCallback(
    (trackId: string) => {
      if (!universalAccount) {
        toast.error("Please connect your wallet first");
        return;
      }

      setSelectedTrackForTip(trackId);
      setIsTipDialogOpen(true);
    },
    [universalAccount]
  );

  const handleTipSubmit = useCallback(() => {
    if (!selectedTrackForTip || !tipAmount) {
      toast.error("Please enter a tip amount");
      return;
    }

    const trackId = BigInt(selectedTrackForTip);
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
  }, [selectedTrackForTip, tipAmount, tipTx, transfer, tip]);

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

  // Calculate pending transactions count
  const pendingTxCount = [likeTx, tipTx].filter((tx) => tx.isPending).length;

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#0088ff] text-primary-foreground">
              {/* <Music className="w-5 h-5" /> */}
              <Image
                src="/logo.svg"
                alt="Based Beats"
                width={100}
                height={100}
              />
            </div>
            <div>
              <h1 className="text-xl font-bold">BasedBeats</h1>
              <p className="text-xs text-muted-foreground">
                Onchain Music Streaming
              </p>
            </div>

            {/* Transaction loader */}
            <TransactionLoader count={pendingTxCount} />
          </div>

          {account.status === "connected" ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end gap-0.5 text-xs">
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground transition-colors font-mono"
                  onClick={() => {
                    navigator.clipboard.writeText(universalAccount || "");
                    toast.success("Address copied!");
                  }}
                  title="Click to copy address"
                >
                  {universalAccount?.slice(0, 6)}...
                  {universalAccount?.slice(-4)}
                </button>
                <span className="font-semibold">
                  {universalBalance?.formatted.slice(0, 8)}{" "}
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
                    : "Get test USDC"
                }
              >
                <Wallet className="w-4 h-4 mr-2" />
                {faucetMutation.isPending ? "Funding..." : "Fund"}
              </Button>

              <Button variant="ghost" onClick={() => disconnect()} size="sm">
                <LogOut className="w-4 h-4" />
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
                  <Wallet className="w-4 h-4 mr-2" />
                  {connector.name}
                </Button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="container px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome section */}
          {account.status !== "connected" && (
            <div className="mb-8 p-8 rounded-xl border bg-card text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Music className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Welcome to BasedBeats</h2>
              <p className="text-muted-foreground mb-6">
                Stream music onchain with seamless Web3 integration.
                <br />
                Connect your wallet to start listening.
              </p>
              {connectors.slice(0, 1).map((connector) => (
                <Button
                  key={connector.uid}
                  onClick={() => connect({ connector })}
                  size="lg"
                >
                  <Wallet className="w-5 h-5 mr-2" />
                  Connect with {connector.name}
                </Button>
              ))}
            </div>
          )}

          {/* Track list */}
          {account.status === "connected" && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Onchain Music</h2>
                <p className="text-muted-foreground">
                  {queue.length} track{queue.length !== 1 ? "s" : ""} on Base •
                  Like tracks for 0.001 USDC • Tip your favorite artists
                </p>
              </div>

              <TrackList
                onLike={handleLike}
                onTip={handleTip}
                isLiking={likeTx.isPending}
                isTipping={tipTx.isPending}
                likedTracks={likedTracks}
              />
            </>
          )}
        </div>
      </main>

      {/* Music player */}
      {account.status === "connected" && (
        <MusicPlayer
          onLike={handleLike}
          onTip={handleTip}
          isLiking={likeTx.isPending}
          isTipping={tipTx.isPending}
        />
      )}

      {/* Tip dialog */}
      <Dialog open={isTipDialogOpen} onOpenChange={setIsTipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tip Artist</DialogTitle>
            <DialogDescription>
              Send USDC to support this artist. Your tip goes directly to the
              creator.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (USDC)</label>
              <Input
                type="number"
                placeholder="1.00"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                step="0.1"
                min="0.1"
              />
              <p className="text-xs text-muted-foreground">
                Your balance:{" "}
                {usdcBalance ? formatUnits(usdcBalance, USDC.decimals) : "0"}{" "}
                USDC
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsTipDialogOpen(false);
                  setSelectedTrackForTip(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleTipSubmit}
                disabled={tipTx.isPending || !tipAmount}
              >
                {tipTx.isPending ? "Sending..." : "Send Tip"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;
