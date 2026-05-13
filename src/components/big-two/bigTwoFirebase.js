import { db } from "@/db/dbConnection";
import {
  LAST_TWO_BOT_ATTACK_MS,
  ROOM_COLLECTION,
  applyLastTwoCall,
  applyMissedLastTwoCallout,
  applyPass,
  applyPlay,
  chooseBotMove,
  getNextHumanSeat,
  getPlayer,
  getSeatPlayer,
  makePlayer,
  normalizeName,
  roomHasPlayerName,
  startGameState,
  withRoomExpiry,
} from "./bigTwoRules";
import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  setDoc,
} from "firebase/firestore";

export function getRoomRef(roomId) {
  return doc(db, ROOM_COLLECTION, roomId);
}

export function listenToBigTwoRoom(roomId, callback, onError) {
  return onSnapshot(getRoomRef(roomId), callback, onError);
}

export async function createBigTwoRoom(
  roomId,
  playerId,
  playerName,
  targetHumans,
  maxPoint = 50
) {
  const roomRef = getRoomRef(roomId);
  const normalizedName = normalizeName(playerName);
  const room = {
    roomId,
    targetHumans,
    maxPoint,
    status: "waiting",
    players: [makePlayer(playerId, normalizedName, 0)],
    botDriverId: playerId,
    turnSeat: null,
    hands: {},
    lastPlay: null,
    passes: [],
    history: [],
    winner: null,
    points: {},
    roundScores: [],
    finalRanks: [],
    lastTwoCallout: null,
    mustPlayThreeClubs: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
  };

  await setDoc(roomRef, targetHumans === 1 ? startGameState(room) : room);
}

export async function joinBigTwoRoom(roomId, playerId, playerName) {
  const roomRef = getRoomRef(roomId);
  const normalizedName = normalizeName(playerName);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(roomRef);
    if (!snapshot.exists()) throw new Error("Room not found.");

    const room = snapshot.data();
    if (room.status !== "waiting") throw new Error("Game already started.");
    if (getPlayer(room, playerId)) return;
    if (roomHasPlayerName(room, normalizedName)) {
      throw new Error("Name already taken in this room.");
    }

    const nextSeat = getNextHumanSeat(room);
    if (nextSeat === null) throw new Error("Room is full.");

    const nextRoom = withRoomExpiry({
      ...room,
      players: [...(room.players || []), makePlayer(playerId, normalizedName, nextSeat)],
    });
    const humanCount = nextRoom.players.filter((player) => !player.isBot).length;

    transaction.set(
      roomRef,
      humanCount >= room.targetHumans ? startGameState(nextRoom) : nextRoom
    );
  });
}

export async function playCards(roomId, playerId, cards) {
  const roomRef = getRoomRef(roomId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(roomRef);
    if (!snapshot.exists()) throw new Error("Room not found.");
    transaction.set(roomRef, applyPlay(snapshot.data(), playerId, cards));
  });
}

export async function passTurn(roomId, playerId) {
  const roomRef = getRoomRef(roomId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(roomRef);
    if (!snapshot.exists()) throw new Error("Room not found.");
    transaction.set(roomRef, applyPass(snapshot.data(), playerId));
  });
}

export async function autoPassTurn(roomId, expectedUpdatedAt) {
  const roomRef = getRoomRef(roomId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(roomRef);
    if (!snapshot.exists()) throw new Error("Room not found.");
    const room = snapshot.data();
    if (room.status !== "playing" || room.updatedAt !== expectedUpdatedAt) return;
    if (room.lastTwoCallout || !room.lastPlay) return;

    const player = getSeatPlayer(room, room.turnSeat);
    if (!player || player.isBot) return;

    transaction.set(roomRef, applyPass(room, player.id));
  });
}

export async function callLastTwo(roomId, playerId) {
  const roomRef = getRoomRef(roomId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(roomRef);
    if (!snapshot.exists()) throw new Error("Room not found.");
    transaction.set(roomRef, applyLastTwoCall(snapshot.data(), playerId));
  });
}

export async function runBotLastCardsCall(roomId, expectedUpdatedAt) {
  const roomRef = getRoomRef(roomId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(roomRef);
    if (!snapshot.exists()) throw new Error("Room not found.");
    const room = snapshot.data();
    if (room.updatedAt !== expectedUpdatedAt || !room.lastTwoCallout) return;

    const bot = getSeatPlayer(room, room.lastTwoCallout.seat);
    if (!bot?.isBot) return;

    transaction.set(roomRef, applyLastTwoCall(room, bot.id));
  });
}

export async function callOutMissedLastTwo(roomId, playerId) {
  const roomRef = getRoomRef(roomId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(roomRef);
    if (!snapshot.exists()) throw new Error("Room not found.");
    transaction.set(roomRef, applyMissedLastTwoCallout(snapshot.data(), playerId));
  });
}

export async function runRandomBotLastCardsAttack(roomId, expectedUpdatedAt) {
  const roomRef = getRoomRef(roomId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(roomRef);
    if (!snapshot.exists()) throw new Error("Room not found.");
    const room = snapshot.data();
    if (room.updatedAt !== expectedUpdatedAt || !room.lastTwoCallout) return;
    const attackAt = room.lastTwoCallout.openedAt + LAST_TWO_BOT_ATTACK_MS;
    if (Date.now() < attackAt) return;

    const owner = getSeatPlayer(room, room.lastTwoCallout.seat);
    if (owner?.isBot) return;

    const attackers = (room.players || []).filter(
      (player) => player.isBot && player.seat !== room.lastTwoCallout.seat
    );
    if (!attackers.length) return;

    const attacker = attackers[Math.floor(Math.random() * attackers.length)];
    transaction.set(roomRef, applyMissedLastTwoCallout(room, attacker.id));
  });
}

export async function expireLastTwoCallout(roomId, expectedUpdatedAt) {
  const roomRef = getRoomRef(roomId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(roomRef);
    if (!snapshot.exists()) throw new Error("Room not found.");
    const room = snapshot.data();
    if (room.updatedAt !== expectedUpdatedAt) return;
    if (!room.lastTwoCallout || Date.now() < room.lastTwoCallout.expiresAt) return;

    transaction.set(roomRef, applyMissedLastTwoCallout(room, null, true));
  });
}

export async function restartRoom(roomId, playerId) {
  const roomRef = getRoomRef(roomId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(roomRef);
    if (!snapshot.exists()) throw new Error("Room not found.");
    const room = snapshot.data();
    if (room.botDriverId !== playerId) throw new Error("Only room creator can restart.");

    const humans = (room.players || []).filter((player) => !player.isBot);
    const resetMatch = room.status === "ended";
    transaction.set(
      roomRef,
      startGameState({
        ...room,
        players: humans,
        status: "waiting",
        points: resetMatch ? {} : room.points || {},
        roundScores: [],
        finalRanks: resetMatch ? [] : room.finalRanks || [],
        winner: null,
      })
    );
  });
}

export async function runBotTurn(roomId, expectedUpdatedAt) {
  const roomRef = getRoomRef(roomId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(roomRef);
    if (!snapshot.exists()) throw new Error("Room not found.");
    const room = snapshot.data();
    if (room.status !== "playing" || room.updatedAt !== expectedUpdatedAt) return;

    const bot = getSeatPlayer(room, room.turnSeat);
    if (!bot?.isBot) return;

    const move = chooseBotMove(room, bot);
    if (move.action === "wait") return;

    const nextRoom =
      move.action === "pass"
        ? applyPass(room, bot.id)
        : applyPlay(room, bot.id, move.cards);

    transaction.set(roomRef, nextRoom);
  });
}

export async function roomExists(roomId) {
  const snapshot = await getDoc(getRoomRef(roomId));
  return snapshot.exists();
}
