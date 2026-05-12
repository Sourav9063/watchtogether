"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import styles from "../page.module.css";
import {
  CARD_BACK,
  cardsByValue,
  evaluateHand,
  getCardLabel,
  getPlayer,
  getSeatPlayer,
  normalizeName,
} from "@/components/big-two/bigTwoRules";
import {
  joinBigTwoRoom,
  listenToBigTwoRoom,
  passTurn,
  playCards,
  restartRoom,
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
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const botTimerRef = useRef(null);

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
    if (!room || room.status !== "playing") return undefined;

    const turnPlayer = getSeatPlayer(room, room.turnSeat);
    if (!turnPlayer?.isBot) return undefined;

    window.clearTimeout(botTimerRef.current);
    botTimerRef.current = window.setTimeout(() => {
      runBotTurn(room.roomId, room.updatedAt).catch(() => {});
    }, 700);

    return () => window.clearTimeout(botTimerRef.current);
  }, [room]);

  const currentHand = currentPlayer ? room?.hands?.[currentPlayer.seat] || [] : [];
  const selectedHand = evaluateHand(selectedCards);
  const isMyTurn =
    room?.status === "playing" && currentPlayer && room.turnSeat === currentPlayer.seat;
  const canPass = Boolean(isMyTurn && room?.lastPlay);

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
    try {
      await playCards(roomId, playerId, selectedCards);
    } catch (err) {
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

  const submitRestart = async () => {
    setError("");
    try {
      await restartRoom(roomId, playerId);
    } catch (err) {
      setError(err.message || "Could not start new game.");
    }
  };

  const toggleCard = (card) => {
    if (!isMyTurn) return;
    setSelectedCards((cards) =>
      cards.includes(card)
        ? cards.filter((selected) => selected !== card)
        : [...cards, card].sort((a, b) => a - b)
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
            />
          ))}

          <div className={styles.centerPile}>
            <div className={styles.pileCards}>
              {room.lastPlay?.cards?.length ? (
                room.lastPlay.cards.map((card) => (
                  <CardImage card={card} key={card} compact />
                ))
              ) : (
                <div className={styles.emptyPile}>Lead trick</div>
              )}
            </div>
            <div className={styles.pileText}>
              {room.lastPlay
                ? `${room.lastPlay.name}: ${room.lastPlay.hand?.label || "played"}`
                : room.mustPlayThreeClubs
                  ? "3 of clubs starts"
                  : "Table clear"}
            </div>
          </div>
        </div>
      </section>

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

      {currentPlayer ? (
        <section className={styles.handDock}>
          <div className={styles.turnLine}>
            <span>
              {isMyTurn
                ? "Your turn"
                : `${getSeatPlayer(room, room.turnSeat)?.name || "Waiting"} turn`}
            </span>
            <span>{currentHand.length} cards</span>
          </div>

          <div className={styles.handRail}>
            {currentHand.map((card) => (
              <button
                className={`${styles.cardButton} ${
                  selectedCards.includes(card) ? styles.cardSelected : ""
                }`}
                disabled={!isMyTurn}
                key={card}
                onClick={() => toggleCard(card)}
                type="button"
                title={getCardLabel(card)}
              >
                <CardImage card={card} />
              </button>
            ))}
          </div>

          <div className={styles.actionRow}>
            <div className={styles.selectionText}>
              {selectedHand ? selectedHand.label : selectedCards.length ? "Invalid hand" : "Select cards"}
            </div>
            <button
              className={styles.primaryButton}
              disabled={!isMyTurn || !selectedHand}
              onClick={submitPlay}
              type="button"
            >
              Play
            </button>
            <button
              className={styles.secondaryButton}
              disabled={!canPass}
              onClick={submitPass}
              type="button"
            >
              Pass
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

function PlayerSeat({ player, position, room }) {
  const isTurn = player && room.turnSeat === player.seat && room.status === "playing";
  const count = player ? room.hands?.[player.seat]?.length || 0 : 0;

  return (
    <div
      className={`${styles.seat} ${styles[POSITION_CLASS[position]]} ${
        isTurn ? styles.seatTurn : ""
      }`}
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
