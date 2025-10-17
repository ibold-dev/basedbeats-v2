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
  isLoading: boolean;
  preloadedTracks: Map<string, Howl>;

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
  preloadTrack: (track: Track) => void;
  preloadNextTracks: () => void;
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
  isLoading: false,
  preloadedTracks: new Map(),

  playTrack: (track: Track) => {
    const { currentHowl, isLoading, preloadedTracks } = get();

    // Prevent multiple simultaneous loads
    if (isLoading) {
      return;
    }

    // Stop current track if playing
    if (currentHowl) {
      currentHowl.stop();
    }

    // Check if track is already preloaded
    const preloadedHowl = preloadedTracks.get(track.id);

    if (preloadedHowl && track.audioUrl) {
      // Use preloaded track - instant playback!
      const actualDuration = preloadedHowl.duration();
      const updatedTrack = {
        ...track,
        duration: actualDuration,
      };

      set({
        currentTrack: updatedTrack,
        isPlaying: true,
        currentTime: 0,
        currentIndex: get().queue.findIndex((t) => t.id === track.id),
        currentHowl: preloadedHowl,
        isLoading: false,
      });

      preloadedHowl.play();
      return;
    }

    // Create new Howl instance for the track
    if (track.audioUrl) {
      set({ isLoading: true });

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
            isLoading: false,
          });
          howl.play();
        },
        onloaderror: () => {
          set({ isLoading: false });
          console.error("Failed to load audio");
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
        isLoading: false,
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
    const { queue, currentIndex, playTrack, repeatMode, preloadNextTracks } =
      get();

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
      // Preload next tracks after playing
      setTimeout(() => preloadNextTracks(), 1000);
    } else if (repeatMode === "all" && queue.length > 0) {
      // If repeat all is on and we're at the end, go to first track
      const firstTrack = queue[0];
      playTrack(firstTrack);
      // Preload next tracks after playing
      setTimeout(() => preloadNextTracks(), 1000);
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

    // Start preloading the first few tracks
    const tracksToPreload = tracks.slice(0, 3);
    tracksToPreload.forEach((track) => {
      get().preloadTrack(track);
    });
  },

  clearQueue: () => {
    const { currentHowl, preloadedTracks } = get();
    if (currentHowl) {
      currentHowl.stop();
    }

    // Clean up preloaded tracks
    preloadedTracks.forEach((howl) => {
      howl.unload();
    });

    set({
      queue: [],
      currentIndex: -1,
      currentTrack: null,
      isPlaying: false,
      currentHowl: null,
      isLoading: false,
      preloadedTracks: new Map(),
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

  preloadTrack: (track: Track) => {
    const { preloadedTracks } = get();

    // Don't preload if already cached
    if (preloadedTracks.has(track.id) || !track.audioUrl) {
      return;
    }

    const howl = new Howl({
      src: [track.audioUrl],
      volume: 0, // Silent preload
      html5: true,
      preload: true,
      onload: () => {
        // Store the preloaded track
        const newPreloadedTracks = new Map(preloadedTracks);
        newPreloadedTracks.set(track.id, howl);
        set({ preloadedTracks: newPreloadedTracks });
        console.log(`Preloaded track: ${track.title}`);
      },
      onloaderror: () => {
        console.error(`Failed to preload track: ${track.title}`);
      },
    });
  },

  preloadNextTracks: () => {
    const { queue, currentIndex, preloadTrack } = get();

    // Preload next 3 tracks
    const tracksToPreload = queue.slice(currentIndex + 1, currentIndex + 4);
    tracksToPreload.forEach((track) => {
      preloadTrack(track);
    });
  },
}));

export { useMusicStore };
