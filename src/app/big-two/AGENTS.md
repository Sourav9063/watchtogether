# Big Two Notes

Scope: files under `src/app/big-two` and shared game code in `src/components/big-two`.

## Stack

- Next.js 15 App Router routes: `page.js`, `[room]/page.js`, `layout.js`.
- React client components with hooks and CSS Modules.
- Firebase Firestore from `firebase/firestore`.
- Firestore collection: `bigTwoRooms`.
- Card data/images come from `src/components/big-two/data/data.js` and `public/assets/card-svg`.

## Main Files

- `src/app/big-two/page.js`: lobby, room create form, player setup.
- `src/app/big-two/[room]/page.js`: game UI, snapshot listener, buttons, timers, bot scheduling.
- `src/app/big-two/page.module.css`: lobby, table, hand dock, responsive UI.
- `src/components/big-two/bigTwoRules.js`: pure rules, hand validation, state transitions, scoring, bot decisions.
- `src/components/big-two/bigTwoFirebase.js`: Firestore reads, writes, transactions.

## Game Flow

1. Player opens `/big-two`, enters unique name, chooses human count and max point.
2. `createBigTwoRoom()` writes a room document.
3. When enough humans join, `startGameState()` fills empty seats with bots, deals cards, redeals disqualified hands, and starts play.
4. Seat holding `3 of clubs` starts first.
5. Current player plays valid cards or passes when table has active `lastPlay`.
6. If all other players pass, table clears and last player leads.
7. When a hand reaches zero cards, round ends, remaining card counts become points.
8. If any total reaches `maxPoint`, match ends; lowest total wins.

## Valid Hands

- `1`: single
- `2`: pair
- `3`: three of a kind
- `5`: straight, flush, full house, four of a kind, straight flush, royal flush

When `lastPlay` exists, new play must match card count and beat table hand. UI hints use `getPlayBlockReason()`. Transactions re-check rules in `applyPlay()`.

## Last Two / Last One

After a player plays and has `2` or `1` cards left, `applyPlay()` opens `lastTwoCallout`.

- `remainingCount === 2`: owner must call Last Two.
- `remainingCount === 1`: owner must call Last One.
- Owner calls through `callLastTwo()` / `applyLastTwoCall()`.
- Other players call missed owner through `callOutMissedLastTwo()` / `applyMissedLastTwoCallout()`.
- Missed call returns played cards to owner hand and clears pending call.
- Human-owned pending call can be attacked by a random bot after `LAST_TWO_BOT_ATTACK_MS`.
- Expired pending call restores previous state by force.

Normal play, pass, bot turn, and human auto-pass pause while `lastTwoCallout` exists.

## Firebase Use

- `onSnapshot()`: live room updates.
- `setDoc()`: create room.
- `runTransaction()`: all game mutations, including join, play, pass, call, callout, bot move, restart.
- `getDoc()`: room existence check.
- `expiresAt`: room TTL field, refreshed by `withRoomExpiry()`.

Keep all authoritative game changes in `bigTwoRules.js`; Firebase wrapper should only load snapshot, guard stale state, call pure transition, and write result.

## Bot / Timer Logic

- Creator client owns bot scheduling through `botDriverId`.
- `runBotTurn()` chooses play/pass with `chooseBotMove()`.
- Human auto-pass triggers only when pass is legal: active `lastPlay`, no pending Last Two/One.
- Bot Last Two/One calls and bot attacks are scheduled from `[room]/page.js`, then committed by Firestore transaction.

## Edit Rules

- Keep rules pure in `bigTwoRules.js`; no Firestore imports there.
- Validate in transaction even if UI already disabled invalid action.
- Do not trust local room state after button click; Firestore snapshot can be stale.
- Keep UI labels derived from room state, especially `lastTwoCallout.remainingCount`.
- Run `npm run lint` after changes.
