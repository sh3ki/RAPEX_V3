# RAPEX Technologies OPC

> **Hyper-local same-day delivery platform** — The Shopee + Grab of the Filipino community.  
> Order from your neighborhood shops, get it delivered immediately by a community rider.

---

## What is RAPEX?

RAPEX is a hyper-local e-commerce and on-demand delivery platform built for Filipino communities. Think Shopee combined with GrabExpress — users browse and order from 4 types of local stores (Shop, Fresh Market, Ready-to-Eat Food, and Pre-Loved), and orders are delivered immediately by local riders, typically within 10–25 minutes.

The platform connects:
- **Merchants** — local store owners who want fast, digital order management
- **Riders** — community delivery riders earning per delivery + weekly incentives
- **Customers (Users)** — community residents ordering from nearby stores
- **Admins** — RAPEX operations staff managing the platform
- **SuperAdmin** — RAPEX ownership with full platform control

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Backend | Django + Django REST Framework | 5.x / 3.x |
| Frontend Web | Next.js (React) | 14+ |
| Mobile App | React Native (Expo) | Latest Stable |
| Database | PostgreSQL | 16 |
| Cache | Redis | 7.x |
| Task Queue | Celery | 5.x |
| Real-Time | Django Channels + Redis Channel Layer | 4.x |
| Push Notifications | Firebase Cloud Messaging (FCM) | Latest |
| Push Fallback | OneSignal | Latest |
| Maps | Google Maps Platform SDK | Latest |
| OTP / SMS | Semaphore PH API | v1 |
| File Storage | MinIO (self-hosted) or Cloudflare R2 | Latest |
| Proxy | Nginx | 1.25+ |
| WSGI Server | Gunicorn | 21.x |
| DB Pooling | PgBouncer | 1.21+ |
| Auth | JWT (simplejwt) + OTP | Latest |
| Containerization | Docker + Docker Compose | 24.x / v2 |
| UI Dashboard | Apex Dashboard - exact copy | Latest |

---

## Architecture

```
MODULAR MONOLITH
Single deployable unit with internally isolated modules.

Modules:
  core              ← Base config, shared utilities, permissions
  accounts          ← User, Merchant, Rider, Admin, SuperAdmin models & auth
  superadmin        ← SuperAdmin panel API & logic
  admin_panel       ← Admin operations API & logic
  merchant          ← Merchant store management
  shop              ← Shop (general merchandise) module
  fresh_market      ← Fresh Market (raw produce) module
  ready_to_eat      ← Ready-to-Eat (cooked food) module
  preloved          ← Pre-Loved (second-hand) module
  orders            ← Order state machine & core order logic
  delivery          ← Delivery pricing, rider assignment, vehicle logic
  rider             ← Rider operations, wallet, remittance
  wallet            ← Wallet engine for all roles
  notifications     ← FCM, OneSignal, SMS, in-app notifications
  messaging         ← Chat threads (Admin ↔ all roles)
  referrals         ← Referral QR codes, points engine
  reports           ← Business analytics, reports generation
  fraud             ← Fraud detection, blacklist, investigations
  settings          ← Platform-wide configuration
```

---

## Domain Structure

```
app.rapex.ph            → User web app (Next.js)
merchant.rapex.ph       → Merchant dashboard (Next.js)
rider.rapex.ph          → Rider dashboard (Next.js)
admin.rapex.ph          → Admin dashboard (Next.js)
superadmin.rapex.ph     → SuperAdmin dashboard (Next.js)
api.rapex.ph            → Django REST API
ws.rapex.ph             → Django Channels WebSocket
```

For local development:
```
localhost:3000          → User app (Next.js)
localhost:3001          → Merchant dashboard
localhost:3002          → Rider dashboard
localhost:3003          → Admin dashboard
localhost:3004          → SuperAdmin dashboard
localhost:8000          → Django API
localhost:8001          → Django Channels WebSocket
```

---

## Prerequisites

**Option A — Docker (Recommended):**
- Docker Desktop 4.x+ (Windows / macOS) or Docker Engine 24.x + Docker Compose v2 (Linux)
- Android Studio (for mobile development)
- Expo CLI (`npm install -g expo-cli`)
- Google Maps API key (with Places, Directions, Maps JS, Maps Android/iOS enabled)
- Firebase project with FCM enabled
- Semaphore SMS API key (Philippines)

**Option B — Manual:**
- Python 3.12+
- Node.js 20+
- PostgreSQL 16
- Redis 7
- Android Studio (for mobile development)
- Expo CLI (`npm install -g expo-cli`)
- MinIO or Cloudflare R2 account (for file storage)
- Google Maps API key (with Places, Directions, Maps JS, Maps Android/iOS enabled)
- Firebase project with FCM enabled
- Semaphore SMS API key (Philippines)

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/rapex-technologies/rapex-v3.git
cd rapex-v3
```

---

### Option A: Docker Setup (Recommended)

Docker Compose starts **all backend services** (Django, Celery, Daphne, PostgreSQL, PgBouncer, Redis, MinIO, Nginx, all 5 Next.js frontends) with a single command.

```bash
# Copy environment file
cp .env.example .env
# Edit .env with your API keys (Google Maps, Firebase, Semaphore)

# Build and start all services
docker compose up --build

# In a separate terminal: run migrations
docker compose exec backend python manage.py migrate

# Create superadmin account
docker compose exec backend python manage.py create_superadmin

# Load initial fixtures
docker compose exec backend python manage.py loaddata fixtures/initial_settings.json
```

Services available after `docker compose up`:

| Service | Local URL |
|---|---|
| Django API | `http://localhost:8000` |
| Django Channels (WS) | `ws://localhost:8001` |
| User App | `http://localhost:3000` |
| Merchant Dashboard | `http://localhost:3001` |
| Rider Dashboard | `http://localhost:3002` |
| Admin Dashboard | `http://localhost:3003` |
| SuperAdmin Dashboard | `http://localhost:3004` |
| MinIO Console | `http://localhost:9001` |
| PostgreSQL | `localhost:5432` |
| Redis | `localhost:6379` |

Useful Docker commands:

```bash
# View logs for a specific service
docker compose logs -f backend
docker compose logs -f celery-worker

# Run Django management commands
docker compose exec backend python manage.py shell
docker compose exec backend python manage.py makemigrations

# Stop all services
docker compose down

# Stop and remove volumes (wipes database)
docker compose down -v

# Rebuild a single service after code change
docker compose up --build backend
```

> **Mobile app (React Native/Expo)** is NOT run in Docker — see Option B Step 4 below.

---

### Option B: Manual Setup

### 2. Backend (Django)

```bash
# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with your values (see Environment Variables section)

# Run database migrations
python manage.py migrate

# Create superadmin account
python manage.py create_superadmin

# Load initial fixtures (settings, markup tiers, etc.)
python manage.py loaddata fixtures/initial_settings.json

# Start Django development server
python manage.py runserver 8000

# In a separate terminal: Start Celery worker
celery -A rapex worker -l info

# In a separate terminal: Start Celery beat (scheduled tasks)
celery -A rapex beat -l info

# In a separate terminal: Start Django Channels (ASGI)
daphne -b 0.0.0.0 -p 8001 rapex.asgi:application
```

### 3. Frontend Web Apps (Next.js)

Each role has its own Next.js app under `frontend/`:

```bash
# User App
cd frontend/user
npm install
cp .env.local.example .env.local
npm run dev      # Starts on port 3000

# Merchant Dashboard
cd frontend/merchant
npm install
cp .env.local.example .env.local
npm run dev      # Starts on port 3001

# Rider Dashboard
cd frontend/rider
npm install
npm run dev      # Starts on port 3002

# Admin Dashboard
cd frontend/admin
npm install
npm run dev      # Starts on port 3003

# SuperAdmin Dashboard
cd frontend/superadmin
npm install
npm run dev      # Starts on port 3004
```

Shared UI rule (mandatory):
- Build reusable dashboard UI in `frontend/shared/src` first.
- Role apps consume shared components through `@shared/*` and keep only thin wrappers for role-specific navigation/context.
- Do not duplicate common components (Sidebar, TopBar, DashboardLayout, DataTable, badges, stat cards, shared form controls) inside role apps.

### 4. Mobile App (React Native)

```bash
cd mobile
npm install
cp .env.example .env
# Edit .env with API_BASE_URL, GOOGLE_MAPS_API_KEY, FCM_CONFIG

# Start Expo
npx expo start

# Build for Android (development)
npx expo run:android
```

---

## Environment Variables

### Backend `.env`

```env
# Django
SECRET_KEY=your-django-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,api.rapex.ph

# Database
DATABASE_URL=postgresql://rapex_user:password@localhost:5432/rapex_db
PGBOUNCER_URL=postgresql://rapex_user:password@localhost:6432/rapex_db

# Redis
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1
CHANNEL_LAYERS_URL=redis://localhost:6379/2

# JWT
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=15
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

# SMS (Semaphore)
SEMAPHORE_API_KEY=your-semaphore-api-key
SEMAPHORE_SENDER_NAME=RAPEX

# Firebase FCM
FIREBASE_CREDENTIALS_JSON=path/to/firebase-credentials.json
# OR
FIREBASE_CREDENTIALS_JSON_STRING={"type":"service_account",...}

# Google Maps
GOOGLE_MAPS_API_KEY=your-google-maps-server-key

# File Storage — MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=your-minio-access-key
MINIO_SECRET_KEY=your-minio-secret-key
MINIO_BUCKET_NAME=rapex-media
MINIO_SECURE=False

# OR — Cloudflare R2
CLOUDFLARE_R2_ACCOUNT_ID=your-account-id
CLOUDFLARE_R2_ACCESS_KEY=your-access-key
CLOUDFLARE_R2_SECRET_KEY=your-secret-key
CLOUDFLARE_R2_BUCKET_NAME=rapex-media

# Email (for admin 2FA codes)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=noreply@rapex.ph
EMAIL_HOST_PASSWORD=your-email-password

# OneSignal (Web push fallback)
ONESIGNAL_APP_ID=your-onesignal-app-id
ONESIGNAL_REST_API_KEY=your-onesignal-rest-api-key

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:3004

# Platform defaults (can also be changed via admin dashboard)
DEFAULT_RIDER_RADIUS_KM=2
DEFAULT_INCENTIVE_DELIVERY_TARGET=40
DEFAULT_INCENTIVE_BONUS_AMOUNT=250
WALLET_THRESHOLD_FOR_LARGE_ORDERS=1001
```

### Frontend `.env.local` (per app)

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8001
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-browser-key
NEXT_PUBLIC_ONESIGNAL_APP_ID=your-onesignal-app-id
```

### Mobile `.env`

```env
API_BASE_URL=http://localhost:8000
WS_BASE_URL=ws://localhost:8001
GOOGLE_MAPS_API_KEY=your-google-maps-android-key
EXPO_PUBLIC_FCM_SENDER_ID=your-fcm-sender-id
```

---

## Project Directory Structure

```
rapex-v3/
├── backend/                        ← Django project root
│   ├── rapex/                      ← Django project config
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   ├── urls.py
│   │   ├── asgi.py
│   │   └── wsgi.py
│   ├── core/                       ← Shared utilities, base models
│   ├── accounts/                   ← All user/role models, auth
│   ├── superadmin/                 ← SuperAdmin APIs
│   ├── admin_panel/                ← Admin APIs
│   ├── merchant/                   ← Merchant store APIs
│   ├── shop/                       ← Shop module
│   ├── fresh_market/               ← Fresh Market module
│   ├── ready_to_eat/               ← Ready-to-Eat module
│   ├── preloved/                   ← Pre-Loved module
│   ├── orders/                     ← Order engine
│   ├── delivery/                   ← Delivery & rider assignment
│   ├── rider/                      ← Rider operations
│   ├── wallet/                     ← Wallet engine
│   ├── notifications/              ← Notification service
│   ├── messaging/                  ← Chat system
│   ├── referrals/                  ← Referral engine
│   ├── reports/                    ← Analytics & reports
│   ├── fraud/                      ← Fraud detection
│   ├── settings_module/            ← Platform settings
│   ├── fixtures/                   ← Initial data fixtures
│   ├── requirements.txt
│   ├── manage.py
│   └── .env.example
│
├── frontend/                       ← All Next.js apps
│   ├── user/                       ← app.rapex.ph
│   ├── merchant/                   ← merchant.rapex.ph
│   ├── rider/                      ← rider.rapex.ph
│   ├── admin/                      ← admin.rapex.ph
│   ├── superadmin/                 ← superadmin.rapex.ph
│   └── shared/                     ← Shared components, hooks, utils
│       ├── components/             ← Apex Dashboard components
│       ├── hooks/                  ← Custom React hooks
│       ├── lib/                    ← API client, WS client
│       └── types/                  ← TypeScript types
│
├── mobile/                         ← React Native (Expo) app
│   ├── app/                        ← Expo Router file-based routing
│   │   ├── (auth)/                 ← Login, Register, OTP screens
│   │   ├── (user)/                 ← User app tabs
│   │   ├── (merchant)/             ← Merchant app screens
│   │   └── (rider)/                ← Rider app screens
│   ├── components/                 ← Shared RN components
│   ├── hooks/                      ← Custom hooks
│   ├── lib/                        ← API client, WS client, storage
│   ├── assets/                     ← Images, fonts, icons
│   └── app.json
│
├── nginx/                          ← Nginx configs
│   ├── nginx.conf
│   └── sites-available/
│
├── docker/                         ← Docker configs for deployment
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── docker-compose.yml
│
├── docs/                           ← Project documentation
│   ├── PROJECT_OVERVIEW.md
│   ├── PROJECT_FEATURE_LIST.md
│   ├── BLUEPRINT.md
│   ├── DEVGUIDE.md
│   └── API_REFERENCE.md
│
├── README.md
├── TODO.md
└── PROGRESS.md
```

---

## Running Tests

```bash
# Backend unit tests
cd backend
python manage.py test --verbosity=2

# Run specific module tests
python manage.py test orders.tests

# Frontend tests
cd frontend/user
npm run test

# E2E tests (Playwright)
cd tests/e2e
npx playwright test
```

---

## Build & Deployment

### Production Build

```bash
# Build Next.js apps
cd frontend/user && npm run build
cd frontend/merchant && npm run build
# ... repeat for all frontend apps

# Collect Django static files
cd backend
python manage.py collectstatic --noinput

# Build mobile APK
cd mobile
npx expo build:android --type apk
```

### Server Deployment (Hostinger VPS)

**Docker Deployment (Recommended):**

```bash
# Pull latest code
git pull origin main

# Build and restart all services in detached mode
docker compose -f docker-compose.prod.yml up --build -d

# Run any new migrations
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Collect static files
docker compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput

# View logs
docker compose -f docker-compose.prod.yml logs -f backend
```

**Manual Deployment (Fallback):**

```bash
# Pull latest code
git pull origin main

# Backend: install new dependencies, migrate, restart
pip install -r requirements.txt
python manage.py migrate
sudo systemctl restart gunicorn
sudo systemctl restart daphne
sudo systemctl restart celery
sudo systemctl restart celery-beat

# Frontend: rebuild and restart
npm run build
sudo systemctl restart nginx
```

---

## API Documentation

- Local: `http://localhost:8000/api/docs/` (Swagger UI via drf-spectacular)
- Local: `http://localhost:8000/api/redoc/` (ReDoc)
- Production: `https://api.rapex.ph/docs/` (restricted to admin IPs)

---

## Contribution Guidelines

1. Create a feature branch: `git checkout -b feature/module-name-description`
2. Follow the coding conventions in `DEVGUIDE.md`
3. Write tests for new API endpoints
4. Submit a PR with a description of changes
5. All PRs require at least one review before merge

---

## Auth and Merchant Onboarding Update (April 2026)

- Global web auth uses Google OAuth + magic-link for user, rider, admin, and superadmin dashboards.
- Merchant auth uses email-or-username + password login and Google login; signup keeps magic-link and Google.
- Merchant magic-link verification now uses a dedicated callback route (`/auth/callback`) instead of login-page query parsing.
- Backend auth now supports identity merge-by-email, role mismatch guarding, and role-aware auto-provision on magic-link verification.
- Merchant onboarding is normalized into dedicated models:
  - Merchant business categories and business types
  - Merchant business profile
  - Merchant location
  - Merchant documents
  - Merchant onboarding state
- Merchant flow now uses a 5-step wizard with draft persistence (session + backend state), OTP verification (email + phone), legal acknowledgments, and final submit-to-pending flow.
- Onboarding step 1 now requires profile image upload, password + confirm password, username validation, and phone country-code input.
- Merchant dashboard access is gated until onboarding is complete and account status is approved.
- Seed command keeps onboarding business category/type catalog but intentionally does not seed merchant accounts.

---

## Platform Quick Reference

| Item | Value |
|---|---|
| MVP Launch Target | January 1, 2026 |
| Current Phase | MVP Build |
| Primary Market | Batangas Province, Philippines |
| MVP User Target | 100,000 registered |
| Concurrent Session Target | 10,000 |
| Default Rider Radius | 2 km |
| Wallet Threshold | ₱1,001+ orders require wallet |
| Rider Incentive | 40 deliveries/week = ₱250 bonus |
| Markup Range | 5% – 15% (tiered by order value) |
| Platform Fee | 10% of collected commission |

---

## License

Proprietary Software — RAPEX Technologies OPC  
© 2026 RAPEX Technologies OPC. All rights reserved.  
Unauthorized use, reproduction, or distribution is prohibited.
