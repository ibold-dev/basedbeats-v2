"use client";

import Image from "next/image";
import { useMusicStore } from "@/stores/useMusicStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Heart, DollarSign, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHasLiked } from "@/hooks/useBasedBeats";
import { useAccount } from "wagmi";

interface TrackListProps {
  onLike?: (trackId: string) => void;
  onTip?: (trackId: string) => void;
  likedTracks?: Set<string>;
  isLiking?: boolean;
  isTipping?: boolean;
}

interface TrackItemProps {
  track: any;
  isCurrentTrack: boolean;
  isPlaying: boolean;
  onTrackClick: (track: any) => void;
  onLike: (trackId: string) => void;
  onTip: (trackId: string) => void;
  isLiking: boolean;
  isTipping: boolean;
  userAddress?: `0x${string}`;
}

function TrackItem({
  track,
  isCurrentTrack,
  isPlaying,
  onTrackClick,
  onLike,
  onTip,
  isLiking,
  isTipping,
  userAddress,
}: TrackItemProps) {
  // Check if user has liked this specific track
  const { data: hasLiked } = useHasLiked(
    BigInt(track.id),
    userAddress!,
    !!userAddress
  );

  const isLiked = hasLiked || false;

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md group cursor-pointer",
        isCurrentTrack && "ring-2 ring-primary shadow-md"
      )}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Album art with play button overlay */}
        <div
          className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-sm"
          onClick={() => onTrackClick(track)}
        >
          <Image
            src={track.albumArt}
            alt={track.title}
            fill
            className="object-cover"
            sizes="64px"
          />
          <div
            className={cn(
              "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity",
              isCurrentTrack
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100"
            )}
          >
            {isCurrentTrack && isPlaying ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white ml-0.5" />
            )}
          </div>
        </div>

        {/* Track info */}
        <div className="flex-1 min-w-0" onClick={() => onTrackClick(track)}>
          <h3
            className={cn(
              "font-semibold truncate",
              isCurrentTrack && "text-primary"
            )}
          >
            {track.title}
          </h3>
          <p className="text-sm text-muted-foreground truncate">
            {track.artist}
          </p>
          {track.album && (
            <p className="text-xs text-muted-foreground truncate">
              {track.album}
            </p>
          )}
        </div>

        {/* Track stats */}
        {track.likes !== undefined && (
          <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              <span>{track.likes}</span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              if (!isLiked) {
                onLike(track.id);
              }
            }}
            disabled={isLiking || isLiked}
            className={cn(
              "h-9 w-9 transition-opacity",
              isLiked
                ? "opacity-100 text-red-500"
                : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
            )}
            title={isLiked ? "Already liked" : "Like track"}
          >
            <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onTip(track.id);
            }}
            disabled={isTipping}
            className="h-9 w-9 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
            title="Tip artist"
          >
            <DollarSign className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function TrackList({
  onLike,
  onTip,
  likedTracks,
  isLiking,
  isTipping,
}: TrackListProps) {
  const {
    queue,
    currentTrack,
    isPlaying,
    isLoading,
    playTrack,
    pause,
    resume,
  } = useMusicStore();

  const { address } = useAccount();

  const handleTrackClick = (track: any) => {
    // Prevent clicks during loading
    if (isLoading) {
      return;
    }

    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        pause();
      } else {
        resume();
      }
    } else {
      playTrack(track);
    }
  };

  if (queue.length === 0) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Music className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-1">No tracks available</h3>
            <p className="text-sm text-muted-foreground">
              Connect your wallet to explore music
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {queue.map((track) => (
        <TrackItem
          key={track.id}
          track={track}
          isCurrentTrack={currentTrack?.id === track.id}
          isPlaying={isPlaying}
          onTrackClick={handleTrackClick}
          onLike={onLike || (() => {})}
          onTip={onTip || (() => {})}
          isLiking={isLiking || false}
          isTipping={isTipping || false}
          userAddress={address}
        />
      ))}
    </div>
  );
}
