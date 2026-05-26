"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const MusicPlayerContext = createContext(null);

const INITIAL_STATE = {
  currentTrack: null,
  playSequence: 0,
  queue: [],
  currentIndex: -1,
  sourceUrl: null,
  isPlaying: false,
  isLoading: false,
  positionSeconds: 0,
  durationSeconds: 0,
  volume: 1,
  shuffle: false,
  loopMode: "none",
  lyrics: null,
  lyricsLoading: false,
  playerOpen: false,
  error: null,
};

export function MusicPlayerProvider({ children }) {
  const [state, setState] = useState(INITIAL_STATE);
  const stateRef = useRef(INITIAL_STATE);
  const audioRef = useRef(null);
  const generationRef = useRef(0);
  const queueRef = useRef([]);
  const indexRef = useRef(-1);
  const shuffleRef = useRef(false);
  const loopRef = useRef("none");
  const playedIdsRef = useRef(new Set());
  const sourceCacheRef = useRef(new Map());
  const retryRef = useRef(false);
  const playTrackRef = useRef(null);
  const advanceRef = useRef(null);

  const updateState = useCallback((change) => {
    setState((current) => {
      const next =
        typeof change === "function"
          ? change(current)
          : { ...current, ...change };
      stateRef.current = next;
      return next;
    });
  }, []);

  const fetchLyrics = useCallback(
    async (track, generation) => {
      const query = new URLSearchParams({
        trackName: track.title,
        artistName: track.artist,
        albumName: track.album || "",
        duration: String(track.duration || 0),
      });
      try {
        const response = await fetch(`/api/music/lyrics?${query}`);
        const data = await response.json();
        if (generation !== generationRef.current) return;
        updateState({
          lyrics: Array.isArray(data.lyrics) ? data.lyrics : [],
          lyricsLoading: false,
        });
      } catch {
        if (generation === generationRef.current) {
          updateState({ lyrics: [], lyricsLoading: false });
        }
      }
    },
    [updateState],
  );

  const getSource = useCallback(async (track, refresh) => {
    const cached = sourceCacheRef.current.get(track.id);
    if (
      !refresh &&
      cached &&
      (!cached.expiresAt || cached.expiresAt - 60000 > Date.now())
    ) {
      return cached;
    }
    const response = await fetch("/api/music/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: track.id,
        title: track.title,
        artist: track.artist,
        refresh,
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.audioUrl) {
      throw new Error(data.error || "Unable to resolve audio source");
    }
    sourceCacheRef.current.set(track.id, data);
    return data;
  }, []);

  const playTrack = useCallback(
    async (track, queue, options = {}) => {
      if (!track) return;
      const generation = ++generationRef.current;
      const audio = audioRef.current;
      retryRef.current = Boolean(options.refresh);
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }

      if (Array.isArray(queue)) {
        queueRef.current = queue;
        playedIdsRef.current.clear();
      }
      const activeQueue = queueRef.current.length ? queueRef.current : [track];
      if (!queueRef.current.length) queueRef.current = activeQueue;
      indexRef.current = Math.max(
        0,
        activeQueue.findIndex((item) => item.id === track.id),
      );
      if (shuffleRef.current) playedIdsRef.current.add(track.id);
      updateState({
        currentTrack: track,
        playSequence: generation,
        queue: activeQueue,
        currentIndex: indexRef.current,
        sourceUrl: null,
        positionSeconds: 0,
        durationSeconds: track.duration || 0,
        isPlaying: false,
        isLoading: true,
        lyrics: null,
        lyricsLoading: true,
        error: null,
      });
      fetchLyrics(track, generation);

      try {
        const source = await getSource(track, Boolean(options.refresh));
        if (generation !== generationRef.current || !audioRef.current) return;
        const player = audioRef.current;
        player.src = source.audioUrl;
        player.load();
        updateState({ sourceUrl: source.audioUrl });
        try {
          await player.play();
        } catch (error) {
          if (generation !== generationRef.current) return;
          updateState({
            isLoading: false,
            isPlaying: false,
            error:
              error?.name === "NotAllowedError"
                ? "Press play to start playback"
                : "Unable to start playback",
          });
        }
      } catch (error) {
        if (generation === generationRef.current) {
          updateState({
            isLoading: false,
            error: error.message || "Unable to resolve audio source",
          });
        }
      }
    },
    [fetchLyrics, getSource, updateState],
  );

  playTrackRef.current = playTrack;

  const next = useCallback(
    (fromEnded = false) => {
      const queue = queueRef.current;
      const current = stateRef.current.currentTrack;
      if (!queue.length || !current) return;
      if (fromEnded && loopRef.current === "one" && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
        return;
      }
      if (shuffleRef.current) {
        let candidates = queue.filter(
          (track) => !playedIdsRef.current.has(track.id),
        );
        if (!candidates.length && loopRef.current === "all") {
          playedIdsRef.current = new Set([current.id]);
          candidates = queue.filter((track) => track.id !== current.id);
        }
        if (!candidates.length) {
          audioRef.current?.pause();
          return;
        }
        const selection = candidates[Math.floor(Math.random() * candidates.length)];
        playTrackRef.current(selection);
        return;
      }
      const nextIndex = indexRef.current + 1;
      if (nextIndex >= queue.length) {
        if (loopRef.current !== "all") {
          audioRef.current?.pause();
          return;
        }
        indexRef.current = 0;
      } else {
        indexRef.current = nextIndex;
      }
      playTrackRef.current(queue[indexRef.current]);
    },
    [],
  );

  advanceRef.current = next;

  const previous = useCallback(() => {
    const queue = queueRef.current;
    if (!queue.length) return;
    indexRef.current = indexRef.current <= 0 ? queue.length - 1 : indexRef.current - 1;
    playTrackRef.current(queue[indexRef.current]);
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    const current = stateRef.current;
    if (!current.currentTrack) return;
    if (!audio?.src) {
      playTrackRef.current(current.currentTrack, undefined, { refresh: true });
      return;
    }
    if (audio.paused) {
      audio.play().catch(() => {
        updateState({ error: "Press play to start playback", isLoading: false });
      });
    } else {
      audio.pause();
    }
  }, [updateState]);

  const seek = useCallback((seconds) => {
    if (!audioRef.current || !Number.isFinite(seconds)) return;
    audioRef.current.currentTime = seconds;
    updateState({ positionSeconds: seconds });
  }, [updateState]);

  const toggleShuffle = useCallback(() => {
    const enabled = !shuffleRef.current;
    shuffleRef.current = enabled;
    playedIdsRef.current.clear();
    if (enabled && stateRef.current.currentTrack) {
      playedIdsRef.current.add(stateRef.current.currentTrack.id);
    }
    updateState({ shuffle: enabled });
  }, [updateState]);

  const toggleLoop = useCallback(() => {
    const modes = ["none", "all", "one"];
    const mode = modes[(modes.indexOf(loopRef.current) + 1) % modes.length];
    loopRef.current = mode;
    updateState({ loopMode: mode });
  }, [updateState]);

  const close = useCallback(() => {
    generationRef.current += 1;
    audioRef.current?.pause();
    if (audioRef.current) {
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }
    queueRef.current = [];
    indexRef.current = -1;
    updateState({ ...INITIAL_STATE, shuffle: shuffleRef.current, loopMode: loopRef.current });
  }, [updateState]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.volume = stateRef.current.volume;
    audioRef.current = audio;
    const onLoading = () => updateState({ isLoading: true });
    const onPlaying = () => updateState({ isLoading: false, isPlaying: true, error: null });
    const onPause = () => updateState({ isPlaying: false });
    const onTime = () => updateState({ positionSeconds: audio.currentTime || 0 });
    const onDuration = () => {
      if (Number.isFinite(audio.duration)) updateState({ durationSeconds: audio.duration });
    };
    const onEnded = () => advanceRef.current?.(true);
    const onError = () => {
      const track = stateRef.current.currentTrack;
      if (track && !retryRef.current) {
        retryRef.current = true;
        playTrackRef.current?.(track, undefined, { refresh: true });
      } else {
        updateState({ isLoading: false, isPlaying: false, error: "Playback failed" });
      }
    };
    audio.addEventListener("loadstart", onLoading);
    audio.addEventListener("waiting", onLoading);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("durationchange", onDuration);
    audio.addEventListener("loadedmetadata", onDuration);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audioRef.current = null;
    };
  }, [updateState]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const actions = {
      play: () => togglePlay(),
      pause: () => togglePlay(),
      previoustrack: () => previous(),
      nexttrack: () => next(),
      seekbackward: (details) =>
        seek(Math.max(0, stateRef.current.positionSeconds - (details.seekOffset || 10))),
      seekforward: (details) =>
        seek(stateRef.current.positionSeconds + (details.seekOffset || 10)),
      seekto: (details) => seek(details.seekTime),
    };
    Object.entries(actions).forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Browser lacks this action.
      }
    });
    return () => {
      Object.keys(actions).forEach((action) => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // Browser lacks this action.
        }
      });
    };
  }, [next, previous, seek, togglePlay]);

  useEffect(() => {
    if (!("mediaSession" in navigator) || !state.currentTrack) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: state.currentTrack.title,
      artist: state.currentTrack.artist,
      album: state.currentTrack.album,
      artwork: state.currentTrack.cover
        ? [{ src: state.currentTrack.cover, sizes: "512x512" }]
        : [],
    });
  }, [state.currentTrack]);

  useEffect(() => {
    if (
      !("mediaSession" in navigator) ||
      !Number.isFinite(state.durationSeconds) ||
      state.durationSeconds <= 0
    ) {
      return;
    }
    try {
      navigator.mediaSession.setPositionState({
        duration: state.durationSeconds,
        playbackRate: 1,
        position: Math.min(state.positionSeconds, state.durationSeconds),
      });
    } catch {
      // Position state can fail while metadata is changing.
    }
  }, [state.durationSeconds, state.positionSeconds]);

  const controls = useMemo(
    () => ({
      playTrack,
      togglePlay,
      previous,
      next,
      seek,
      toggleShuffle,
      toggleLoop,
      close,
      openPlayer: () => updateState({ playerOpen: true }),
      closePlayer: () => updateState({ playerOpen: false }),
    }),
    [close, next, playTrack, previous, seek, toggleLoop, togglePlay, toggleShuffle, updateState],
  );

  return (
    <MusicPlayerContext.Provider value={{ ...state, ...controls }}>
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (!context) throw new Error("useMusicPlayer must be used in MusicPlayerProvider");
  return context;
}
