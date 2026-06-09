# RAPEX Technologies OPC — FULL PROJECT TODO

> **Version:** 1.0 MVP  
> **Status:** In Progress (Reality-Synced Snapshot)  
> **Track:** Mark each item `[x]` when complete · `[~]` when in-progress

---

## REALITY-SYNCED SNAPSHOT (APRIL 15, 2026)

This snapshot is based on direct scanning of:
- `backend/apps/*`
- `backend/config/*`
- `frontend/*/src/*`
- `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`

### Module Build Status

#### Backend
- [x] Core foundation is substantially implemented: `core`, `accounts`, `settings_module`
- [x] Core commerce flow is substantially implemented: `merchant`, `shop`, `fresh_market`, `ready_to_eat`, `preloved`, `orders`, `delivery`, `wallet`
- [~] Operations modules are implemented but still have gaps: `admin_panel`, `superadmin`, `notifications`, `messaging`, `referrals`, `rider`
- [~] Risk/compliance modules are partially implemented: `fraud` (models/services/tasks + admin/superadmin access via panel endpoints)
- [~] Reports are partial: `reports` service exists but full report surface/export matrix is incomplete
- [ ] Automated tests are effectively not started (test files exist but are empty placeholders)

#### Frontend (Web)
- [x] All 5 Next.js apps are scaffolded and have route pages + shared API clients
- [x] Shared frontend package established at `frontend/shared/src` and core role wrappers (Sidebar/TopBar/DashboardLayout/DataTable/status/stat-card) are wired
- [~] User, Merchant, Rider, Admin, SuperAdmin dashboards are implemented but not yet fully aligned with backend endpoint contracts
- [~] Major integration pass still pending (endpoint path mismatches, real-time socket path alignment, end-to-end flow validation)

#### Mobile
- [ ] Not started in this repository snapshot

### Priority TODO (Based on Current Code)

#### P0 — Fix Runtime-Critical Integration/Service Issues
- [ ] Align admin frontend endpoint prefix with backend (`/api/v1/admin/...` vs `/api/v1/admin-panel/...` in source pages)
- [ ] Fix wallet service call signatures in admin/superadmin/referrals flows to match `WalletService` and `LoyaltyPointsService` method definitions
- [ ] Align rider real-time ping socket path/client with actual backend Channels routes

#### P1 — Stabilize Core Backend
- [ ] Complete referral credit flow with valid points-credit API usage and qualification checks
- [ ] Finish missing reports endpoints (riders, merchants, exports) and wire to admin/superadmin screens
- [ ] Add explicit fraud API surface if needed outside `admin_panel` / `superadmin`

#### P2 — Quality + Delivery Readiness
- [ ] Build test suite for auth, orders, wallet, delivery, and admin operations
- [ ] Add integration tests for end-to-end order lifecycle and rider wallet/remittance flows
- [ ] Prepare production compose/deploy readiness checklist (`docker-compose.prod.yml`, hardened env, health checks)
- [~] Complete shared component adoption audit so remaining duplicated role-specific UI is either migrated to `frontend/shared/src` or intentionally documented

### April 2026 Table Page Standardization Update

- [x] Extend shared table layer with `TablePageLayout` and `TableRowDetailsModal` components
- [x] Enhance shared `DataTable` to support row-click behavior and non-sortable action-column handling
- [x] Migrate Admin table/list-heavy pages (`users`, `merchants`, `riders`, `orders`, `referrals`, `notifications`, `fraud`) to shared table-page layout patterns
- [x] Migrate SuperAdmin governance/ledger pages (`admins`, `audit-log`, `blacklist`, `wallet-ledger`) to shared table-page layout patterns
- [x] Migrate Merchant operational pages (`orders`, `stores`, `products`) to shared table-page layout patterns
- [x] Migrate Rider and User list/history pages (`orders`, `wallet`, `notifications`, `referral`) to shared table-page layout patterns
- [x] Run full cross-app runtime regression pass (all 5 frontend apps typecheck clean after stale `.next` type artifact cleanup and rider `tsconfig` deprecation-setting correction)

### April 2026 Media Storage Stabilization Update

- [x] Add shared storage utility (`backend/apps/core/storage.py`) for canonical upload paths, storage-path normalization, and URL resolution
- [x] Refactor KYC and merchant onboarding file persistence to centralized path generation (no ad hoc path builders)
- [x] Normalize API serialization of stored media paths across accounts, merchant, admin-panel, messaging, and product modules
- [x] Add missing upload endpoints for chat attachments, merchant store assets, and merchant product images with `{file_url, storage_path}` response contract
- [x] Enforce owner-first upload taxonomy across roles and media domains (`user/{id}`, `rider/{id}`, `merchant/{id}`, `admin/{id}`, `superadmin/{id}`) including organized `files`, `profile`, `assets`, and `media/images|videos` segments
- [x] Update architecture/developer docs to make upload taxonomy mandatory for all future file/image/video upload implementations
- [x] Add Docker startup bucket bootstrap command (`ensure_storage_bucket`) to guarantee MinIO bucket existence before app boot
- [x] Make backend auto-seeding optional via `AUTO_SEED` to prevent wiping local cleanup work during routine restarts
- [x] Perform local Docker DB account cleanup and verify all role-account/profile tables are empty for fresh merchant onboarding testing

> Phase markers below are scan-based (`[x]` complete, `[~]` in-progress, `[ ]` not started). Detailed line-items are still being reconciled per module.

### April 2026 Auth + Merchant Onboarding Update

- [x] Replace role web auth stores with Google + email magic-link flow (`user`, `rider`, `admin`, `superadmin`)
- [x] Implement merchant login with email-or-username + password and Google
- [x] Keep merchant signup on magic-link + Google and move verification to dedicated callback route
- [x] Add backend magic-link endpoints and username availability endpoint
- [x] Add normalized merchant onboarding models, services, endpoints, and migrations
- [x] Add merchant pending route and dashboard gating (`wizard_completed` + `status`)
- [x] Add legal markdown scaffolding for Terms and Privacy in merchant app
- [x] Add merchant onboarding profile image upload endpoint and step-1 frontend integration
- [x] Harden merchant onboarding profile hydration and username field handling to prevent null-controlled-input and trim() runtime errors after Google login
- [x] Disable merchant account seeding and purge existing local/dev merchant accounts
- [x] Wire production-grade file upload pipeline for onboarding documents with persistent storage paths + resolved file URLs from backend upload APIs
- [~] Finalize full merchant wizard UX parity across all edge cases and browser permissions

### April 2026 Onboarding Redesign + Wizard Enhancement Update

- [x] Add country code database model (`country_name`, `country_code`, `country_flag_emoji`, `max_digits`, `is_default`) with migration
- [x] Add merchant onboarding country code API endpoint and serializer for frontend phone selector
- [x] Expand seed command with PH-oriented merchant categories/types and onboarding country-code defaults
- [x] Enforce admin merchant approve/reject gate until all five onboarding steps are complete
- [x] Add admin onboarding progress payload (`completed_steps`, `percentage`, checklist, `can_review`) to merchant list API
- [x] Redesign shared onboarding components (Wizard, Input, Dropdown, MultiSelectDropdown, PhoneNumberInput, FileUpload, ImageUpload)
- [x] Add new shared components: `Checkbox`, `PasswordInput` (with strength + rules), `ConfirmPasswordInput`, and `MapPickerModal`
- [x] Refactor merchant onboarding page to consume shared components and DB-driven country codes
- [x] Make profile image optional and add initials fallback avatar when image is missing
- [x] Update admin merchants page to display onboarding progress and disable approve/reject when onboarding is incomplete
- [x] Resolve onboarding runtime loop (`Maximum update depth exceeded`) by guarding phone sync state updates
- [x] Resolve onboarding dropdown emptiness in local Docker DB by populating merchant categories/types/country-codes data
- [x] Stabilize nested onboarding state patching to skip no-op updates and prevent recursive render loops
- [x] Make email field rendering deterministic to avoid hydration mismatch from dynamic label text
- [x] Update phone selector to shared dropdown styling with `country short code + dial code` formatting (example: `PH (+63)`) and no emoji flags
- [x] Keep password strength visuals purple-only and preserve password/confirm values when existing step draft data is present
- [x] Extract shared profile-image upload box with inline preview and defer storage upload until step-save (`Next`)
- [x] Constrain dropdown/multiselect menus inside onboarding container bounds with predictable max-height behavior
- [x] Center wizard step icons/connectors and add professional placeholders across onboarding inputs
- [x] Stabilize location-step progression by combining no-op guards with controlled-input loop prevention
- [x] Add onboarding logout action that clears auth session and onboarding draft state before redirecting to login
- [x] Replace inline onboarding banners with shared top-right toast notifications for validation/system feedback
- [x] Add field-level required-input error styling (red state) across profile, business, location, and verification steps
- [x] Refactor onboarding phone synchronization to explicit handlers to prevent update-depth recursion in local state sync
- [x] Replace profile-image helper copy with: `Drop images here or click to browse. PNG, JPEG, and WEBP are supported.`
- [x] Relax location numeric compatibility validation to accept valid numeric coordinates while retaining required-field checks
- [x] Hard-delete local/dev accounts and related onboarding data for `shekaigarcia@gmail.com` and `berlyneugenio657@gmail.com`
- [x] Redesign selfie-with-ID flow to modal capture (camera dropdown, 16:9 frame, capture/recapture/save) without strict face-detection dependency
- [x] Split Valid ID into inline single-image uploads for `VALID_ID_FRONT` and `VALID_ID_BACK` with individual previews
- [x] Enforce onboarding document selection rules: single file for all document types except `OTHER` (up to 3 files)
- [x] Expand Unregistered document matrix to include optional `Other Documents`
- [x] Enforce 10MB max file size for onboarding document uploads (frontend validation + backend serializer validation)
- [x] Change onboarding documents step to preview-only staging and defer all upload + DB persistence until `Next` is clicked
- [x] Convert shared onboarding dropdowns and multi-selects to popup modal overlays rendered outside form containers
- [x] Default map picker to closer zoom and preserve zoom level while repositioning location pin
- [x] Remove selfie capture face-detection gating and disable mirrored camera feed in onboarding capture flow
- [x] Fix selfie recapture black-frame issue by stabilizing stream reattachment and video readiness checks
- [x] Separate onboarding document preview URL handling from storage paths for reliable fetched-document display
- [x] Add remove (`X`) controls for fetched/saved onboarding documents and persist removals when saving step
- [x] Reduce selfie-with-ID preview footprint to compact card dimensions in documents step
- [x] Replace verification inputs with shared global 6-digit OTP slot component (`OtpInput`) for email and phone
- [x] Combine legal acceptance into one checkbox sentence linking Privacy Policy and Terms & Conditions while setting both acceptance flags
- [x] Expand final review step into complete profile/business/location/documents summary with image/document previews
- [x] Add SMTP env-driven configuration in base settings and optional development console-backend toggle
- [x] Add PhilSMS provider wiring with Semaphore fallback and env example updates for SMS/email settings
- [x] Render Valid ID front/back previews in 16:9 landscape using object-contain for staged and saved media
- [x] Expand onboarding country code dataset to all dialing regions and support shared dial codes in DB schema
- [~] Align running Docker backend seed command source with workspace `seed.py` so lookup catalog seeding stays automatic on future reseeds

### April 2026 Admin Realtime Merchant KYC Update

- [x] Emit admin notification events when a merchant account is newly created (pre-onboarding completion)
- [x] Emit admin notification events when merchant onboarding is submitted and ready for KYC review
- [x] Add JWT query-token fallback auth for notifications WebSocket consumer (`/ws/notifications/`)
- [x] Wire admin dashboard layout to notifications WebSocket and show toast notifications for merchant registration/onboarding submission events
- [x] Add pending merchant KYC red-number badge on admin sidebar `Merchants` menu item
- [x] Add merchants table indicator for newly received onboarding-submitted notifications
- [x] Add merchant pending-page unlock fallback when KYC is already approved but status payload remains stale-pending

### April 2026 Merchant Stores & Products Professionalization Update

- [x] Upgrade merchant stores create flow to require uploaded store profile image file (multipart) instead of URL text
- [x] Replace stores-page category select with shared dropdown component and richer category descriptions
- [x] Enforce one-store-per-category UX in stores create modal using filtered shared dropdown options
- [x] Make stores list rows navigate to dedicated store detail route (`/stores/[storeId]`)
- [x] Add new merchant store detail page with shared table layout, store header, products table, and `+ Add Product` action
- [x] Implement store-scoped professional Add Product modal with required minimum 3 images and module-aware payload mapping
- [x] Route product image uploads through shared merchant product upload endpoint before product create submission
- [x] Add backend `approval_status` moderation field to product tables (shop, fresh_market, ready_to_eat, preloved) with default `PENDING`
- [x] Enforce backend minimum 3-image validation on product serializers (shop, fresh_market, ready_to_eat, preloved)
- [x] Harden backend product create/list/detail ownership checks to merchant-owned store scope for all 4 product modules

---

## [~] PHASE 0 — INFRASTRUCTURE SETUP (40%)

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

## [~] PHASE 1 — BACKEND FOUNDATION (78%)

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

## [~] PHASE 2 — PLATFORM SETTINGS (80%)

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

## [~] PHASE 3 — MERCHANT & STORE MODULES (75%)

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

## [~] PHASE 4 — WALLET MODULE (78%)

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

## [~] PHASE 5 — ORDER MODULE (75%)

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

## [~] PHASE 6 — DELIVERY MODULE (72%)

- [ ] `DeliveryFareConfig` model (managed via settings)
- [ ] `RiderDeliverySession` model (start, pickup, end, GPS track JSON)
- [ ] Rider location update endpoint: `POST /rider/location/update/`
- [ ] GPS track stored per delivery session
- [ ] User order tracking endpoint: `GET /user/orders/{id}/rider-location/`
- [ ] GPS enforcement on delivery confirmation (50m radius validation)
- [ ] Live location → WebSocket `rider.location` event every 5s push

---

## [~] PHASE 7 — RIDER MODULE (60%)

- [ ] Rider profile API (GET/PATCH)
- [ ] Vehicle management API (update vehicle_type, plate, model)
- [ ] Online/offline toggle API: `PATCH /rider/online/`
- [ ] Rider dashboard summary API
- [ ] Weekly incentive calculation (Celery Beat, based on delivery count thresholds)
- [ ] Incentive confirmation by admin: `PATCH /admin/riders/{id}/incentive/confirm/`
- [ ] Remittance history API: `GET /rider/remittance/`
- [ ] Referral API: `GET /rider/referral/`

---

## [~] PHASE 8 — NOTIFICATIONS MODULE (68%)

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

## [~] PHASE 9 — MESSAGING MODULE (60%)

- [ ] `ChatThread`, `ChatMessage` models
- [ ] WebSocket consumer: `chat_thread_{thread_id}` group
- [ ] Send/receive message API
- [ ] Image attachment support in chat (upload to MinIO, return URL)
- [ ] GCash screenshot verification UI state (admin marks `is_verified=True + wallet_amount`)
- [ ] Admin chat panel APIs: list threads, unread counts, thread detail
- [ ] Read receipt update on message open
- [ ] Thread archive API

---

## [~] PHASE 10 — REFERRALS MODULE (50%)

- [ ] `ReferralCode`, `ReferralRecord`, `ReferralMonthlyTracker` models
- [ ] Unique code generation on account approval (6-char alphanumeric + UUID fallback)
- [ ] QR code generation: `qrcode` library → save to MinIO → return URL
- [ ] Points engine: credit on new referral qualifies (KYC approved + first order placed)
- [ ] Monthly cap enforcement: check `ReferralMonthlyTracker` before crediting
- [ ] Referral APIs: `GET /user/referral/`, `GET /rider/referral/`
- [ ] Admin referral management: manual adjustment API

---

## [~] PHASE 11 — REPORTS MODULE (45%)

- [ ] Report aggregation queries: daily/weekly/monthly GMV, orders, commissions, by store type, by rider
- [ ] `GET /admin/reports/daily/`, `weekly/`, `monthly/`
- [ ] `GET /admin/reports/by-store-type/`
- [ ] `GET /admin/reports/riders/` (earnings, remittance compliance)
- [ ] `GET /admin/reports/merchants/` (top merchants, store type breakdown)
- [ ] CSV export endpoint
- [ ] PDF export endpoint (ReportLab)
- [ ] Merchant own reports: `GET /merchant/reports/revenue/`, `products/`

---

## [~] PHASE 12 — FRAUD MODULE (55%)

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

## [~] PHASE 13 — ADMIN PANEL MODULE (72%)

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

## [~] PHASE 14 — SUPERADMIN MODULE (70%)

- [ ] SuperAdmin dashboard aggregated stats API
- [ ] Admin account CRUD (create/edit/deactivate/role change)
- [ ] Platform settings CRUD API
- [ ] Markup + Commission tier management API
- [ ] Full wallet ledger API (all transactions, all roles)
- [ ] Manual wallet adjustment API (can adjust any wallet)
- [ ] Platform blacklist management
- [ ] Full audit log access

---

## [~] PHASE 15 — FRONTEND WEB (5 NEXT.JS APPS) (65%)

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

## [ ] PHASE 16 — MOBILE APP (React Native / Expo) (0%)

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

## [ ] PHASE 17 — INTEGRATION & TESTING (0%)

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

## [ ] PHASE 18 — LAUNCH PREPARATION (0%)

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
