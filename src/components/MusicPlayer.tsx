"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useMusicStore } from "@/stores/useMusicStore";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Heart,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MusicPlayerProps {
  onLike?: (trackId: string) => void;
  onTip?: (trackId: string) => void;
  isLiking?: boolean;
  isTipping?: boolean;
}

export function MusicPlayer({
  onLike,
  onTip,
  isLiking,
  isTipping,
}: MusicPlayerProps) {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    volume,
    togglePlayPause,
    nextTrack,
    previousTrack,
    seekTo,
    setVolume,
    updateCurrentTime,
  } = useMusicStore();

  // Update current time regularly while playing
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      updateCurrentTime();
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, updateCurrentTime]);

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isMuted = volume === 0;

  const toggleMute = () => {
    if (isMuted) {
      setVolume(0.8);
    } else {
      setVolume(0);
    }
  };

  if (!currentTrack) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t backdrop-blur-lg bg-opacity-95 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center text-muted-foreground">
            <p>No track selected. Choose a track to start playing.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t backdrop-blur-lg bg-opacity-95 z-50 shadow-2xl">
      <div className="container mx-auto px-4 py-3">
        {/* Progress bar */}
        <div className="mb-3">
          <Slider
            value={currentTime}
            min={0}
            max={currentTrack.duration || 100}
            step={0.1}
            onChange={seekTo}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(currentTrack.duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Album art and track info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
              <Image
                src={currentTrack.albumArt}
                alt={currentTrack.title}
                fill
                className="object-cover"
                sizes="56px"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">
                {currentTrack.title}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {currentTrack.artist}
              </p>
            </div>
          </div>

          {/* Playback controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={previousTrack}
              className="h-9 w-9"
            >
              <SkipBack className="h-5 w-5" />
            </Button>

            <Button
              variant="default"
              size="icon"
              onClick={togglePlayPause}
              className="h-11 w-11 rounded-full"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={nextTrack}
              className="h-9 w-9"
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onLike?.(currentTrack.id)}
              disabled={isLiking}
              className={cn("h-9 w-9", currentTrack.likes && "text-red-500")}
              title="Like track"
            >
              <Heart
                className={cn("h-5 w-5", currentTrack.likes && "fill-current")}
              />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onTip?.(currentTrack.id)}
              disabled={isTipping}
              className="h-9 w-9"
              title="Tip artist"
            >
              <DollarSign className="h-5 w-5" />
            </Button>
          </div>

          {/* Volume control */}
          <div className="hidden md:flex items-center gap-2 w-32">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="h-9 w-9"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>

            <Slider
              value={isMuted ? 0 : volume}
              min={0}
              max={1}
              step={0.01}
              onChange={setVolume}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
