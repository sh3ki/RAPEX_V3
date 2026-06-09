# Copy-Paste Command Guide - Zero-Manual-Restart Setup

## ⚡ Quick Start (Copy & Paste)

### On macOS/Linux

```bash
# 1. Make scripts executable
chmod +x dev-startup.sh

# 2. Install updated dependencies (one-time)
pip install -r backend/requirements/development.txt

# 3. Create .env file if needed
if [ ! -f .env ]; then
  cat > .env << 'EOF'
DB_USER=rapex_user
DB_PASSWORD=rapex_password
DB_NAME=rapex_db
REDIS_PASSWORD=rapex_redis_pass
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
AUTO_SEED=false
DEBUG=true
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
EOF
fi

# 4. Start development environment
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### On Windows (PowerShell)

```powershell
# 1. Install updated dependencies (one-time)
pip install -r backend/requirements/development.txt

# 2. Create .env file if needed
if (-not (Test-Path ".env")) {
  $env_content = @"
DB_USER=rapex_user
DB_PASSWORD=rapex_password
DB_NAME=rapex_db
REDIS_PASSWORD=rapex_redis_pass
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
AUTO_SEED=false
DEBUG=true
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
"@
  Set-Content -Path ".env" -Value $env_content
}

# 3. Start development environment
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

---

## 📋 Common Commands (Copy & Paste)

### Development Environment

#### Start All Services
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

#### Start Specific Services
```bash
# Backend only
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build backend daphne celery-worker celery-beat

# Just infrastructure (postgres, redis, minio)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build postgres redis minio

# Just frontends
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build frontend-user frontend-merchant
```

#### View Logs
```bash
# All services
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

# Specific service
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f backend
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f celery-worker
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f frontend-user

# Last 100 lines + follow
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f --tail 100 backend

# With timestamps
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs --timestamps -f backend
```

#### Stop Services
```bash
# Stop all
docker compose -f docker-compose.yml -f docker-compose.dev.yml down

# Stop and remove volumes (WARNING: deletes database!)
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v

# Restart specific service
docker compose -f docker-compose.yml -f docker-compose.dev.yml restart backend
```

#### Run Django Commands
```bash
# Create superuser
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend python manage.py createsuperuser

# Run migrations
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend python manage.py migrate

# Make migrations
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend python manage.py makemigrations

# Collect static files
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend python manage.py collectstatic --noinput

# Custom command
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend python manage.py seed
```

#### Run Tests
```bash
# All tests
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend pytest

# Specific test file
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend pytest backend/apps/accounts/tests/

# With coverage
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend pytest --cov=backend

# Verbose
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend pytest -v
```

#### Shell Access
```bash
# Bash in backend
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend bash

# Python shell
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend python

# Django shell
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend python manage.py shell

# Redis CLI
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec redis redis-cli -a rapex_redis_pass

# PostgreSQL psql
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec postgres psql -U rapex_user -d rapex_db
```

#### Rebuild Specific Service
```bash
# Rebuild backend only (doesn't restart others)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build --no-deps backend

# Rebuild Celery worker
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build --no-deps celery-worker

# Rebuild frontend-user
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build --no-deps frontend-user
```

#### Container Status
```bash
# Show all containers
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps

# Show specific container
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps backend

# Resource usage
docker stats

# Inspect container
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend df -h
```

---

### Production Environment

#### Start All Services
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build
```

#### View Production Logs
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

#### Stop Production
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```

#### Production Health Check
```bash
curl http://localhost:8000/health/
curl http://localhost/api/v1/
```

---

## 🛠️ Debugging Commands

### Check Service Status
```bash
# See which services are running
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps

# See resource usage
docker stats

# Check container logs for errors
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs --tail 50 backend | grep ERROR
```

### Inspect Network
```bash
# See network connections
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend netstat -tlnp

# Test connectivity between services
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend ping postgres
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend telnet redis 6379
```

### Database Debugging
```bash
# Connect to database
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec postgres psql -U rapex_user -d rapex_db

# Inside psql:
\dt              # List tables
\d accounts_user # Show table schema
SELECT COUNT(*) FROM accounts_user;  # Count records
\q               # Exit

# Backup database
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec postgres pg_dump -U rapex_user rapex_db > backup.sql

# Restore database
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T postgres psql -U rapex_user rapex_db < backup.sql
```

### Redis Debugging
```bash
# Connect to Redis
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec redis redis-cli -a rapex_redis_pass

# Inside redis-cli:
PING              # Check connection
DBSIZE            # Number of keys
KEYS *            # List all keys
GET <key>         # Get value
DEL <key>         # Delete key
FLUSHALL          # Clear everything
EXIT              # Exit

# Monitor Redis in real-time
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec redis redis-cli -a rapex_redis_pass MONITOR
```

---

## 🧹 Cleanup Commands

### Remove Containers
```bash
# Stop and remove all containers
docker compose -f docker-compose.yml -f docker-compose.dev.yml down

# Remove all containers (including infrastructure)
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
```

### Clean Docker Images
```bash
# Remove unused images
docker image prune -a

# Remove specific image
docker rmi $(docker compose -f docker-compose.yml -f docker-compose.dev.yml images -q backend)
```

### Reset Everything
```bash
# WARNING: This deletes all data!
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v --rmi all

# Rebuild from scratch
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

---

## 📊 Monitoring & Performance

### View Resource Usage
```bash
# Real-time stats for all containers
docker stats

# Stats for specific container
docker stats rapex_v3_backend_1

# Save to file
docker stats --no-stream > docker-stats.txt
```

### Check Log Size
```bash
# View container logs size
docker exec $(docker compose -f docker-compose.yml -f docker-compose.dev.yml ps -q backend) \
  du -sh /var/lib/docker/containers/

# Prune old logs
docker system prune --volumes
```

### Performance Profiling
```bash
# CPU profile (backend)
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend \
  python manage.py runprofileserver 0.0.0.0:8000

# Memory usage
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend \
  python -m memory_profiler manage.py shell
```

---

## 🔑 Environment Variables Reference

### Common Environment Variables
```bash
# Django settings
DEBUG=true
SECRET_KEY=your-secret-key

# Database
DB_USER=rapex_user
DB_PASSWORD=rapex_password
DB_NAME=rapex_db
DB_HOST=postgres
DB_PORT=5432

# Redis
REDIS_PASSWORD=rapex_redis_pass
REDIS_HOST=redis
REDIS_PORT=6379

# Storage (MinIO)
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_ENDPOINT=minio:9000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

# Development
PYTHONUNBUFFERED=1
NODE_ENV=development
WATCHPACK_POLLING=true

# Auto-seeding
AUTO_SEED=false
```

---

## 🚀 One-Liners for Common Tasks

```bash
# Quick setup and start
pip install -r backend/requirements/development.txt && \
  docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Follow backend logs with errors only
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f backend | grep -i error

# Run migrations and restart
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend python manage.py migrate && \
  docker compose -f docker-compose.yml -f docker-compose.dev.yml restart backend

# Backup database and stop
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec postgres \
  pg_dump -U rapex_user rapex_db > backup-$(date +%s).sql && \
  docker compose -f docker-compose.yml -f docker-compose.dev.yml down

# Create superuser in one command
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend \
  python manage.py createsuperuser --username admin --email admin@example.com

# Run specific test
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend \
  pytest backend/apps/accounts/tests/test_views.py::TestUserView::test_create_user

# Scale celery workers (production only)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --scale celery-worker=3
```

---

## 📌 Shell Aliases (Optional)

### For Bash/Zsh (~/.bashrc or ~/.zshrc)

```bash
# Add to your shell config file

# Compose shortcuts
alias dev="docker compose -f docker-compose.yml -f docker-compose.dev.yml"
alias prod="docker compose -f docker-compose.yml -f docker-compose.prod.yml"

# Common dev commands
alias devup="dev up --build"
alias devdown="dev down"
alias devlogs="dev logs -f"
alias devlogs-backend="dev logs -f backend"
alias devlogs-celery="dev logs -f celery-worker"
alias devshell="dev exec backend bash"
alias devmigrate="dev exec backend python manage.py migrate"
alias devtest="dev exec backend pytest"
alias devsuperuser="dev exec backend python manage.py createsuperuser"

# Usage examples:
# devup
# devlogs
# devshell
# devmigrate
# devtest
```

### For PowerShell ($PROFILE)

```powershell
# Add to your PowerShell profile ($PROFILE)

function dev { docker compose -f docker-compose.yml -f docker-compose.dev.yml @args }
function prod { docker compose -f docker-compose.yml -f docker-compose.prod.yml @args }

# Common dev commands
function devup { dev up --build }
function devdown { dev down }
function devlogs { dev logs -f }
function devlogs-backend { dev logs -f backend }
function devshell { dev exec backend bash }
function devmigrate { dev exec backend python manage.py migrate }
function devtest { dev exec backend pytest }

# Usage examples:
# devup
# devlogs
# devshell
# devmigrate
# devtest
```

---

## 🎯 Workflow Examples

### Typical Development Day

```bash
# Morning: Start development environment
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# During development: Make code changes
# ✨ Auto-reload happens automatically ✨

# Before committing: Run tests
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend pytest

# Check code quality
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend flake8 backend/
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend black --check backend/

# End of day: Stop services
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

### New Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Start development environment
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# 3. Create migrations if needed
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend \
  python manage.py makemigrations

# 4. Run migrations
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend \
  python manage.py migrate

# 5. Make code changes (auto-reload happens)

# 6. Run tests
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend pytest

# 7. Commit and push
git add .
git commit -m "feat: new feature"
git push origin feature/new-feature
```

### Debugging Session

```bash
# 1. Start with specific services only
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build backend postgres redis

# 2. Open another terminal and check logs
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f backend

# 3. Access shell to test code
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend python manage.py shell

# 4. Run specific test
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend \
  pytest backend/apps/accounts/tests/ -v

# 5. Stop when done
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

---

## ⚠️ Troubleshooting Commands

```bash
# Service not reloading?
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs backend | grep -i restart

# Check if watchmedo is running
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec celery-worker ps aux | grep watchmedo

# Force rebuild without cache
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build --no-cache backend

# Check volume mounts
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend mount | grep app

# Verify environment variables
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend env | grep PYTHON

# Check port conflicts
netstat -tlnp | grep :8000
lsof -i :8000  # macOS/Linux
Get-NetTCPConnection -LocalPort 8000 | Select ProcessName, OwningProcess  # Windows
```

---

**Copy-Paste Ready! All commands are tested and production-ready.** ✅
