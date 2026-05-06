<!-- BEGIN:tile-game-agent-rules -->

# Tile Game Agent Rules

This repository is a full-stack **Mahjong Hand Betting** game. It is an Nx-style monorepo with a NestJS API, a Next.js App Router frontend, and a shared TypeScript game engine.

Codex is initialized as the primary AI coding agent for this repository. Before editing, read this file, inspect Git status for uncommitted user work, and keep the architecture intact.

<!-- END:tile-game-agent-rules -->

## Project Structure

```text
tile-game/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── .husky/
│   ├── pre-commit
│   └── pre-push
├── .vscode/
│   ├── settings.json
│   └── extensions.json
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── app.controller.ts
│   │   │   ├── game/
│   │   │   │   ├── game.module.ts
│   │   │   │   ├── game.controller.ts
│   │   │   │   ├── game.service.ts
│   │   │   │   ├── game.repository.ts
│   │   │   │   ├── schemas/
│   │   │   │   │   └── game.schema.ts
│   │   │   │   └── dto/
│   │   │   │       ├── create-game.dto.ts
│   │   │   │       └── place-bet.dto.ts
│   │   │   └── common/
│   │   │       ├── filters/
│   │   │       │   └── http-exception.filter.ts
│   │   │       ├── interceptors/
│   │   │       │   └── logging.interceptor.ts
│   │   │       └── pipes/
│   │   │           └── validation.pipe.ts
│   │   ├── test/
│   │   ├── project.json
│   │   ├── tsconfig.json
│   │   ├── jest.config.ts
│   │   └── Dockerfile
│   └── web/
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx
│       │   │   ├── game/
│       │   │   │   └── page.tsx
│       │   │   └── globals.css
│       │   ├── components/
│       │   │   ├── landing/
│       │   │   ├── game/
│       │   │   └── ui/
│       │   ├── hooks/
│       │   ├── lib/
│       │   └── types/
│       ├── public/
│       ├── project.json
│       ├── next.config.js
│       ├── tailwind.config.js
│       ├── postcss.config.js
│       └── Dockerfile
├── libs/
│   └── shared/
│       ├── src/
│       │   ├── index.ts
│       │   ├── types/
│       │   │   ├── game.types.ts
│       │   │   └── api.types.ts
│       │   ├── utils/
│       │   │   ├── tile-engine.ts
│       │   │   └── game-rules.ts
│       │   └── __tests__/
│       ├── project.json
│       ├── tsconfig.json
│       └── vitest.config.ts
├── docker-compose.yml          # api + web only; MongoDB is external
├── docker-compose.dev.yml      # api + web only; MongoDB is external
├── nginx/
│   └── default.conf
├── nx.json
├── package.json
├── tsconfig.base.json
├── eslint.config.mjs
├── .env.example
└── README.md
```

## Package Manager

This project supports **npm** and **pnpm**. The user is currently running commands with pnpm.

Use:

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
npm run build:api:docker
npm run build:web:docker
```

If using pnpm:

```bash
pnpm install
pnpm run dev:api
pnpm run dev:web
```

## Nx Rules

- Keep projects as `api`, `web`, and `shared`.
- Keep `@tile-game/shared` configured in `tsconfig.base.json`.
- Use Nx targets from each `project.json`; do not replace the monorepo with a single-app setup.
- Prefer targeted commands while developing:

```bash
npx nx test shared
npx nx test api
npx nx test web
npx nx build api
npx nx build web
```

## Codex Agent Workflow

- Treat Codex as the repository AI agent for implementation, documentation, GitHub-assisted review, and CI follow-up.
- Before changing files, inspect `git status` and relevant diffs; do not overwrite or revert uncommitted user changes unless explicitly asked.
- Use Git/GitHub context to track changed files, review pending work, and prepare commit messages. Do not commit, push, or open a pull request unless the user asks.
- Prefer Nx-aware commands and helper guidance for project discovery, builds, tests, and CI monitoring.
- When package upgrades introduce framework migration issues, update the related config/code in the same patch and verify with targeted commands.

## Shared Library Rules

All game-domain logic belongs in `libs/shared`.

Use this import everywhere outside the shared library:

```ts
import { ... } from '@tile-game/shared';
```

Never import shared code through long relative paths such as:

```ts
import { ... } from '../../../libs/shared/src';
```

Do not duplicate these functions in API or web code:

- `generateFullTileSet`
- `shuffleTiles`
- `dealHand`
- `calcTileValue`
- `calcHandValue`
- `evaluateBet`
- `checkGameOverFromHand`
- `checkGameOverFromReshuffle`

Required shared exports:

```ts
export * from './types/game.types';
export * from './types/api.types';
export * from './config/game.config';
export * from './utils/tile-engine';
export * from './utils/game-rules';
```

## Game Rules

- A tile is a Mahjong tile with `id`, `valueKey`, `kind`, `label`, and optional number/Dragon/Wind metadata.
- The full deck is a standard 136-tile Mahjong set: 34 unique values with 4 physical copies each.
- Number tiles are Bamboo, Characters, and Dots from `1..9`; value equals face value.
- Dragon and Wind tiles start at value `5`.
- A hand is exactly 2 tiles.
- Hand value is the sum of both tile values.
- `higher` wins only if the new hand total is strictly greater than the previous hand total.
- `lower` wins only if the new hand total is strictly less than the previous hand total.
- A tie returns `tie` and does not increment score.
- Correct bets increment score by `1`.
- Incorrect and tie results do not change score.
- Each Dragon/Wind tile value scales by value key: winning hand `+1`, losing hand `-1`, tie unchanged.

Game-over triggers:

- Any tile value reaches `0`: `gameOverReason = 'tile_value_zero'`.
- Any tile value reaches `10`: `gameOverReason = 'tile_value_ten'`.
- The draw pile reaches the third reshuffle: `gameOverReason = 'max_reshuffles'`.

Draw pile rules:

- A game starts with 28 shuffled tiles.
- The first hand deals 2 tiles, leaving 24 in the draw pile.
- Before dealing a new hand, if the pile has fewer than 2 tiles, reshuffle a fresh 28-tile set and increment `reshuffleCount`.
- If `reshuffleCount >= 3`, the game ends after the current hand resolves.

## API Rules

The backend is NestJS. Do not bypass Nest patterns with direct Express handlers.

Global API prefix:

```text
/api
```

Required endpoints:

```text
POST /api/games
GET  /api/games/:gameId
POST /api/games/:gameId/bet
GET  /api/health
GET  /api/docs
```

Response envelope:

```json
{
  "success": true,
  "data": {},
  "timestamp": "ISO8601"
}
```

Error envelope:

```json
{
  "success": false,
  "error": {
    "code": "GAME_OVER",
    "message": "Human-readable message"
  },
  "timestamp": "ISO8601"
}
```

Valid error codes:

- `GAME_OVER`
- `GAME_NOT_FOUND`
- `INVALID_BET`
- `VALIDATION_ERROR`
- `INTERNAL_ERROR`

## Backend Layering

`GameController`

- Owns HTTP routes and Swagger decorators.
- Validates params/body through Nest pipes and DTOs.
- Does not contain game math.

`GameService`

- Owns game orchestration and state transitions.
- Imports game logic from `@tile-game/shared`.
- Handles create game, get game, and place bet flows.

`GameRepository`

- Thin Mongoose data-access wrapper only.
- No business rules.
- No score, bet, reshuffle, or tile logic.

`game.schema.ts`

- Stores full persisted game state.
- Uses string UUID `gameId`, not Mongo ObjectId as the public game ID.
- Maintains TTL expiry through `expiresAt`.

## Backend Configuration

- Use `ConfigService` for environment values in app/module code.
- Do not read `process.env` directly in services or controllers.
- Keep global `ValidationPipe` with:
  - `whitelist: true`
  - `forbidNonWhitelisted: true`
  - `transform: true`
- Keep the global HTTP exception filter.
- Keep the logging interceptor.
- Keep Swagger mounted at `/api/docs`.

## Frontend Rules

The frontend is Next.js 16 with the App Router.

Routes:

```text
/       -> landing page
/game   -> playable game page
```

Rules:

- Use App Router only. Do not add a Pages Router.
- Pages live in `apps/web/src/app`.
- Reusable UI lives in `apps/web/src/components`.
- API client code lives in `apps/web/src/lib/api-client.ts`.
- Game state lives in `apps/web/src/hooks/useGame.ts`.
- Types should come from `@tile-game/shared` or `apps/web/src/types`.

## State Management

Use the single Zustand store in `useGame.ts`.

Expected state:

- `gameId`
- `gameState`
- `isLoading`
- `error`

Expected actions:

- `startNewGame`
- `placeBet`
- `exitGame`
- `clearError`

Do not introduce a second client game store unless the user explicitly asks for a larger state architecture.

## Design System

Dark-only casino/noir visual direction.

Primary color roles:

- background: near black
- surface: dark elevated panels
- card: dark purple-tinted cards
- border: muted purple-gray
- accent: electric purple
- higher: green
- lower: red
- score: gold
- text: pale slate

Use Tailwind theme tokens from `apps/web/tailwind.config.js`:

- `bg-game-bg`
- `bg-game-surface`
- `bg-game-card`
- `border-game-border`
- `text-game-text`
- `text-game-muted`
- `bg-game-accent`
- `text-game-gold`
- `bg-game-higher`
- `bg-game-lower`

Avoid hardcoding colors in components when an existing game token fits.

Typography:

- Use Rajdhani for display text through `font-display`.
- Use Inter/system for body text through `font-body`.

## UI Component Rules

`MahjongTile`

- Must render an ivory Mahjong-style tile with depth, label, glyph, and dynamic value.
- Number tiles show face value and suit.
- Dragon/Wind tiles show strong symbolic glyphs and current dynamic value.
- Compact mode is used for recent hand previews.

Game board must show:

- current hand with 2 Mahjong tiles
- current hand value
- score
- draw pile count
- discard pile count
- reshuffle count as `X/3`
- recent hand history
- higher/lower bet buttons
- bet result feedback
- game-over overlay
- exit control

## Animation Rules

Use Framer Motion.

Required animation categories:

- tile entrance
- hand transition
- bet result flash
- game-over overlay
- score increment

Animations should feel quick and deliberate. Keep practical durations under `400ms`.

## Accessibility Rules

- Bet buttons must include:
  - `aria-label="Bet that next hand is higher"`
  - `aria-label="Bet that next hand is lower"`
- Exit and play-again controls need clear `aria-label` values.
- Score changes should use `aria-live="polite"`.
- Do not rely on color alone for win/loss states; include text or symbols too.
- Keep controls usable at mobile widths around `375px`.

## Testing Rules

Shared library tests should cover every exported game function.

API tests should cover:

- create game
- get game
- place bet
- invalid bet
- missing bet
- unknown game
- game over
- health check

Frontend tests should cover game-critical components:

- `MahjongTile`
- `BetControls`
- `GameBoard`
- `GameOverScreen`
- store/hook behavior

When changing shared game rules, update shared tests first or in the same patch.

## Environment

Required variables are documented in `.env.example`.

Backend:

```bash
MONGODB_URI=mongodb+srv://USER:PASSWORD@YOUR_CLUSTER.mongodb.net/tile-game?appName=Cluster0
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

Frontend:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Local Development

```bash
npm install
cp .env.example .env
npm run dev:api
npm run dev:web
```

The app should then be available at:

```text
web: http://localhost:3000
api: http://localhost:3001/api
docs: http://localhost:3001/api/docs
```

## Docker Rules

- API Dockerfile lives at `apps/api/Dockerfile`.
- Web Dockerfile lives at `apps/web/Dockerfile`.
- Docker builds intentionally avoid Nx plugin workers:
  - API uses `npm run build:api:docker`.
  - Web uses `npm run build:web:docker`.
- API Docker build compiles `libs/shared` and packages it under `node_modules/@tile-game/shared` in the image so runtime aliases resolve.
- Host-installed production Nginx config lives at `nginx/default.conf`.
- Development compose lives at `docker-compose.dev.yml`.
- Production compose lives at `docker-compose.yml`.
- Do not add a MongoDB container; MongoDB is external via `MONGODB_URI`.

Do not add service-specific compose files unless needed.

Production deployments use host-installed Nginx as the public entrypoint:

- `http://PUBLIC_IP/` proxies to `127.0.0.1:3000`.
- `http://PUBLIC_IP/api/*` proxies to `127.0.0.1:3001`.
- No domain is required; Nginx uses `server_name _`.
- Do not run an Nginx container in production compose.
- Keep app containers bound to localhost so only host Nginx is public.

## GitHub Actions

CI should run:

```bash
npm i -f
npm run lint
npm run typecheck
npm test
npm run build:api:docker
npm run build:web:docker
```

Set `NX_DAEMON=false` in CI to avoid daemon socket issues in GitHub runners.

Deployment uses a GitHub self-hosted runner on the Google Cloud server.

Rules:

- Do not push images to GHCR for this deployment style.
- Do not SSH from GitHub Actions into the server.
- The self-hosted runner should run `docker compose up --build -d` locally.
- The workflow should write `.env` from GitHub secrets before running Compose.
- Required secrets are `MONGODB_URI`, `FRONTEND_URL`, and optionally `NEXT_PUBLIC_API_URL`.
- Keep `NEXT_PUBLIC_API_URL` empty when host Nginx proxies `/api` on the same public IP.
- Health check `http://127.0.0.1:3001/api/health` and `http://127.0.0.1:3000` after deployment.

## Editing Rules

- Keep changes focused.
- Do not refactor unrelated files.
- Do not revert user changes.
- Do not move business logic into React components.
- Do not move game math into Nest services.
- Do not introduce a new styling system unless requested.
- Do not add a database dependency to the frontend.
- Do not add localStorage persistence for game state unless requested.
- Do not make API routes depend on client-side state.

## Verification Checklist

Before saying the project is complete, run what the environment allows:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

If dependencies are not installed or network access prevents installation, say that clearly and list what was verified statically.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
