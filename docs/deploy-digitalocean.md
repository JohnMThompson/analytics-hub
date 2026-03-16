# DigitalOcean Deployment Runbook

This guide deploys `analytics-hub` to a DigitalOcean droplet with:
- Docker Compose runtime
- Caddy reverse proxy (automatic HTTPS)
- Public access through a subdomain
- GitHub Actions SSH-based deploys from `main`

## 1. Prerequisites

- A DigitalOcean Ubuntu droplet (22.04+ recommended)
- A domain/subdomain (example: `analytics.example.com`)
- Repo access on GitHub
- A local machine with SSH access to the droplet

## 2. DNS Setup

Create an `A` record for your subdomain pointing to the droplet IPv4.

Example:
- Host: `analytics`
- Type: `A`
- Value: `<DROPLET_PUBLIC_IP>`

## 3. Droplet Bootstrap

SSH into the droplet and install Docker + Compose plugin:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg ufw git

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo usermod -aG docker "$USER"
```

Re-login (or run `newgrp docker`) so the `docker` group takes effect.

## 4. Firewall Setup

Allow SSH, HTTP, and HTTPS only:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status
```

Do not expose `3000` or `8000` publicly.

## 5. Clone App and Configure Environment

```bash
sudo mkdir -p /opt/ai-analytics
sudo chown "$USER":"$USER" /opt/ai-analytics
git clone https://github.com/JohnMThompson/analytics-hub.git /opt/ai-analytics
cd /opt/ai-analytics
cp .env.example .env
```

Edit `/opt/ai-analytics/.env` with production values:

- `APP_DOMAIN=your-subdomain.example.com`
- `CORS_ALLOWED_ORIGINS=https://your-subdomain.example.com`
- All required `DB_*` values
- Dashboard toggles (`ENABLE_*_DASHBOARD`)

## 6. First Deploy (Manual)

```bash
cd /opt/ai-analytics
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Verify:

```bash
curl -fsS "https://$APP_DOMAIN/api/health" | jq
curl -fsS "https://$APP_DOMAIN/api/dashboards" | jq
curl -i "https://$APP_DOMAIN/api/ready"
```

## 7. GitHub Actions Auto-Deploy Setup

Add these repository secrets in GitHub (`Settings > Secrets and variables > Actions`):

- `DO_HOST`: droplet IP or hostname
- `DO_USER`: SSH username
- `DO_SSH_KEY`: private SSH key (deploy key)
- `DO_SSH_PORT`: optional, default `22`
- `APP_DOMAIN`: your public subdomain

Workflow file:
- `.github/workflows/deploy.yml`

Behavior on `push` to `main`:
1. SSH into droplet
2. Sync to `origin/main`
3. Build and recreate containers with production compose
4. Check `https://$APP_DOMAIN/api/health`

## 8. Manual Deploy Commands

```bash
cd /opt/ai-analytics
git fetch origin
git checkout main
git reset --hard origin/main
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --remove-orphans
```

## 9. Rollback Procedure

1. Find previous good commit:
```bash
cd /opt/ai-analytics
git log --oneline -n 20
```

2. Reset to that commit:
```bash
git checkout main
git reset --hard <GOOD_SHA>
```

3. Rebuild/restart:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --remove-orphans
```

Certificate data is preserved in Docker volumes (`caddy_data`, `caddy_config`), so TLS certs are not re-issued on each deploy.

## 10. Troubleshooting

### Health check fails after deploy
- `docker compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=200 backend caddy frontend`
- Validate DB credentials in `.env`
- Check readiness endpoint:
  - `curl -i "https://$APP_DOMAIN/api/ready"`

### DNS/TLS problems
- Confirm DNS resolution:
  - `dig +short your-subdomain.example.com`
- Confirm firewall allows 80/443
- Check Caddy logs for ACME errors

### Workflow SSH failures
- Validate `DO_SSH_KEY` format and access
- Ensure droplet has repo checkout at `/opt/ai-analytics`
- Confirm host key can be scanned and accepted
