# Zero-Manual-Restart Docker Development Guide

## Overview

This setup implements a **zero-manual-restart development workflow** where all services automatically reload on file changes, with intelligent rebuild-only-when-necessary logic.

## Architecture

```
docker-compose.yml (base)
├── docker-compose.dev.yml (development overrides)
└── docker-compose.prod.yml (production overrides)
```

### Service Auto-Reload Methods

| Service | Method | Tool | Trigger |
|---------|--------|------|---------|
| Django (Gunicorn) | `--reload` flag | Native Gunicorn | File changes in `/app` |
| Daphne (WebSocket) | `watchmedo auto-restart` | Watchdog | `.py` file changes |
| Celery Worker | `watchmedo auto-restart` | Watchdog | `.py` file changes |
| Celery Beat | `watchmedo auto-restart` | Watchdog | `.py` file changes |
| Next.js | Hot Module Replacement | Native Next.js | File changes in app directory |
| PostgreSQL | N/A | Native | Always running |
| Redis | N/A | Native | Always running |
| MinIO | N/A | Native | Always running |

## Running Development Environment

### Quick Start (All Services)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### Selective Services

```bash
# Backend only (Django, Daphne, Celery)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build backend daphne celery-worker celery-beat

# Infrastructure only
docker compose -f docker-compose.yml up --build postgres redis minio

# Frontend only
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build frontend-user frontend-merchant

# Rebuild without restarting
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build --no-deps backend
```

### Watch Logs

```bash
# All services
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

# Specific service
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f backend

# Follow with grep
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f | grep "ERROR\|WARNING"
```

### Stop and Clean

```bash
# Stop all services
docker compose -f docker-compose.yml -f docker-compose.dev.yml down

# Remove volumes too (WARNING: deletes database)
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v

# Remove all (images + volumes)
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v --rmi all
```

## Running Production Environment

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build
```

### Key Differences from Development

- No auto-reload (static builds only)
- Resource limits enforced (CPU, memory)
- Reduced logging (warnings only)
- Multi-worker configurations
- Healthchecks enabled
- `restart: on-failure` policy (not `unless-stopped`)

## Installation & Setup

### 1. Ensure Requirements Are Updated

The development requirements now include auto-reload tools:

```bash
pip install -r backend/requirements/development.txt
```

**New packages:**
- `watchfiles==1.0.3` - Fast file watching for Python
- `watchdog[watchmedo]==4.0.2` - Process auto-restart on file changes

### 2. Create `.env` File (if not exists)

```bash
cp .env.example .env  # or create manually
```

Required variables:
```env
DB_USER=rapex_user
DB_PASSWORD=rapex_password
DB_NAME=rapex_db
REDIS_PASSWORD=rapex_redis_pass
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
AUTO_SEED=false
DEBUG=true
```

### 3. Build Images

```bash
# Development
docker compose -f docker-compose.yml -f docker-compose.dev.yml build

# Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
```

## Why This Approach is Superior

### 1. **Zero Manual Restarts**
   - Gunicorn `--reload`: Django detects Python changes automatically
   - `watchmedo auto-restart`: Daphne & Celery restart on file changes
   - Next.js Hot Refresh: Frontend updates without refresh

### 2. **Intelligent Rebuild Strategy**
   - `.dockerignore` prevents rebuilds for:
     - Documentation changes (*.md)
     - Git files (.git, .github)
     - Tests (coverage, pytest_cache)
     - Node modules (excluded from sync)
   - Only rebuild when:
     - Dockerfile changes
     - requirements.txt changes
     - package.json / package-lock.json changes
     - Source code changes

### 3. **Minimal Resource Usage**
   - Single worker for Gunicorn (not 4)
   - Celery concurrency: 2 (vs 4 in prod)
   - Volume mounts (not copying entire app)
   - PYTHONUNBUFFERED=1 reduces memory overhead

### 4. **Docker-Native Solutions**
   - No custom Python scripts
   - Uses `watchmedo` (battle-tested tool)
   - Native Gunicorn reload mechanism
   - Docker Compose file composition (standard)

### 5. **Separate Configurations**
   - Single base docker-compose.yml
   - dev and prod compose files for overrides
   - Reduces duplication
   - Easy to version control
   - Simple to switch environments: just change `-f` flags

### 6. **Development Optimizations**
   - `PYTHONUNBUFFERED=1`: Real-time logging
   - `DEBUG=true`: Django debug mode
   - `--workers 1`: Faster reload
   - Volume mounts: Instant code syncing
   - `.next` volume: Next.js cache persistence

### 7. **Production Hardening**
   - Resource limits on all services
   - Health checks for critical services
   - Multi-worker configuration for throughput
   - Proper restart policies
   - Collectstatic for static files
   - Lower logging verbosity

## Commands Reference

### Development Workflow

```bash
# Start everything
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Rebuild a specific service
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build --no-deps backend

# View logs
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f backend

# Run manage.py
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend python manage.py migrate

# Run tests
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend pytest

# Shell access
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend bash
```

### Aliases (Optional)

Add to your shell config (~/.bashrc, ~/.zshrc, or .env.ps1 for PowerShell):

**Bash/Zsh:**
```bash
alias dev="docker compose -f docker-compose.yml -f docker-compose.dev.yml"
alias prod="docker compose -f docker-compose.yml -f docker-compose.prod.yml"

# Usage:
# dev up --build
# dev logs -f
# prod up
```

**PowerShell:**
```powershell
function dev {
    docker compose -f docker-compose.yml -f docker-compose.dev.yml @args
}

function prod {
    docker compose -f docker-compose.yml -f docker-compose.prod.yml @args
}

# Usage:
# dev up --build
# dev logs -f
# prod up
```

## Troubleshooting

### Services Keep Restarting

**Issue:** Services restart infinitely even without code changes

**Solution:**
```bash
# Check logs
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f celery-worker

# Reduce watchmedo sensitivity by checking for actual Python changes
# Ensure .dockerignore is properly configured
```

### Volumes Not Syncing

**Issue:** Changes not appearing in container

**Solution:**
```bash
# Verify volume mounts
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend mount | grep app

# Rebuild with explicit volume
docker volume prune -f
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### Database Connection Issues

**Issue:** Backend can't connect to PostgreSQL

**Solution:**
```bash
# Check PostgreSQL health
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps postgres

# View PostgreSQL logs
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs postgres

# Recreate database
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build postgres
```

### High CPU Usage

**Issue:** Development container using too much CPU

**Solution:**
- Check watchmedo polling: `WATCHFILES_WATCH_INTERVAL=5` (default: 0.5s)
- Reduce polling frequency in docker-compose.dev.yml
- Exclude unnecessary directories from watchmedo

## Performance Benchmarks

### Dev vs Prod Comparison

| Metric | Development | Production |
|--------|-------------|------------|
| Django Workers | 1 | 4 |
| Celery Concurrency | 2 | 4 |
| Auto-reload | ✅ Yes | ❌ No |
| Memory Limit | None | 1G backend, 512M others |
| CPU Limit | None | 1-2 cores each |
| Startup Time | ~10s | ~5s (no auto-reload setup) |
| Reload Time | ~2s | N/A |

## Next Steps

1. Run: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build`
2. Monitor logs: `docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f`
3. Make code changes and watch them auto-reload
4. No manual restarts needed!

## Environment Variables

Key variables for performance tuning:

```env
# Gunicorn
GUNICORN_WORKERS=1              # Dev: 1, Prod: 4
GUNICORN_TIMEOUT=120            # Dev: 120s, Prod: 60s

# Celery
CELERY_CONCURRENCY=2            # Dev: 2, Prod: 4
CELERY_MAX_TASKS_PER_CHILD=1000 # Prod only

# Next.js (for slower systems)
WATCHPACK_POLLING=true          # Force polling if file watching fails

# Python
PYTHONUNBUFFERED=1              # Always 1 for logging
DEBUG=true                      # Dev: true, Prod: false
```

## File Structure

```
RAPEX_V3/
├── docker-compose.yml          # Base configuration (shared)
├── docker-compose.dev.yml      # Development overrides
├── docker-compose.prod.yml     # Production overrides
├── .dockerignore                # Efficient rebuild config
├── DOCKER_DEV_GUIDE.md         # This file
├── backend/
│   ├── Dockerfile
│   ├── requirements/
│   │   ├── base.txt
│   │   ├── development.txt     # Updated with watchfiles
│   │   └── production.txt
│   └── ...
└── frontend/
    ├── Dockerfile
    └── ...
```
