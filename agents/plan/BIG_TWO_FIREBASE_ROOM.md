# Big Two Firebase Room Plan

## Summary
Build `src/app/big-two` into realtime Big Two card room using Firestore snapshots, transactions, unique player names, mobile-first table UI, and bot-filled seats for 1-4 player games.

## Key Changes
- Add create/join gate before room access:
  - player must enter name before creating or joining
  - name must be unique within room
  - creator selects human player count: `1`, `2`, `3`, or `4`
  - remaining seats auto-fill with bots
- Store room state in Firestore `bigTwoRooms/{roomId}`:
  - `players`, `bots`, `status`, `turnSeat`, `hands`, `lastPlay`, `passes`, `history`, `winner`, `createdAt`, `updatedAt`
- Use `onSnapshot` for realtime state updates and `runTransaction` for create/join/start/play/pass/new-game.
- Add Firebase-managed cleanup:
  - every room stores Firestore timestamp field `expiresAt`
  - every room action extends expiration 48 hours from last update
  - Firestore TTL policy deletes expired `bigTwoRooms` documents
- Replace current demo UI with real card table UI:
  - green felt table surface
  - 4 seats around table
  - opponent card backs
  - played pile in center
  - current turn highlight
  - bottom hand fan for current player
  - mobile layout with compact seats, bottom hand rail, and reachable play/pass controls

## Player Modes
- `1-player`: 1 human + 3 bots
- `2-player`: 2 humans + 2 bots
- `3-player`: 3 humans + 1 bot
- `4-player`: 4 humans + 0 bots
- Game starts once selected human seats filled.
- Bots occupy remaining seats immediately when room starts.

## Game Rules
- Enforce core Big Two:
  - 3 of clubs starts first trick
  - valid hands: single, pair, triple, straight, flush, full house, four of kind, straight flush, royal flush
  - same card count required to beat current hand
  - five-card hand ranking follows poker hierarchy from provided image
  - pass allowed only when current trick has active last play
  - trick resets after all other active seats pass
  - player wins when hand empty
- Use existing `CardData` order: `3 clubs` lowest, `2 spades` highest.

## Bots
- Bot turn advances from active browser snapshot handler through same transaction path.
- Bot strategy:
  - play lowest valid hand that beats current hand
  - pass when no valid hand exists
  - lead with lowest single when starting trick
- Bot logic stays simple for first version, not competitive AI.

## Test Plan
- Run `npm run lint`.
- Run `npm run build`.
- Manual checks:
  - create room requires name
  - join room requires name
  - duplicate name blocked
  - 1-player starts with 3 bots
  - 2-player starts with 2 humans and 2 bots
  - 3-player starts with 3 humans and 1 bot
  - 4-player waits for 4 humans
  - invalid plays rejected
  - stale tab or out-of-turn move rejected by transaction
  - mobile viewport shows usable table, hand, and play/pass controls without overlap
  - `expiresAt` updates after create/join/play/pass/restart
  - Firestore TTL policy is enabled for collection group `bigTwoRooms` on field `expiresAt`

## Assumptions
- Firestore env config already works through existing Firebase setup.
- Firebase console has Firestore TTL enabled for `bigTwoRooms.expiresAt`; TTL deletion is asynchronous and can lag after expiration.
- Production Firestore security rules hardening stays separate task.
- UI should feel like real card table, not dashboard.
