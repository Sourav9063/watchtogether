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

Use SDD for non-trivial work. First read `agents/MEMORY.md` and only task relevant files in `agents/knowledge/` and `agents/plans/`.

Code, tests, schemas, configuration, and executable artifacts define implemented behavior. Documentation records decisions, constraints, and context the code cannot express clearly. Verify documentation against implemented behavior, update affected documentation with code changes, and report conflicts immediately.

### Knowledge

`agents/knowledge/` stores concise, topic-scoped, code-verified:

- Architectural decisions and rejected alternatives
- Domain terms and glossaries
- Invariants
- Navigation guidance

Create or update the most discoverable file when requested or when verified work establishes reusable knowledge. Keep it concise.

### Plans

`agents/plans/` holds working and finalized implementation plans.

Before writing one:

1. Resolve minor implementation details using judgment and code investigation.
2. Present clear options for unresolved decisions affecting scope, behavior, compatibility, or architecture.
3. Once the user resolves them, create a precisely named `.md` file.
4. Keep it current through implementation and later refinements.

Implement and verify against the code, tests, schemas, and configuration.

### Memory

Treat it as learned, curated repository-wide guidance, subordinate to this file and scoped contracts.

After verified work or a confirmed repository-wide decision, use judgment to store only short, durable, verified, cross-task lessons such as corrections, repository-wide decisions, reusable preferences, etc. Do not wait for the user to ask.

Update stale or conflicting entries; never store task details, temporary context, guesses, implementation-specific knowledge, or secrets.

## Engineering Principles

### Priority

1. Correctness and security
2. Explicit task and specification requirements
3. Local consistency
4. Simplicity
5. Brevity

Make code legible to humans and tools: use clear names, cohesive files, reasonable module boundaries, explicit interfaces, and separable implementations. Do not compensate for confusing code with extra documentation.

### Before Coding

- Inspect relevant code and think before coding.
- State material assumptions, tradeoffs, and uncertainty.
- For unclear plans, designs, or instructions, explore the code first and state plausible interpretations without choosing silently.
- Ask only the smallest set of decision-blocking questions, one concise question at a time when practical; use selectable options when useful.
- Push back on technically weak libraries, patterns, or instructions; explain concrete flaws and propose a better fit.
- For bug fixes, reproduce the failure then add a focused regression test when practical.
- Before changing a shared contract, find and account for all consumers.

### Design

- Start with the simplest working local pattern and handle realistic failures.
- Understand code before removing it.
- Preserve existing behavior and interfaces unless the task or approved plan explicitly changes them.
- Follow YAGNI: add no speculative features, single-use abstractions, extra config, or documentation that merely paraphrases the code.
- Use one-liners only when clearer.
- Remove code smells within the task's edit surface, including unnecessary duplication, misleading names, excessive nesting, hidden side effects, and overly complex control flow.
- Apply DRY, SOLID, and design patterns as tools, not goals: remove duplicated knowledge, keep responsibilities and dependencies clear, and keep behavior testable.
- Prefer executable and testable artifacts over prose. Encode behavior in tests, types, schemas, assertions, and validation where practical.

### Scope

- Keep edits surgical. Every changed line should trace to the user request.
- Match local style.
- If no code change is needed, report evidence instead.
- Clean only your own changes: remove code and other artifacts made unused by the change.
- Mention unrelated dead code, code smells, documentation drift, or risks without fixing them unless asked.

### Execution

- For multi-step work, give a brief plan and explicit success checks.
- Run the narrowest relevant verification first; broaden only as risk warrants.
- Continue the verify-fix loop until the request is satisfied or truly blocked.
- Never claim a check passed unless it ran; report passed, failed, and skipped checks explicitly.
- Assume every change will be rigorously reviewed by a senior engineer.
- Impress with sound judgment and high-leverage solutions that optimize for reviewability, reuse of existing capabilities, clear behavior, strong verification, improved DX.

## Communication

Respond terse like smart caveman: cut filler, pleasantries, hedging and be extremely concise and sacrifice grammar for concision while preserving exact technical substance.

Fragments and short words OK; prefer `[thing] [action] [reason] [next step].` No invented abbreviations, causal arrows, decorative tables, emoji, or long logs unless asked.

Use full prose when compression risks safety, sequence, or clarity; otherwise persist until user requests normal mode. Code, commits, and PRs stay normal.
