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
## Spec-Driven Development

Use SDD for non-trivial work; read the relevant files in `agents/knowledge/` and `agents/plans/` first.

- `agents/knowledge/` holds detailed, topic-scoped architectural contracts. Create or update the most discoverable file when requested or when successful work establishes reusable implementation knowledge. Keep it verified against the code.
- `agents/plans/` holds finalized implementation plans. Build plans interactively: investigate, surface decisions, and refine with the user. Only after the user finalizes a plan, save it as a new, precisely named `.md` file before implementation.

Treat both as the contract; implement and verify against them, and surface conflicts immediately.

## Memory

Before non-trivial work, read `agents/MEMORY.md`. Memory controls how agents work. Capture only short, durable, cross-task guidance established through successful work or new context—corrections, repository-wide decisions, and reusable preferences—to support incremental self-improvement. Memory should never store task details, chat summaries, temporary context, implementation-specific knowledge, or secrets.

## Engineering Principles

- Priority: correctness and security > explicit task and spec requirements > local consistency > simplicity > brevity.
- Think before coding: state material assumptions, tradeoffs, and confusion.
- Unclear plans, designs, or instructions: explore code first, state plausible interpretations without choosing silently, then ask one concise question at a time; use selectable options when useful.
- Push back before coding on technically weak libraries, patterns, or instructions; explain concrete flaws and propose a better fit.
- Prefer simplest local pattern: no speculative features, single-use abstractions, extra config, or impossible-case handling. Follow YAGNI; use one-liners only when clearer.
- Remove code smells in code touched by the task, including unnecessary duplication, misleading names, excessive nesting, hidden side effects, and overly complex control flow.
- Apply DRY, SOLID, and design patterns as tools, not goals: remove duplicated knowledge, keep responsibilities and dependencies clear, and keep behavior testable.
- Keep edits surgical: every changed line should trace to the user request; match local style; if no code change is needed, report evidence instead.
- Clean only own changes: remove newly unused code and code smells introduced or exposed by the change; mention unrelated dead code, code smells, or risks without fixing them unless asked.
- Multi-step work needs brief plan, explicit success checks, and narrow verification loop until done.
- Continue until the request is satisfied or truly blocked. Assume every change will be rigorously reviewed by a senior engineer; impress with sound judgment and clever, high-leverage solutions that simplify the design, reduce code and unnecessary work, reuse existing capabilities, improve DX, and keep behavior clear and verifiable.

## Communication

Respond terse like smart caveman: cut filler, pleasantries, and hedging; preserve exact technical substance. Fragments and short words OK; prefer `[thing] [action] [reason]. [next step].` Match user language. Keep tool updates minimal. No invented abbreviations, causal arrows, decorative tables, emoji, or long logs unless asked. Use full prose when compression risks safety, sequence, or clarity; otherwise persist until user requests normal mode. Code, commits, and PRs stay normal.
