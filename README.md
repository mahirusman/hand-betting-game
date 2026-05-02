# Mahjong Hand Betting

A full-stack Nx monorepo for a dark casino-style Mahjong hand betting game.

## Stack

- Nx monorepo with `api`, `web`, and `shared` projects
- NestJS 10, MongoDB/Mongoose, Swagger, validation, throttling
- Next.js 14 App Router, Tailwind CSS, Framer Motion, Zustand
- Shared TypeScript game engine exported as `@tile-game/shared`

## Getting Started

```bash
npm install
cp .env.example .env
npm run dev:api
npm run dev:web
```

The web app runs at `http://localhost:3000`, the API at `http://localhost:3001/api`, and Swagger at `http://localhost:3001/api/docs`.

## Environment

```bash
MONGODB_URI=mongodb+srv://USER:PASSWORD@YOUR_CLUSTER.mongodb.net/tile-game?appName=Cluster0
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Commands

```bash
npm run lint
npm run typecheck
npm test
npm run build:api:docker
npm run build:web:docker
```

## Docker

```bash
docker compose -f docker-compose.dev.yml up --build
```

Production compose uses `.env` for the API and builds `tile-game-api` and `tile-game-web`.

It does **not** run MongoDB or Nginx in Docker. MongoDB is expected to be an external Atlas/live database through `MONGODB_URI`. The API and web containers bind to localhost only:

```text
127.0.0.1:3000 -> web
127.0.0.1:3001 -> api
```

Only the API container receives `MONGODB_URI`. The web container receives only public frontend environment values.

```bash
docker compose up --build -d
```

For a Google Cloud VM with host-installed Nginx and no domain, copy the provided Nginx config to the server Nginx config directory:

```bash
sudo cp nginx/default.conf /etc/nginx/conf.d/tile-game.conf
sudo nginx -t
sudo systemctl reload nginx
```

Open firewall ingress for TCP `80`, then visit:

```text
http://YOUR_PUBLIC_IP/
http://YOUR_PUBLIC_IP/api/health
http://YOUR_PUBLIC_IP/api/docs
```

Nginx config lives in `nginx/default.conf`. It routes `/api/*` to `127.0.0.1:3001` and everything else to `127.0.0.1:3000`.

For production behind Nginx, leave `NEXT_PUBLIC_API_URL` empty so browser requests use the same public IP:

```bash
NEXT_PUBLIC_API_URL=
```

## API

- `POST /api/games`
- `GET /api/games/:gameId`
- `POST /api/games/:gameId/bet`
- `GET /api/health`

All game responses are wrapped in:

```json
{
  "success": true,
  "data": {},
  "timestamp": "2026-05-02T00:00:00.000Z"
}
```

## Branch Protection

For `main`, enable:

- Require pull request before merging
- Require at least 1 approval
- Require status checks to pass, including the `ci` workflow
- Block direct pushes to `main`

## GitHub Actions Deployment

This project deploys with a **GitHub self-hosted runner** installed on the Google Cloud server. There is no GHCR image push and no SSH step. The runner checks out the repo on the server and runs Docker Compose locally.

Required server setup:

```bash
docker --version
docker compose version
```

Install the GitHub self-hosted runner from:

```text
GitHub repo -> Settings -> Actions -> Runners -> New self-hosted runner
```

The runner user must be able to run Docker:

```bash
sudo usermod -aG docker $USER
```

Log out and back in after adding the Docker group, or restart the runner service.

Required GitHub secrets:

```text
MONGODB_URI          # Atlas connection string
FRONTEND_URL         # Example: http://YOUR_PUBLIC_IP
NEXT_PUBLIC_API_URL  # Leave empty when host Nginx proxies /api on the same public IP
```

Deployment flow:

```text
push to main
-> self-hosted runner checks out repo
-> writes .env from GitHub secrets
-> docker compose up --build -d
-> checks http://127.0.0.1:3001/api/health
-> checks http://127.0.0.1:3000
```

The deploy workflow is [deploy.yml](.github/workflows/deploy.yml). CI for pull requests is [ci.yml](.github/workflows/ci.yml).

## Notes

The shared library owns all tile math and game rule checks. API and web code import from `@tile-game/shared` instead of duplicating game logic.
