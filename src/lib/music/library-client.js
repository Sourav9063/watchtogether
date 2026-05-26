"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "playtorrio-music-library-v1";
const EMPTY_LIBRARY = { liked: [], history: [], albums: [], playlists: [] };

function filenamePart(value) {
  return value
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || "track";
}

function audioExtension(contentType) {
  if (contentType.includes("webm")) return "webm";
  if (contentType.includes("mpeg") || contentType.includes("mp3")) return "mp3";
  if (contentType.includes("ogg")) return "ogg";
  if (contentType.includes("wav")) return "wav";
  return "m4a";
}

function loadLibrary() {
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    return {
      liked: Array.isArray(value?.liked) ? value.liked : [],
      history: Array.isArray(value?.history) ? value.history : [],
      albums: Array.isArray(value?.albums) ? value.albums : [],
      playlists: Array.isArray(value?.playlists) ? value.playlists : [],
    };
  } catch {
    return EMPTY_LIBRARY;
  }
}

export function useMusicLibrary() {
  const [library, setLibrary] = useState(EMPTY_LIBRARY);
  const [downloadingIds, setDownloadingIds] = useState([]);
  const [downloadMessage, setDownloadMessage] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLibrary(loadLibrary());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
    }
  }, [hydrated, library]);

  const toggleLike = useCallback((track) => {
    setLibrary((current) => {
      const liked = current.liked.some((item) => item.id === track.id)
        ? current.liked.filter((item) => item.id !== track.id)
        : [track, ...current.liked];
      return { ...current, liked };
    });
  }, []);

  const addToHistory = useCallback((track) => {
    if (!track?.id) return;
    setLibrary((current) => ({
      ...current,
      history: [
        track,
        ...current.history.filter((item) => item.id !== track.id),
      ].slice(0, 100),
    }));
  }, []);

  const toggleAlbum = useCallback((album) => {
    setLibrary((current) => {
      const albums = current.albums.some((item) => item.id === album.id)
        ? current.albums.filter((item) => item.id !== album.id)
        : [album, ...current.albums];
      return { ...current, albums };
    });
  }, []);

  const createPlaylist = useCallback((name) => {
    const title = name.trim().slice(0, 60);
    if (!title) return;
    setLibrary((current) => {
      if (
        current.playlists.some(
          (playlist) => playlist.name.toLowerCase() === title.toLowerCase(),
        )
      ) {
        return current;
      }
      return {
        ...current,
        playlists: [
          ...current.playlists,
          { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: title, tracks: [] },
        ],
      };
    });
  }, []);

  const deletePlaylist = useCallback((playlistId) => {
    setLibrary((current) => ({
      ...current,
      playlists: current.playlists.filter((playlist) => playlist.id !== playlistId),
    }));
  }, []);

  const addToPlaylist = useCallback((playlistId, track) => {
    setLibrary((current) => ({
      ...current,
      playlists: current.playlists.map((playlist) => {
        if (playlist.id !== playlistId) return playlist;
        if (playlist.tracks.some((item) => item.id === track.id)) return playlist;
        return { ...playlist, tracks: [...playlist.tracks, track] };
      }),
    }));
  }, []);

  const removeFromPlaylist = useCallback((playlistId, trackId) => {
    setLibrary((current) => ({
      ...current,
      playlists: current.playlists.map((playlist) =>
        playlist.id === playlistId
          ? {
              ...playlist,
              tracks: playlist.tracks.filter((track) => track.id !== trackId),
            }
          : playlist,
      ),
    }));
  }, []);

  const downloadTrack = useCallback(async (track) => {
    if (downloadingIds.includes(track.id)) return;
    setDownloadingIds((current) => [...current, track.id]);
    setDownloadMessage(`Downloading "${track.title}"...`);
    try {
      const response = await fetch("/api/music/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: track.id,
          title: track.title,
          artist: track.artist,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Unable to download audio");
      }
      const blob = await response.blob();
      if (!blob.size) throw new Error("Downloaded audio is empty");
      const serverFilename = response.headers.get("X-Music-Filename");
      const filename = serverFilename
        ? decodeURIComponent(serverFilename)
        : `${filenamePart(track.title)}-${filenamePart(track.artist)}.${audioExtension(blob.type)}`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setDownloadMessage(`"${filename}" sent to device downloads.`);
    } catch (error) {
      setDownloadMessage(error.message || "Unable to download song.");
    } finally {
      setDownloadingIds((current) => current.filter((id) => id !== track.id));
    }
  }, [downloadingIds]);

  return useMemo(
    () => ({
      ...library,
      downloadingIds,
      downloadMessage,
      hydrated,
      toggleLike,
      addToHistory,
      toggleAlbum,
      createPlaylist,
      deletePlaylist,
      addToPlaylist,
      removeFromPlaylist,
      downloadTrack,
      clearDownloadMessage: () => setDownloadMessage(null),
    }),
    [
      library,
      downloadingIds,
      downloadMessage,
      hydrated,
      toggleLike,
      addToHistory,
      toggleAlbum,
      createPlaylist,
      deletePlaylist,
      addToPlaylist,
      removeFromPlaylist,
      downloadTrack,
    ],
  );
}
