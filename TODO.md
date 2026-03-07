# RAPEX Technologies OPC — FULL PROJECT TODO

> **Version:** 1.0 MVP  
> **Status:** Pre-Build  
> **Track:** Mark each item `[x]` when complete · `[~]` when in-progress

---

## PHASE 0 — INFRASTRUCTURE SETUP

### 0.1 Server & Domain
- [ ] Provision Hostinger VPS (Ubuntu 22.04 LTS, recommended 8GB RAM / 4 vCPU)
- [ ] Configure SSH access with keypair (disable password auth)
- [ ] Register domain `rapex.ph` and configure DNS via Cloudflare
- [ ] Point subdomains: `api`, `ws`, `app`, `merchant`, `rider`, `admin`, `superadmin`
- [ ] Install system packages: `python3.12`, `postgresql-16`, `redis-server`, `nginx`, `certbot`
- [ ] Install Node.js 20.x (for Next.js build)
- [ ] Install PM2 (Next.js process manager)

### 0.2 Database
- [ ] Create PostgreSQL user `rapex_user` with strong password
- [ ] Create databases: `rapex_prod`, `rapex_staging`, `rapex_dev`
- [ ] Configure PostgreSQL: `max_connections=200`, `shared_buffers=2GB`
- [ ] Install PgBouncer, configure pooling (transaction mode, port 6432)
- [ ] Enable daily automated backup with `pg_dump` → upload to R2/MinIO

### 0.3 Cache & Queue
- [ ] Configure Redis: `maxmemory 1gb`, `maxmemory-policy allkeys-lru`
- [ ] Enable Redis persistence: `appendonly yes`
- [ ] Set Redis password in config
- [ ] Test Redis connection from Django

### 0.4 File Storage
- [ ] Install MinIO on VPS (port 9000) OR create Cloudflare R2 bucket
- [ ] Create bucket: `rapex-media`
- [ ] Create bucket policy: product images = public, KYC = private
- [ ] Test file upload + signed URL generation from Django

### 0.5 SSL Certificates
- [ ] Install SSL for `api.rapex.ph` via Certbot
- [ ] Install SSL for `ws.rapex.ph`
- [ ] Install SSL for all 5 frontend subdomains
- [ ] Configure auto-renewal cron

### 0.6 Nginx
- [ ] Install Nginx
- [ ] Configure virtualhost for `api.rapex.ph` → Gunicorn :8000
- [ ] Configure virtualhost for `ws.rapex.ph` → Daphne :8001 (WebSocket upgrade)
- [ ] Configure 5 frontend virtualhosts → Next.js apps
- [ ] Enable Nginx gzip compression
- [ ] Configure rate limiting on `/api/v1/auth/` endpoints

### 0.7 Docker
- [ ] Install Docker Engine 24.x on VPS
- [ ] Install Docker Compose v2 (plugin)
- [ ] Create `backend/Dockerfile` (python:3.12-slim base, multi-stage for prod)
- [ ] Create `backend/.dockerignore`
- [ ] Create root `docker-compose.yml` (development — volume mounts, hot-reload)
- [ ] Create root `docker-compose.prod.yml` (production — pre-built images, no mounts)
- [ ] Create `Dockerfile` for each of the 5 Next.js frontend apps (node:20-alpine)
- [ ] Define all named volumes: `postgres-data`, `redis-data`, `minio-data`, `static-files`
- [ ] Configure all environment variables via `.env` (Docker reads root `.env`)
- [ ] Verify all 14 services start cleanly with `docker compose up --build`

---

## PHASE 1 — BACKEND FOUNDATION

### 1.1 Django Project Scaffold
- [ ] Create virtual environment (Python 3.12)
- [ ] Create Django project structure (`config/settings/base.py`, `development.py`, `production.py`)
- [ ] Configure `INSTALLED_APPS` (DJANGO_APPS, THIRD_PARTY_APPS, LOCAL_APPS)
- [ ] Configure `DATABASE` from `DATABASE_URL` env var
- [ ] Configure `CACHES` → Redis backend
- [ ] Configure `CHANNEL_LAYERS` → Redis channel layer
- [ ] Configure `CELERY_BROKER_URL` + `CELERY_RESULT_BACKEND`
- [ ] Configure `REST_FRAMEWORK` (JWT auth, custom exception handler, StandardPagination)
- [ ] Configure `CORS_ALLOWED_ORIGINS`
- [ ] Configure JWT settings (15min access, 7d refresh, rotate=True)
- [ ] Configure file storage (MinIO/S3 when `USE_S3=True`, local otherwise)
- [ ] Configure LOGGING (file + console, INFO in prod)
- [ ] Write `.env.example` with all required variables
- [ ] Configure systemd services for Gunicorn + Daphne + Celery Worker + Celery Beat
- [ ] Set up `requirements/base.txt`, `development.txt`, `production.txt` (pinned versions)

### 1.2 core Module
- [ ] Create `apps/core/` app
- [ ] `BaseModel`: UUID PK, created_at, updated_at, is_deleted, deleted_at, `soft_delete()`
- [ ] `SoftDeleteManager` (default manager filters `is_deleted=False`)
- [ ] `AllObjectsManager` (no filter — for admin use)
- [ ] Permission classes: `IsUser`, `IsMerchant`, `IsRider`, `IsAdmin`, `IsSuperAdmin`, `IsAdminOrSuperAdmin`, `IsKYCApproved`, `IsRiderOnline`
- [ ] Exception classes: `RapexAPIException`, `InsufficientBalanceError`, `OrderNotCancellable`, `StoreCurrentlyClosed`, `KYCNotApproved`, `RiderOffline`, `InvalidOTP`, `OTPExpired`, `OTPRateLimitExceeded`
- [ ] Pagination classes: `StandardPagination` (50), `LargePagination` (100), `SmallPagination` (20)
- [ ] `RapexJSONRenderer` (wraps all responses: `{success, data, message}`)
- [ ] `custom_exception_handler` (formats DRF exceptions through renderer)
- [ ] `AuditMixin` for views

### 1.3 accounts Module
- [ ] `CustomUser` model (extends `AbstractBaseUser`, `USERNAME_FIELD='phone'`)
- [ ] `SuperAdminProfile`, `AdminProfile` (with `permissions JSONB`), `MerchantProfile`, `RiderProfile`, `UserProfile` models
- [ ] `OTPRecord` model with rate-limiting logic (3 attempts / 15 min)
- [ ] `OTPService.request_otp()` → Semaphore SMS dispatch
- [ ] `OTPService.verify_otp()` → return temp_token (10min JWT)
- [ ] `AuthService.register_user()`, `register_merchant()`, `register_rider()`
- [ ] `DeviceFingerprintService` (SHA256, validate on each request via middleware)
- [ ] JWT login endpoint: access token (response header) + refresh (httpOnly cookie)
- [ ] Auto-logout on fingerprint mismatch
- [ ] OTP endpoints: `/auth/otp/request/`, `/auth/otp/verify/`
- [ ] Registration endpoints: `/auth/register/user/`, `/auth/register/merchant/`, `/auth/register/rider/`
- [ ] Token endpoints: `/auth/token/`, `/auth/token/refresh/`, `/auth/logout/`
- [ ] Profile endpoints: GET/PATCH `/[role]/profile/`
- [ ] KYC upload endpoint: POST `/[role]/profile/kyc/` (multipart)
- [ ] Write unit tests for all auth flows

---

## PHASE 2 — PLATFORM SETTINGS

### 2.1 settings_module
- [ ] `PlatformSetting` model (key-value store with value_type)
- [ ] `MarkupTier` model (per store_type, price range → markup rate)
- [ ] `CommissionTier` model
- [ ] `SettingsService.get()` (Redis cache, fallback DB, TTL 5min)
- [ ] `SettingsService.set()` (update DB, invalidate cache)
- [ ] `SettingsService.calculate_markup()` (returns markup_rate + final_price)
- [ ] `SettingsService.calculate_delivery_fare()` (vehicle_type, speed, distance_km)
- [ ] Management command: `load_initial_settings` (seed all defaults)
- [ ] API: SuperAdmin settings CRUD
- [ ] API: Admin limited settings read/write

---

## PHASE 3 — MERCHANT & STORE MODULES

### 3.1 merchant Module
- [ ] `MerchantStore` model (4 store types, max 1 per type per merchant)
- [ ] `StoreSchedule` model
- [ ] `MerchantMarkupOverride` model
- [ ] `MerchantService.create_store()` (enforce 4-store max)
- [ ] `MerchantService.toggle_open()` + WebSocket broadcast
- [ ] `MerchantService.get_nearby_stores()` (Haversine distance filter)
- [ ] Merchant store CRUD API
- [ ] Store open/close toggle API
- [ ] User-facing nearby stores API (`/user/merchants/`)
- [ ] Celery task: `auto_close_stores_by_schedule()` (Beat: daily)

### 3.2 shop Module
- [ ] `ShopCategory` model
- [ ] `ShopProduct` model (base_price → markup applied → final_price stored)
- [ ] Markup applied on product save using `SettingsService.calculate_markup()`
- [ ] Product CRUD API (merchant-side)
- [ ] Product listing API (user-side, filter by store)
- [ ] Toggle availability per product
- [ ] Promo price support (`is_on_promo`, `promo_original_price`)
- [ ] Inventory management (`has_inventory`, `stock_qty`) + auto-mark unavailable at 0 stock

### 3.3 fresh_market Module
- [ ] `FreshProduct` model (pricing_mode: PER_PIECE/PER_KILO/PER_100G/PER_PACK/PER_BUNDLE)
- [ ] Freshness status ENUM: `FRESH_TODAY`, `LIMITED`, `OUT_OF_STOCK`
- [ ] `auto_reset_daily` flag + Celery Beat task: daily reset at midnight
- [ ] Product CRUD API (merchant-side)
- [ ] Product listing API (user-side)

### 3.4 ready_to_eat Module
- [ ] `MenuCategory`, `MenuItem`, `MenuItemVariant` (serving sizes with price), `MenuItemAddOn` models
- [ ] `ReadyToEatStoreSettings` model (default_prep_time)
- [ ] Store hours enforcement (reject orders outside schedule)
- [ ] Menu CRUD API (merchant-side)
- [ ] Menu listing API (user-side)
- [ ] Sold-out toggle per menu item

### 3.5 preloved Module
- [ ] `PreLovedCategory`, `PreLovedListing` models
- [ ] Condition ENUM: `NEW`, `LIKE_NEW`, `GOOD`, `FAIR`, `FOR_PARTS`
- [ ] Availability status: `AVAILABLE`, `RESERVED`, `SOLD`
- [ ] Negotiable pricing flag
- [ ] Listing CRUD API (merchant-side)
- [ ] Listing browsing API (user-side, filter by condition/price/category)

---

## PHASE 4 — WALLET MODULE

- [ ] `RapexWallet` model (UNIQUE owner_id + owner_type)
- [ ] `WalletTransaction` model (all transaction types)
- [ ] `RiderRemittanceRecord` model
- [ ] `UserLoyaltyPoints` model
- [ ] `PointsTransaction` model
- [ ] `WalletService.credit()` (select_for_update, atomic)
- [ ] `WalletService.debit()` (atomic, InsufficientBalanceError if negative)
- [ ] `WalletService.process_top_up()` (overdue remittance auto-deduct first)
- [ ] `WalletService.process_order_payment()` (debit rider at pickup)
- [ ] `WalletService.deduct_commission()` (after delivery)
- [ ] `WalletService.credit_initial_load()` (₱500 on rider KYC approval)
- [ ] `LoyaltyPointsService.credit_points()`, `redeem_points()`
- [ ] `RemittanceService.create_weekly_remittance()` (Celery Beat every Monday)
- [ ] `RemittanceService.mark_overdue()` (Celery Beat daily)
- [ ] Rider wallet balance + transaction history API
- [ ] User wallet + points history API
- [ ] Real-time balance push via WebSocket on any wallet change

---

## PHASE 5 — ORDER MODULE

- [ ] `Order`, `OrderItem`, `OrderStatusHistory` models
- [ ] Order state machine: all states + valid transitions (see BLUEPRINT.md Section 9)
- [ ] `OrderService.place_order()` (full placement flow, snapshot prices, 3-min timer)
- [ ] `OrderService.accept_order()` (revoke Celery timer)
- [ ] `OrderService.reject_order()` (refund points if used)
- [ ] `OrderService.assign_rider()` (validate rider balance, assign)
- [ ] `OrderService.pickup_confirmed()` (debit rider wallet)
- [ ] `OrderService.mark_delivered()` (GPS check, commission deducted)
- [ ] Celery task: `cancel_order_if_not_accepted()` (countdown 180s)
- [ ] Celery task: `ping_available_riders()` (find + notify riders within radius)
- [ ] Delivery fare calculation endpoint: `POST /user/delivery/fare-estimate/`
- [ ] Full order API (user, merchant, rider)
- [ ] Every status change → `OrderStatusHistory` record created
- [ ] WebSocket events fired on every status change

---

## PHASE 6 — DELIVERY MODULE

- [ ] `DeliveryFareConfig` model (managed via settings)
- [ ] `RiderDeliverySession` model (start, pickup, end, GPS track JSON)
- [ ] Rider location update endpoint: `POST /rider/location/update/`
- [ ] GPS track stored per delivery session
- [ ] User order tracking endpoint: `GET /user/orders/{id}/rider-location/`
- [ ] GPS enforcement on delivery confirmation (50m radius validation)
- [ ] Live location → WebSocket `rider.location` event every 5s push

---

## PHASE 7 — RIDER MODULE

- [ ] Rider profile API (GET/PATCH)
- [ ] Vehicle management API (update vehicle_type, plate, model)
- [ ] Online/offline toggle API: `PATCH /rider/online/`
- [ ] Rider dashboard summary API
- [ ] Weekly incentive calculation (Celery Beat, based on delivery count thresholds)
- [ ] Incentive confirmation by admin: `PATCH /admin/riders/{id}/incentive/confirm/`
- [ ] Remittance history API: `GET /rider/remittance/`
- [ ] Referral API: `GET /rider/referral/`

---

## PHASE 8 — NOTIFICATIONS MODULE

- [ ] `Notification`, `FCMToken` models
- [ ] Firebase Admin SDK setup (service account from env)
- [ ] `NotificationService.send()` → async Celery dispatch
- [ ] Celery task: `dispatch_notification()` (FCM + OneSignal + SMS + in-app)
- [ ] All 20+ event_type templates implemented (titles + body)
- [ ] FCM token registration endpoint: `POST /notifications/fcm-token/`
- [ ] Notification read/unread status
- [ ] Admin broadcast endpoint: `POST /admin/notifications/broadcast/`
- [ ] Notification log API for admin: `GET /admin/notifications/log/`

---

## PHASE 9 — MESSAGING MODULE

- [ ] `ChatThread`, `ChatMessage` models
- [ ] WebSocket consumer: `chat_thread_{thread_id}` group
- [ ] Send/receive message API
- [ ] Image attachment support in chat (upload to MinIO, return URL)
- [ ] GCash screenshot verification UI state (admin marks `is_verified=True + wallet_amount`)
- [ ] Admin chat panel APIs: list threads, unread counts, thread detail
- [ ] Read receipt update on message open
- [ ] Thread archive API

---

## PHASE 10 — REFERRALS MODULE

- [ ] `ReferralCode`, `ReferralRecord`, `ReferralMonthlyTracker` models
- [ ] Unique code generation on account approval (6-char alphanumeric + UUID fallback)
- [ ] QR code generation: `qrcode` library → save to MinIO → return URL
- [ ] Points engine: credit on new referral qualifies (KYC approved + first order placed)
- [ ] Monthly cap enforcement: check `ReferralMonthlyTracker` before crediting
- [ ] Referral APIs: `GET /user/referral/`, `GET /rider/referral/`
- [ ] Admin referral management: manual adjustment API

---

## PHASE 11 — REPORTS MODULE

- [ ] Report aggregation queries: daily/weekly/monthly GMV, orders, commissions, by store type, by rider
- [ ] `GET /admin/reports/daily/`, `weekly/`, `monthly/`
- [ ] `GET /admin/reports/by-store-type/`
- [ ] `GET /admin/reports/riders/` (earnings, remittance compliance)
- [ ] `GET /admin/reports/merchants/` (top merchants, store type breakdown)
- [ ] CSV export endpoint
- [ ] PDF export endpoint (ReportLab)
- [ ] Merchant own reports: `GET /merchant/reports/revenue/`, `products/`

---

## PHASE 12 — FRAUD MODULE

- [ ] `FraudFlag`, `InvestigationCase`, `AccountBlacklist` models
- [ ] Auto-flagging rules (Celery periodic task):
  - [ ] Excessive order cancellations (>5 in 24h)
  - [ ] Rapid referral usage (>10 referrals in 24h)
  - [ ] Non-responsive rider pattern (>3 pings rejected in 1h)
  - [ ] Late remittance (>3 overdue records)
  - [ ] GPS manipulation (delivery confirmed from impossible location)
- [ ] Fraud flag APIs: `GET /admin/fraud/flags/`
- [ ] Investigation case CRUD: `POST/GET/PATCH /admin/fraud/cases/`
- [ ] Blacklist APIs: `POST /admin/fraud/blacklist/`, `GET /superadmin/fraud/blacklist/`
- [ ] Blacklist enforcement middleware: reject auth attempts for blacklisted accounts

---

## PHASE 13 — ADMIN PANEL MODULE

- [ ] Admin dashboard stats API
- [ ] User KYC queue: list pending, approve/reject
- [ ] Merchant KYC queue: approve/reject + markup override API
- [ ] Rider KYC queue: approve → trigger `credit_initial_load(₱500)`
- [ ] User management: list/detail/suspend/ban/adjust points
- [ ] Merchant management: list/detail/suspend/store visibility control
- [ ] Rider management: list/detail/suspend/manual wallet load/incentive confirm
- [ ] Referral management: list/adjust pointss
- [ ] Audit trail: all admin actions logged to `AdminAuditLog`

---

## PHASE 14 — SUPERADMIN MODULE

- [ ] SuperAdmin dashboard aggregated stats API
- [ ] Admin account CRUD (create/edit/deactivate/role change)
- [ ] Platform settings CRUD API
- [ ] Markup + Commission tier management API
- [ ] Full wallet ledger API (all transactions, all roles)
- [ ] Manual wallet adjustment API (can adjust any wallet)
- [ ] Platform blacklist management
- [ ] Full audit log access

---

## PHASE 15 — FRONTEND WEB (5 NEXT.JS APPS)

### SuperAdmin Dashboard (port 3004)
- [ ] Project scaffold: Next.js 14, TypeScript, Tailwind, TanStack Query, Zustand
- [ ] Apex Dashboard layout (sidebar + topbar) — dark mode
- [ ] Login page
- [ ] Dashboard overview (stat cards + charts)
- [ ] Admin management page (table + create/edit modal)
- [ ] Platform settings editor
- [ ] Markup & Commission tier editor
- [ ] Wallet ledger page (full transaction table)
- [ ] Fraud blacklist page
- [ ] Audit log page
- [ ] Reports page (date range + CSV/PDF download)

### Admin Dashboard (port 3003)
- [ ] Project scaffold
- [ ] Login
- [ ] Dashboard overview
- [ ] KYC Queue — User, Merchant, Rider (tabbed, doc viewer modal)
- [ ] User management (table + detail drawer + suspend/ban/points)
- [ ] Merchant management (table + detail + markup override)
- [ ] Rider management (table + detail + wallet load + incentive confirm)
- [ ] Order monitoring (real-time table with WebSocket updates)
- [ ] Chat panel (inbox list + thread view + GCash verify button)
- [ ] Notifications log + broadcast composer
- [ ] Referral management
- [ ] Reports page
- [ ] Fraud flags + investigation cases
- [ ] Settings page

### Merchant Dashboard (port 3001)
- [ ] Project scaffold
- [ ] Register + Login flow (OTP + profile completion + KYC upload)
- [ ] KYC pending/approved/rejected status screen
- [ ] Dashboard (sales summary + order counts + earnings)
- [ ] Store manager (4 store type tabs: create/edit store, open/close toggle, schedule)
- [ ] Products/Menu manager per store type
- [ ] Order management (incoming orders, accept/reject with 3-min countdown, status flow)
- [ ] Sales reports (daily/weekly/monthly charts)
- [ ] Profile + settings page
- [ ] Notifications page

### Rider Dashboard (port 3002)
- [ ] Project scaffold
- [ ] Register + Login (OTP + KYC + vehicle details)
- [ ] Dashboard (earnings, deliveries today, wallet balance)
- [ ] Wallet page (balance, transaction history, remittance schedule)
- [ ] Order history
- [ ] Profile + vehicle settings page

### User App (port 3000)
- [ ] Project scaffold
- [ ] Register + Login (OTP + optional KYC for wallet)
- [ ] Home — discovery: 4 store type tabs, nearby stores on map
- [ ] Merchant storefront (product list by category, add to cart)
- [ ] Cart + checkout (delivery address, vehicle selection, points redemption, order summary)
- [ ] Order tracking (real-time status + live map with rider location)
- [ ] Order history
- [ ] Wallet page (balance, transactions, top-up request via chat)
- [ ] Points/Rewards page
- [ ] Referral page (shareable link + QR)
- [ ] Profile page

---

## PHASE 16 — MOBILE APP (React Native / Expo)

- [ ] Expo project scaffold (SDK 51, TypeScript, Expo Router 3)
- [ ] Auth screens (login, register, OTP, role selection)
- [ ] Role-based routing on app start
- [ ] User: Home (discovery), Merchant store view, Cart, Checkout, Order tracking with map
- [ ] User: Wallet, Points, Referral, Profile, KYC upload
- [ ] Rider: Online/offline toggle, Delivery ping modal (accept/reject), 
      Live delivery map (merchant → customer route), Delivery confirmation
- [ ] Rider: Wallet, Remittance, Referral, Profile
- [ ] Merchant: Dashboard, Orders (accept/reject), Products quick-view, Profile
- [ ] Push notifications: FCM via expo-notifications, deep link routing
- [ ] Background location tracking for riders (expo-location)
- [ ] OTA updates configured (expo-updates)
- [ ] Expo EAS Build configured for Android APK

---

## PHASE 17 — INTEGRATION & TESTING

- [ ] Full end-to-end order flow test (User → Merchant → Rider → Delivered)
- [ ] Wallet: top-up → remittance deduction → delivery payment → commission
- [ ] KYC: submit → admin review → approve → notifications
- [ ] Referral: share code → new register → qualify → points credited → monthly cap
- [ ] Fraud auto-flag test: trigger cancellation pattern
- [ ] All WebSocket events fire in correct sequence
- [ ] All push notifications delivered
- [ ] All API unit tests pass (`python manage.py test`)
- [ ] All frontend pages render without console errors
- [ ] Mobile APK installs and all flows work on Android device

---

## PHASE 18 — LAUNCH PREPARATION

- [ ] All `.env` values set to production values on server
- [ ] `DEBUG=False` confirmed
- [ ] `python manage.py collectstatic` run
- [ ] All 5 Next.js apps built (`npm run build`) and started via PM2
- [ ] Nginx configs finalized and tested
- [ ] SSL certificates active on all domains
- [ ] Database indices created (see BLUEPRINT.md model Meta indexes)
- [ ] Redis persistence enabled
- [ ] Celery worker + beat running as systemd services
- [ ] Log rotation configured
- [ ] Daily database backup confirmed working
- [ ] Load test: simulated 1,000 concurrent users (k6 or Locust)
- [ ] Create initial SuperAdmin account manually
- [ ] Seed initial platform settings via `load_initial_settings`
- [ ] Internal UAT (User Acceptance Testing) by team
- [ ] Fix all critical UAT bugs
- [ ] Soft launch: invite 50 beta merchants + 20 beta riders + 100 beta users
- [ ] Monitor error logs for 72 hours post-launch

---

*End of RAPEX Full Project TODO — v1.0 MVP*
