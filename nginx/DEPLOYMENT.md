# Google Cloud Deployment Notes

This project is running on a Google Cloud VM with host-installed Nginx in front of Dockerized API and web services.

## Server

- Public IP: `34.27.190.15`
- SSH access is configured outside this document.

## Repository

The repository was cloned on the VM:

```bash
cd ~
git clone git@github.com:mahirusman/hand-betting-game.git hand-betting-game
cd hand-betting-game
```

## System Packages Installed

The VM was a fresh Debian 12 server, so these tools were installed:

- Git
- Node.js 20
- npm
- Docker Engine
- Docker Compose plugin
- Nginx

## Environment

The production `.env` file was copied to the project root on the VM:

```bash
~/hand-betting-game/.env
```

Production values used:

```bash
PORT=3001
NODE_ENV=production
FRONTEND_URL=http://34.27.190.15
NEXT_PUBLIC_API_URL=
```

`MONGODB_URI` is required in `.env` and points to the external MongoDB instance. MongoDB is not hosted in Docker on this VM.

## Nginx

Nginx is installed on the host and uses this repository config:

```bash
sudo cp nginx/default.conf /etc/nginx/conf.d/tile-game.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
```

Nginx proxies:

```text
http://34.27.190.15/      -> 127.0.0.1:3000
http://34.27.190.15/api/* -> 127.0.0.1:3001
```

## Docker Compose

The app is built and started with:

```bash
cd ~/hand-betting-game
sudo docker compose up --build -d
```

Running containers:

```text
hand-betting-game-api-1 -> 127.0.0.1:3001
hand-betting-game-web-1 -> 127.0.0.1:3000
```

## Disk Space Note

The VM root disk is small, so the first Docker build ran out of space while exporting the API image. The fix was to remove host dependencies and Docker build leftovers before rebuilding:

```bash
cd ~/hand-betting-game
rm -rf node_modules
npm cache clean --force
sudo docker system prune -af --volumes
sudo apt-get clean
sudo rm -rf /var/lib/apt/lists/*
sudo docker compose up --build -d
```

After cleanup and rebuild, the containers started successfully.

## Verification

Server-local checks passed:

```bash
curl http://127.0.0.1
curl http://127.0.0.1/api/health
```

Expected API health response:

```json
{
  "success": true,
  "data": {
    "status": "ok"
  },
  "timestamp": "..."
}
```

Nginx status:

```bash
systemctl is-active nginx
```

Expected result:

```text
active
```

Docker status:

```bash
cd ~/hand-betting-game
sudo docker compose ps
```

Expected result: both `api` and `web` services are `Up`.

## Public Access

Google Cloud firewall ingress for TCP port `80` has been enabled for public HTTP access.

Live links:

```text
Frontend:       http://34.27.190.15/
Backend health: http://34.27.190.15/api/health
```

API docs are also available at:

```text
http://34.27.190.15/api/docs
```

Firewall rule used:

```bash
gcloud compute firewall-rules create allow-tile-game-http \
  --project=devtestmilo \
  --network=default \
  --allow=tcp:80 \
  --source-ranges=0.0.0.0/0
```
