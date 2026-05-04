# Mahjong Hand Betting

A full-stack Nx monorepo for a dark casino-style hand-betting game played with a Mahjong deck. The player is dealt a hand, sees its total value, and bets whether the next hand will be **higher** or **lower**. Non-number tiles dynamically scale up or down with each correct or incorrect bet, and the game ends when any tile crosses 0 or 10 — or when the deck has been reshuffled three times.

---

## Stack

- Nx 19 monorepo with `api`, `web`, and `shared` projects
- **API** — NestJS 10, MongoDB/Mongoose, Swagger, validation, rate-limiting
- **Web** — Next.js 14 App Router, Tailwind CSS, Framer Motion, Zustand
- **Shared** — TypeScript game engine + types, published as `@tile-game/shared`

The shared library owns every game rule (tile generation, shuffling, dealing, bet evaluation, dynamic tile-value scaling, game-over checks). The API and web apps are thin layers on top of it.

---

## Getting Started

```bash
npm install
cp .env.example .env
npm run dev:web   # Start the web app at http://localhost:3000
```

Stop the web-only process, then start both apps together:

```bash
npm run dev       # Starts the API and web app together
```

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

## API

```
POST  /api/games                  Create a new game
GET   /api/games/:gameId          Fetch an existing game
POST  /api/games/:gameId/bet      Place a higher/lower bet
GET   /api/games/leaderboard      Top 5 finished games by score
GET   /api/health                 Liveness probe
```

All success responses are wrapped in:

```json
{
  "success": true,
  "data": { "...": "GameState or LeaderboardEntry[]" },
  "timestamp": "2026-05-04T00:00:00.000Z"
}
```

Errors share a parallel envelope:

```json
{
  "success": false,
  "error": { "code": "GAME_NOT_FOUND", "message": "Game not found." },
  "timestamp": "2026-05-04T00:00:00.000Z"
}
```

Error codes: `GAME_OVER`, `GAME_NOT_FOUND`, `INVALID_BET`, `VALIDATION_ERROR`, `INTERNAL_ERROR`.

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

```bash
docker compose -f docker-compose.dev.yml up --build
```

Production compose builds `tile-game-api` and `tile-game-web`. It does **not** run MongoDB or Nginx — MongoDB is expected to be an external Atlas instance reached through `MONGODB_URI`, and Nginx is host-installed (config in `nginx/default.conf`). The API and web containers bind to localhost only:

```
127.0.0.1:3000 -> web
127.0.0.1:3001 -> api
```

For a Google Cloud VM with host-installed Nginx and no domain, copy the provided config:

```bash
sudo cp nginx/default.conf /etc/nginx/conf.d/tile-game.conf
sudo nginx -t
sudo systemctl reload nginx
```

Open firewall ingress for TCP `80`, then visit `http://YOUR_PUBLIC_IP/`. Behind Nginx, leave `NEXT_PUBLIC_API_URL=` empty so browser requests use the same public IP.

---

## CI / Deployment

CI runs on pull requests via [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

Deployment uses a **GitHub self-hosted runner** installed on the Google Cloud VM. The workflow ([`deploy.yml`](.github/workflows/deploy.yml)) checks out the repo on the server, writes `.env` from secrets, and runs `docker compose up --build -d`.

Required GitHub secrets:

```text
MONGODB_URI          # Atlas connection string
FRONTEND_URL         # http://YOUR_PUBLIC_IP
NEXT_PUBLIC_API_URL  # Empty when host Nginx proxies /api on the same IP
```

Branch protection on `main`: require pull request, at least 1 approval, passing `ci` workflow, no direct pushes.
