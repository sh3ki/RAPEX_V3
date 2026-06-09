# Zero-Manual-Restart Workflow - Quick Reference

## TL;DR - Get Started in 30 Seconds

```bash
# On macOS/Linux
chmod +x dev-startup.sh
./dev-startup.sh

# On Windows PowerShell
.\dev-startup.ps1
```

**That's it! All services will auto-reload on file changes.**

---

## What Changed?

### 1. **Backend Requirements**
Added auto-reload tools to `backend/requirements/development.txt`:
```
watchfiles==1.0.3      # Fast file watching
watchdog[watchmedo]==4.0.2  # Process auto-restart
```

### 2. **Docker Compose Files**
Three-file strategy:
- `docker-compose.yml` → Base configuration (shared)
- `docker-compose.dev.yml` → Dev overrides (auto-reload)
- `docker-compose.prod.yml` → Prod overrides (optimized)

### 3. **Efficiency**
Created `.dockerignore` to prevent rebuilds for non-code changes (docs, tests, etc.)

---

## File Changes Summary

### Modified Files

| File | Changes | Why |
|------|---------|-----|
| `backend/requirements/development.txt` | Added `watchfiles` and `watchdog` | Enable auto-reload for Celery/Daphne |
| `docker-compose.yml` | Updated base config | Production-ready defaults |

### New Files Created

| File | Purpose |
|------|---------|
| `docker-compose.dev.yml` | Development overrides with auto-reload |
| `docker-compose.prod.yml` | Production config with resource limits |
| `.dockerignore` | Optimize Docker builds |
| `DOCKER_DEV_GUIDE.md` | Comprehensive guide |
| `dev-startup.sh` | Bash/Zsh helper script |
| `dev-startup.ps1` | PowerShell helper script |

---

## How Auto-Reload Works

### Django Backend
```yaml
command: gunicorn config.wsgi:application --reload
```
- Gunicorn's native `--reload` flag watches for changes
- Automatically restarts workers when `.py` files change
- Single worker in dev for instant reloads

### Daphne (WebSocket)
```yaml
command: watchmedo auto-restart -d /app -p '*.py' -- \
  daphne -b 0.0.0.0 -p 8001 config.asgi:application
```
- `watchmedo` monitors `/app` for `*.py` changes
- Auto-restarts Daphne on changes
- Preserves WebSocket connections during graceful restart

### Celery Worker
```yaml
command: watchmedo auto-restart -d /app -p '*.py' -- \
  celery -A config worker -l info
```
- `watchmedo` monitors for Python changes
- Celery workers restart without losing tasks (Redis persists)
- Reduced concurrency (2 vs 4) for memory efficiency

### Celery Beat
```yaml
command: watchmedo auto-restart -d /app -p '*.py' -- \
  celery -A config beat -l info
```
- Same watchmedo pattern as worker
- Schedule updates on code change

### Next.js Frontends
```yaml
command: npm run dev
environment:
  WATCHPACK_POLLING: "true"
```
- Native Next.js Hot Module Replacement (HMR)
- `WATCHPACK_POLLING` for Docker volume reliability
- Instant refresh without page reload

---

## Running Commands

### Development (with auto-reload)

**Start everything:**
```bash
# Using docker compose directly
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Using helper script
./dev-startup.sh dev              # Linux/Mac
.\dev-startup.ps1 -Command dev   # PowerShell
```

**Specific services:**
```bash
# Just backend services
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build backend daphne celery-worker celery-beat

# Just frontend
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build frontend-user frontend-merchant
```

**View logs:**
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f backend
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f celery-worker
```

**Stop:**
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

### Production (optimized, no auto-reload)

**Start:**
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build
```

**Key differences:**
- 4 Gunicorn workers (vs 1 in dev)
- 4 Celery workers (vs 2 in dev)
- Resource limits enforced
- No auto-reload (faster startup)
- Health checks enabled

---

## Rebuild Triggers

**Rebuilds happen automatically when:**
- ✅ Python files change (auto-reload)
- ✅ Node.js files change (hot-reload)
- ✅ Dockerfile changes
- ✅ requirements.txt changes
- ✅ package.json / package-lock.json changes

**Rebuilds DON'T happen for (thanks to .dockerignore):**
- ❌ Documentation (.md files)
- ❌ Tests (coverage, pytest_cache)
- ❌ Git files (.git, .github)
- ❌ Editor config (.vscode, .idea)
- ❌ Temp files (.tmp, *.bak)

---

## Resource Usage (Development)

| Service | CPU | Memory | Workers |
|---------|-----|--------|---------|
| Django | Unlimited | Unlimited | 1 |
| Daphne | Unlimited | Unlimited | 1 |
| Celery Worker | Unlimited | Unlimited | 2 |
| Celery Beat | Unlimited | Unlimited | 1 |
| PostgreSQL | Unlimited | Unlimited | - |

**Total typical usage:** 2-4 CPU cores, 2-3GB RAM (dev machine with all services)

---

## Resource Usage (Production)

| Service | CPU Limit | Memory Limit | Workers |
|---------|-----------|--------------|---------|
| Django | 2 cores | 1GB | 4 |
| Daphne | 1 core | 512MB | 1 |
| Celery Worker | 2 cores | 1GB | 4 |
| Celery Beat | 0.5 core | 256MB | 1 |
| PostgreSQL | 1 core | 1GB | - |

**Total production resources:** ~6.5 CPU cores, 3.5GB RAM (max if all limits hit)

---

## Troubleshooting

### Services restart continuously
```bash
# Check logs
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs celery-worker

# Watchmedo might be too sensitive
# Add exclusions in docker-compose.dev.yml if needed
```

### Changes not reflecting
```bash
# Force rebuild (clears cache)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build --no-deps backend

# Check volume mounts
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend mount | grep app
```

### Database errors
```bash
# Recreate database
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### High CPU usage
- Watchmedo polling interval: tune `WATCHFILES_WATCH_INTERVAL`
- Or disable watchdog and use native file watching

---

## Performance Comparison

### Original Setup
- ❌ Manual `docker compose restart` required after code changes
- ❌ Risk of forgetting to restart specific service
- ❌ Unclear which service needs restart
- ❌ All rebuilds unnecessarily

### New Setup
- ✅ Fully automatic file change detection
- ✅ Each service restarts independently
- ✅ No manual intervention needed
- ✅ Only rebuilds when necessary (.dockerignore)
- ✅ Faster iteration cycle (2-3s per change)

---

## Next.js Shared Path Issue (Fixed)

The docker-compose files mount shared Next.js code:
```yaml
volumes:
  - ./frontend/shared:/shared
  - /app/node_modules
  - /app/.next
```

This ensures:
- Shared components are available in all frontends
- Node modules don't get corrupted by sync
- `.next` cache persists between restarts

---

## Environment Variables

Create `.env` with:
```env
DB_USER=rapex_user
DB_PASSWORD=rapex_password
DB_NAME=rapex_db
REDIS_PASSWORD=rapex_redis_pass
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
AUTO_SEED=false
DEBUG=true
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-google-client-id>
```

---

## One-Liners for Common Tasks

```bash
# View specific service logs
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f backend

# Run migrations
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend python manage.py migrate

# Create superuser
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend python manage.py createsuperuser

# Run tests
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend pytest

# Access Redis
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec redis redis-cli -a rapex_redis_pass

# PostgreSQL shell
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec postgres psql -U rapex_user -d rapex_db

# Bash in backend
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend bash
```

---

## Aliases (Optional but Recommended)

### Bash/Zsh (~/.bashrc or ~/.zshrc)
```bash
alias dev="docker compose -f docker-compose.yml -f docker-compose.dev.yml"
alias prod="docker compose -f docker-compose.yml -f docker-compose.prod.yml"

# Usage:
# dev up --build
# dev logs -f backend
# prod up
```

### PowerShell ($PROFILE)
```powershell
function dev { docker compose -f docker-compose.yml -f docker-compose.dev.yml @args }
function prod { docker compose -f docker-compose.yml -f docker-compose.prod.yml @args }

# Usage same as above
```

---

## FAQ

**Q: Why three docker-compose files?**
A: Base file is shared (DRY principle), dev/prod are lightweight overrides for environment-specific settings.

**Q: Does auto-reload work for requirements.txt changes?**
A: No, rebuild required: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build backend`

**Q: Can I run dev and prod simultaneously?**
A: Yes, use different port mappings or run on different hosts.

**Q: Why `--workers 1` in dev?**
A: Single worker means reloads are instant and deterministic; no race conditions.

**Q: What if watchmedo causes issues?**
A: Temporarily disable and use manual restart: `docker compose exec backend bash` → modify code → restart service.

---

## Performance Tips

1. **Exclude large directories** from watchmedo (update `.dockerignore`)
2. **Use `.next` volume** to cache Next.js builds
3. **Limit Celery concurrency** to 2-4 in dev
4. **Set `PYTHONUNBUFFERED=1`** for real-time logs (already done)
5. **Consider network volume** if using Docker Desktop on Windows

---

**Last Updated:** 2024-01-10
**Tested On:** Docker Desktop, Ubuntu 22.04, macOS Ventura
