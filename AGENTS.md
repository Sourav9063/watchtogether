# Repository Guidelines

## Project Structure

Next.js 15 App Router project. Routes live in `src/app`; examples: `stream/page.js`, `live/page.js`, `room/[roomId]/page.js`. Shared UI lives in `src/components`. Hooks/utilities live in `src/hooks` and `src/helper`. Config/Firebase live in `src/config` and `src/db`. Socket.IO API lives in `src/pages/api/socket`. Static assets live in `public/` and `assets/`.

## Commands

- `npm run dev`: start dev server.
- `npm run lint`: run Next ESLint.
- `npm run build`: production build; run occasionally.
- `npm run start`: serve production build.

Use Node `22.x`, matching `package.json`.

## Coding Style

Use JavaScript, React functional components, and Next file names: `page.js`, `layout.js`, `[param]`. Components use PascalCase; hooks use `use...`; CSS Modules use `*.module.css`. Keep JSX 2-space indented. Prefer existing helpers/providers before new patterns.

## Testing

Dev server usually runs; user tests UI continuously. Run `npm run lint` for code changes. Run `npm run build` occasionally, especially after route, metadata, dependency, or deployment-sensitive changes.

## Commits & Pull Requests

Use Conventional Commits: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`. Example: `git commit -m "fix: resolve login validation issue"`. PRs include summary, touched routes/components, validation, and screenshots for UI changes.

## Security & Configuration

Do not commit secrets. Use `NEXT_PUBLIC_` only for browser-safe values. Keep `.env*` private.

## Working Rules

- Think before coding: state assumptions, tradeoffs, and confusion; when behavior is ambiguous, surface options instead of picking silently.
- Unclear plans/designs/instructions: explore code first, then ask one concise question at a time; use selectable options when supported and useful.
- Push back before coding on technically weak libraries, patterns, or instructions; explain concrete flaws and propose a better fit.
- Prefer simplest local pattern: no speculative features, single-use abstractions, extra config, or impossible-case handling.
- Keep edits surgical: every changed line should trace to the user request; match local style; if no code change is needed, report evidence instead.
- Clean only own changes: remove newly unused code, mention unrelated dead code/risks without deleting.
- Multi-step work needs brief plan, explicit success checks, and narrow verification loop until done.

## Communication

Respond like smart caveman: no greetings articles filler hedging. Keep technical substance code API names commands errors exact. Prefer [thing] [action] [reason]. Fragments OK. Use fuller wording when compression risks ambiguity, safety, or irreversible-action clarity.