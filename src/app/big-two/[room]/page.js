"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import styles from "../page.module.css";
import {
  CARD_BACK,
  cardsByValue,
  canPlayCards,
  evaluateHand,
  getCardLabel,
  getLastCardsLabel,
  getPlayer,
  getPlayBlockReason,
  getSeatPlayer,
  hasValidPlay,
  normalizeName,
} from "@/components/big-two/bigTwoRules";
import {
  callLastTwo,
  callOutMissedLastTwo,
  expireLastTwoCallout,
  joinBigTwoRoom,
  listenToBigTwoRoom,
  passTurn,
  playCards,
  restartRoom,
  runBotLastCardsCall,
  runBotTurn,
} from "@/components/big-two/bigTwoFirebase";
import { getCustomLink } from "@/helper/customFunc";

const POSITION_CLASS = {
  bottom: "seatBottom",
  right: "seatRight",
  top: "seatTop",
  left: "seatLeft",
};

export default function BigTwoRoom() {
  const params = useParams();
  const roomId = params.room;
  const [room, setRoom] = useState(null);
  const [roomMissing, setRoomMissing] = useState(false);
  const [playerId, setPlayerId] = useState("");
  const [name, setName] = useState("");
  const [selectedCards, setSelectedCards] = useState([]);
  const [showPlayedPile, setShowPlayedPile] = useState(false);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [hiddenNoticeAt, setHiddenNoticeAt] = useState(null);
  const [playAnimation, setPlayAnimation] = useState(null);
  const botTimerRef = useRef(null);
  const botLastCardsTimerRef = useRef(null);
  const animationReadyRef = useRef(false);
  const seenLastPlayAtRef = useRef(null);
  const pendingPlayOriginRef = useRef(null);
  const seatRefs = useRef({});
  const cardButtonRefs = useRef({});
  const centerPileRef = useRef(null);
  const handDockRef = useRef(null);

  useEffect(() => {
    const id = getCustomLink();
    setPlayerId(id);
    setName(localStorage.getItem("bigTwoPlayerName") || "");
  }, []);

  useEffect(() => {
    if (!roomId) return undefined;

    return listenToBigTwoRoom(
      roomId,
      (snapshot) => {
        if (!snapshot.exists()) {
          setRoomMissing(true);
          setRoom(null);
          return;
        }
        setRoomMissing(false);
        setRoom(snapshot.data());
      },
      (err) => setError(err.message || "Room sync failed.")
    );
  }, [roomId]);

  const currentPlayer = useMemo(() => {
    if (!room || !playerId) return null;
    return getPlayer(room, playerId);
  }, [room, playerId]);

  useEffect(() => {
    setSelectedCards([]);
  }, [room?.updatedAt, room?.turnSeat]);

  useEffect(() => {
    if (!room || room.status !== "playing" || room.lastTwoCallout) return undefined;

    const turnPlayer = getSeatPlayer(room, room.turnSeat);
    if (!turnPlayer?.isBot) return undefined;

    window.clearTimeout(botTimerRef.current);
    botTimerRef.current = window.setTimeout(() => {
      runBotTurn(room.roomId, room.updatedAt).catch(() => {});
    }, 5000);

    return () => window.clearTimeout(botTimerRef.current);
  }, [room]);

  useEffect(() => {
    if (!room?.lastTwoCallout) return undefined;

    setNow(Date.now());
    const tick = window.setInterval(() => setNow(Date.now()), 250);
    const delay = Math.max(0, room.lastTwoCallout.expiresAt - Date.now());
    const expiry = window.setTimeout(() => {
      expireLastTwoCallout(room.roomId, room.updatedAt).catch(() => {});
    }, delay);

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(expiry);
    };
  }, [room?.lastTwoCallout, room?.roomId, room?.updatedAt]);

  useEffect(() => {
    window.clearTimeout(botLastCardsTimerRef.current);
    if (!room?.lastTwoCallout || room.botDriverId !== playerId) return undefined;

    const owner = getSeatPlayer(room, room.lastTwoCallout.seat);
    if (!owner?.isBot) return undefined;

    const remainingMs = Math.max(0, room.lastTwoCallout.expiresAt - Date.now() - 50);
    const delay = Math.min(Math.random() * 5000, remainingMs);
    botLastCardsTimerRef.current = window.setTimeout(() => {
      runBotLastCardsCall(room.roomId, room.updatedAt).catch(() => {});
    }, delay);

    return () => window.clearTimeout(botLastCardsTimerRef.current);
  }, [room?.lastTwoCallout, room?.roomId, room?.updatedAt, room?.botDriverId, playerId, room]);

  const currentHand = currentPlayer ? room?.hands?.[currentPlayer.seat] || [] : [];
  const selectedHand = evaluateHand(selectedCards);
  const selectedPlayReason = room && selectedCards.length
    ? getPlayBlockReason(room, selectedCards)
    : "";
  const selectedCanPlay = Boolean(
    room && selectedCards.length && selectedHand && canPlayCards(room, selectedCards)
  );
  const isMyTurn =
    room?.status === "playing" && currentPlayer && room.turnSeat === currentPlayer.seat;
  const hasPlayableCards = Boolean(isMyTurn && hasValidPlay(room, currentHand));
  const requiredSelectionSize = room?.lastPlay?.cards?.length || null;
  const playedHistory = (room?.history || []).filter((entry) => entry.type === "play");
  const lastTwoCallout = room?.lastTwoCallout || null;
  const canPass = Boolean(isMyTurn && room?.lastPlay && !lastTwoCallout);
  const lastCallNotification = getLastCallNotification(room?.history || []);
  const showCallNotification = Boolean(
    lastCallNotification.message && lastCallNotification.at !== hiddenNoticeAt
  );
  const isLastTwoOwner = Boolean(lastTwoCallout?.playerId === playerId);
  const canCallLastTwo = Boolean(
    lastTwoCallout &&
      isLastTwoOwner &&
      now <= lastTwoCallout.expiresAt
  );
  const lastCardsLabel = getLastCardsLabel(lastTwoCallout);
  const playHint = selectedPlayReason
    ? selectedPlayReason
    : !hasPlayableCards && canPass
      ? "No valid cards. Pass."
      : selectedHand
        ? selectedHand.label
        : selectedCards.length
          ? "Invalid hand"
          : requiredSelectionSize
            ? `Select ${requiredSelectionSize}`
            : "Select cards";

  useEffect(() => {
    if (!lastCallNotification.at) return undefined;
    setHiddenNoticeAt(null);
    const timer = window.setTimeout(() => {
      setHiddenNoticeAt(lastCallNotification.at);
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [lastCallNotification.at]);

  useEffect(() => {
    if (!room) return undefined;
    const lastPlay = room?.lastPlay;
    if (!lastPlay?.playedAt) {
      animationReadyRef.current = true;
      return undefined;
    }

    if (!animationReadyRef.current) {
      animationReadyRef.current = true;
      seenLastPlayAtRef.current = lastPlay.playedAt;
      return undefined;
    }
    if (seenLastPlayAtRef.current === lastPlay.playedAt) return undefined;

    seenLastPlayAtRef.current = lastPlay.playedAt;

    const target = getElementCenter(centerPileRef.current);
    const ownPlay = currentPlayer && lastPlay.seat === currentPlayer.seat;
    const pendingOrigin = pendingPlayOriginRef.current;
    const from = ownPlay && pendingOrigin ? pendingOrigin : getPlayOrigin({
      currentPlayer,
      handDock: handDockRef.current,
      lastPlay,
      seatRefs: seatRefs.current,
    });

    pendingPlayOriginRef.current = null;
    if (!target || !from) return undefined;

    const animationId = `${lastPlay.playedAt}-${lastPlay.seat}`;
    setPlayAnimation({
      id: animationId,
      cards: lastPlay.cards || [],
      from,
      to: target,
    });

    const timer = window.setTimeout(() => {
      setPlayAnimation((animation) =>
        animation?.id === animationId ? null : animation
      );
    }, 760);

    return () => window.clearTimeout(timer);
  }, [room, currentPlayer]);

  const joinRoom = async (event) => {
    event.preventDefault();
    const playerName = normalizeName(name);

    if (!playerName) {
      setError("Name required.");
      return;
    }
    if (!playerId) return;

    setJoining(true);
    setError("");

    try {
      await joinBigTwoRoom(roomId, playerId, playerName);
      localStorage.setItem("bigTwoPlayerName", playerName);
    } catch (err) {
      setError(err.message || "Could not join room.");
    } finally {
      setJoining(false);
    }
  };

  const submitPlay = async () => {
    setError("");
    pendingPlayOriginRef.current =
      getCardsOrigin(selectedCards, cardButtonRefs.current) ||
      getElementCenter(handDockRef.current);
    try {
      await playCards(roomId, playerId, selectedCards);
    } catch (err) {
      pendingPlayOriginRef.current = null;
      setError(err.message || "Could not play cards.");
    }
  };

  const submitPass = async () => {
    setError("");
    try {
      await passTurn(roomId, playerId);
    } catch (err) {
      setError(err.message || "Could not pass.");
    }
  };

  const submitLastTwo = async () => {
    setError("");
    try {
      await callLastTwo(roomId, playerId);
    } catch (err) {
      setError(err.message || `Could not call ${lastCardsLabel}.`);
    }
  };

  const submitCallOut = async () => {
    setError("");
    try {
      await callOutMissedLastTwo(roomId, playerId);
    } catch (err) {
      setError(err.message || `Could not call out ${lastCardsLabel}.`);
    }
  };

  const submitRestart = async () => {
    setError("");
    try {
      await restartRoom(roomId, playerId);
    } catch (err) {
      setError(err.message || "Could not start new game.");
    }
  };

  const toggleCard = (card) => {
    if (!isMyTurn || !hasPlayableCards) return;
    setSelectedCards((cards) =>
      cards.includes(card)
        ? cards.filter((selected) => selected !== card)
        : getNextSelection(cards, card, requiredSelectionSize)
    );
  };

  if (roomMissing) {
    return (
      <main className={styles.lobbyPage}>
        <section className={styles.lobbyPanel}>
          <h1 className={styles.title}>Room missing</h1>
          <Link className={styles.linkButton} href="/big-two">
            Create room
          </Link>
        </section>
      </main>
    );
  }

  if (!room) {
    return (
      <main className={styles.tablePage}>
        <div className={styles.loading}>Loading table...</div>
      </main>
    );
  }

  if (!currentPlayer && room.status === "waiting") {
    const joinedHumans = room.players?.filter((player) => !player.isBot).length || 0;
    const roomFull = joinedHumans >= room.targetHumans;

    return (
      <main className={styles.lobbyPage}>
        <section className={styles.lobbyPanel}>
          <p className={styles.eyebrow}>Room {roomId}</p>
          <h1 className={styles.title}>Join table</h1>
          <p className={styles.copy}>
            {joinedHumans}/{room.targetHumans} human seats filled.
          </p>

          <form className={styles.form} onSubmit={joinRoom}>
            <label className={styles.field}>
              <span>Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={18}
                placeholder="Player name"
              />
            </label>

            {error && <p className={styles.error}>{error}</p>}

            <button
              className={styles.primaryButton}
              disabled={joining || roomFull}
              type="submit"
            >
              {roomFull ? "Room full" : joining ? "Joining..." : "Join room"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.tablePage}>
      <header className={styles.tableHeader}>
        <div>
          <p className={styles.eyebrow}>Room {roomId}</p>
          <h1 className={styles.tableTitle}>Big Two</h1>
        </div>
        <Link className={styles.smallLink} href="/big-two">
          New room
        </Link>
      </header>

      {room.status === "waiting" && (
        <div className={styles.waitingBar}>
          Waiting for {room.targetHumans - room.players.length} player
          {room.targetHumans - room.players.length === 1 ? "" : "s"}.
        </div>
      )}

      <section className={styles.tableShell}>
        <div className={styles.feltTable}>
          {getVisualSeats(room, currentPlayer).map(({ player, position }) => (
            <PlayerSeat
              key={position}
              player={player}
              position={position}
              room={room}
              seatRefs={seatRefs}
            />
          ))}

          <div className={styles.centerPile} ref={centerPileRef}>
            <div className={styles.pileCards}>
              {room.lastPlay?.cards?.length ? (
                room.lastPlay.cards.map((card) => (
                  <CardImage card={card} key={card} compact />
                ))
              ) : (
                <div className={styles.emptyPile}>
                  {getLeadText(room, currentPlayer)}
                </div>
              )}
            </div>
            <div className={styles.pileText}>
              {room.lastPlay
                ? `${room.lastPlay.name}: ${room.lastPlay.hand?.label || "played"}`
                : "Table clear"}
            </div>
          </div>

          <button
            className={styles.playedPileButton}
            onClick={() => setShowPlayedPile(true)}
            type="button"
          >
            <span>Played pile</span>
            <strong>{playedHistory.length}</strong>
          </button>
        </div>
      </section>

      {showPlayedPile && (
        <PlayedPile
          history={playedHistory}
          onClose={() => setShowPlayedPile(false)}
        />
      )}

      {room.winner && (
        <section className={styles.resultBar}>
          <span>{room.winner.name} won.</span>
          {room.botDriverId === playerId && (
            <button className={styles.secondaryButton} onClick={submitRestart} type="button">
              New game
            </button>
          )}
        </section>
      )}

      {showCallNotification && room.status === "playing" && (
        <section className={styles.callNotice}>
          {lastCallNotification.message}
        </section>
      )}

      {playAnimation && <PlayedCardAnimation animation={playAnimation} />}

      {currentPlayer ? (
        <section className={styles.handDock} ref={handDockRef}>
          <div className={styles.turnLine}>
            <span>
              {isMyTurn
                ? "Your turn"
                : `${getSeatPlayer(room, room.turnSeat)?.name || "Waiting"} turn`}
            </span>
            <span>{currentHand.length} cards</span>
          </div>

          <div className={styles.selectionText}>{playHint}</div>

          <div className={styles.handRail}>
            {currentHand.map((card) => (
              <button
                className={`${styles.cardButton} ${
                  selectedCards.includes(card) ? styles.cardSelected : ""
                } ${!hasPlayableCards ? styles.cardUnavailable : ""} ${
                  isSelectionLimitReached(selectedCards, card, requiredSelectionSize)
                    ? styles.cardUnavailable
                    : ""
                }`}
                disabled={
                  !isMyTurn ||
                  !hasPlayableCards ||
                  isSelectionLimitReached(selectedCards, card, requiredSelectionSize)
                }
                key={card}
                onClick={() => toggleCard(card)}
                ref={(element) => {
                  if (element) {
                    cardButtonRefs.current[card] = element;
                  } else {
                    delete cardButtonRefs.current[card];
                  }
                }}
                type="button"
                title={getCardLabel(card)}
              >
                <CardImage card={card} />
              </button>
            ))}
          </div>

          <div className={styles.actionRow}>
            <button
              className={styles.primaryButton}
              disabled={!isMyTurn || !selectedCanPlay || !hasPlayableCards}
              onClick={submitPlay}
              type="button"
            >
              Play
            </button>
            <button
              className={canCallLastTwo ? styles.dangerButton : styles.secondaryButton}
              disabled={canCallLastTwo ? false : !canPass}
              onClick={canCallLastTwo ? submitLastTwo : submitPass}
              type="button"
            >
              {canCallLastTwo ? lastCardsLabel : "Pass"}
            </button>
            <button
              className={styles.callButton}
              onClick={submitCallOut}
              type="button"
            >
              Call {lastTwoCallout ? lastCardsLabel : "Last Two/One"}
            </button>
          </div>

          {error && <p className={styles.error}>{error}</p>}
        </section>
      ) : (
        <section className={styles.handDock}>
          <p className={styles.copy}>Game already started.</p>
        </section>
      )}
    </main>
  );
}

function PlayerSeat({ player, position, room, seatRefs }) {
  const isTurn = player && room.turnSeat === player.seat && room.status === "playing";
  const count = player ? room.hands?.[player.seat]?.length || 0 : 0;

  return (
    <div
      className={`${styles.seat} ${styles[POSITION_CLASS[position]]} ${
        isTurn ? styles.seatTurn : ""
      }`}
      ref={(element) => {
        if (!player) return;
        if (element) {
          seatRefs.current[player.seat] = element;
        } else {
          delete seatRefs.current[player.seat];
        }
      }}
    >
      <div className={styles.seatName}>{player?.name || "Open seat"}</div>
      <div className={styles.seatCards}>
        {player ? (
          <>
            <Image src={CARD_BACK} alt="" width={42} height={61} />
            <span>{count}</span>
          </>
        ) : (
          <span>0</span>
        )}
      </div>
    </div>
  );
}

function PlayedCardAnimation({ animation }) {
  const dx = animation.from.x - animation.to.x;
  const dy = animation.from.y - animation.to.y;

  return (
    <div
      className={styles.playAnimation}
      style={{
        "--play-from-x": `${dx}px`,
        "--play-from-y": `${dy}px`,
        left: `${animation.to.x}px`,
        top: `${animation.to.y}px`,
      }}
    >
      {animation.cards.map((card) => (
        <CardImage card={card} key={card} compact />
      ))}
    </div>
  );
}

function CardImage({ card, compact = false }) {
  const cardData = cardsByValue[card];
  return (
    <Image
      className={compact ? styles.compactCardImage : styles.cardImage}
      src={cardData.image}
      alt={cardData.name}
      width={compact ? 64 : 92}
      height={compact ? 93 : 134}
    />
  );
}

function PlayedPile({ history, onClose }) {
  const latestFirst = [...history].reverse();

  return (
    <div className={styles.pileOverlay} role="dialog" aria-modal="true">
      <section className={styles.pilePanel}>
        <header className={styles.pilePanelHeader}>
          <div>
            <p className={styles.eyebrow}>Latest first</p>
            <h2>Played cards</h2>
          </div>
          <button className={styles.secondaryButton} onClick={onClose} type="button">
            Close
          </button>
        </header>

        <div className={styles.playedList}>
          {latestFirst.length ? (
            latestFirst.map((entry, index) => (
              <article className={styles.playedItem} key={`${entry.at}-${index}`}>
                {index < 4 && (
                  <div className={styles.playedMeta}>
                    <strong>{entry.name}</strong>
                    <span>{entry.label}</span>
                  </div>
                )}
                <div className={styles.playedCards}>
                  {entry.cards.map((card) => (
                    <CardImage card={card} compact key={card} />
                  ))}
                </div>
              </article>
            ))
          ) : (
            <p className={styles.copy}>No cards played yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function getLastCallNotification(history) {
  const latest = [...history]
    .reverse()
    .find((entry) =>
      ["lastCardsCall", "callout", "pass"].includes(entry.type)
    );

  if (!latest) return { message: "", at: null };
  if (latest.type === "pass") {
    return {
      message: `${latest.name} passed.`,
      at: latest.at,
    };
  }
  if (latest.type === "lastCardsCall") {
    return {
      message: `${latest.name} called his ${latest.label}.`,
      at: latest.at,
    };
  }
  if (latest.name === "Timer") return { message: "", at: latest.at };
  return {
    message: `${latest.name} caught ${latest.targetName}'s ${latest.label}.`,
    at: latest.at,
  };
}

function getVisualSeats(room, currentPlayer) {
  const baseSeat = currentPlayer?.seat ?? 0;
  const seats = [
    { seat: baseSeat, position: "bottom" },
    { seat: (baseSeat + 1) % 4, position: "right" },
    { seat: (baseSeat + 2) % 4, position: "top" },
    { seat: (baseSeat + 3) % 4, position: "left" },
  ];

  return seats.map(({ seat, position }) => ({
    position,
    player: getSeatPlayer(room, seat),
  }));
}

function getLeadText(room, currentPlayer) {
  if (room.status !== "playing") return "Lead trick";
  if (currentPlayer && room.turnSeat === currentPlayer.seat) return "Lead is Yours";
  const leader = getSeatPlayer(room, room.turnSeat);
  return `Leader is ${leader?.name || "Waiting"}`;
}

function getElementCenter(element) {
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function getCardsOrigin(cards, cardElements) {
  const centers = cards
    .map((card) => getElementCenter(cardElements[card]))
    .filter(Boolean);

  if (!centers.length) return null;

  return {
    x: centers.reduce((sum, center) => sum + center.x, 0) / centers.length,
    y: centers.reduce((sum, center) => sum + center.y, 0) / centers.length,
  };
}

function getPlayOrigin({ currentPlayer, handDock, lastPlay, seatRefs }) {
  if (currentPlayer && lastPlay.seat === currentPlayer.seat) {
    return getElementCenter(handDock);
  }
  return getElementCenter(seatRefs[lastPlay.seat]);
}

function getNextSelection(cards, card, requiredSelectionSize) {
  if (requiredSelectionSize === 1) return [card];
  if (requiredSelectionSize && cards.length >= requiredSelectionSize) {
    return cards;
  }
  return [...cards, card].sort((a, b) => a - b);
}

function isSelectionLimitReached(cards, card, requiredSelectionSize) {
  return Boolean(
    requiredSelectionSize &&
      !cards.includes(card) &&
      cards.length >= requiredSelectionSize
  );
}
