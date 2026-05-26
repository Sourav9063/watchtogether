"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import { useMusicLibrary } from "@/lib/music/library-client";
import { MusicPlayerProvider, useMusicPlayer } from "./MusicPlayerProvider";
import styles from "./MusicApp.module.css";

const PAGE_SIZE = 20;

function Icon({ name, className }) {
  const paths = {
    music: <path d="M9 18V5l10-2v12M9 18a3 3 0 1 1-3-3h3m10 0a3 3 0 1 1-3-3h3" />,
    home: <path d="m3 11 9-8 9 8v9h-6v-6H9v6H3z" />,
    heart: <path d="M20.8 8.7c0 5.4-8.8 10.3-8.8 10.3S3.2 14.1 3.2 8.7A4.7 4.7 0 0 1 12 6.3a4.7 4.7 0 0 1 8.8 2.4Z" />,
    history: <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5m4-2v5l3 2" />,
    download: <path d="M12 3v12m0 0 5-5m-5 5-5-5M4 20h16" />,
    playlist: (
      <>
        <path d="M16 5H3" />
        <path d="M11 12H3" />
        <path d="M11 19H3" />
        <path d="M21 13V5" />
        <circle cx="18" cy="16" r="3" />
      </>
    ),
    album: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />,
    search: <path d="m21 21-4.4-4.4m1.4-5.1a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />,
    back: <path d="M19 12H5m6-6-6 6 6 6" />,
    close: <path d="M6 6 18 18M18 6 6 18" />,
    play: <path d="m8 5 11 7-11 7Z" />,
    pause: <path d="M8 5v14m8-14v14" />,
    previous: <path d="M19 5 8 12l11 7ZM5 5v14" />,
    next: <path d="m5 5 11 7-11 7Zm14 0v14" />,
    shuffle: <path d="M16 3h5v5M4 20 21 3M4 4l5 5m6 6 6 5h-5" />,
    repeat: <path d="M17 2 21 6l-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4m14-1v2a3 3 0 0 1-3 3H3" />,
    lyrics: <path d="M4 5h16M4 10h12M4 15h14M4 20h9" />,
    explore: <path d="m14.5 9.5-2 5-5 2 2-5 5-2ZM12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" />,
    collapse: <path d="m6 9 6 6 6-6" />,
    more: <path d="M5 12h.1m6.9 0h.1m6.9 0h.1" />,
    plus: <path d="M12 5v14M5 12h14" />,
    trash: <path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7m4 4v6m4-6v6" />,
  };
  return (
    <svg className={className || styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {paths[name] || paths.music}
      </g>
    </svg>
  );
}

function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, "0")}`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 21) return "Good Evening";
  return "Late Night Vibes";
}

function Cover({ src, alt, sizes = "80px" }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return (
    <span className={styles.cover}>
      {src && !failed ? (
        <Image src={src} alt={alt} fill sizes={sizes} onError={() => setFailed(true)} />
      ) : (
        <Icon name="music" className={styles.placeholderIcon} />
      )}
    </span>
  );
}

async function requestJson(path, options) {
  const response = await fetch(path, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to load music");
  return data;
}

export default function MusicApp() {
  return (
    <MusicPlayerProvider>
      <MusicExperience />
    </MusicPlayerProvider>
  );
}

function MusicExperience() {
  const player = useMusicPlayer();
  const library = useMusicLibrary();
  const [view, setView] = useState("home");
  const [query, setQuery] = useState("");
  const [searchTab, setSearchTab] = useState("tracks");
  const [page, setPage] = useState(0);
  const [reload, setReload] = useState(0);
  const [trending, setTrending] = useState([]);
  const [searchResults, setSearchResults] = useState({ tracks: [], albums: [] });
  const [album, setAlbum] = useState(null);
  const [albumTracks, setAlbumTracks] = useState([]);
  const [playlistId, setPlaylistId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menu, setMenu] = useState(null);
  const [newPlaylistOpen, setNewPlaylistOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState("");

  const selectedPlaylist = library.playlists.find((item) => item.id === playlistId);
  const addToHistory = library.addToHistory;

  useEffect(() => {
    if (player.playSequence && player.currentTrack) {
      addToHistory(player.currentTrack);
    }
  }, [addToHistory, player.currentTrack, player.playSequence]);

  useEffect(() => {
    if (view !== "home") return;
    let ignore = false;
    setLoading(true);
    setError(null);
    requestJson(`/api/music/trending?index=${page * PAGE_SIZE}&limit=${PAGE_SIZE}`)
      .then((data) => {
        if (!ignore) setTrending(data.tracks);
      })
      .catch((loadError) => {
        if (!ignore) setError(loadError.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [page, reload, view]);

  async function submitSearch(event) {
    event?.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setView("home");
      return;
    }
    setView("search");
    setLoading(true);
    setError(null);
    try {
      setSearchResults(await requestJson(`/api/music/search?q=${encodeURIComponent(trimmed)}`));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  async function openAlbum(selected) {
    setView("album");
    setAlbum(selected);
    setAlbumTracks([]);
    setLoading(true);
    setError(null);
    try {
      const data = await requestJson(`/api/music/album/${selected.id}`);
      setAlbum(data.album);
      setAlbumTracks(data.tracks);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  function navigate(nextView) {
    setView(nextView);
    setError(null);
  }

  function openPlaylist(id) {
    setPlaylistId(id);
    navigate("playlist");
  }

  function createPlaylist(event) {
    event.preventDefault();
    if (!playlistName.trim()) return;
    library.createPlaylist(playlistName);
    setPlaylistName("");
    setNewPlaylistOpen(false);
    navigate("playlists");
  }

  const content = (() => {
    if (loading) return <SkeletonGrid list={view !== "home" && view !== "albums"} />;
    if (error) {
      return (
        <EmptyState
          icon="music"
          title="Music unavailable"
          detail={error}
          action={view === "home" ? () => setReload((current) => current + 1) : () => navigate("home")}
          actionLabel={view === "home" ? "Retry" : "Back home"}
        />
      );
    }
    if (view === "home") {
      return (
        <>
          <Title title="Trending Now" badge={`Page ${page + 1}`} />
          <TrackGrid
            tracks={trending}
            rankOffset={page * PAGE_SIZE}
            onPlay={(track) => player.playTrack(track, trending)}
          />
        </>
      );
    }
    if (view === "search") {
      return (
        <SearchResults
          results={searchResults}
          tab={searchTab}
          setTab={setSearchTab}
          player={player}
          openAlbum={openAlbum}
          setMenu={(track) => setMenu({ track })}
        />
      );
    }
    if (view === "liked") {
      return (
        <LibraryTrackView
          title="Liked Songs"
          icon="heart"
          tone="pink"
          tracks={library.liked}
          emptyTitle="No liked songs yet"
          emptyDetail="Songs you love will appear here"
          onBack={() => navigate("home")}
          player={player}
          setMenu={setMenu}
        />
      );
    }
    if (view === "history") {
      return (
        <LibraryTrackView
          title="History"
          icon="history"
          tone="violet"
          tracks={library.history}
          emptyTitle="No listening history"
          emptyDetail="Songs you play will appear here"
          onBack={() => navigate("home")}
          player={player}
          setMenu={setMenu}
        />
      );
    }
    if (view === "downloads") {
      return (
        <section className={styles.sectionView}>
          <SectionHeader title="Downloads" icon="download" tone="cyan" subtitle="Device files" onBack={() => navigate("home")} />
          <p className={styles.offlineNote}>
            Downloaded audio saves to your browser download location as
            {" "}<strong>Song-Artist.filetype</strong>. Confirm provider terms and
            media rights before public use.
          </p>
          <EmptyState
            icon="download"
            title="Files save on your device"
            detail="Use Download from a song menu or full player. Browser security prevents this page from listing or deleting files already saved on your device."
          />
        </section>
      );
    }
    if (view === "albums") {
      return (
        <section className={styles.sectionView}>
          <SectionHeader title="Saved Albums" icon="album" tone="amber" subtitle={`${library.albums.length} albums`} onBack={() => navigate("home")} />
          {library.albums.length ? (
            <AlbumGrid albums={library.albums} openAlbum={openAlbum} />
          ) : (
            <EmptyState icon="album" title="No saved albums" detail="Albums you save will appear here" />
          )}
        </section>
      );
    }
    if (view === "playlists") {
      return (
        <section className={styles.sectionView}>
          <SectionHeader
            title="Your Playlists"
            icon="playlist"
            subtitle={`${library.playlists.length} playlists`}
            onBack={() => navigate("home")}
            action={<button className={styles.pillButton} onClick={() => setNewPlaylistOpen(true)}><Icon name="plus" />New</button>}
          />
          {library.playlists.length ? (
            <div className={styles.playlistList}>
              {library.playlists.map((playlist) => (
                <button className={styles.playlistRow} key={playlist.id} onClick={() => openPlaylist(playlist.id)}>
                  <span className={styles.playlistCover}>
                    {playlist.tracks[0] ? <Cover src={playlist.tracks[0].cover} alt="" /> : <Icon name="music" />}
                  </span>
                  <span>
                    <strong>{playlist.name}</strong>
                    <small>{playlist.tracks.length} tracks</small>
                  </span>
                  <span className={styles.rowArrow}>›</span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState icon="playlist" title="No playlists yet" detail="Create one to organize your music" />
          )}
        </section>
      );
    }
    if (view === "playlist" && selectedPlaylist) {
      return (
        <DetailView
          title={selectedPlaylist.name}
          subtitle={`${selectedPlaylist.tracks.length} tracks`}
          cover={selectedPlaylist.tracks[0]?.cover}
          tracks={selectedPlaylist.tracks}
          player={player}
          setMenu={(track) => setMenu({ track, playlistId: selectedPlaylist.id })}
          onBack={() => navigate("playlists")}
          onDelete={() => {
            library.deletePlaylist(selectedPlaylist.id);
            navigate("playlists");
          }}
        />
      );
    }
    if (view === "album" && album) {
      return (
        <DetailView
          title={album.title}
          subtitle={album.artist}
          cover={album.cover}
          tracks={albumTracks}
          player={player}
          setMenu={(track) => setMenu({ track })}
          onBack={() => navigate("albums")}
          isSaved={library.albums.some((item) => item.id === album.id)}
          onSave={() => library.toggleAlbum(album)}
        />
      );
    }
    return <EmptyState icon="music" title="Nothing selected" detail="Return home to browse music." />;
  })();

  return (
    <main className={styles.music}>
      <Sidebar view={view} navigate={navigate} currentTrack={player.currentTrack} />
      <div className={styles.mainPane}>
        <MobileHeader />
        <SearchBar
          query={query}
          setQuery={setQuery}
          searching={view === "search"}
          submit={submitSearch}
          reset={() => {
            setQuery("");
            navigate("home");
          }}
        />
        {view === "home" && <MobileChips navigate={navigate} />}
        <div className={styles.content}>{content}</div>
        {view === "home" && (
          <Pagination
            page={page}
            previous={() => setPage((current) => Math.max(0, current - 1))}
            next={() => setPage((current) => current + 1)}
          />
        )}
      </div>
      {player.currentTrack && !player.playerOpen && <MiniPlayer player={player} />}
      {player.playerOpen && (
        <PlayerOverlay
          player={player}
          library={library}
        />
      )}
      {menu && (
        <TrackActions
          menu={menu}
          library={library}
          close={() => setMenu(null)}
        />
      )}
      {library.downloadMessage && (
        <StatusToast
          message={library.downloadMessage}
          close={library.clearDownloadMessage}
        />
      )}
      {newPlaylistOpen && (
        <Modal title="New Playlist" close={() => setNewPlaylistOpen(false)}>
          <form className={styles.createForm} onSubmit={createPlaylist}>
            <input
              autoFocus
              maxLength={60}
              value={playlistName}
              onChange={(event) => setPlaylistName(event.target.value)}
              placeholder="Playlist name"
            />
            <button className={styles.primaryButton} type="submit">Create</button>
          </form>
        </Modal>
      )}
    </main>
  );
}

function Sidebar({ view, navigate, currentTrack }) {
  return (
    <aside className={styles.sidebar}>
      <Brand title="Music" subtitle={greeting()} />
      <div className={styles.sidebarDivider} />
      <NavButton label="Home" icon="home" active={view === "home"} onClick={() => navigate("home")} />
      <NavButton label="Liked Songs" icon="heart" tone="pink" active={view === "liked"} onClick={() => navigate("liked")} />
      <NavButton label="History" icon="history" active={view === "history"} onClick={() => navigate("history")} />
      <NavButton label="Downloads" icon="download" tone="cyan" active={view === "downloads"} onClick={() => navigate("downloads")} />
      <p className={styles.eyebrow}>LIBRARY</p>
      <NavButton label="Playlists" icon="playlist" active={view === "playlists" || view === "playlist"} onClick={() => navigate("playlists")} />
      <NavButton label="Albums" icon="album" tone="amber" active={view === "albums" || view === "album"} onClick={() => navigate("albums")} />
      {currentTrack && (
        <div className={styles.sidebarNowPlaying}>
          <Cover src={currentTrack.cover} alt="" />
          <span><strong>{currentTrack.title}</strong><small>{currentTrack.artist}</small></span>
        </div>
      )}
    </aside>
  );
}

function Brand({ title, subtitle }) {
  return (
    <div className={styles.brand}>
      <div className={styles.brandHeading}><span className={styles.logo}><Icon name="music" /></span><strong>{title}</strong></div>
      <p>{subtitle}</p>
    </div>
  );
}

function MobileHeader() {
  return <header className={styles.mobileHeader}><Brand title={greeting()} subtitle="" /></header>;
}

function NavButton({ label, icon, active, onClick, tone = "violet" }) {
  return (
    <button className={`${styles.navButton} ${styles[tone]} ${active ? styles.active : ""}`} onClick={onClick}>
      <Icon name={icon} />{label}
    </button>
  );
}

function SearchBar({ query, setQuery, searching, submit, reset }) {
  return (
    <form className={styles.searchBar} onSubmit={submit}>
      <button type="button" className={styles.iconButton} onClick={searching ? reset : undefined} aria-label={searching ? "Back to trending" : "Search"}>
        <Icon name={searching ? "back" : "search"} />
      </button>
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search songs, albums, artists..." />
      {query && <button type="button" className={styles.iconButton} onClick={reset} aria-label="Clear search"><Icon name="close" /></button>}
    </form>
  );
}

function MobileChips({ navigate }) {
  return (
    <nav className={styles.chips}>
      <NavButton label="Liked" icon="heart" tone="pink" onClick={() => navigate("liked")} />
      <NavButton label="History" icon="history" onClick={() => navigate("history")} />
      <NavButton label="Downloads" icon="download" tone="cyan" onClick={() => navigate("downloads")} />
      <NavButton label="Playlists" icon="playlist" onClick={() => navigate("playlists")} />
      <NavButton label="Albums" icon="album" tone="amber" onClick={() => navigate("albums")} />
    </nav>
  );
}

function Title({ title, badge }) {
  return <header className={styles.title}><h2>{title}</h2>{badge && <span>{badge}</span>}</header>;
}

function TrackGrid({ tracks, onPlay, rankOffset = null }) {
  return tracks.length ? (
    <div className={styles.trackGrid}>
      {tracks.map((track, index) => (
        <button className={styles.trackCard} key={track.id} onClick={() => onPlay(track)}>
          <span className={styles.cardArtwork}>
            <Cover src={track.cover} alt="" sizes="(max-width: 600px) 45vw, (max-width: 1100px) 22vw, 16vw" />
            {rankOffset !== null && <span className={styles.rank}>{rankOffset + index + 1}</span>}
            {track.duration > 0 && <span className={styles.timeBadge}>{formatDuration(track.duration)}</span>}
            <span className={styles.playBadge}><Icon name="play" /></span>
          </span>
          <strong>{track.title}</strong>
          <small>{track.artist}</small>
        </button>
      ))}
    </div>
  ) : <EmptyState icon="music" title="No tracks found" detail="Try another page or search." />;
}

function AlbumGrid({ albums, openAlbum }) {
  return (
    <div className={styles.trackGrid}>
      {albums.map((album) => (
        <button className={styles.trackCard} key={album.id} onClick={() => openAlbum(album)}>
          <span className={styles.cardArtwork}><Cover src={album.cover} alt="" sizes="(max-width: 600px) 45vw, 18vw" />{album.nbTracks > 0 && <span className={styles.timeBadge}>{album.nbTracks} tracks</span>}</span>
          <strong>{album.title}</strong><small>{album.artist}</small>
        </button>
      ))}
    </div>
  );
}

function SearchResults({ results, tab, setTab, player, openAlbum, setMenu }) {
  return (
    <section className={styles.sectionView}>
      <div className={styles.tabs}>
        <button className={tab === "tracks" ? styles.selectedTab : ""} onClick={() => setTab("tracks")}>Tracks</button>
        <button className={tab === "albums" ? styles.selectedTab : ""} onClick={() => setTab("albums")}>Albums</button>
      </div>
      {tab === "tracks" ? (
        results.tracks.length ? <TrackList tracks={results.tracks} player={player} setMenu={setMenu} /> : <EmptyState icon="search" title="No tracks found" detail="Try different search." />
      ) : results.albums.length ? <AlbumGrid albums={results.albums} openAlbum={openAlbum} /> : <EmptyState icon="album" title="No albums found" detail="Try different search." />}
    </section>
  );
}

function SectionHeader({ title, subtitle, icon, tone = "violet", onBack, action }) {
  return (
    <header className={styles.sectionHeader}>
      <button className={styles.backButton} onClick={onBack} aria-label="Back"><Icon name="back" /></button>
      <span className={`${styles.sectionIcon} ${styles[tone]}`}><Icon name={icon} /></span>
      <span className={styles.sectionTitle}><h2>{title}</h2><small>{subtitle}</small></span>
      {action}
    </header>
  );
}

function LibraryTrackView({ title, icon, tone, tracks, emptyTitle, emptyDetail, onBack, player, setMenu }) {
  return (
    <section className={styles.sectionView}>
      <SectionHeader
        title={title}
        icon={icon}
        tone={tone}
        subtitle={`${tracks.length} songs`}
        onBack={onBack}
        action={tracks.length ? <button className={styles.pillButton} onClick={() => { if (!player.shuffle) player.toggleShuffle(); player.playTrack(tracks[0], tracks); }}><Icon name="shuffle" />Shuffle</button> : null}
      />
      {tracks.length ? <TrackList tracks={tracks} player={player} setMenu={(track) => setMenu({ track })} /> : <EmptyState icon={icon} title={emptyTitle} detail={emptyDetail} />}
    </section>
  );
}

function TrackList({ tracks, player, setMenu, numbered = false }) {
  return (
    <div className={styles.trackList}>
      {tracks.map((track, index) => {
        const active = player.currentTrack?.id === track.id;
        return (
          <div className={`${styles.trackRow} ${active ? styles.playing : ""}`} key={track.id}>
            {numbered && <span className={styles.number}>{active ? "≋" : index + 1}</span>}
            <button className={styles.rowMain} onClick={() => player.playTrack(track, tracks)}>
              <Cover src={track.cover} alt="" />
              <span><strong>{track.title}</strong><small>{track.artist}</small></span>
            </button>
            {track.duration > 0 && <time>{formatDuration(track.duration)}</time>}
            <button className={styles.moreButton} onClick={() => setMenu(track)} aria-label={`Actions for ${track.title}`}><Icon name="more" /></button>
          </div>
        );
      })}
    </div>
  );
}

function DetailView({ title, subtitle, cover, tracks, player, setMenu, onBack, onDelete, onSave, isSaved }) {
  return (
    <section className={styles.detail}>
      <div className={styles.detailHero}>
        {cover && <div className={styles.heroBackground}><Cover src={cover} alt="" sizes="800px" /></div>}
        <button className={styles.heroBack} onClick={onBack} aria-label="Back"><Icon name="back" /></button>
        <div className={styles.heroInfo}>
          <div className={styles.heroCover}><Cover src={cover} alt="" sizes="140px" /></div>
          <div><h2>{title}</h2><p>{subtitle}</p></div>
        </div>
        <div className={styles.heroActions}>
          {tracks.length > 0 && <button className={styles.pillButton} onClick={() => { if (!player.shuffle) player.toggleShuffle(); player.playTrack(tracks[0], tracks); }}><Icon name="shuffle" />Shuffle</button>}
          {tracks.length > 0 && <button className={styles.primaryButton} onClick={() => player.playTrack(tracks[0], tracks)}><Icon name="play" />Play All</button>}
          {onSave && <button className={styles.pillButton} onClick={onSave}><Icon name="heart" />{isSaved ? "Saved" : "Save"}</button>}
          {onDelete && <button className={styles.pillButton} onClick={onDelete}><Icon name="trash" />Delete</button>}
        </div>
      </div>
      {tracks.length ? <TrackList tracks={tracks} player={player} setMenu={setMenu} numbered /> : <EmptyState icon="album" title="No tracks available" detail="Album has no playable metadata." />}
    </section>
  );
}

function Pagination({ page, previous, next }) {
  return (
    <nav className={styles.pagination} aria-label="Trending pages">
      <button disabled={page === 0} onClick={previous}>Previous</button>
      <span>Page {page + 1}</span>
      <button onClick={next}>Next</button>
    </nav>
  );
}

function MiniPlayer({ player }) {
  const progress = player.durationSeconds ? (player.positionSeconds / player.durationSeconds) * 100 : 0;
  return (
    <section className={styles.miniPlayer} onClick={player.openPlayer} aria-label="Now playing">
      <span className={styles.miniProgress} style={{ width: `${progress}%` }} />
      <Cover src={player.currentTrack.cover} alt="" />
      <button className={styles.miniTrack} onClick={player.openPlayer}><strong>{player.currentTrack.title}</strong><small>{player.currentTrack.artist}</small></button>
      <div className={styles.miniControls}>
        <button onClick={(event) => { event.stopPropagation(); player.previous(); }} aria-label="Previous"><Icon name="previous" /></button>
        <button className={styles.miniPlay} onClick={(event) => { event.stopPropagation(); player.togglePlay(); }} aria-label={player.isPlaying ? "Pause" : "Play"}>
          {player.isLoading ? <span className={styles.spinner} /> : <Icon name={player.isPlaying ? "pause" : "play"} />}
        </button>
        <button onClick={(event) => { event.stopPropagation(); player.next(); }} aria-label="Next"><Icon name="next" /></button>
        <button onClick={(event) => { event.stopPropagation(); player.close(); }} aria-label="Close"><Icon name="close" /></button>
      </div>
      {player.error && <p className={styles.playerError}>{player.error}</p>}
    </section>
  );
}

function PlayerOverlay({ player, library }) {
  const [tab, setTab] = useState("art");
  const [related, setRelated] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const downloading = library.downloadingIds.includes(player.currentTrack.id);
  const activeLine = useMemo(() => {
    if (!player.lyrics?.length) return -1;
    return player.lyrics.reduce((active, line, index) => line.startTimeMs <= player.positionSeconds * 1000 ? index : active, -1);
  }, [player.lyrics, player.positionSeconds]);
  const activeRef = useRef(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeLine]);

  useEffect(() => {
    if (tab !== "related" || !player.currentTrack) return;
    let ignore = false;
    setLoadingRelated(true);
    requestJson(`/api/music/related/${player.currentTrack.id}`)
      .then((data) => { if (!ignore) setRelated(data.tracks.filter((track) => track.id !== player.currentTrack.id)); })
      .catch(() => { if (!ignore) setRelated([]); })
      .finally(() => { if (!ignore) setLoadingRelated(false); });
    return () => { ignore = true; };
  }, [player.currentTrack, tab]);

  return (
    <div
      className={styles.playerBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Music player"
      onClick={(event) => {
        event.stopPropagation();
        player.closePlayer();
      }}
    >
      <div className={styles.playerBackground}><Cover src={player.currentTrack.cover} alt="" sizes="100vw" /></div>
      <article className={styles.fullPlayer} onClick={(event) => event.stopPropagation()}>
        <header className={styles.overlayHeader}>
          <button onClick={player.closePlayer} aria-label="Collapse player"><Icon name="collapse" /></button>
          <div>
            <button className={library.liked.some((track) => track.id === player.currentTrack.id) ? styles.liked : ""} onClick={() => library.toggleLike(player.currentTrack)} aria-label="Like song"><Icon name="heart" /></button>
            <button
              disabled={downloading}
              onClick={() => library.downloadTrack(player.currentTrack)}
              aria-label="Download to device"
            >
              {downloading ? <span className={styles.spinner} /> : <Icon name="download" />}
            </button>
          </div>
        </header>
        <nav className={styles.playerTabs}>
          {[["art", "album", "Art"], ["lyrics", "lyrics", "Lyrics"], ["related", "explore", "Related"]].map(([key, icon, label]) => (
            <button className={tab === key ? styles.selectedTab : ""} key={key} onClick={() => setTab(key)}><Icon name={icon} />{label}</button>
          ))}
        </nav>
        <div className={styles.playerBody}>
          {tab === "art" && (
            <div className={styles.artView}>
              <div className={styles.largeArt}><Cover src={player.currentTrack.cover} alt="" sizes="360px" /></div>
              <h2>{player.currentTrack.title}</h2><p>{player.currentTrack.artist}</p><small>{player.currentTrack.album}</small>
            </div>
          )}
          {tab === "lyrics" && (
            <div className={styles.lyricsView}>
              {player.lyricsLoading ? <LoadingLabel text="Loading lyrics..." /> : player.lyrics?.length ? player.lyrics.map((line, index) => (
                <button ref={index === activeLine ? activeRef : null} className={index === activeLine ? styles.activeLyric : ""} key={`${line.startTimeMs}-${index}`} onClick={() => player.seek(line.startTimeMs / 1000)}>{line.text}</button>
              )) : <EmptyState icon="lyrics" title="No lyrics available" detail="" />}
            </div>
          )}
          {tab === "related" && (
            loadingRelated ? <LoadingLabel text="Finding related tracks..." /> : <TrackGrid tracks={related} onPlay={(track) => { player.playTrack(track, related); setTab("art"); }} />
          )}
        </div>
        <PlayerControls player={player} />
      </article>
    </div>
  );
}

function PlayerControls({ player }) {
  return (
    <footer className={styles.playerControls}>
      <input type="range" min="0" max={player.durationSeconds || 1} value={Math.min(player.positionSeconds, player.durationSeconds || 1)} onChange={(event) => player.seek(Number(event.target.value))} aria-label="Seek" />
      <div className={styles.duration}><span>{formatDuration(player.positionSeconds)}</span><span>{formatDuration(player.durationSeconds)}</span></div>
      {player.error && <p>{player.error}</p>}
      <div className={styles.largeControls}>
        <button className={player.shuffle ? styles.controlActive : ""} onClick={player.toggleShuffle} aria-label="Shuffle"><Icon name="shuffle" /></button>
        <button onClick={player.previous} aria-label="Previous"><Icon name="previous" /></button>
        <button className={styles.primaryPlay} onClick={player.togglePlay} aria-label={player.isPlaying ? "Pause" : "Play"}>{player.isLoading ? <span className={styles.spinner} /> : <Icon name={player.isPlaying ? "pause" : "play"} />}</button>
        <button onClick={() => player.next()} aria-label="Next"><Icon name="next" /></button>
        <button className={player.loopMode !== "none" ? styles.controlActive : ""} onClick={player.toggleLoop} aria-label={`Loop ${player.loopMode}`}><Icon name="repeat" />{player.loopMode === "one" && <sup>1</sup>}</button>
      </div>
    </footer>
  );
}

function TrackActions({ menu, library, close }) {
  const liked = library.liked.some((track) => track.id === menu.track.id);
  const downloading = library.downloadingIds.includes(menu.track.id);
  return (
    <Modal title={menu.track.title} close={close}>
      <button className={styles.modalAction} onClick={() => { library.toggleLike(menu.track); close(); }}><Icon name="heart" />{liked ? "Remove from Liked" : "Like Song"}</button>
      {menu.playlistId && <button className={styles.modalAction} onClick={() => { library.removeFromPlaylist(menu.playlistId, menu.track.id); close(); }}><Icon name="trash" />Remove from Playlist</button>}
      <p className={styles.modalLabel}>ADD TO PLAYLIST</p>
      {library.playlists.length ? library.playlists.map((playlist) => (
        <button className={styles.modalAction} key={playlist.id} onClick={() => { library.addToPlaylist(playlist.id, menu.track); close(); }}><Icon name="playlist" />{playlist.name}</button>
      )) : <p className={styles.modalMuted}>Create playlist from Library first.</p>}
      <button
        className={styles.modalAction}
        disabled={downloading}
        onClick={() => {
          library.downloadTrack(menu.track);
          close();
        }}
      >
        {downloading ? <span className={styles.spinner} /> : <Icon name="download" />}
        {downloading ? "Downloading..." : "Download to Device"}
      </button>
    </Modal>
  );
}

function Modal({ title, close, children }) {
  return (
    <div className={styles.modalBackdrop} onMouseDown={close}>
      <section className={styles.modal} onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-label={title}>
        <header><h2>{title}</h2><button onClick={close} aria-label="Close"><Icon name="close" /></button></header>
        {children}
      </section>
    </div>
  );
}

function EmptyState({ icon, title, detail, action, actionLabel }) {
  return (
    <div className={styles.empty}>
      <Icon name={icon} />
      <h3>{title}</h3>
      {detail && <p>{detail}</p>}
      {action && <button className={styles.pillButton} onClick={action}>{actionLabel}</button>}
    </div>
  );
}

function LoadingLabel({ text }) {
  return <div className={styles.loadingLabel}><span className={styles.spinner} /><p>{text}</p></div>;
}

function StatusToast({ message, close }) {
  return (
    <div className={styles.statusToast} role="status">
      <span>{message}</span>
      <button onClick={close} aria-label="Dismiss"><Icon name="close" /></button>
    </div>
  );
}

function SkeletonGrid({ list }) {
  return <div className={list ? styles.skeletonList : styles.trackGrid}>{Array.from({ length: list ? 7 : 10 }, (_, index) => <span className={list ? styles.skeletonRow : styles.skeletonCard} key={index} />)}</div>;
}
