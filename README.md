# Mahjong Hand Betting

A full-stack Nx monorepo for a dark casino-style hand-betting game played with a Mahjong deck. The player is dealt a hand, sees its total value, and bets whether the next hand will be **higher** or **lower**. Non-number tiles dynamically scale up or down with each correct or incorrect bet, and the game ends when any tile crosses 0 or 10 — or when the deck has been reshuffled three times.

---

## Stack

- Nx 22 monorepo with `api`, `web`, and `shared` projects
- **API** — NestJS 11, MongoDB/Mongoose, Swagger, validation, rate-limiting
- **Web** — Next.js 16 App Router, React 19, Tailwind CSS 4, Framer Motion, Zustand
- **Shared** — TypeScript game engine + types, published as `@tile-game/shared`
- **AI workflow** — Codex is initialized as the repository AI coding agent, with Nx-aware agent guidance and Git/GitHub change tracking.

The shared library owns every game rule (tile generation, shuffling, dealing, bet evaluation, dynamic tile-value scaling, game-over checks). The API and web apps are thin layers on top of it.

---

## CI / Deployment

CI runs on pull requests via [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

Branch protection on `main`: require pull request, at least 1 approval, passing `ci` workflow, no direct pushes.

### AWS CodePipeline / ECS

AWS CodePipeline/ECR/ECS is the single production deployment path for this repository. The deployment source of truth is [`aws/CODEPIPELINE.md`](aws/CODEPIPELINE.md).

The intended AWS flow is:

```text
Developer pushes to develop
  -> CodePipeline starts automatically
  -> CodeBuild builds Docker images
  -> CodeBuild pushes images to ECR
  -> CodePipeline tells ECS to deploy
  -> ECS pulls images from ECR
  -> New ECS task/container starts
  -> Application is live
```

The root [`buildspec.yml`](buildspec.yml) builds both Docker images, pushes them to ECR, and emits the `imagedefinitions.json` artifact used by the standard ECS deploy action. The ECS container names are `api` and `web`; keep those names aligned between CodeBuild, the ECS task definition, and CodePipeline.

Required AWS runtime configuration:

```text
MONGODB_URI        Stored in SSM Parameter Store or Secrets Manager
FRONTEND_URL       Public app URL used by API CORS
NEXT_PUBLIC_API_URL Build-time web API base URL, empty for same-origin ALB routing
```

---

## AI Agent Workflow

Codex is the primary AI agent for this repository. It should read [`AGENTS.md`](AGENTS.md) before editing, preserve the Nx monorepo boundaries, and use Git status/diffs to track uncommitted work before making changes.

Nx helper prompts and skills are included for agent-assisted workspace navigation and CI monitoring. When CI is connected through GitHub and Nx Cloud, Codex can help inspect failing checks, propose or apply fixes, and prepare a clear commit message without committing changes unless explicitly asked.

---

## Getting Started

### Project Setup

```bash
git clone git@github.com:mahirusman/hand-betting-game.git
cd hand-betting-game
cp .env.example .env
npm i -f
npm run dev       # Starts the API and web app together
```

For web-only UI work, use `npm run dev:web`.

Swagger docs live at `http://localhost:3001/api/docs`.

### Environment

```bash
MONGODB_URI=mongodb+srv://USER:PASSWORD@YOUR_CLUSTER.mongodb.net/tile-game?appName=Cluster0
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

The API requires a reachable MongoDB instance — either Atlas or a local Mongo — because the leaderboard and game state are persisted there.

---

## Commands

```bash
npm run dev               # Run API + web together via Nx
npm run dev:api           # API only
npm run dev:web           # Web only
npm run lint              # ESLint across api, web, shared
npm run typecheck         # tsc --noEmit per project
npm test                  # shared (vitest) + api (jest) + web (vitest)
npm run build             # Nx run-many -t build
npm run build:api:docker  # Production API bundle for the Docker image
npm run build:web:docker  # Production Next.js standalone bundle
npm run format            # Prettier via nx format:write
```

---

## Game Rules

**Setup**

- A fresh draw pile contains 28 tiles drawn from a freshly shuffled 136-tile Mahjong deck (3 suits × 9 face values × 4 copies, plus 4 copies each of 3 dragons and 4 winds).
- Number tiles are worth their face value. Dragons and winds start at value **5**.
- The first hand (2 tiles) is dealt automatically when a game starts.

**Each turn**

1. The player sees the current hand's tiles and total value.
2. They press **Bet Higher** or **Bet Lower** to predict the next hand.
3. The next 2 tiles are dealt; the previous hand is discarded.
4. The bet is evaluated against the new hand's total value:
   - Higher than previous → "higher" wins.
   - Lower than previous → "lower" wins.
   - Equal → tie.
5. **Dynamic scaling**: every non-number tile in the new hand has its value `+1` on a winning bet and `-1` on a losing bet. Ties leave values untouched. Duplicate tiles within a single hand only shift their shared value once (the spec says "+1 per winning hand", not per copy).
6. Score increments by 1 for a correct bet.

**Reshuffling**

- When the draw pile is empty, the contents of the discard pile are merged with a fresh 28-tile draw, shuffled, and used as the new draw pile. The reshuffle counter increments.

**Game over**

- A tile value reaches **0** (any non-number tile, even one not currently in hand).
- A tile value reaches **10** (same scope).
- The draw pile has been reshuffled for the **3rd** time.

All thresholds live in `libs/shared/src/config/game.config.ts`.

---

## Architecture Overview

```
.
├── apps
│   ├── api        NestJS HTTP layer + Mongo persistence
│   └── web        Next.js App Router UI
└── libs
    └── shared     Pure game engine + shared types and config
```

**`libs/shared`** is the source of truth. It exports:

- `config/game.config.ts` — every tunable constant (`HAND_SIZE`, `FRESH_DRAW_PILE_SIZE`, `MAX_RESHUFFLES`, `BASE_NON_NUMBER_VALUE`, `GAME_OVER_LOW`/`HIGH`, `LEADERBOARD_LIMIT`, `HISTORY_LIMIT`, `HISTORY_VISIBLE`, `BET_DIRECTIONS`).
- `utils/tile-engine.ts` — `generateFullTileSet`, `shuffleTiles`, `dealHand`, `calcTileValue`, `evaluateBet`, `updateDynamicTileValues`.
- `utils/game-rules.ts` — `checkGameOverFromHand`, `checkGameOverFromTileValueState`, `checkTileValueGameOver`, `checkGameOverFromReshuffle`.
- `types/game.types.ts` and `types/api.types.ts`.

**`apps/api`** owns one stateful flow: `GameService.placeBet`. It re-shuffles when needed, calls into the shared engine for the bet/scaling/game-over math, persists the new state via `GameRepository`, and returns the projected `GameState` to the client. Pure logic stays out of the controllers.

**`apps/web`** is presentational. A Zustand store (`useGame.ts`) holds the latest `GameState` and exposes `startNewGame`, `placeBet`, `exitGame`, `clearError`. Components (`GameBoard`, `TileDisplay`, `BetControls`, `HandHistory`, `GameOverScreen`, `LandingPage`, `LeaderboardCard`) render the store state.

---

## Testing

```bash
npm test              # all suites
npm run test:shared   # vitest, libs/shared
npm run test:api      # jest, apps/api
npm run test:web      # vitest, apps/web
```

The shared engine has unit coverage for tile generation, shuffling, dealing, bet evaluation, dynamic scaling (including duplicate non-number tiles in a hand), and every game-over path. The API has controller/service/e2e specs; the web has component specs (`MahjongTile`, `BetControls`, `GameOverScreen`) and a hook spec for the Zustand store.

---

## Docker

Docker Compose is kept for local/container parity. Production deployment is handled by AWS CodePipeline/ECR/ECS, not Docker Compose.

```bash
docker compose -f docker-compose.dev.yml up --build
```

Both Compose files run only the API and web services. MongoDB remains external through `MONGODB_URI`.

---
