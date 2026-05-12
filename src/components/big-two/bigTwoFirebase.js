import { db } from "@/db/dbConnection";
import {
  ROOM_COLLECTION,
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

export async function createBigTwoRoom(roomId, playerId, playerName, targetHumans) {
  const roomRef = getRoomRef(roomId);
  const normalizedName = normalizeName(playerName);
  const room = {
    roomId,
    targetHumans,
    status: "waiting",
    players: [makePlayer(playerId, normalizedName, 0)],
    botDriverId: playerId,
    turnSeat: null,
    hands: {},
    lastPlay: null,
    passes: [],
    history: [],
    winner: null,
    mustPlayThreeClubs: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
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

    const nextRoom = {
      ...room,
      players: [...(room.players || []), makePlayer(playerId, normalizedName, nextSeat)],
      updatedAt: Date.now(),
    };
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

export async function restartRoom(roomId, playerId) {
  const roomRef = getRoomRef(roomId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(roomRef);
    if (!snapshot.exists()) throw new Error("Room not found.");
    const room = snapshot.data();
    if (room.botDriverId !== playerId) throw new Error("Only room creator can restart.");

    const humans = (room.players || []).filter((player) => !player.isBot);
    transaction.set(
      roomRef,
      startGameState({
        ...room,
        players: humans,
        status: "waiting",
        updatedAt: Date.now(),
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
