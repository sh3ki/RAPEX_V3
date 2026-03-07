# RAPEX Technologies OPC — MASTER CLAUDE OPUS BUILD PROMPT

> **Purpose:** Complete, modular, component-driven build prompt for Claude Opus  
> **Approach:** Module-by-module, one at a time — never all at once  
> **UI Reference:** https://apex-dashboard.pages.dev/ (exact copy)  
> **Target:** Production-ready MVP — 100k users / 10k concurrent

---

## HOW TO USE THIS FILE

1. Copy one **Master Context Block** (Section 1) into every new Claude conversation
2. Then paste one **Module Build Prompt** (Section 3 onwards) at a time
3. Work module by module — complete and test each before moving forward
4. After each module, paste the next prompt in a fresh continuation

---

## SECTION 1 — MASTER CONTEXT BLOCK
*(Include this at the start of every build session)*

```
You are building RAPEX — a multi-role, multi-vendor hyperlocal delivery and 
marketplace platform based in the Philippines.

=== PLATFORM IDENTITY ===
- Company: RAPEX Technologies OPC
- Location: Philippines
- Currency: Philippine Peso (₱)
- Language: English (UI), Filipino surnames/names acceptable in data
- Platform: Web (Next.js) + Mobile (React Native / Expo) + Backend (Django)

=== 5 ROLES ===
1. SUPERADMIN — Full platform control. Single account. Uses superadmin-dashboard.
2. ADMIN — Operations team. Multiple sub-roles (Operations, Support, Finance, 
   Compliance, Logistics). Uses admin-dashboard.
3. MERCHANT — Store owners. Up to 4 store types per merchant:
   - SHOP (retail products — markup-based pricing — tiered)
   - FRESH MARKET (produce by weight/piece/kilo — markup-based — freshness reset daily)
   - READY TO EAT (food menu with variants and add-ons — with prep time)
   - PRE-LOVED (secondhand items — negotiable pricing)
   Uses merchant-dashboard (web) + merchant screens (mobile).
4. RIDER — Delivery couriers. Own wallet (must have enough balance = order total 
   before accepting). Vehicle types: Bicycle, Motorcycle, 4-Wheels.
   Uses rider-dashboard (web) + mobile app.
5. USER/CUSTOMER — End users. Discovery, ordering, wallet, loyalty points, referrals.
   Uses user-app (web) + mobile app.

=== PRICING RULES ===
Merchant sets base_price. Platform applies markup (tiered by price range). 
Displayed price = base_price × (1 + markup_rate). Users see only the final price.
Merchant receives base_price. Platform earns the markup.
On top of markup: a commission is still taken from the markup portion for RAPEX.
Delivery fee is calculated separately (base fare + per-km surcharge + speed addon).
Rider pays merchant using Rider's wallet at pickup. Order total flows: 
Rider Wallet → Merchant (indirectly tracked). Remittance happens weekly.

=== KEY BUSINESS RULES ===
1. Merchant has 3 minutes to accept or the order auto-cancels.
2. Rider must have wallet balance ≥ order total to receive the delivery ping.
3. Orders cannot be cancelled once rider picks up (PICKED_UP state onward).
4. Rider wallet auto-deducts overdue remittance on next top-up.
5. ₱500 initial wallet load for newly approved riders.
6. Loyalty points for users: earned on delivery, redeemable as discount.
7. Referral system: monthly cap on points from referrals.
8. KYC required for all three (User, Merchant, Rider) before transacting.
9. Only Admin can verify GCash screenshots and credit wallet. No self-service.
10. GPS enforcement: rider must be within 50m of delivery address to mark delivered.
11. Anti-spam: 3 OTP attempts max per 15 minutes per phone number.
12. Fresh Market products auto-reset to "Fresh Today" daily via Celery Beat.
13. 10% of markup revenue is RAPEX commission. Remaining 90% is RAPEX income.
14. Rider delivery fee is split per configured rate. RAPEX takes a portion.

=== TECH STACK (EXACT) ===
Backend:
- Python 3.12 + Django 5.1 + Django REST Framework 3.15
- PostgreSQL 16 (PgBouncer for pooling on prod)
- Redis 7 (cache + Celery broker + Channel Layer)
- Celery 5.4 + Celery Beat
- Django Channels 4.0 + Daphne (ASGI, port 8001)
- djangorestframework-simplejwt (JWT auth)
- django-filter (filtering)
- django-cors-headers (CORS)
- Pillow (image handling)
- boto3 (S3-compatible storage)
- firebase-admin (FCM push)
- requests (Semaphore SMS, OneSignal)
- python-decouple (env vars)
- factory-boy (tests)
- coverage.py (test coverage)
- black + flake8 + isort (linting)
- ReportLab (PDF reports)
- Docker 24.x + Docker Compose v2 (containerization — all backend + frontend services)

Frontend (5 separate Next.js apps):
- Next.js 14.2 (App Router)
- TypeScript 5
- TailwindCSS 3.4 (custom design tokens)
- TanStack Query (React Query) v5
- Zustand (global state)
- Axios (HTTP client with interceptor auto-refresh)
- Recharts (dashboard charts)
- React Hook Form + Zod (forms)
- @vis.gl/react-google-maps (Google Maps integration)
- ws / native WebSocket (real-time)
- date-fns (date formatting)
- lucide-react (icons)

Mobile:
- React Native 0.74 + Expo SDK 51
- Expo Router 3 (file-based routing)
- expo-notifications (FCM)
- expo-location (GPS)
- expo-secure-store (token storage)
- expo-camera + expo-image-picker (KYC uploads)
- expo-updates (OTA)
- react-native-maps (Google Maps)
- TanStack Query (server state)
- Zustand (global state)
- Axios

=== UI / DESIGN SYSTEM ===
Reference URL: https://apex-dashboard.pages.dev/
- Copy the Apex Dashboard EXACTLY for all web dashboards
- Dark mode is DEFAULT (no light mode toggle for MVP)
- Primary color: #FF6B00 (RAPEX Orange)
- Secondary color: #7C3AED (Purple)
- Background: #0F172A (dark navy)
- Surface/Card: #1E293B
- Border: #334155
- Text primary: #F1F5F9
- Text secondary: #94A3B8
- Use the Apex sidebar navigation structure
- Use Apex card styles for all stat cards
- Use Apex data table styles for all lists
- Charts: use Recharts with matching dark styles

=== PLATFORM URLS (Production) ===
- API: https://api.rapex.ph/api/v1/
- WebSocket: wss://ws.rapex.ph/ws/
- User App: https://app.rapex.ph
- Merchant Dashboard: https://merchant.rapex.ph
- Rider Dashboard: https://rider.rapex.ph
- Admin Dashboard: https://admin.rapex.ph
- SuperAdmin: https://superadmin.rapex.ph

=== CODING CONSTRAINTS ===
- All models inherit from BaseModel (UUID PK, created_at, updated_at, is_deleted)
- Business logic only in services.py — never in views
- Views only: validate input (serializer), call service, return response
- All wallet operations: select_for_update() inside transaction.atomic()
- All API endpoints need explicit permission_classes
- Mobile: Expo SecureStore for tokens (not AsyncStorage)
- All monetary values: DecimalField(max_digits=12, decimal_places=2)
- GPS: lat=DecimalField(max_digits=10, decimal_places=8), lng(max_digits=11)
- Error handling: custom RapexAPIException class — no raw tracebacks to clients
- Logging: logging.getLogger(__name__) — no print() statements
- Tests: factory_boy for test data, TestCase for unit, pytest for integration
- All services run via Docker Compose (development: docker compose up, production: docker compose -f docker-compose.prod.yml up -d)
- backend/Dockerfile uses python:3.12-slim, multi-stage for production
- docker-compose.yml must include: backend, daphne, celery-worker, celery-beat, postgres, pgbouncer, redis, minio, nginx, 5 Next.js services

Now wait for my next message with the specific module to build.
```

---

## SECTION 2 — BUILD SEQUENCE

Build modules in this exact order. Do not skip ahead. Each must be tested before proceeding.

```
PHASE 0: Infrastructure
  0.1 → Django project scaffold + settings + backend/Dockerfile + .dockerignore
  0.2 → Docker Compose setup: docker-compose.yml (dev, hot-reload) + docker-compose.prod.yml (prod)
  0.3 → PostgreSQL + Redis + Celery + Channels setup
  0.4 → Nginx + Gunicorn + Daphne config (nginx config + docker-compose Nginx service)

PHASE 1: Core Foundation
  1.1 → core module (BaseModel, permissions, exceptions, pagination)
  1.2 → accounts module (CustomUser, 5 profiles, OTP, JWT auth)

PHASE 2: Platform Settings
  2.1 → settings_module (PlatformSetting, MarkupTier, CommissionTier)

PHASE 3: Merchant + Stores
  3.1 → merchant module (MerchantStore, StoreSchedule)
  3.2 → shop module (ShopCategory, ShopProduct)
  3.3 → fresh_market module (FreshProduct, daily reset task)
  3.4 → ready_to_eat module (MenuItem, MenuItemVariant, AddOn)
  3.5 → preloved module (PreLovedListing)

PHASE 4: Wallet
  4.1 → wallet module (RapexWallet, WalletTransaction, points, remittance)

PHASE 5: Orders
  5.1 → orders module (Order, OrderItem, state machine, 3-min timer)

PHASE 6: Delivery
  6.1 → delivery module (DeliveryFare config, rider auto-ping, GPS tracking)

PHASE 7: Rider
  7.1 → rider module (RiderProfile API, vehicle, incentives, location update)

PHASE 8: Communication
  8.1 → notifications module (FCM, OneSignal, SMS, in-app)
  8.2 → messaging module (ChatThread, ChatMessage, admin chat panel)

PHASE 9: Growth
  9.1 → referrals module (ReferralCode, points engine, QR)
  9.2 → reports module (aggregators, CSV/PDF export)
  9.3 → fraud module (FraudFlag, InvestigationCase, Blacklist)

PHASE 10: Admin + SuperAdmin APIs
  10.1 → admin_panel module (all admin endpoints: KYC, user/merchant/rider mgmt)
  10.2 → superadmin module (platform settings, admin management, ledger)

PHASE 11: Frontend Web (per app)
  11.1 → superadmin-dashboard (Next.js — Apex UI)
  11.2 → admin-dashboard (Next.js — Apex UI)
  11.3 → merchant-dashboard (Next.js — Apex UI)
  11.4 → rider-dashboard (Next.js — Apex UI)
  11.5 → user-app (Next.js — Apex UI)

PHASE 12: Mobile App
  12.1 → Expo project scaffold + auth screens
  12.2 → User mobile screens
  12.3 → Rider mobile screens
  12.4 → Merchant mobile screens
```

---

## SECTION 3 — MODULE BUILD PROMPTS

---

### PROMPT 0.1 — Django Project Scaffold

```
Using the Master Context as background, scaffold the RAPEX Django backend project.

Create:
backend/
├── config/
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py         ← All shared settings
│   │   ├── development.py  ← Debug=True, local DB, local Redis
│   │   └── production.py   ← Debug=False, env-based config, production DB
│   ├── urls.py             ← Main URL router
│   ├── asgi.py             ← ASGI with Channels routing
│   └── wsgi.py
├── apps/                   ← Empty dir — modules created later
├── requirements/
│   ├── base.txt            ← ALL production dependencies with pinned versions
│   ├── development.txt     ← base.txt + dev tools (black, flake8, factory-boy, coverage)
│   └── production.txt      ← base.txt + gunicorn, psycopg2-binary
├── .env.example            ← Template for all env vars
└── manage.py

Settings must include:
- INSTALLED_APPS split into DJANGO_APPS, THIRD_PARTY_APPS, LOCAL_APPS
- DATABASE from DATABASE_URL env var (using dj-database-url)
- CACHES → Redis backend using REDIS_URL
- CHANNEL_LAYERS → Redis channel layer
- CELERY_BROKER_URL, CELERY_RESULT_BACKEND from env
- REST_FRAMEWORK config: JWT auth, StandardPagination, custom exception handler
- CORS_ALLOWED_ORIGINS from env (list)
- JWT settings: 15min access, 7d refresh, rotate refresh=True
- DEFAULT_FILE_STORAGE → MinIO/S3 when USE_S3=True, local FileSystemStorage otherwise
- LOGGING config: file handler + console handler, level INFO in prod

Output all files with full content.
```

---

### PROMPT 1.1 — core Module

```
Build the `core` Django app for RAPEX.

Create: backend/apps/core/

Files to produce with full content:

models.py — BaseModel:
- id: UUIDField(primary_key=True, default=uuid.uuid4)
- created_at: DateTimeField(auto_now_add=True)
- updated_at: DateTimeField(auto_now=True)
- is_deleted: BooleanField(default=False)
- deleted_at: DateTimeField(null=True, blank=True)
- SoftDeleteManager as default manager (filters is_deleted=False)
- Method: soft_delete() sets is_deleted=True, deleted_at=now

permissions.py:
- IsUser(BasePermission): role == 'USER'
- IsMerchant: role == 'MERCHANT'
- IsRider: role == 'RIDER'
- IsAdmin: role == 'ADMIN'
- IsSuperAdmin: role == 'SUPERADMIN'
- IsAdminWithPermission: base class + required_permission attr
- IsAdminOrSuperAdmin: role in ADMIN, SUPERADMIN
- IsKYCApproved: permission that checks profile.kyc_status == 'APPROVED'
- IsRiderOnline: checks riderprofile.is_online == True

exceptions.py:
- RapexAPIException(APIException): detail, code, status_code
- InsufficientBalanceError (code: insufficient_balance, 402)
- OrderNotCancellable (code: order_not_cancellable, 400)
- StoreCurrentlyClosed (code: store_closed, 400)
- KYCNotApproved (code: kyc_required, 403)
- RiderOffline (code: rider_offline, 400)
- InvalidOTP (code: invalid_otp, 400)
- OTPExpired (code: otp_expired, 400)
- OTPRateLimitExceeded (code: otp_rate_limit, 429)

pagination.py:
- StandardPagination(PageNumberPagination): page_size=50, max_page_size=200
- LargePagination: page_size=100
- SmallPagination: page_size=20

mixins.py:
- AuditMixin: override perform_create to log admin action
- SoftDeleteMixin: override destroy to soft_delete instead

renderers.py:
- RapexJSONRenderer: wraps all responses in {success, data, message, errors}

exception_handler.py:
- custom_exception_handler: formats all DRF exceptions through RapexJSONRenderer

Output all core/ files with full content.
```

---

### PROMPT 1.2 — accounts Module

```
Build the `accounts` Django app for RAPEX.

Customer-facing roles: USER, MERCHANT, RIDER
Internal roles: ADMIN, SUPERADMIN

Models:
- CustomUser(AbstractBaseUser):
  id UUID, phone VARCHAR(20) UNIQUE, email UNIQUE NULL, 
  role ENUM(USER,MERCHANT,RIDER,ADMIN,SUPERADMIN),
  is_active BOOL, is_verified BOOL, device_id VARCHAR(255) NULL,
  USERNAME_FIELD = 'phone'
- SuperAdminProfile: OneToOne(CustomUser), full_name
- AdminProfile: OneToOne, full_name, sub_role(OPERATIONS/SUPPORT/FINANCE/COMPLIANCE/LOGISTICS), 
  permissions JSONB default={}
- MerchantProfile: OneToOne, full_name, birthday, home_address, business_name, 
  business_address, business_lat/lng, kyc_status(PENDING/APPROVED/REJECTED), 
  kyc_rejection_reason, kyc_id_photo, kyc_selfie_photo, kyc_business_doc
- RiderProfile: OneToOne, full_name, birthday, home_address, home_lat/lng, 
  emergency_contact_name/phone, vehicle_type(BICYCLE/MOTORCYCLE/4_WHEELS), 
  vehicle_plate NULL, vehicle_model NULL, kyc_status, kyc_id_photo, kyc_selfie_photo,
  is_online BOOL, current_lat/lng NULL, background_check_flagged BOOL DEFAULT False
- UserProfile: OneToOne, full_name, birthday, home_address, home_lat/lng, 
  kyc_status, kyc_id_type, kyc_id_photo, kyc_selfie_photo

OTP System:
- OTPRecord model: phone, otp_code(6-digit), purpose(REGISTRATION/LOGIN/RESET), 
  is_used BOOL, expires_at(5min), attempt_count
- Rate limiting: 3 attempts per 15 minutes per phone → raise OTPRateLimitExceeded
- OTP delivery via Semaphore PHP API (POST to https://api.semaphore.co/api/v4/messages)
- OTP validation: check is_used, check expiry, increment attempt_count, mark as is_used on success

Services (accounts/services.py):
- OTPService.request_otp(phone, purpose): rate check → generate → save → send via Semaphore
- OTPService.verify_otp(phone, otp_code, purpose): validate → return temp_token (10-min JWT)
- AuthService.register_user(temp_token, data): verify temp_token → create CustomUser + UserProfile
- AuthService.register_merchant(temp_token, data): create CustomUser + MerchantProfile
- AuthService.register_rider(temp_token, data): create CustomUser + RiderProfile
- DeviceFingerprintService.generate(device_id, user_agent, platform): SHA256 hash
- DeviceFingerprintService.validate(request, user): check fingerprint in JWT payload

Views + Serializers:
- POST /api/v1/auth/otp/request/ → OTPRequestSerializer → OTPService.request_otp
- POST /api/v1/auth/otp/verify/ → OTPVerifySerializer → OTPService.verify_otp → temp_token
- POST /api/v1/auth/register/user/ → UserRegistrationSerializer → AuthService.register_user
- POST /api/v1/auth/register/merchant/ → MerchantRegistrationSerializer
- POST /api/v1/auth/register/rider/ → RiderRegistrationSerializer
- POST /api/v1/auth/token/ → login → return JWT pair (access in header, refresh in httpOnly cookie)
- POST /api/v1/auth/token/refresh/ → refresh → new access token
- POST /api/v1/auth/logout/ → add refresh token to Redis blacklist
- GET/PATCH /api/v1/[role]/profile/ → get or update own profile
- POST /api/v1/[role]/profile/kyc/ → upload KYC documents (multipart/form-data)

Output all accounts/ files with full content.
```

---

### PROMPT 2.1 — settings_module

```
Build the `settings_module` Django app for RAPEX.

Models:
- PlatformSetting: key VARCHAR(100) UNIQUE, value TEXT, 
  value_type ENUM(STRING,INT,FLOAT,BOOL,JSON), description NULL, last_updated_by UUID NULL
- MarkupTier: store_type ENUM(ALL,SHOP,FRESH_MARKET,READY_TO_EAT,PRELOVED), 
  price_min DECIMAL, price_max DECIMAL NULL, markup_rate DECIMAL(5,2)
- CommissionTier: same structure as MarkupTier

Initial Data (management command: load_initial_settings):
- RIDER_BASE_FARE_BICYCLE = 30.00
- RIDER_BASE_FARE_MOTORCYCLE = 40.00
- RIDER_BASE_FARE_4_WHEELS = 60.00
- RIDER_STANDARD_ADDON = 15.00
- RIDER_SAVER_ADDON = 5.00
- RIDER_SURCHARGE_PER_KM = 10.00
- RIDER_BASE_COVERAGE_KM = 3.0
- RIDER_SEARCH_RADIUS_KM = 5.0
- RIDER_PING_EXPIRY_SECONDS = 180
- ORDER_MERCHANT_TIMEOUT_SECONDS = 180
- RIDER_INITIAL_WALLET_LOAD = 500.00
- LOYALTY_POINTS_PER_ORDER = 10 (int, configurable by admin)
- REFERRAL_POINTS_PER_REFERRAL = 50
- REFERRAL_MONTHLY_CAP = 500
- Markup tiers (ALL store types): 1-100 = 5%, 101-1000 = 8%, 1001+ = 10%
- Commission: 10% flat

SettingsService:
- get(key): read from Redis cache first, fallback to DB, cache for 5 minutes
- set(key, value, updated_by): update DB, invalidate Redis cache
- calculate_markup(store_type, base_price): look up tier, return (markup_rate, final_price)
- calculate_delivery_fare(vehicle_type, delivery_speed, distance_km): compute fare

API:
- GET /api/v1/superadmin/settings/ → list all settings
- PATCH /api/v1/superadmin/settings/ → bulk update multiple keys
- GET /api/v1/admin/settings/ → read-only list
- PATCH /api/v1/admin/settings/ → limited keys only

Output all settings_module/ files with full content.
```

---

### PROMPT 3.1 — merchant Module

```
Build the `merchant` Django app for RAPEX.

Models:
- MerchantStore: id, merchant FK(MerchantProfile), store_type ENUM(SHOP/FRESH_MARKET/READY_TO_EAT/PRELOVED),
  display_name, description NULL, logo_url NULL, banner_url NULL, is_open BOOL, is_visible BOOL,
  is_accepting_delivery BOOL, is_accepting_pickup BOOL, tags JSONB
- StoreSchedule: store FK, day_of_week SMALLINT(0-6), open_time TIME NULL, close_time TIME NULL, is_closed BOOL
- MerchantMarkupOverride: merchant FK, store_type NULL, tier_1_rate, tier_2_rate, tier_3_rate, 
  set_by_admin FK(AdminProfile), reason

Rules:
- A merchant can have at most 1 store per store_type (max 4 stores total)
- Store can be toggled open/closed manually
- Celery Beat task: auto-close stores based on StoreSchedule daily at midnight check
- Markup rates: use MerchantMarkupOverride if set, otherwise use global MarkupTier

Services:
- MerchantService.create_store(merchant, store_type, data): validate max-store limit, create
- MerchantService.toggle_open(store, is_open): update + broadcast WebSocket to admin
- MerchantService.get_nearby_stores(lat, lng, radius_km, store_type): 
  postgis or Haversine formula distance query, return open+visible stores sorted by distance

API:
- GET /api/v1/merchant/stores/ → own stores list
- POST /api/v1/merchant/stores/ → create store
- GET/PATCH /api/v1/merchant/stores/{id}/ → detail + edit
- PATCH /api/v1/merchant/stores/{id}/open/ → set is_open=True
- PATCH /api/v1/merchant/stores/{id}/close/ → set is_open=False
- User-facing: GET /api/v1/user/merchants/?lat=X&lng=Y&type=SHOP → nearby stores

Output all merchant/ files with full content.
```

---

### PROMPT 4.1 — wallet Module

```
Build the `wallet` Django app for RAPEX.

Models:
- RapexWallet: owner_id UUID, owner_type ENUM(RIDER,USER), balance DECIMAL(12,2), last_updated
  UNIQUE(owner_id, owner_type)
- WalletTransaction: wallet FK, transaction_type(see BLUEPRINT.md), amount DECIMAL(+/-), 
  balance_after, order_id FK(Order) NULL, reference_number NULL, note NULL,
  performed_by_id NULL, performed_by_role(SYSTEM/ADMIN/SUPERADMIN)
- RiderRemittanceRecord: rider FK, period_start DATE, period_end DATE, amount_owed, amount_paid,
  due_date DATE, status(CURRENT/DUE_SOON/OVERDUE/PAID/WAIVED), paid_at, payment_reference
- UserLoyaltyPoints: user FK UNIQUE, total_points INT, rollover_balance DECIMAL, lifetime_earned
- PointsTransaction: user FK, type(EARNED/REDEEMED/ADJUSTED/EXPIRED), points INT, order_id FK NULL, note

CRITICAL: All wallet balance changes MUST use:
  with transaction.atomic():
      wallet = RapexWallet.objects.select_for_update().get(...)
      ...

WalletService:
- credit(owner_id, owner_type, amount, txn_type, **kwargs): atomic credit + broadcast WebSocket
- debit(owner_id, owner_type, amount, txn_type, **kwargs): atomic debit, raise InsufficientBalanceError if underfunded
- get_balance(owner_id, owner_type): return current balance
- process_top_up(rider_id, amount, admin_id): 
    check for OVERDUE remittance → auto-deduct penalty first → credit remainder
- process_order_payment(rider_id, order): debit rider wallet, log as PAYMENT_TO_MERCHANT
- deduct_commission(rider_id, order): debit commission amount after delivery
- credit_initial_load(rider_id): credit ₱500 on KYC approval
- credit_loyalty_points(user_id, order): calculate points, update UserLoyaltyPoints, create PointsTransaction

LoyaltyPointsService:
- redeem_points(user_id, points_to_redeem): validate balance, convert to ₱ discount
- Points value: configurable via LOYALTY_POINT_VALUE_PESOS setting

RemittanceService:
- create_weekly_remittance(period_start, period_end): Celery Beat task every Monday midnight
  scans all riders with balance owed, creates RemittanceRecord
- mark_overdue(): set OVERDUE for records past due_date
- record_payment(rider_id, reference): mark PAID

API:
- GET /api/v1/rider/wallet/ → balance + recent transactions
- GET /api/v1/rider/wallet/transactions/ → paginated transaction history
- GET /api/v1/user/wallet/ → user wallet balance + transactions
- GET /api/v1/user/points/ → points summary
- GET /api/v1/user/points/history/ → points transaction history

Output all wallet/ files with full content.
```

---

### PROMPT 5.1 — orders Module

```
Build the `orders` Django app for RAPEX.

Models: Order, OrderItem, OrderStatusHistory  
(See BLUEPRINT.md Section 3 — orders module for exact fields)

Critical: Implement the full state machine (Section 9 of BLUEPRINT.md).

Services — OrderService:
- place_order(user, validated_data):
    1. Validate store is open + accepting delivery
    2. Validate each product is available, snapshot product name + price
    3. Calculate delivery fee via SettingsService.calculate_delivery_fare()
    4. Apply points discount if points_to_redeem > 0
    5. Create Order + OrderItems in transaction.atomic()
    6. Schedule cancel_order_if_not_accepted Celery task (countdown=180)
    7. Send WebSocket event: order.new → merchant_{merchant_id} group
    8. Send FCM push to merchant
    9. Return order

- accept_order(order, merchant):
    1. Validate order.status == PENDING_MERCHANT
    2. Revoke Celery timeout task
    3. Set status MERCHANT_ACCEPTED → PREPARING (or COOKING for food)
    4. Send WebSocket + push to user

- reject_order(order, merchant, reason):
    1. Validate cancellable status
    2. Set CANCELLED, save reason
    3. Refund points if redeemed
    4. Notify user

- assign_rider(order, rider):
    1. Validate rider.wallet_balance >= order.total_amount
    2. Assign rider to order
    3. Update status → RIDER_ASSIGNED
    4. Notify user + merchant

- pickup_confirmed(order, merchant):
    1. Status: PICKED_UP
    2. WalletService.process_order_payment(rider, order)
    3. Status: IN_TRANSIT
    4. Start GPS enforcement

- mark_delivered(order, rider, lat, lng):
    1. Validate GPS distance ≤ 50m from delivery_lat/lng
    2. Status: DELIVERED
    3. WalletService.deduct_commission(rider, order)
    4. Async Celery: credit_loyalty_points(user, order) after 30s delay
    5. Update remittance record
    6. Notify all parties

Celery Tasks:
- cancel_order_if_not_accepted(order_id): auto-cancel PENDING_MERCHANT after 3min
- ping_available_riders(order_id): find riders within search radius, 
  check wallet balance ≥ order total, send WebSocket ping to rider_{rider_id} group

API:
- POST /api/v1/user/orders/ → place_order
- GET /api/v1/user/orders/ → user order list (paginated, filterable)
- GET /api/v1/user/orders/{id}/ → order detail
- POST /api/v1/user/orders/{id}/cancel/ → cancel (pre-pickup only)
- GET /api/v1/merchant/orders/ → merchant order list
- PATCH /api/v1/merchant/orders/{id}/accept/ → accept
- PATCH /api/v1/merchant/orders/{id}/reject/ → reject
- PATCH /api/v1/merchant/orders/{id}/pickup-confirmed/ → confirm pickup
- GET /api/v1/rider/orders/active/ → active order assigned to rider
- POST /api/v1/rider/orders/{id}/accept/ → accept ping
- POST /api/v1/rider/orders/{id}/reject/ → reject ping
- POST /api/v1/rider/orders/{id}/deliver/ → confirm delivery (lat+lng required)

WebSocket events (use channel_layer.group_send):
order.new, order.accepted, order.status_changed, 
order.rider_assigned, order.picked_up, rider.ping

Output all orders/ files with full content.
```

---

### PROMPT 8.1 — notifications Module

```
Build the `notifications` Django app for RAPEX.

Models:
- Notification: recipient_id, recipient_role, channel(PUSH_FCM/WEB_PUSH/IN_APP/SMS),
  event_type, title, body, data_payload JSONB NULL, sent_at, delivery_status,
  error_message NULL
- FCMToken: owner_id, owner_role, device_id, fcm_token TEXT, is_active, last_active

NotificationService:
- send(recipient_id, role, event_type, data):
    1. Look up FCM tokens for recipient
    2. Dispatch to Celery: dispatch_notification.delay(...)
    3. Create Notification record

Celery Tasks:
- dispatch_notification(notification_id):
    1. Send FCM via firebase_admin.messaging.send(Message(...))
    2. Send OneSignal web push via HTTP POST
    3. Send in-app via channel_layer.group_send to user_{id} group
    4. Send SMS via Semaphore if event requires it (OTP, critical alerts)
    5. Update Notification.delivery_status

Notification event_type templates to implement:
- order.new (→ Merchant)
- order.accepted (→ User)
- order.rejected (→ User)
- order.rider_assigned (→ User, Merchant)
- order.picked_up (→ User)
- order.delivered (→ User, Merchant)
- order.cancelled (→ User, Merchant, Rider)
- order.timeout_cancelled (→ User)
- rider.ping (→ Rider)
- wallet.credited (→ Rider or User)
- wallet.debited (→ Rider)
- kyc.approved (→ Merchant, Rider, User)
- kyc.rejected (→ Merchant, Rider, User)
- points.earned (→ User)
- referral.credited (→ User or Rider)
- remittance.due_soon (→ Rider)
- remittance.overdue (→ Rider)
- system.broadcast (→ All)

API:
- POST /api/v1/notifications/fcm-token/ → register FCM token
- GET /api/v1/admin/notifications/log/ → paginated notification history
- POST /api/v1/admin/notifications/broadcast/ → system.broadcast to role(s)
- PATCH /api/v1/[role]/notifications/{id}/read/ → mark as read

Output all notifications/ files with full content.
```

---

### PROMPT 11.1 — SuperAdmin Dashboard (Next.js)

```
Build the SuperAdmin Dashboard Next.js app for RAPEX.

Reference UI: https://apex-dashboard.pages.dev/ — copy EXACTLY.
Framework: Next.js 14 App Router, TypeScript, TailwindCSS.
Colors: #FF6B00 (primary), #7C3AED (secondary), dark mode default.

Port: 3004
Domain: superadmin.rapex.ph

Create all screens modeled after Apex Dashboard's layout:
1. Login page — dark card center, RAPEX logo, phone + OTP + password form
2. Dashboard overview — Apex stat cards showing:
   - Total Platform GMV (today / week / month)
   - Active Users, Active Merchants, Active Riders (counts)
   - Platform Commission Earned (today/week/month)
   - New Registrations (today)
   - Orders (today: placed / completed / cancelled)
   - Line chart: 30-day revenue trend
   - Pie chart: Orders by store type
3. Admin Management — Apex data table: list all admin accounts, create/edit/deactivate
4. Platform Settings — 2-column settings panel: key-value editor with save button per row
5. Markup & Commission Tiers — Cards per store type with editable tier rows
6. Wallet Ledger — Full transaction history table with filters (role, type, date range)
7. Fraud Blacklist — Table of blacklisted accounts (all roles), add new entry
8. Audit Log — Read-only data table: which admin did what + timestamp
9. Reporting — Date picker + export to CSV/PDF

Components to create (all matching Apex Dashboard style):
- layouts/DashboardLayout.tsx — sidebar + topbar
- components/StatCard.tsx — icon + number + label + change %
- components/DataTable.tsx — sortable, paginated, with search
- components/PageHeader.tsx — title + breadcrumb + action button
- components/Modal.tsx — dark modal with form
- components/Badge.tsx — status badge (colored pill)

Output all files with full content. Include:
- app/layout.tsx, app/page.tsx (redirect to dashboard)
- All page.tsx files
- All component files
- tailwind.config.ts with RAPEX color tokens
- lib/api.ts with Axios + JWT interceptor
- All TypeScript types in types/index.ts
```

---

### PROMPT 12.1 — Mobile App Scaffold + Auth

```
Build the React Native Expo mobile app for RAPEX.

Create the full Expo project structure using Expo Router 3 (file-based routing).
Support 3 roles on one app: USER, MERCHANT, RIDER.
After login, route to role-specific navigation stacks.

Screens to implement:

Auth Screens (app/(auth)/):
- login.tsx: Phone input → OTP request → OTP 6-digit input → password → login
- register.tsx: Role selection (User/Merchant/Rider) → Phone + OTP → 
  registration form (role-specific fields) → success screen
- Step 1 always: OTP verification via /auth/otp/request/ → /auth/otp/verify/
- On verified: temp_token → registration payload → /auth/register/[role]/

Auth flow:
- Store access_token in expo-secure-store key "access_token"
- Store refresh_token in expo-secure-store key "refresh_token"
- Store user object in expo-secure-store key "user"
- On app start: check for stored tokens → validate → redirect to role screens

Root layout (app/_layout.tsx):
- Load stored user
- If no user: redirect to /(auth)/login
- If user.role == USER: redirect to /(user)/
- If user.role == MERCHANT: redirect to /(merchant)/
- If user.role == RIDER: redirect to /(rider)/

User screens (app/(user)/):
- Tab navigator: Home, Orders, Wallet, Profile
- Home: list of nearby store categories → discovery of open stores
- Orders: list + status badges + order tracking screen with Google Maps

Rider screens (app/(rider)/):
- Tab navigator: Home, Orders, Wallet, Profile
- Home: Online/Offline toggle (large button), delivery request incoming ping (bottom sheet)
- Live tracking: map with route to merchant → route to customer

Design:
- Match Apex Dashboard dark theme palette on mobile
- React Native StyleSheet — not Tailwind (mobile)
- Use react-native-maps for all map screens
- Bottom tab navigator from expo-router tabs

Output all files with full content.
```

---

## SECTION 4 — COMPONENT REFERENCE (Apex Dashboard Mapping)

| RAPEX Screen | Apex Component to Copy |
|---|---|
| All dashboards — sidebar | Apex left nav sidebar |
| Stat cards (GMV, users, etc.) | Apex summary cards with icon + number |
| Data tables (orders, users, etc.) | Apex data table with pagination |
| Charts (revenue, order trends) | Apex recharts area/line charts |
| KYC review panel | Apex profile card + form |
| Modals (create/edit) | Apex modal component |
| Status badges | Apex badge/pill component |
| Form inputs | Apex form input style |
| Page headers | Apex breadcrumb + title bar |
| Alerts / toasts | Apex alert component |

---

## SECTION 5 — FINAL INTEGRATION PROMPT

```
All backend modules are complete. All frontend apps are complete. 
Now integrate everything and verify:

1. Run through full Order flow end-to-end:
   User places order → Merchant accepts → Rider receives ping → Rider accepts →
   Merchant confirms pickup → Rider marks delivered → User sees delivered.
   Verify at each step: WebSocket event fires, push notification sent, 
   wallet balance changes, order status logged in OrderStatusHistory.

2. KYC approval flow:
   Merchant submits KYC photos → Admin sees in KYC queue → Admin approves →
   Merchant receives push notification → Merchant can now create stores.

3. Wallet top-up flow:
   Rider sends screenshot in chat → Admin views → Admin confirms amount →
   Wallet credited → Overdue remittance auto-deducted if applicable.

4. Points and referral:
   User completes an order → Points credited async (30s delay) → 
   User checks points → User redeems on next order.
   User shares referral link → New user registers → Referral points credited → 
   Monthly cap enforced.

5. Verify all 5 web dashboards load correctly on correct ports.
   Verify mobile app routes correctly per role.
   Verify all pages match Apex Dashboard design.

List any gaps or missing connections found. Fix each one.
Output any missing files.
```

---

*End of RAPEX Master Build Prompt — v1.0 MVP*
