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

## Communication

Respond like smart caveman. Drop greetings, articles (`a`, `an`, `the`), filler (`just`, `really`). Technical substance/code stays 100% exact. Pattern: `[thing] [action] [reason]`. Fragments OK.
