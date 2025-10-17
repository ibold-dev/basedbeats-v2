import { create } from "zustand";
import { Howl } from "howler";

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number;
  explicit?: boolean;
  audioUrl?: string;
  likes?: number;
  creator?: string;
  metadataCid?: string;
}

export interface MusicState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  queue: Track[];
  currentIndex: number;
  currentHowl: Howl | null;
  isShuffled: boolean;
  repeatMode: "none" | "one" | "all";

  // Actions
  playTrack: (track: Track) => void;
  pause: () => void;
  resume: () => void;
  togglePlayPause: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  nextTrack: () => void;
  previousTrack: () => void;
  addToQueue: (tracks: Track[]) => void;
  clearQueue: () => void;
  updateCurrentTime: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
}

const useMusicStore = create<MusicState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  volume: 0.8,
  queue: [],
  currentIndex: 0,
  currentHowl: null,
  isShuffled: false,
  repeatMode: "none",

  playTrack: (track: Track) => {
    const { currentHowl } = get();

    // Stop current track if playing
    if (currentHowl) {
      currentHowl.stop();
    }

    // Create new Howl instance for the track
    if (track.audioUrl) {
      const howl = new Howl({
        src: [track.audioUrl],
        volume: get().volume,
        html5: true,
        onload: () => {
          // Get the actual duration from the audio file
          const actualDuration = howl.duration();

          // Update the track with the real duration
          const updatedTrack = {
            ...track,
            duration: actualDuration,
          };

          set({
            currentTrack: updatedTrack,
            isPlaying: true,
            currentTime: 0,
            currentIndex: get().queue.findIndex((t) => t.id === track.id),
            currentHowl: howl,
          });
          howl.play();
        },
        onplay: () => {
          set({ isPlaying: true });
        },
        onpause: () => {
          set({ isPlaying: false });
        },
        onstop: () => {
          set({ isPlaying: false, currentTime: 0 });
        },
        onseek: () => {
          set({ currentTime: howl.seek() as number });
        },
        onend: () => {
          // Handle repeat and auto-play next track
          const { repeatMode } = get();
          if (repeatMode === "one") {
            // Repeat current track
            howl.seek(0);
            howl.play();
          } else {
            // Auto-play next track if available
            get().nextTrack();
          }
        },
      });
    } else {
      // No audio URL, just update UI state
      set({
        currentTrack: track,
        isPlaying: true,
        currentTime: 0,
        currentIndex: get().queue.findIndex((t) => t.id === track.id),
        currentHowl: null,
      });
    }
  },

  pause: () => {
    const { currentHowl } = get();
    if (currentHowl) {
      currentHowl.pause();
    }
    set({ isPlaying: false });
  },

  resume: () => {
    const { currentHowl } = get();
    if (currentHowl) {
      currentHowl.play();
    }
    set({ isPlaying: true });
  },

  togglePlayPause: () => {
    const { isPlaying, currentHowl } = get();
    if (currentHowl) {
      if (isPlaying) {
        currentHowl.pause();
      } else {
        currentHowl.play();
      }
    }
    set({ isPlaying: !isPlaying });
  },

  seekTo: (time: number) => {
    const { currentHowl, currentTrack } = get();
    const seekTime = Math.max(0, Math.min(time, currentTrack?.duration || 0));

    if (currentHowl) {
      currentHowl.seek(seekTime);
    }
    set({ currentTime: seekTime });
  },

  setVolume: (volume: number) => {
    const newVolume = Math.max(0, Math.min(1, volume));
    const { currentHowl } = get();

    if (currentHowl) {
      currentHowl.volume(newVolume);
    }
    set({ volume: newVolume });
  },

  nextTrack: () => {
    const { queue, currentIndex, playTrack, repeatMode } = get();

    if (repeatMode === "one") {
      // If repeat one is on, just restart current track
      const currentTrack = queue[currentIndex];
      if (currentTrack) {
        playTrack(currentTrack);
      }
      return;
    }

    if (currentIndex < queue.length - 1) {
      const nextTrack = queue[currentIndex + 1];
      playTrack(nextTrack);
    } else if (repeatMode === "all" && queue.length > 0) {
      // If repeat all is on and we're at the end, go to first track
      const firstTrack = queue[0];
      playTrack(firstTrack);
    }
  },

  previousTrack: () => {
    const { queue, currentIndex, playTrack, repeatMode } = get();

    if (repeatMode === "one") {
      // If repeat one is on, just restart current track
      const currentTrack = queue[currentIndex];
      if (currentTrack) {
        playTrack(currentTrack);
      }
      return;
    }

    if (currentIndex > 0) {
      const prevTrack = queue[currentIndex - 1];
      playTrack(prevTrack);
    } else if (repeatMode === "all" && queue.length > 0) {
      // If repeat all is on and we're at the beginning, go to last track
      const lastTrack = queue[queue.length - 1];
      playTrack(lastTrack);
    }
  },

  addToQueue: (tracks: Track[]) => {
    set({ queue: tracks });
  },

  clearQueue: () => {
    const { currentHowl } = get();
    if (currentHowl) {
      currentHowl.stop();
    }
    set({
      queue: [],
      currentIndex: -1,
      currentTrack: null,
      isPlaying: false,
      currentHowl: null,
    });
  },

  updateCurrentTime: () => {
    const { currentHowl, isPlaying } = get();
    if (currentHowl && isPlaying) {
      const seekTime = (currentHowl.seek() as number) || 0;
      set({ currentTime: seekTime });
    }
  },

  toggleShuffle: () => {
    const { isShuffled, queue } = get();
    const newShuffled = !isShuffled;

    if (newShuffled && queue.length > 1) {
      // Shuffle the queue (Fisher-Yates algorithm)
      const shuffledQueue = [...queue];
      for (let i = shuffledQueue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledQueue[i], shuffledQueue[j]] = [
          shuffledQueue[j],
          shuffledQueue[i],
        ];
      }
      set({ isShuffled: newShuffled, queue: shuffledQueue, currentIndex: 0 });
    } else {
      // Unshuffle - restore original order
      set({ isShuffled: newShuffled });
    }
  },

  toggleRepeat: () => {
    const { repeatMode } = get();
    const modes: ("none" | "one" | "all")[] = ["none", "one", "all"];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    set({ repeatMode: nextMode });
  },
}));

export { useMusicStore };
