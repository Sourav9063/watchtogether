"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

const STREAMED_BASE = "https://streamed.pk";

const PROVIDERS = [
  {
    id: "streamed",
    label: "Streamed.pk",
    description: "Live, today, and all listed matches.",
    accent: "#00d4ff",
    tint: "rgba(0, 212, 255, 0.2)",
  },
  {
    id: "ppv",
    label: "PPV.to",
    description: "Event streams and always-live cards.",
    accent: "#ff4f8b",
    tint: "rgba(255, 79, 139, 0.2)",
  },
  {
    id: "cdnLive",
    label: "CDN Live",
    description: "Online channels and sports event feeds.",
    accent: "#70e000",
    tint: "rgba(112, 224, 0, 0.18)",
  },
];

const VIEW_MODES = [
  { id: "live", label: "Live" },
  { id: "today", label: "Today" },
  { id: "all", label: "All" },
];

function asString(value, fallback = "") {
  return value == null ? fallback : String(value);
}

function asNumber(value, fallback = 0) {
  return typeof value === "number" ? value : Number(value) || fallback;
}

function asBoolean(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function imageValue(value) {
  const text = asString(value).trim();
  return text || null;
}

function normalizeSport(sport) {
  return {
    id: asString(sport?.id),
    name: asString(sport?.name || sport?.title || sport?.id, "Sports"),
  };
}

function normalizeStreamedMatch(match) {
  const sources = Array.isArray(match?.sources) ? match.sources : [];
  const home = match?.teams?.home || {};
  const away = match?.teams?.away || {};

  return {
    id: asString(match?.id),
    title: asString(match?.title || `${home.name || ""} ${away.name || ""}`),
    category: asString(match?.category, "sports"),
    date: asNumber(match?.date),
    poster: imageValue(match?.poster),
    popular: asBoolean(match?.popular),
    teams: {
      home: {
        name: asString(home?.name),
        badge: imageValue(home?.badge),
      },
      away: {
        name: asString(away?.name),
        badge: imageValue(away?.badge),
      },
    },
    sources: sources
      .map((source) => ({
        source: asString(source?.source),
        id: asString(source?.id),
      }))
      .filter((source) => source.source && source.id),
  };
}

function normalizeStream(stream) {
  return {
    id: asString(stream?.id || stream?.embedUrl),
    streamNo: asNumber(stream?.streamNo || stream?.stream_no, 1),
    language: asString(stream?.language, "Unknown"),
    hd: asBoolean(stream?.hd),
    embedUrl: asString(stream?.embedUrl || stream?.embed_url),
    source: asString(stream?.source),
  };
}

function normalizePpvStream(stream) {
  const category =
    stream?.category_name ||
    stream?.categoryName ||
    stream?.category ||
    stream?._categoryName;

  return {
    id: asNumber(stream?.id),
    name: asString(stream?.name, "Untitled event"),
    tag: asString(stream?.tag),
    poster: imageValue(stream?.poster),
    uriName: asString(stream?.uri_name || stream?.uriName),
    startsAt: asNumber(stream?.starts_at || stream?.startsAt),
    endsAt: asNumber(stream?.ends_at || stream?.endsAt),
    alwaysLive: asBoolean(stream?.always_live ?? stream?.alwaysLive),
    category: asString(category, "PPV"),
    iframe: imageValue(stream?.iframe),
    allowPastStreams: asBoolean(
      stream?.allow_past_streams ?? stream?.allowPastStreams,
    ),
  };
}

function normalizeCdnChannel(channel) {
  return {
    name: asString(channel?.name, "CDN channel"),
    code: asString(channel?.code),
    url: asString(channel?.url),
    image: asString(channel?.image),
    status: asString(channel?.status),
    viewers: asNumber(channel?.viewers),
  };
}

function normalizeCdnSport(event) {
  const channels = Array.isArray(event?.channels) ? event.channels : [];

  return {
    gameID: asString(event?.gameID || event?.id),
    homeTeam: asString(event?.homeTeam),
    awayTeam: asString(event?.awayTeam),
    homeTeamIMG: asString(event?.homeTeamIMG),
    awayTeamIMG: asString(event?.awayTeamIMG),
    time: asString(event?.time),
    tournament: asString(event?.tournament, "Tournament"),
    country: asString(event?.country),
    countryIMG: asString(event?.countryIMG),
    status: asString(event?.status),
    start: asString(event?.start),
    end: asString(event?.end),
    channels: channels.map(normalizeCdnChannel).filter((channel) => channel.url),
  };
}

function formatMatchTime(timestamp) {
  if (!timestamp) return "Time TBA";
  const value = timestamp > 100000000000 ? timestamp : timestamp * 1000;

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ppvTimeLabel(stream) {
  if (stream.alwaysLive) return "Always Live";

  const now = Math.floor(Date.now() / 1000);
  if (now >= stream.startsAt && now <= stream.endsAt) return "Live Now";
  if (stream.startsAt > now) {
    return new Date(stream.startsAt * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return "";
}

function initials(text) {
  return asString(text, "?").trim().slice(0, 1).toUpperCase() || "?";
}

function streamedPoster(match) {
  const homeBadge = match.teams.home.badge;
  const awayBadge = match.teams.away.badge;

  if (homeBadge && awayBadge) {
    return `${STREAMED_BASE}/api/images/poster/${homeBadge}/${awayBadge}.webp`;
  }
  if (match.poster) {
    return `${STREAMED_BASE}/api/images/proxy/${match.poster}.webp`;
  }

  return null;
}

function badgeUrl(badge) {
  return badge ? `${STREAMED_BASE}/api/images/badge/${badge}.webp` : null;
}

function categoryTabs(provider, sports, streamedMatches, ppvStreams, cdnSports) {
  if (provider === "streamed") {
    const presentIds = new Set(streamedMatches.map((match) => match.category));
    return sports
      .filter((sport) => presentIds.has(sport.id))
      .map((sport) => ({ id: sport.id, label: sport.name }));
  }

  if (provider === "ppv") {
    return Array.from(
      new Set(ppvStreams.map((stream) => stream.category).filter(Boolean)),
    ).map((category) => ({ id: category, label: category }));
  }

  return Array.from(
    new Set(cdnSports.map((event) => event.tournament).filter(Boolean)),
  ).map((tournament) => ({ id: tournament, label: tournament }));
}

function EmptyState({ title, detail }) {
  return (
    <div className={styles.stateBox}>
      <span className={styles.stateKicker}>No results</span>
      <h2>{title}</h2>
      <p>{detail}</p>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className={styles.grid} aria-label="Loading matches">
      {Array.from({ length: 8 }).map((_, index) => (
        <div className={styles.skeletonCard} key={index} />
      ))}
    </div>
  );
}

function Dialog({ title, children, onClose }) {
  return (
    <div className={styles.dialogBackdrop} role="presentation">
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sports-dialog-title"
      >
        <div className={styles.dialogHeader}>
          <h2 id="sports-dialog-title">{title}</h2>
          <button
            type="button"
            className={styles.iconButton}
            onClick={onClose}
            aria-label="Close"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12" />
              <path d="M18 6L6 18" />
            </svg>
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

export default function SportsClient() {
  const [provider, setProvider] = useState("streamed");
  const [viewMode, setViewMode] = useState("live");
  const [sportFilter, setSportFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState("");
  const [sports, setSports] = useState([]);
  const [streamedMatches, setStreamedMatches] = useState([]);
  const [ppvStreams, setPpvStreams] = useState([]);
  const [cdnChannels, setCdnChannels] = useState([]);
  const [cdnSports, setCdnSports] = useState([]);
  const [cdnShowChannels, setCdnShowChannels] = useState(false);
  const [sourceDialog, setSourceDialog] = useState(null);
  const [streamDialog, setStreamDialog] = useState(null);
  const [channelDialog, setChannelDialog] = useState(null);
  const [player, setPlayer] = useState(null);

  const syncPlayerUrl = useCallback((url) => {
    if (typeof window === "undefined") {
      return;
    }

    const pageUrl = new URL(window.location.href);

    if (url) {
      pageUrl.searchParams.set("url", url);
    } else {
      pageUrl.searchParams.delete("url");
    }

    window.history.replaceState(null, "", `${pageUrl.pathname}${pageUrl.search}${pageUrl.hash}`);
  }, []);

  const activeProvider = PROVIDERS.find((item) => item.id === provider);
  const styleVars = {
    "--sports-accent": activeProvider.accent,
    "--sports-tint": activeProvider.tint,
    "--sports-contrast": provider === "ppv" ? "#ffd166" : "#8b5cf6",
    "--left-color": activeProvider.tint,
    "--right-color": provider === "cdnLive" ? "rgba(0, 212, 255, 0.16)" : activeProvider.tint,
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotice("");

    try {
      if (provider === "streamed") {
        const [matchesRes, sportsRes] = await Promise.all([
          fetch(`/api/live-matches/streamed/matches?mode=${viewMode}`),
          fetch("/api/live-matches/streamed/sports"),
        ]);
        const [matchesData, sportsData] = await Promise.all([
          matchesRes.json(),
          sportsRes.json(),
        ]);

        setStreamedMatches(
          Array.isArray(matchesData) ? matchesData.map(normalizeStreamedMatch) : [],
        );
        setSports(Array.isArray(sportsData) ? sportsData.map(normalizeSport) : []);
      }

      if (provider === "ppv") {
        const res = await fetch("/api/live-matches/ppv/streams");
        const data = await res.json();
        setPpvStreams(Array.isArray(data) ? data.map(normalizePpvStream) : []);
      }

      if (provider === "cdnLive") {
        const [channelsRes, sportsRes] = await Promise.all([
          fetch("/api/live-matches/cdn/channels"),
          fetch("/api/live-matches/cdn/sports"),
        ]);
        const [channelsData, sportsData] = await Promise.all([
          channelsRes.json(),
          sportsRes.json(),
        ]);

        setCdnChannels(
          Array.isArray(channelsData) ? channelsData.map(normalizeCdnChannel) : [],
        );
        setCdnSports(
          Array.isArray(sportsData) ? sportsData.map(normalizeCdnSport) : [],
        );
      }
    } catch (err) {
      setError(err?.message || "Could not load live matches.");
    } finally {
      setLoading(false);
    }
  }, [provider, viewMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const sharedUrl = new URLSearchParams(window.location.search).get("url");

    if (sharedUrl) {
      setPlayer({ title: "Shared sports stream", url: sharedUrl });
    }
  }, []);

  const tabs = useMemo(
    () =>
      categoryTabs(provider, sports, streamedMatches, ppvStreams, cdnSports),
    [cdnSports, ppvStreams, provider, sports, streamedMatches],
  );

  const filteredStreamed = useMemo(
    () =>
      sportFilter === "all"
        ? streamedMatches
        : streamedMatches.filter((match) => match.category === sportFilter),
    [sportFilter, streamedMatches],
  );

  const filteredPpv = useMemo(
    () =>
      sportFilter === "all"
        ? ppvStreams
        : ppvStreams.filter((stream) => stream.category === sportFilter),
    [ppvStreams, sportFilter],
  );

  const filteredCdnSports = useMemo(
    () =>
      sportFilter === "all"
        ? cdnSports
        : cdnSports.filter((event) => event.tournament === sportFilter),
    [cdnSports, sportFilter],
  );

  const onlineChannels = useMemo(
    () => cdnChannels.filter((channel) => channel.status === "online"),
    [cdnChannels],
  );

  const visibleCount =
    provider === "streamed"
      ? filteredStreamed.length
      : provider === "ppv"
        ? filteredPpv.length
        : cdnShowChannels
          ? onlineChannels.length
          : filteredCdnSports.length;

  const openPlayer = useCallback((title, url) => {
    if (!url) {
      setNotice("Stream not yet available.");
      return;
    }

    setPlayer({ title, url });
    syncPlayerUrl(url);
    setNotice("");
  }, [syncPlayerUrl]);

  const closePlayer = useCallback(() => {
    setPlayer(null);
    syncPlayerUrl("");
  }, [syncPlayerUrl]);

  const loadStreamsForSource = useCallback(
    async (match, source) => {
      setNotice("Loading streams...");
      setSourceDialog(null);

      try {
        const qs = new URLSearchParams({
          source: source.source,
          id: source.id,
        });
        const res = await fetch(`/api/live-matches/streamed/streams?${qs}`);
        const data = await res.json();
        const streams = Array.isArray(data)
          ? data.map(normalizeStream).filter((stream) => stream.embedUrl)
          : [];

        if (!streams.length) {
          setNotice("No streams available for this source.");
          return;
        }

        if (streams.length === 1) {
          openPlayer(match.title, streams[0].embedUrl);
          return;
        }

        setNotice("");
        setStreamDialog({ match, streams });
      } catch (err) {
        setNotice(err?.message || "Could not load streams.");
      }
    },
    [openPlayer],
  );

  const openMatch = useCallback(
    (match) => {
      if (!match.sources.length) {
        setNotice("No sources available for this match.");
        return;
      }

      if (match.sources.length === 1) {
        loadStreamsForSource(match, match.sources[0]);
        return;
      }

      setSourceDialog({ match, sources: match.sources });
    },
    [loadStreamsForSource],
  );

  const switchProvider = (nextProvider) => {
    setProvider(nextProvider);
    setSportFilter("all");
    setNotice("");
  };

  const switchMode = (nextMode) => {
    setViewMode(nextMode);
    setSportFilter("all");
    setNotice("");
  };

  return (
    <section className={styles.sportsShell} style={styleVars}>
      <div className={styles.controlBand}>
        <div className={styles.providerTabs} aria-label="Provider">
          {PROVIDERS.map((item) => (
            <button
              type="button"
              className={`${styles.providerTab} ${
                provider === item.id ? styles.activeTab : ""
              }`}
              onClick={() => switchProvider(item.id)}
              key={item.id}
            >
              <span>{item.label}</span>
              <small>{item.description}</small>
            </button>
          ))}
        </div>

        <div className={styles.toolbar}>
          {provider === "streamed" && (
            <div className={styles.segmented} aria-label="Match mode">
              {VIEW_MODES.map((mode) => (
                <button
                  type="button"
                  className={viewMode === mode.id ? styles.activePill : ""}
                  onClick={() => switchMode(mode.id)}
                  key={mode.id}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          )}

          {provider === "cdnLive" && (
            <div className={styles.segmented} aria-label="CDN mode">
              <button
                type="button"
                className={!cdnShowChannels ? styles.activePill : ""}
                onClick={() => {
                  setCdnShowChannels(false);
                  setSportFilter("all");
                }}
              >
                Events
              </button>
              <button
                type="button"
                className={cdnShowChannels ? styles.activePill : ""}
                onClick={() => {
                  setCdnShowChannels(true);
                  setSportFilter("all");
                }}
              >
                Channels
              </button>
            </div>
          )}

          <div className={styles.metaStrip}>
            <span>{visibleCount} showing</span>
            <span>{activeProvider.label}</span>
          </div>

          <button
            type="button"
            className={styles.refreshButton}
            onClick={loadData}
          >
            Refresh
          </button>
        </div>

        {!cdnShowChannels && tabs.length > 0 && (
          <div className={`${styles.filterRail} hoverScrollbarX`}>
            <button
              type="button"
              className={sportFilter === "all" ? styles.activeChip : ""}
              onClick={() => setSportFilter("all")}
            >
              All
            </button>
            {tabs.map((tab) => (
              <button
                type="button"
                className={sportFilter === tab.id ? styles.activeChip : ""}
                onClick={() => setSportFilter(tab.id)}
                key={tab.id}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {notice && <p className={styles.notice}>{notice}</p>}
      {error && (
        <div className={styles.stateBox}>
          <span className={styles.stateKicker}>Error</span>
          <h2>Could not load sports</h2>
          <p>{error}</p>
        </div>
      )}

      {!error && loading && <LoadingGrid />}

      {!error && !loading && provider === "streamed" && (
        <>
          {filteredStreamed.length === 0 ? (
            <EmptyState
              title="No Streamed.pk matches"
              detail="Try another mode or refresh provider data."
            />
          ) : (
            <div className={styles.grid}>
              {filteredStreamed.map((match) => {
                const poster = streamedPoster(match);
                const homeBadge = badgeUrl(match.teams.home.badge);
                const awayBadge = badgeUrl(match.teams.away.badge);

                return (
                  <button
                    type="button"
                    className={styles.matchCard}
                    style={
                      poster
                        ? { backgroundImage: `url(${poster})` }
                        : undefined
                    }
                    onClick={() => openMatch(match)}
                    key={`${match.id}-${match.title}`}
                  >
                    <span className={styles.cardTag}>{match.category}</span>
                    <span className={styles.liveBadge}>Live</span>
                    <span className={styles.teamRow}>
                      {homeBadge ? (
                        <span
                          className={styles.logoImage}
                          style={{ backgroundImage: `url(${homeBadge})` }}
                        />
                      ) : (
                        <span className={styles.avatarInitial}>
                          {initials(match.teams.home.name || match.title)}
                        </span>
                      )}
                      <span className={styles.playMark}>Play</span>
                      {awayBadge ? (
                        <span
                          className={styles.logoImage}
                          style={{ backgroundImage: `url(${awayBadge})` }}
                        />
                      ) : (
                        <span className={styles.avatarInitial}>
                          {initials(match.teams.away.name || match.title)}
                        </span>
                      )}
                    </span>
                    <span className={styles.cardTitleBlock}>
                      <strong>{match.title}</strong>
                      <small>{formatMatchTime(match.date)}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {!error && !loading && provider === "ppv" && (
        <>
          {filteredPpv.length === 0 ? (
            <EmptyState
              title="No PPV events"
              detail="Try another category or refresh provider data."
            />
          ) : (
            <div className={styles.grid}>
              {filteredPpv.map((stream) => (
                <button
                  type="button"
                  className={styles.eventCard}
                  style={
                    stream.poster
                      ? { backgroundImage: `url(${stream.poster})` }
                      : undefined
                  }
                  onClick={() => openPlayer(stream.name, stream.iframe)}
                  key={`${stream.id}-${stream.name}`}
                >
                  <span className={styles.cardTag}>{stream.category}</span>
                  <span className={styles.timeBadge}>
                    {ppvTimeLabel(stream) || "Event"}
                  </span>
                  <span className={styles.cardTitleBlock}>
                    <strong>{stream.name}</strong>
                    <small>{stream.tag || stream.category}</small>
                  </span>
                  <span className={styles.cardAction}>
                    {stream.iframe ? "Open stream" : "Not available"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {!error && !loading && provider === "cdnLive" && (
        <>
          {cdnShowChannels ? (
            onlineChannels.length === 0 ? (
              <EmptyState
                title="No online CDN channels"
                detail="Switch back to events or refresh provider data."
              />
            ) : (
              <div className={styles.grid}>
                {onlineChannels.map((channel) => (
                  <button
                    type="button"
                    className={styles.channelCard}
                    onClick={() => openPlayer(channel.name, channel.url)}
                    key={`${channel.code}-${channel.name}`}
                  >
                    {channel.image ? (
                      <span
                        className={styles.mediaThumb}
                        style={{ backgroundImage: `url(${channel.image})` }}
                      />
                    ) : (
                      <span className={styles.avatarInitial}>
                        {initials(channel.name)}
                      </span>
                    )}
                    <span className={styles.liveBadge}>Online</span>
                    <span className={styles.cardTitleBlock}>
                      <strong>{channel.name}</strong>
                      <small>{channel.viewers} viewers</small>
                    </span>
                  </button>
                ))}
              </div>
            )
          ) : filteredCdnSports.length === 0 ? (
            <EmptyState
              title="No CDN sports events"
              detail="Try another tournament or refresh provider data."
            />
          ) : (
            <div className={styles.grid}>
              {filteredCdnSports.map((event) => (
                <button
                  type="button"
                  className={styles.cdnEventCard}
                  onClick={() => {
                    if (!event.channels.length) {
                      setNotice("No channels available for this event.");
                      return;
                    }
                    if (event.channels.length === 1) {
                      openPlayer(
                        `${event.homeTeam} vs ${event.awayTeam}`,
                        event.channels[0].url,
                      );
                      return;
                    }
                    setChannelDialog({ event, channels: event.channels });
                  }}
                  key={`${event.gameID}-${event.homeTeam}-${event.awayTeam}`}
                >
                  <span className={styles.cardTag}>{event.tournament}</span>
                  <span className={styles.versusRow}>
                    {event.homeTeamIMG ? (
                      <span
                        className={styles.logoImage}
                        style={{ backgroundImage: `url(${event.homeTeamIMG})` }}
                      />
                    ) : (
                      <span className={styles.avatarInitial}>
                        {initials(event.homeTeam)}
                      </span>
                    )}
                    <span className={styles.versusLabel}>VS</span>
                    {event.awayTeamIMG ? (
                      <span
                        className={styles.logoImage}
                        style={{ backgroundImage: `url(${event.awayTeamIMG})` }}
                      />
                    ) : (
                      <span className={styles.avatarInitial}>
                        {initials(event.awayTeam)}
                      </span>
                    )}
                  </span>
                  <span className={styles.cardTitleBlock}>
                    <strong>
                      {event.homeTeam || "Home"} vs {event.awayTeam || "Away"}
                    </strong>
                    <small>{event.time || event.status || "Time TBA"}</small>
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {sourceDialog && (
        <Dialog
          title={`Choose source for ${sourceDialog.match.title}`}
          onClose={() => setSourceDialog(null)}
        >
          <div className={styles.dialogList}>
            {sourceDialog.sources.map((source) => (
              <button
                type="button"
                onClick={() => loadStreamsForSource(sourceDialog.match, source)}
                key={`${source.source}-${source.id}`}
              >
                <span>{source.source}</span>
                <small>{source.id}</small>
              </button>
            ))}
          </div>
        </Dialog>
      )}

      {streamDialog && (
        <Dialog
          title={`Choose stream for ${streamDialog.match.title}`}
          onClose={() => setStreamDialog(null)}
        >
          <div className={styles.dialogList}>
            {streamDialog.streams.map((stream) => (
              <button
                type="button"
                onClick={() => {
                  setStreamDialog(null);
                  openPlayer(streamDialog.match.title, stream.embedUrl);
                }}
                key={`${stream.source}-${stream.id}-${stream.streamNo}`}
              >
                <span>Stream {stream.streamNo}</span>
                <small>
                  {stream.language} {stream.hd ? "HD" : "SD"}
                </small>
              </button>
            ))}
          </div>
        </Dialog>
      )}

      {channelDialog && (
        <Dialog
          title={`${channelDialog.event.homeTeam} vs ${channelDialog.event.awayTeam}`}
          onClose={() => setChannelDialog(null)}
        >
          <div className={styles.dialogList}>
            {channelDialog.channels.map((channel) => (
              <button
                type="button"
                onClick={() => {
                  setChannelDialog(null);
                  openPlayer(channel.name, channel.url);
                }}
                key={`${channel.code}-${channel.name}`}
              >
                <span>{channel.name}</span>
                <small>{channel.status || "channel"}</small>
              </button>
            ))}
          </div>
        </Dialog>
      )}

      {player && (
        <Dialog title={player.title} onClose={closePlayer}>
          <div className={styles.playerFrame}>
            <iframe
              src={player.url}
              title={player.title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          </div>
        </Dialog>
      )}
    </section>
  );
}
