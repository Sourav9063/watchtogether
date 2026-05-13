import { CardData } from "./data/data";

export const CARD_BACK = "/assets/card-svg/blue_back.png";
export const ROOM_COLLECTION = "bigTwoRooms";
export const ROOM_TTL_MS = 48 * 60 * 60 * 1000;
export const LAST_TWO_CALL_MS = 5 * 1000;

const HUMAN_SEAT_ORDER = {
  1: [0],
  2: [0, 2],
  3: [0, 1, 2],
  4: [0, 1, 2, 3],
};

const FIVE_CARD_RANK = {
  straight: 1,
  flush: 2,
  "full house": 3,
  "four of kind": 4,
  "straight flush": 5,
  "royal flush": 6,
};
const MAX_DEAL_ATTEMPTS = 200;

export const cardsByValue = CardData.reduce((map, card) => {
  map[card.value] = card;
  return map;
}, {});

export function normalizeName(name) {
  return name.trim().replace(/\s+/g, " ");
}

export function withRoomExpiry(room) {
  const updatedAt = Date.now();
  return {
    ...room,
    updatedAt,
    expiresAt: new Date(updatedAt + ROOM_TTL_MS),
  };
}

export function makePlayer(playerId, name, seat) {
  return {
    id: playerId,
    name: normalizeName(name),
    seat,
    isBot: false,
    joinedAt: Date.now(),
  };
}

export function makeBot(seat) {
  return {
    id: `bot-${seat}`,
    name: `Bot ${seat + 1}`,
    seat,
    isBot: true,
    joinedAt: Date.now(),
  };
}

export function getSortedCards(values) {
  return [...values].sort((a, b) => a - b);
}

export function getCardLabel(value) {
  return cardsByValue[value]?.name || `card ${value}`;
}

export function evaluateHand(values) {
  const sorted = getSortedCards(values);
  const cards = sorted.map((value) => cardsByValue[value]).filter(Boolean);

  if (cards.length !== sorted.length || new Set(sorted).size !== sorted.length) {
    return null;
  }

  if (sorted.length === 1) {
    return {
      type: "single",
      size: 1,
      rank: sorted[0],
      values: sorted,
      label: getCardLabel(sorted[0]),
    };
  }

  const numbers = cards.map((card) => card.number);
  const suits = cards.map((card) => card.suit);
  const counts = numbers.reduce((map, number) => {
    map[number] = (map[number] || 0) + 1;
    return map;
  }, {});
  const countValues = Object.values(counts).sort((a, b) => b - a);

  if (sorted.length === 2 && countValues[0] === 2) {
    return {
      type: "pair",
      size: 2,
      rank: sorted[1],
      values: sorted,
      label: "pair",
    };
  }

  if (sorted.length === 3 && countValues[0] === 3) {
    return {
      type: "three of kind",
      size: 3,
      rank: sorted[2],
      values: sorted,
      label: "three of kind",
    };
  }

  if (sorted.length !== 5) {
    return null;
  }

  const uniqueNumbers = [...new Set(numbers)].sort((a, b) => a - b);
  const isStraight =
    uniqueNumbers.length === 5 &&
    uniqueNumbers.every((number, index) => index === 0 || number === uniqueNumbers[index - 1] + 1);
  const isFlush = new Set(suits).size === 1;
  const highestCard = sorted[sorted.length - 1];
  const isRoyal =
    isStraight &&
    isFlush &&
    uniqueNumbers[0] === 10 &&
    uniqueNumbers[4] === 14;

  let type = null;
  let rank = highestCard;

  if (isRoyal) {
    type = "royal flush";
  } else if (isStraight && isFlush) {
    type = "straight flush";
  } else if (countValues[0] === 4) {
    type = "four of kind";
    rank = highestGroupedCard(counts, 4, sorted);
  } else if (countValues[0] === 3 && countValues[1] === 2) {
    type = "full house";
    rank = highestGroupedCard(counts, 3, sorted);
  } else if (isFlush) {
    type = "flush";
  } else if (isStraight) {
    type = "straight";
  }

  if (!type) return null;

  return {
    type,
    size: 5,
    rank,
    category: FIVE_CARD_RANK[type],
    values: sorted,
    label: type,
  };
}

function highestGroupedCard(counts, count, sorted) {
  const number = Number(
    Object.keys(counts)
      .filter((key) => counts[key] === count)
      .sort((a, b) => Number(b) - Number(a))[0]
  );

  return sorted
    .filter((value) => cardsByValue[value].number === number)
    .sort((a, b) => b - a)[0];
}

export function compareHands(left, right) {
  if (!left || !right || left.size !== right.size) return null;

  if (left.size === 5) {
    if (left.category !== right.category) {
      return left.category - right.category;
    }
    if (left.rank !== right.rank) {
      return left.rank - right.rank;
    }
    return compareValueLists(left.values, right.values);
  }

  if (left.type !== right.type) return null;
  return left.rank - right.rank;
}

function compareValueLists(left, right) {
  for (let index = left.length - 1; index >= 0; index -= 1) {
    if (left[index] !== right[index]) {
      return left[index] - right[index];
    }
  }
  return 0;
}

export function canBeat(candidate, lastPlay) {
  if (!candidate) return false;
  if (!lastPlay) return true;
  const lastHand = lastPlay.hand || evaluateHand(lastPlay.cards || []);
  const comparison = compareHands(candidate, lastHand);
  return comparison !== null && comparison > 0;
}

export function canPlayCards(room, values) {
  return !getPlayBlockReason(room, values);
}

export function getPlayBlockReason(room, values) {
  if (hasOpenLastTwoCallout(room)) {
    return `${getLastCardsLabel(room.lastTwoCallout)} call pending.`;
  }
  if (!values?.length) return "Select cards.";

  const evaluated = evaluateHand(values);
  if (!evaluated) return getInvalidHandReason(values);
  if (!room.lastPlay) return "";

  const lastHand = room.lastPlay.hand || evaluateHand(room.lastPlay.cards || []);
  if (evaluated.size !== lastHand?.size) {
    return `Play ${lastHand?.size || room.lastPlay.cards.length} cards to match table.`;
  }

  const comparison = compareHands(evaluated, lastHand);
  if (comparison === null) {
    return `Play same kind as ${room.lastPlay.name}'s ${lastHand.label}.`;
  }
  if (comparison <= 0) {
    return `Must beat ${room.lastPlay.name}'s ${lastHand.label}.`;
  }

  return "";
}

function getInvalidHandReason(values) {
  if (values.length === 2) return "Selected cards are not a pair.";
  if (values.length === 3) return "Selected cards are not three of a kind.";
  if (values.length === 4) return "Big Two only allows 1, 2, 3, or 5 cards.";
  if (values.length === 5) return "Five cards must be straight, flush, full house, four of kind, or straight flush.";
  return "Invalid Big Two hand.";
}

export function hasValidPlay(room, hand) {
  if (!hand?.length) return false;
  if (hasOpenLastTwoCallout(room)) return false;

  if (!room.lastPlay) {
    return true;
  }

  return getCandidateHands(hand, room.lastPlay.cards.length).some((cards) =>
    canPlayCards(room, cards)
  );
}

export function createInitialHands(players) {
  let hands = dealHands(players);
  let attempts = 1;

  while (isRoundDisqualified(hands) && attempts < MAX_DEAL_ATTEMPTS) {
    hands = dealHands(players);
    attempts += 1;
  }

  return hands;
}

function dealHands(players) {
  const deck = shuffle(CardData.map((card) => card.value));
  const hands = {};

  players.forEach((player) => {
    hands[player.seat] = [];
  });

  deck.forEach((card, index) => {
    const seat = players[index % players.length].seat;
    hands[seat].push(card);
  });

  Object.keys(hands).forEach((seat) => {
    hands[seat] = getSortedCards(hands[seat]);
  });

  return hands;
}

export function isRoundDisqualified(hands) {
  return Object.values(hands || {}).some((hand) => hasAllTwos(hand) || countPairs(hand) >= 6);
}

function hasAllTwos(hand) {
  return hand.filter((card) => cardsByValue[card]?.number === 15).length === 4;
}

function countPairs(hand) {
  const counts = (hand || []).reduce((map, card) => {
    const number = cardsByValue[card]?.number;
    if (number) map[number] = (map[number] || 0) + 1;
    return map;
  }, {});

  return Object.values(counts).reduce((total, count) => total + Math.floor(count / 2), 0);
}

function shuffle(cards) {
  const shuffled = [...cards];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export function startGameState(room) {
  const seats = fillBotSeats(room.players || [], room.targetHumans);
  const hands = createInitialHands(seats);
  const starter = seats.find((player) => hands[player.seat]?.includes(3));
  const points = buildPoints(room.points || {}, seats);

  return withRoomExpiry({
    ...room,
    players: seats,
    status: "playing",
    turnSeat: starter?.seat || 0,
    hands,
    lastPlay: null,
    passes: [],
    history: [],
    winner: null,
    points,
    roundScores: [],
    lastTwoCallout: null,
    mustPlayThreeClubs: false,
  });
}

function buildPoints(points, players) {
  return players.reduce((map, player) => {
    map[player.seat] = Number(points?.[player.seat] || 0);
    return map;
  }, {});
}

export function fillBotSeats(players, targetHumans) {
  const seats = [...players].sort((a, b) => a.seat - b.seat);
  for (let seat = 0; seat < 4; seat += 1) {
    if (!seats.some((player) => player.seat === seat) && seats.filter((player) => player.isBot).length < 4 - targetHumans) {
      seats.push(makeBot(seat));
    }
  }
  return seats.sort((a, b) => a.seat - b.seat);
}

export function roomHasPlayerName(room, name) {
  const normalized = normalizeName(name).toLowerCase();
  return (room.players || []).some((player) => player.name.toLowerCase() === normalized);
}

export function getNextHumanSeat(room) {
  const taken = new Set((room.players || []).map((player) => player.seat));
  const humanSeats = HUMAN_SEAT_ORDER[room.targetHumans] || HUMAN_SEAT_ORDER[4];

  for (const seat of humanSeats) {
    if (!taken.has(seat)) return seat;
  }
  return null;
}

export function getPlayer(room, playerId) {
  return (room.players || []).find((player) => player.id === playerId);
}

export function getSeatPlayer(room, seat) {
  return (room.players || []).find((player) => player.seat === seat);
}

export function applyPlay(room, playerId, selectedCards) {
  const player = getPlayer(room, playerId);
  if (!player) throw new Error("Player not in room.");
  if (room.status !== "playing") throw new Error("Game not active.");
  if (hasOpenLastTwoCallout(room)) throw new Error("Last Two call pending.");
  if (room.turnSeat !== player.seat) throw new Error("Not your turn.");

  const hand = room.hands?.[player.seat] || [];
  const selected = getSortedCards(selectedCards);
  if (!selected.length) throw new Error("Select cards first.");
  if (!selected.every((card) => hand.includes(card))) {
    throw new Error("Selected card missing from hand.");
  }
  const evaluated = evaluateHand(selected);
  if (!evaluated) throw new Error("Invalid Big Two hand.");
  if (!canBeat(evaluated, room.lastPlay)) {
    throw new Error("Hand does not beat table.");
  }

  const nextHand = hand.filter((card) => !selected.includes(card));
  const nextHands = {
    ...room.hands,
    [player.seat]: nextHand,
  };
  const winner = nextHand.length === 0 ? player : null;
  const nextSeat = winner ? player.seat : getNextSeat(room, player.seat);
  const playedAt = Date.now();
  const lastTwoCallout =
    !winner && nextHand.length <= 2
      ? {
          seat: player.seat,
          playerId: player.id,
          name: player.name,
          remainingCount: nextHand.length,
          cards: selected,
          hand: evaluated,
          previousLastPlay: room.lastPlay || null,
          previousPasses: room.passes || [],
          previousTurnSeat: room.turnSeat,
          previousMustPlayThreeClubs: room.mustPlayThreeClubs,
          openedAt: playedAt,
          expiresAt: playedAt + LAST_TWO_CALL_MS,
        }
      : null;

  const playedRoom = {
    ...room,
    status: "playing",
    turnSeat: nextSeat,
    hands: nextHands,
    lastPlay: {
      seat: player.seat,
      name: player.name,
      cards: selected,
      hand: evaluated,
      playedAt,
    },
    passes: [],
    history: [
      ...(room.history || []).slice(-24),
      {
        type: "play",
        seat: player.seat,
        name: player.name,
        cards: selected,
        label: evaluated.label,
        at: playedAt,
      },
    ],
    winner,
    lastTwoCallout,
    mustPlayThreeClubs: false,
  };

  return withRoomExpiry(winner ? finishRound(playedRoom, winner) : playedRoom);
}

function finishRound(room, winner) {
  const currentPoints = buildPoints(room.points || {}, room.players || []);
  const roundScores = (room.players || [])
    .map((player) => {
      const cardCount = room.hands?.[player.seat]?.length || 0;
      const previous = Number(currentPoints[player.seat] || 0);
      const total = previous + cardCount;

      return {
        seat: player.seat,
        name: player.name,
        cardCount,
        points: cardCount,
        total,
      };
    })
    .sort((a, b) => a.seat - b.seat);

  const nextPoints = roundScores.reduce((map, score) => {
    map[score.seat] = score.total;
    return map;
  }, {});
  const maxPoint = Number(room.maxPoint || 50);
  const matchEnded = roundScores.some((score) => score.total >= maxPoint);
  const finalRanks = matchEnded
    ? [...roundScores]
        .sort((a, b) => a.total - b.total || a.cardCount - b.cardCount || a.seat - b.seat)
        .map((score, index) => ({
          rank: index + 1,
          seat: score.seat,
          name: score.name,
          points: score.total,
        }))
    : [];

  return {
    ...room,
    status: matchEnded ? "ended" : "finished",
    turnSeat: winner.seat,
    passes: [],
    winner,
    points: nextPoints,
    roundScores,
    finalRanks,
    lastTwoCallout: null,
  };
}

export function applyPass(room, playerId) {
  const player = getPlayer(room, playerId);
  if (!player) throw new Error("Player not in room.");
  if (room.status !== "playing") throw new Error("Game not active.");
  if (hasOpenLastTwoCallout(room)) throw new Error("Last Two call pending.");
  if (room.turnSeat !== player.seat) throw new Error("Not your turn.");
  if (!room.lastPlay) throw new Error("Cannot pass while leading.");

  const activeSeats = (room.players || []).map((seatPlayer) => seatPlayer.seat);
  const passes = [...new Set([...(room.passes || []), player.seat])];
  const trickDone = passes.length >= activeSeats.length - 1;
  const turnSeat = trickDone ? room.lastPlay.seat : getNextSeat(room, player.seat);

  return withRoomExpiry({
    ...room,
    turnSeat,
    lastPlay: trickDone ? null : room.lastPlay,
    passes: trickDone ? [] : passes,
    history: [
      ...(room.history || []).slice(-24),
      {
        type: "pass",
        seat: player.seat,
        name: player.name,
        at: Date.now(),
      },
    ],
  });
}

export function applyLastTwoCall(room, playerId) {
  const player = getPlayer(room, playerId);
  if (!player) throw new Error("Player not in room.");
  const callout = room.lastTwoCallout;
  const label = getLastCardsLabel(callout);
  if (!callout) throw new Error("No last cards call pending.");
  if (callout.playerId !== playerId) throw new Error(`Only that player can call ${label}.`);
  if (Date.now() > callout.expiresAt) throw new Error(`${label} window expired.`);

  return withRoomExpiry({
    ...room,
    history: [
      ...(room.history || []).slice(-24),
      {
        type: "lastCardsCall",
        seat: player.seat,
        name: player.name,
        label,
        remainingCount: callout.remainingCount,
        at: Date.now(),
      },
    ],
    lastTwoCallout: null,
  });
}

export function applyMissedLastTwoCallout(room, playerId, force = false) {
  const caller = getPlayer(room, playerId);
  if (!caller && !force) throw new Error("Player not in room.");

  const callout = room.lastTwoCallout;
  if (!callout) throw new Error("No last cards call pending.");
  if (!force && callout.playerId === playerId) {
    throw new Error("You cannot call out yourself.");
  }

  const hand = room.hands?.[callout.seat] || [];
  const restoredHand = getSortedCards([...hand, ...(callout.cards || [])]);
  const nextHistory = [...(room.history || [])];
  const lastIndex = nextHistory.findLastIndex(
    (entry) =>
      entry.type === "play" &&
      entry.seat === callout.seat &&
      sameCards(entry.cards || [], callout.cards || [])
  );

  if (lastIndex >= 0) {
    nextHistory.splice(lastIndex, 1);
  }

  const callerBecomesLeader = Boolean(caller && !force);

  return withRoomExpiry({
    ...room,
    status: "playing",
    turnSeat: callerBecomesLeader ? caller.seat : callout.previousTurnSeat,
    hands: {
      ...room.hands,
      [callout.seat]: restoredHand,
    },
    lastPlay: callerBecomesLeader ? null : callout.previousLastPlay || null,
    passes: callerBecomesLeader ? [] : callout.previousPasses || [],
    history: [
      ...nextHistory.slice(-24),
      {
        type: "callout",
        seat: caller?.seat ?? null,
        name: caller?.name || "Timer",
        targetSeat: callout.seat,
        targetName: callout.name,
        label: getLastCardsLabel(callout),
        remainingCount: callout.remainingCount,
        at: Date.now(),
      },
    ],
    winner: null,
    lastTwoCallout: null,
    mustPlayThreeClubs: callerBecomesLeader ? false : callout.previousMustPlayThreeClubs,
  });
}

export function getNextSeat(room, fromSeat) {
  const seats = (room.players || []).map((player) => player.seat).sort((a, b) => a - b);
  const index = seats.indexOf(fromSeat);
  return seats[(index + 1) % seats.length];
}

export function chooseBotMove(room, bot) {
  const hand = room.hands?.[bot.seat] || [];
  if (hasOpenLastTwoCallout(room)) {
    return { action: "wait", cards: [] };
  }

  if (!room.lastPlay) {
    return { action: "play", cards: chooseBotLead(room, hand).values };
  }

  const candidates = getEvaluatedCandidates(hand, room.lastPlay.cards.length)
    .filter((candidate) => canBeat(candidate, room.lastPlay));

  if (!candidates.length) {
    return { action: "pass", cards: [] };
  }

  return { action: "play", cards: chooseBotResponse(room, bot, candidates).values };
}

function chooseBotLead(room, hand) {
  const candidates = [1, 2, 3, 5].flatMap((size) => getEvaluatedCandidates(hand, size));
  const winningPlay = candidates.find((candidate) => candidate.size === hand.length);

  if (winningPlay) {
    return winningPlay;
  }

  const ranked = candidates
    .map((candidate) => ({
      candidate,
      score: scoreBotLead(candidate, hand),
    }))
    .sort((a, b) => b.score - a.score || compareHands(a.candidate, b.candidate));

  return ranked[0]?.candidate || evaluateHand([hand[0]]);
}

function chooseBotResponse(room, bot, candidates) {
  const hand = room.hands?.[bot.seat] || [];
  const winningPlay = candidates.find((candidate) => candidate.size === hand.length);

  if (winningPlay) {
    return winningPlay;
  }

  const urgent = isBotUnderPressure(room, bot);
  const ranked = candidates
    .map((candidate) => ({
      candidate,
      score: scoreBotResponse(candidate, hand, urgent),
    }))
    .sort((a, b) => b.score - a.score || compareHands(a.candidate, b.candidate));

  return ranked[0].candidate;
}

function scoreBotLead(candidate, hand) {
  const remainingCards = hand.length - candidate.size;
  const comboPriority = {
    5: 80,
    3: 64,
    2: 46,
    1: 18,
  };

  return (
    comboPriority[candidate.size] +
    getHandShapeBonus(candidate) -
    getRankCost(candidate) -
    remainingCards * 1.5 -
    getSplitPenalty(candidate, hand)
  );
}

function scoreBotResponse(candidate, hand, urgent) {
  const controlBonus = urgent ? getControlValue(candidate) : getEfficientValue(candidate);

  return (
    candidate.size * 18 +
    controlBonus +
    getHandShapeBonus(candidate) -
    getRankCost(candidate) -
    getSplitPenalty(candidate, hand)
  );
}

function getHandShapeBonus(candidate) {
  if (candidate.size !== 5) return 0;

  return {
    straight: 6,
    flush: 10,
    "full house": 20,
    "four of kind": 28,
    "straight flush": 34,
    "royal flush": 38,
  }[candidate.type] || 0;
}

function getRankCost(candidate) {
  const averageCard = candidate.values.reduce((total, card) => total + card, 0) / candidate.values.length;
  return averageCard / (candidate.size === 1 ? 3 : 5);
}

function getControlValue(candidate) {
  if (candidate.size === 5) return candidate.category * 10 + candidate.rank / 2;
  return candidate.rank / 2;
}

function getEfficientValue(candidate) {
  if (candidate.size === 5) return candidate.category * 4 - candidate.rank / 7;
  return -candidate.rank / 4;
}

function getSplitPenalty(candidate, hand) {
  if (candidate.size !== 1) return 0;

  const number = cardsByValue[candidate.values[0]]?.number;
  const sameNumberCount = hand.filter((card) => cardsByValue[card]?.number === number).length;
  if (sameNumberCount >= 3) return 18;
  if (sameNumberCount === 2) return 10;
  return 0;
}

function isBotUnderPressure(room, bot) {
  const botHandSize = room.hands?.[bot.seat]?.length || 0;
  const opponentLowCards = (room.players || []).some((player) => {
    if (player.seat === bot.seat) return false;
    return (room.hands?.[player.seat]?.length || 0) <= 3;
  });
  const oneMorePassWinsTrick =
    room.lastPlay && (room.passes || []).length >= (room.players || []).length - 2;

  return botHandSize <= 5 || opponentLowCards || oneMorePassWinsTrick;
}

function getEvaluatedCandidates(hand, size) {
  return getCandidateHands(hand, size)
    .map((cards) => evaluateHand(cards))
    .filter(Boolean)
    .sort((a, b) => compareHands(a, b));
}

export function hasOpenLastTwoCallout(room) {
  return Boolean(room?.lastTwoCallout);
}

export function getLastCardsLabel(callout) {
  return callout?.remainingCount === 1 ? "Last One" : "Last Two";
}

function sameCards(left, right) {
  if (left.length !== right.length) return false;
  const sortedLeft = getSortedCards(left);
  const sortedRight = getSortedCards(right);
  return sortedLeft.every((card, index) => card === sortedRight[index]);
}

function getCandidateHands(hand, size) {
  if (size === 1) return hand.map((card) => [card]);
  const combos = [];
  collectCombos(hand, size, 0, [], combos);
  return combos;
}

function collectCombos(cards, size, start, current, combos) {
  if (current.length === size) {
    combos.push([...current]);
    return;
  }

  for (let index = start; index < cards.length; index += 1) {
    current.push(cards[index]);
    collectCombos(cards, size, index + 1, current, combos);
    current.pop();
  }
}
