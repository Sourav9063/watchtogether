import { CardData } from "./data/data";

export const CARD_BACK = "/assets/card-svg/blue_back.png";
export const ROOM_COLLECTION = "bigTwoRooms";

const FIVE_CARD_RANK = {
  straight: 1,
  flush: 2,
  "full house": 3,
  "four of kind": 4,
  "straight flush": 5,
  "royal flush": 6,
};

export const cardsByValue = CardData.reduce((map, card) => {
  map[card.value] = card;
  return map;
}, {});

export function normalizeName(name) {
  return name.trim().replace(/\s+/g, " ");
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

export function createInitialHands(players) {
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

  return {
    ...room,
    players: seats,
    status: "playing",
    turnSeat: starter?.seat || 0,
    hands,
    lastPlay: null,
    passes: [],
    history: [],
    winner: null,
    mustPlayThreeClubs: true,
    updatedAt: Date.now(),
  };
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
  for (let seat = 0; seat < room.targetHumans; seat += 1) {
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
  if (room.turnSeat !== player.seat) throw new Error("Not your turn.");

  const hand = room.hands?.[player.seat] || [];
  const selected = getSortedCards(selectedCards);
  if (!selected.length) throw new Error("Select cards first.");
  if (!selected.every((card) => hand.includes(card))) {
    throw new Error("Selected card missing from hand.");
  }
  if (room.mustPlayThreeClubs && !selected.includes(3)) {
    throw new Error("First play must include 3 of clubs.");
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

  return {
    ...room,
    status: winner ? "finished" : "playing",
    turnSeat: nextSeat,
    hands: nextHands,
    lastPlay: {
      seat: player.seat,
      name: player.name,
      cards: selected,
      hand: evaluated,
      playedAt: Date.now(),
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
        at: Date.now(),
      },
    ],
    winner,
    mustPlayThreeClubs: false,
    updatedAt: Date.now(),
  };
}

export function applyPass(room, playerId) {
  const player = getPlayer(room, playerId);
  if (!player) throw new Error("Player not in room.");
  if (room.status !== "playing") throw new Error("Game not active.");
  if (room.turnSeat !== player.seat) throw new Error("Not your turn.");
  if (!room.lastPlay) throw new Error("Cannot pass while leading.");

  const activeSeats = (room.players || []).map((seatPlayer) => seatPlayer.seat);
  const passes = [...new Set([...(room.passes || []), player.seat])];
  const trickDone = passes.length >= activeSeats.length - 1;
  const turnSeat = trickDone ? room.lastPlay.seat : getNextSeat(room, player.seat);

  return {
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
    updatedAt: Date.now(),
  };
}

export function getNextSeat(room, fromSeat) {
  const seats = (room.players || []).map((player) => player.seat).sort((a, b) => a - b);
  const index = seats.indexOf(fromSeat);
  return seats[(index + 1) % seats.length];
}

export function chooseBotMove(room, bot) {
  const hand = room.hands?.[bot.seat] || [];
  if (!room.lastPlay) {
    const leadCard = room.mustPlayThreeClubs && hand.includes(3) ? 3 : hand[0];
    return { action: "play", cards: [leadCard] };
  }

  const candidates = getCandidateHands(hand, room.lastPlay.cards.length)
    .map((cards) => evaluateHand(cards))
    .filter((candidate) => canBeat(candidate, room.lastPlay))
    .sort((a, b) => compareHands(a, b));

  if (!candidates.length) {
    return { action: "pass", cards: [] };
  }

  return { action: "play", cards: candidates[0].values };
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
