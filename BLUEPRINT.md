# RAPEX Technologies OPC — SYSTEM BLUEPRINT

> **Version:** 1.0 MVP · March 2026  
> **Architecture:** Modular-Monolith · Django 5.x · Next.js 14+ · React Native  
> **This document:** Authoritative technical blueprint for system design, data models, API structure, and data flows.

---

## TABLE OF CONTENTS

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Module Map](#2-module-map)
3. [Database Schema](#3-database-schema)
4. [API Structure](#4-api-structure)
5. [WebSocket Event Map](#5-websocket-event-map)
6. [Core Data Flows](#6-core-data-flows)
7. [Authentication Architecture](#7-authentication-architecture)
8. [Wallet Engine Design](#8-wallet-engine-design)
9. [Order State Machine](#9-order-state-machine)
10. [Notification Pipeline](#10-notification-pipeline)
11. [File Storage Architecture](#11-file-storage-architecture)
12. [Infrastructure Diagram](#12-infrastructure-diagram)
13. [Docker Architecture](#13-docker-architecture)

---

## 1. SYSTEM ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├──────────────┬──────────────┬──────────────┬──────────────────  │
│  User Web    │  Merchant    │  Rider Web   │  Admin / SuperAdmin │
│  (Next.js)  │  (Next.js)   │  (Next.js)   │  (Next.js)          │
├──────────────┴──────────────┴──────────────┴──────────────────  │
│              React Native Mobile App (Expo)                       │
│         User · Merchant · Rider (Android-first)                   │
└───────────────────────┬─────────────────────────────────────────┘
                         │ HTTPS / WSS
┌───────────────────────▼─────────────────────────────────────────┐
│                        NGINX (Reverse Proxy)                      │
│         SSL termination · Load balancing · Static files           │
├──────────────────────────┬──────────────────────────────────────┤
│       Gunicorn WSGI       │           Daphne ASGI                 │
│    (Django REST API)      │     (Django Channels — WebSocket)     │
└──────────────┬───────────┴────────────────┬─────────────────────┘
               │                             │
┌──────────────▼─────────────────────────────▼────────────────────┐
│                     DJANGO APPLICATION                            │
│  Modular-Monolith with 19 internal modules                        │
│  ORM → PostgreSQL · Channels → Redis · Tasks → Celery            │
└──────────┬──────────────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────────┐
│                     DATA & SERVICE LAYER                          │
├─────────────┬──────────────┬───────────────┬────────────────────┤
│ PostgreSQL  │    Redis 7   │    MinIO /    │  External APIs      │
│     16      │  (Cache,     │   Cloudflare  │  Google Maps        │
│ PgBouncer   │   Sessions,  │      R2       │  Semaphore SMS      │
│ (Pooling)   │   Pub/Sub,   │  (File Store) │  FCM / OneSignal    │
│             │   Celery)    │               │                     │
└─────────────┴──────────────┴───────────────┴────────────────────┘
```

### Frontend Shared UI Layer (Web)

All web dashboards use a shared component package at `frontend/shared/src`.

- Reusable layout, table, chart, and UI primitives are implemented once in shared.
- Role apps (`frontend/admin`, `frontend/superadmin`, `frontend/merchant`, `frontend/rider`, `frontend/user`) consume shared components via wrappers/configuration.
- Common components must not be reimplemented per role app.

---

## 2. MODULE MAP

Each module is a Django app with its own `models.py`, `serializers.py`, `views.py`, `urls.py`, `services.py`, `tasks.py`, and `tests.py`.

```
Module              Responsibility
─────────────────   ──────────────────────────────────────────────────
core                BaseModel, shared mixins, custom permissions,
                    pagination classes, exception handlers, constants

accounts            CustomUser base model, role-specific profile models:
                    SuperAdminProfile, AdminProfile, MerchantProfile,
                    RiderProfile, UserProfile — plus auth endpoints

superadmin          SuperAdmin dashboard APIs, platform settings CRUD,
                    admin account management, financial override

admin_panel         Admin dashboard APIs, KYC review, user/merchant/
                    rider management, referral management

merchant            MerchantStore model, store settings, multi-store
                    registration, store schedule management

shop                ShopProduct, ShopCategory models and CRUD APIs

fresh_market        FreshProduct, pricing modes, freshness toggle,
                    daily reset logic

ready_to_eat        MenuItem, MenuCategory, ServingSize, AddOn models,
                    store hours enforcement, prep time

preloved            PreLovedListing, condition rating, negotiable
                    pricing, listing status management

orders              Order, OrderItem models, state machine,
                    3-minute timer logic, order history

delivery            DeliveryFare, rider auto-ping engine, Geolocation
                    matching, GPS tracking session management

rider               RiderProfile, vehicle management, remittance
                    tracking, weekly incentive calculation

wallet              RapexWallet, WalletTransaction, atomic operations,
                    balance ledger, auto-deduction logic

notifications       NotificationTemplate, NotificationLog, FCM push,
                    OneSignal web push, SMS dispatch (Semaphore)

messaging           ChatThread, ChatMessage, read receipts, attachment
                    handling, admin chat panel

referrals           ReferralCode, ReferralRecord, MonthlyPointsTracker,
                    QR code generation, points engine

reports             Report generation (daily/weekly/monthly), query
                    aggregators, CSV/PDF export via ReportLab

fraud               FraudFlag, InvestigationCase, AccountBlacklist,
                    auto-flagging rules, case lifecycle management

settings_module     PlatformSetting key-value store, markup tiers,
                    commission rates, feature flags, maintenance mode
```

---

## 3. DATABASE SCHEMA

### Core Models

```sql
-- BaseModel (abstract — all models inherit)
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
is_deleted      BOOLEAN DEFAULT FALSE
deleted_at      TIMESTAMPTZ NULL

-- Note: All FKs target UUID primary keys
```

---

### accounts module

```sql
-- Base user table (extends AbstractBaseUser)
CustomUser (
  id              UUID PK,
  email           VARCHAR(255) UNIQUE NULL,
  phone           VARCHAR(20) UNIQUE NOT NULL,
  role            ENUM('SUPERADMIN','ADMIN','MERCHANT','RIDER','USER'),
  is_active       BOOLEAN DEFAULT TRUE,
  is_verified     BOOLEAN DEFAULT FALSE,
  device_id       VARCHAR(255) NULL,
  last_login      TIMESTAMPTZ NULL,
  ...BaseModel
)

SuperAdminProfile (
  user_id         FK CustomUser,
  full_name       VARCHAR(200),
  ...BaseModel
)

AdminProfile (
  user_id         FK CustomUser,
  full_name       VARCHAR(200),
  sub_role        ENUM('OPERATIONS','SUPPORT','FINANCE','COMPLIANCE','LOGISTICS'),
  permissions     JSONB  -- {"user_management": true, "reports": true, ...}
  ...BaseModel
)

MerchantProfile (
  user_id         FK CustomUser,
  full_name       VARCHAR(200),
  birthday        DATE,
  home_address    TEXT,
  business_name   VARCHAR(200),
  business_address TEXT,
  business_lat    DECIMAL(10,8),
  business_lng    DECIMAL(11,8),
  kyc_status      ENUM('PENDING','APPROVED','REJECTED'),
  kyc_rejection_reason TEXT NULL,
  kyc_id_photo    VARCHAR(500),  -- storage URL
  kyc_selfie_photo VARCHAR(500),
  kyc_business_doc VARCHAR(500),
  ...BaseModel
)

RiderProfile (
  user_id         FK CustomUser,
  full_name       VARCHAR(200),
  birthday        DATE,
  home_address    TEXT,
  home_lat        DECIMAL(10,8),
  home_lng        DECIMAL(11,8),
  emergency_contact_name    VARCHAR(200),
  emergency_contact_phone   VARCHAR(20),
  vehicle_type    ENUM('BICYCLE','MOTORCYCLE','4_WHEELS'),
  vehicle_plate   VARCHAR(20) NULL,
  vehicle_model   VARCHAR(100) NULL,
  kyc_status      ENUM('PENDING','APPROVED','REJECTED'),
  kyc_id_photo    VARCHAR(500),
  kyc_selfie_photo VARCHAR(500),
  is_online       BOOLEAN DEFAULT FALSE,
  current_lat     DECIMAL(10,8) NULL,
  current_lng     DECIMAL(11,8) NULL,
  background_check_flagged BOOLEAN DEFAULT FALSE,
  ...BaseModel
)

UserProfile (
  user_id         FK CustomUser,
  full_name       VARCHAR(200),
  birthday        DATE,
  home_address    TEXT,
  home_lat        DECIMAL(10,8),
  home_lng        DECIMAL(11,8),
  kyc_status      ENUM('PENDING','APPROVED','REJECTED'),
  kyc_id_type     VARCHAR(50),
  kyc_id_photo    VARCHAR(500),
  kyc_selfie_photo VARCHAR(500),
  ...BaseModel
)
```

---

### merchant module

```sql
MerchantStore (
  id              UUID PK,
  merchant_id     FK MerchantProfile,
  store_type      ENUM('SHOP','FRESH_MARKET','READY_TO_EAT','PRELOVED'),
  display_name    VARCHAR(200),
  description     TEXT NULL,
  logo_url        VARCHAR(500) NULL,
  banner_url      VARCHAR(500) NULL,
  is_open         BOOLEAN DEFAULT FALSE,
  is_visible      BOOLEAN DEFAULT TRUE,
  is_accepting_delivery   BOOLEAN DEFAULT TRUE,
  is_accepting_pickup     BOOLEAN DEFAULT TRUE,
  tags            JSONB DEFAULT '[]',
  ...BaseModel
)

StoreSchedule (
  id              UUID PK,
  store_id        FK MerchantStore,
  day_of_week     SMALLINT,  -- 0=Monday, 6=Sunday
  open_time       TIME NULL,
  close_time      TIME NULL,
  is_closed       BOOLEAN DEFAULT FALSE
)

-- Markup override per merchant (if set, overrides global)
MerchantMarkupOverride (
  id              UUID PK,
  merchant_id     FK MerchantProfile,
  store_type      ENUM(...) NULL,  -- NULL = applies to all this merchant's stores
  tier_1_rate     DECIMAL(5,2),   -- ₱1-₱100
  tier_2_rate     DECIMAL(5,2),   -- ₱101-₱1000
  tier_3_rate     DECIMAL(5,2),   -- ₱1001+
  set_by_admin    FK AdminProfile,
  reason          TEXT,
  ...BaseModel
)
```

---

### shop / fresh_market / ready_to_eat / preloved modules

```sql
-- SHOP
ShopCategory (
  id, store_id FK, name VARCHAR(100), display_order INT
)
ShopProduct (
  id              UUID PK,
  store_id        FK MerchantStore,
  category_id     FK ShopCategory NULL,
  name            VARCHAR(200),
  description     TEXT NULL,
  base_price      DECIMAL(10,2),
  markup_rate     DECIMAL(5,2),  -- Applied at time of product save
  final_price     DECIMAL(10,2), -- base_price * (1 + markup_rate)
  images          JSONB,          -- ['url1', 'url2', ...]
  has_inventory   BOOLEAN DEFAULT FALSE,
  stock_qty       INT DEFAULT 0,
  is_available    BOOLEAN DEFAULT TRUE,
  is_on_promo     BOOLEAN DEFAULT FALSE,
  promo_original_price DECIMAL(10,2) NULL,
  ...BaseModel
)

-- FRESH MARKET
FreshProduct (
  id, store_id FK, name, product_type ENUM(VEGETABLE,FRUIT,RAW_MEAT,...),
  pricing_mode ENUM(PER_PIECE,PER_KILO,PER_100G,PER_PACK,PER_BUNDLE),
  base_price, markup_rate, final_price, images JSONB,
  freshness_status ENUM(FRESH_TODAY,LIMITED,OUT_OF_STOCK),
  auto_reset_daily BOOLEAN DEFAULT FALSE,
  merchant_notes TEXT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  ...BaseModel
)

-- READY TO EAT
MenuCategory (id, store_id FK, name, display_order)
MenuItem (
  id, store_id FK, category_id FK NULL,
  name, description, images JSONB,
  is_available BOOLEAN DEFAULT TRUE, is_sold_out BOOLEAN DEFAULT FALSE,
  ...BaseModel
)
MenuItemVariant (  -- Serving sizes
  id, menu_item_id FK, name VARCHAR(100),  -- "Solo", "Bilhan"
  base_price, markup_rate, final_price,
  is_available BOOLEAN DEFAULT TRUE
)
MenuItemAddOn (
  id, menu_item_id FK, name VARCHAR(100),
  price DECIMAL(10,2), is_available BOOLEAN DEFAULT TRUE
)
ReadyToEatStoreSettings (
  store_id FK UNIQUE, default_prep_time_minutes INT DEFAULT 15
)

-- PRELOVED
PreLovedCategory (id, store_id FK, name)
PreLovedListing (
  id, store_id FK, category_id FK NULL,
  title VARCHAR(300), description TEXT,
  condition ENUM(NEW,LIKE_NEW,GOOD,FAIR,FOR_PARTS),
  base_price, markup_rate, final_price,
  is_negotiable BOOLEAN DEFAULT FALSE,
  availability_status ENUM(AVAILABLE,RESERVED,SOLD),
  delivery_available BOOLEAN DEFAULT TRUE,
  images JSONB,
  ...BaseModel
)
```

---

### orders module

```sql
Order (
  id              UUID PK,
  order_number    VARCHAR(20) UNIQUE,  -- Human-readable e.g., "ORD-20260301-0001"
  user_id         FK UserProfile,
  merchant_id     FK MerchantProfile,
  store_id        FK MerchantStore,
  store_type      ENUM('SHOP','FRESH_MARKET','READY_TO_EAT','PRELOVED'),
  rider_id        FK RiderProfile NULL,
  status          ENUM(
                    'PENDING_MERCHANT','MERCHANT_ACCEPTED',
                    'PREPARING','COOKING',
                    'FOR_PICKUP','READY_FOR_PICKUP',
                    'RIDER_ASSIGNED','PICKED_UP',
                    'IN_TRANSIT','DELIVERED',
                    'CANCELLED','TIMEOUT_CANCELLED','FAILED'
                  ),
  delivery_method ENUM('DELIVERY','PICKUP'),
  vehicle_type    ENUM('BICYCLE','MOTORCYCLE','4_WHEELS') NULL,
  delivery_speed  ENUM('STANDARD','SAVER') NULL,
  delivery_address TEXT NULL,
  delivery_lat    DECIMAL(10,8) NULL,
  delivery_lng    DECIMAL(11,8) NULL,
  subtotal        DECIMAL(10,2),  -- Before delivery fee
  delivery_fee    DECIMAL(10,2) DEFAULT 0,
  points_discount DECIMAL(10,2) DEFAULT 0,
  total_amount    DECIMAL(10,2),  -- subtotal + delivery_fee - points_discount
  markup_collected DECIMAL(10,2),
  commission_rate  DECIMAL(5,2),
  commission_amount DECIMAL(10,2),
  rapex_fee       DECIMAL(10,2),  -- 10% of commission
  merchant_accept_deadline TIMESTAMPTZ,  -- placed_at + 3 minutes
  pickup_confirmed_at TIMESTAMPTZ NULL,
  delivered_at    TIMESTAMPTZ NULL,
  cancellation_reason TEXT NULL,
  special_notes   TEXT NULL,
  ...BaseModel
)

OrderItem (
  id              UUID PK,
  order_id        FK Order,
  product_id      UUID,  -- polymorphic FK: ShopProduct / FreshProduct / MenuItemVariant / PreLovedListing
  product_type    ENUM('SHOP','FRESH','FOOD','PRELOVED'),
  product_name    VARCHAR(300),  -- snapshot at order time
  unit_price      DECIMAL(10,2),  -- final_price at order time (snapshot)
  quantity        DECIMAL(8,3),  -- decimal for weight-based
  line_total      DECIMAL(10,2),
  add_ons         JSONB NULL,     -- snapshot of selected add-ons
  special_note    TEXT NULL
)

OrderStatusHistory (
  id              UUID PK,
  order_id        FK Order,
  from_status     ENUM,
  to_status       ENUM,
  changed_by_role ENUM('SYSTEM','MERCHANT','RIDER','ADMIN','USER'),
  changed_by_id   UUID NULL,
  changed_at      TIMESTAMPTZ DEFAULT NOW(),
  note            TEXT NULL
)
```

---

### delivery module

```sql
DeliveryFareConfig (  -- Managed via admin settings
  id, vehicle_type ENUM, base_fare DECIMAL(10,2),
  standard_addon DECIMAL(10,2), saver_addon DECIMAL(10,2),
  surcharge_per_km DECIMAL(10,2), base_coverage_km DECIMAL(5,2),
  is_active BOOLEAN DEFAULT TRUE, ...BaseModel
)

RiderDeliverySession (
  id              UUID PK,
  rider_id        FK RiderProfile,
  order_id        FK Order UNIQUE,
  started_at      TIMESTAMPTZ,
  pickup_confirmed_at TIMESTAMPTZ NULL,
  delivered_at    TIMESTAMPTZ NULL,
  total_distance_km DECIMAL(8,3) NULL,
  gps_track       JSONB NULL  -- array of {lat, lng, ts} points for replay
)
```

---

### wallet module

```sql
RapexWallet (
  id              UUID PK,
  owner_id        UUID NOT NULL,
  owner_type      ENUM('RIDER','USER'),
  balance         DECIMAL(12,2) DEFAULT 0.00,
  last_updated    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (owner_id, owner_type)
)

WalletTransaction (
  id              UUID PK,
  wallet_id       FK RapexWallet,
  transaction_type ENUM(
                    'INITIAL_LOAD','TOP_UP','PAYMENT_TO_MERCHANT',
                    'COMMISSION_DEDUCTION','PENALTY_DEDUCTION',
                    'INCENTIVE_BONUS','REFERRAL_CREDIT',
                    'POINTS_REDEMPTION','ADMIN_ADJUSTMENT',
                    'REMITTANCE_COLLECTION'
                  ),
  amount          DECIMAL(12,2),  -- positive = credit, negative = debit
  balance_after   DECIMAL(12,2),
  order_id        FK Order NULL,
  reference_number VARCHAR(100) NULL,
  note            TEXT NULL,
  performed_by_id UUID NULL,  -- admin who performed, if manual
  performed_by_role ENUM('SYSTEM','ADMIN','SUPERADMIN') DEFAULT 'SYSTEM',
  ...BaseModel
)

RiderRemittanceRecord (
  id              UUID PK,
  rider_id        FK RiderProfile,
  period_start    DATE,
  period_end      DATE,
  amount_owed     DECIMAL(12,2),
  amount_paid     DECIMAL(12,2) DEFAULT 0,
  due_date        DATE,
  status          ENUM('CURRENT','DUE_SOON','OVERDUE','PAID','WAIVED'),
  paid_at         TIMESTAMPTZ NULL,
  payment_reference VARCHAR(100) NULL
)

UserLoyaltyPoints (
  id              UUID PK,
  user_id         FK UserProfile UNIQUE,
  total_points    INT DEFAULT 0,
  rollover_balance DECIMAL(10,2) DEFAULT 0.00,
  lifetime_earned INT DEFAULT 0,
  last_earned_at  TIMESTAMPTZ NULL
)

PointsTransaction (
  id              UUID PK,
  user_id         FK UserProfile,
  type            ENUM('EARNED','REDEEMED','ADJUSTED','EXPIRED'),
  points          INT,
  order_id        FK Order NULL,
  note            TEXT NULL,
  ...BaseModel
)
```

---

### messaging module

```sql
ChatThread (
  id              UUID PK,
  admin_id        FK AdminProfile,
  participant_id  UUID NOT NULL,
  participant_role ENUM('RIDER','USER','MERCHANT'),
  is_archived     BOOLEAN DEFAULT FALSE,
  unread_count_admin INT DEFAULT 0,
  unread_count_participant INT DEFAULT 0,
  last_message_at TIMESTAMPTZ NULL,
  ...BaseModel
)

ChatMessage (
  id              UUID PK,
  thread_id       FK ChatThread,
  sender_id       UUID NOT NULL,
  sender_role     ENUM('ADMIN','RIDER','USER','MERCHANT'),
  message_type    ENUM('TEXT','IMAGE','FILE','SYSTEM'),
  body            TEXT NULL,
  attachment_url  VARCHAR(500) NULL,
  is_verified     BOOLEAN DEFAULT FALSE,  -- for GCash screenshots
  wallet_amount   DECIMAL(10,2) NULL,     -- for verified top-ups
  read_at         TIMESTAMPTZ NULL,
  ...BaseModel
)
```

---

### referrals module

```sql
ReferralCode (
  id              UUID PK,
  owner_id        UUID NOT NULL,
  owner_role      ENUM('USER','RIDER'),
  code            VARCHAR(20) UNIQUE,
  qr_code_url     VARCHAR(500),
  total_used      INT DEFAULT 0,
  ...BaseModel
)

ReferralRecord (
  id              UUID PK,
  referral_code_id FK ReferralCode,
  referred_id     UUID NOT NULL,
  referred_role   ENUM('USER','RIDER'),
  status          ENUM('INVITED','REGISTERED','QUALIFIED','CREDITED','CAP_REACHED'),
  points_credited INT DEFAULT 0,
  credited_at     TIMESTAMPTZ NULL,
  ...BaseModel
)

ReferralMonthlyTracker (
  id              UUID PK,
  owner_id        UUID NOT NULL,
  owner_role      ENUM('USER','RIDER'),
  month_year      VARCHAR(7),  -- "2026-03"
  points_credited INT DEFAULT 0,
  UNIQUE (owner_id, owner_role, month_year)
)
```

---

### fraud module

```sql
FraudFlag (
  id              UUID PK,
  subject_id      UUID NOT NULL,
  subject_role    ENUM('USER','MERCHANT','RIDER','ORDER','TRANSACTION'),
  flag_type       ENUM(
                    'KYC_ANOMALY','CANCEL_PATTERN','SUSPICIOUS_TRANSACTION',
                    'RAPID_REFERRAL','NON_RESPONSIVE_RIDER',
                    'LATE_REMITTANCE','GPS_MANIPULATION','OTHER'
                  ),
  flag_reason     TEXT,
  auto_flagged    BOOLEAN DEFAULT TRUE,
  is_reviewed     BOOLEAN DEFAULT FALSE,
  reviewed_by     FK AdminProfile NULL,
  reviewed_at     TIMESTAMPTZ NULL,
  resolution      ENUM('CLEARED','ESCALATED','BLACKLISTED','PENDING') DEFAULT 'PENDING',
  ...BaseModel
)

InvestigationCase (
  id              UUID PK,
  case_number     VARCHAR(20) UNIQUE,
  fraud_flag_id   FK FraudFlag NULL,
  subject_id      UUID,
  subject_role    ENUM,
  title           TEXT,
  priority        ENUM('LOW','MEDIUM','HIGH','CRITICAL'),
  status          ENUM('OPEN','UNDER_REVIEW','RESOLVED','ESCALATED'),
  assigned_to     FK AdminProfile NULL,
  opened_by       FK AdminProfile,
  resolution_notes TEXT NULL,
  resolved_at     TIMESTAMPTZ NULL,
  ...BaseModel
)

AccountBlacklist (
  id              UUID PK,
  subject_id      UUID NOT NULL,
  subject_role    ENUM('USER','MERCHANT','RIDER'),
  reason          TEXT,
  blacklisted_by  FK AdminProfile OR SuperAdminProfile,
  is_permanent    BOOLEAN DEFAULT TRUE,
  expires_at      TIMESTAMPTZ NULL,
  ...BaseModel
)
```

---

### notifications module

```sql
Notification (
  id              UUID PK,
  recipient_id    UUID NOT NULL,
  recipient_role  ENUM('USER','MERCHANT','RIDER','ADMIN','SUPERADMIN'),
  channel         ENUM('PUSH_FCM','WEB_PUSH','IN_APP','SMS','EMAIL'),
  event_type      VARCHAR(100),  -- 'order.confirmed', 'wallet.credited', etc.
  title           VARCHAR(200),
  body            TEXT,
  data_payload    JSONB NULL,
  sent_at         TIMESTAMPTZ NULL,
  delivered_at    TIMESTAMPTZ NULL,
  read_at         TIMESTAMPTZ NULL,
  delivery_status ENUM('PENDING','SENT','DELIVERED','FAILED','READ'),
  error_message   TEXT NULL,
  ...BaseModel
)

FCMToken (
  id              UUID PK,
  owner_id        UUID NOT NULL,
  owner_role      ENUM,
  device_id       VARCHAR(255),
  fcm_token       TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  last_active     TIMESTAMPTZ,
  ...BaseModel
)
```

---

### settings_module

```sql
PlatformSetting (
  id              UUID PK,
  key             VARCHAR(100) UNIQUE,  -- e.g., 'RIDER_SEARCH_RADIUS_KM'
  value           TEXT,
  value_type      ENUM('STRING','INT','FLOAT','BOOL','JSON'),
  description     TEXT NULL,
  last_updated_by UUID NULL,
  ...BaseModel
)

MarkupTier (
  id              UUID PK,
  store_type      ENUM('ALL','SHOP','FRESH_MARKET','READY_TO_EAT','PRELOVED'),
  price_min       DECIMAL(10,2),
  price_max       DECIMAL(10,2) NULL,  -- NULL = no upper limit
  markup_rate     DECIMAL(5,2),
  is_active       BOOLEAN DEFAULT TRUE,
  ...BaseModel
)

CommissionTier (
  id              UUID PK,
  store_type      ENUM('ALL','SHOP','FRESH_MARKET','READY_TO_EAT','PRELOVED'),
  price_min       DECIMAL(10,2),
  price_max       DECIMAL(10,2) NULL,
  commission_rate DECIMAL(5,2),
  is_active       BOOLEAN DEFAULT TRUE,
  ...BaseModel
)
```

---

## 4. API STRUCTURE

All REST API endpoints follow the pattern: `https://api.rapex.ph/api/v1/[module]/[resource]/`

### Authentication Endpoints

```
POST   /api/v1/auth/register/user/              ← User registration
POST   /api/v1/auth/register/merchant/          ← Merchant registration
POST   /api/v1/auth/register/rider/             ← Rider registration
POST   /api/v1/auth/otp/request/                ← Request OTP (phone)
POST   /api/v1/auth/otp/verify/                 ← Verify OTP
POST   /api/v1/auth/token/                      ← Login → JWT tokens
POST   /api/v1/auth/token/refresh/              ← Refresh JWT
POST   /api/v1/auth/logout/                     ← Logout (revoke refresh token)
POST   /api/v1/auth/password/reset/request/     ← Request password reset
POST   /api/v1/auth/password/reset/confirm/     ← Confirm password reset
```

### SuperAdmin Endpoints

```
GET    /api/v1/superadmin/dashboard/            ← Platform dashboard stats
GET    /api/v1/superadmin/admins/               ← List all admin accounts
POST   /api/v1/superadmin/admins/               ← Create admin account
PATCH  /api/v1/superadmin/admins/{id}/          ← Edit admin
DELETE /api/v1/superadmin/admins/{id}/          ← Deactivate admin
GET    /api/v1/superadmin/settings/             ← Get all platform settings
PATCH  /api/v1/superadmin/settings/             ← Update platform settings
GET    /api/v1/superadmin/wallet-ledger/        ← Full wallet ledger
POST   /api/v1/superadmin/wallet/adjust/        ← Manual wallet adjustment
GET    /api/v1/superadmin/fraud/blacklist/       ← Platform blacklist
POST   /api/v1/superadmin/fraud/blacklist/       ← Add to blacklist
GET    /api/v1/superadmin/audit-log/            ← Full admin audit log
```

### Admin Endpoints

```
GET    /api/v1/admin/dashboard/                 ← Admin dashboard stats
-- User Management
GET    /api/v1/admin/users/                     ← List users (paginated+filtered)
GET    /api/v1/admin/users/{id}/                ← User detail
PATCH  /api/v1/admin/users/{id}/approve/        ← Approve KYC
PATCH  /api/v1/admin/users/{id}/reject/         ← Reject KYC (reason required)
PATCH  /api/v1/admin/users/{id}/suspend/        ← Suspend
PATCH  /api/v1/admin/users/{id}/ban/            ← Ban
PATCH  /api/v1/admin/users/{id}/points/adjust/  ← Adjust points
-- Merchant Management
GET    /api/v1/admin/merchants/
GET    /api/v1/admin/merchants/{id}/
PATCH  /api/v1/admin/merchants/{id}/approve/
PATCH  /api/v1/admin/merchants/{id}/reject/
PATCH  /api/v1/admin/merchants/{id}/suspend/
PATCH  /api/v1/admin/merchants/{id}/markup-override/
-- Rider Management
GET    /api/v1/admin/riders/
GET    /api/v1/admin/riders/{id}/
PATCH  /api/v1/admin/riders/{id}/approve/       ← Also triggers ₱500 wallet load
PATCH  /api/v1/admin/riders/{id}/reject/
PATCH  /api/v1/admin/riders/{id}/suspend/
POST   /api/v1/admin/riders/{id}/wallet/load/   ← Manual top-up after chat verify
PATCH  /api/v1/admin/riders/{id}/incentive/confirm/  ← Confirm weekly bonus
-- Referrals
GET    /api/v1/admin/referrals/users/
GET    /api/v1/admin/referrals/riders/
POST   /api/v1/admin/referrals/adjust/
-- Reports
GET    /api/v1/admin/reports/daily/
GET    /api/v1/admin/reports/weekly/
GET    /api/v1/admin/reports/monthly/
GET    /api/v1/admin/reports/by-store-type/
GET    /api/v1/admin/reports/by-region/
GET    /api/v1/admin/reports/riders/
GET    /api/v1/admin/reports/merchants/
-- Notifications
GET    /api/v1/admin/notifications/log/
POST   /api/v1/admin/notifications/broadcast/
-- Fraud
GET    /api/v1/admin/fraud/flags/
POST   /api/v1/admin/fraud/cases/
GET    /api/v1/admin/fraud/cases/
PATCH  /api/v1/admin/fraud/cases/{id}/
POST   /api/v1/admin/fraud/blacklist/
-- Settings
GET    /api/v1/admin/settings/
PATCH  /api/v1/admin/settings/
```

### Merchant Endpoints

```
GET    /api/v1/merchant/profile/
PATCH  /api/v1/merchant/profile/
GET    /api/v1/merchant/dashboard/
-- Stores
GET    /api/v1/merchant/stores/
POST   /api/v1/merchant/stores/
GET    /api/v1/merchant/stores/{id}/
PATCH  /api/v1/merchant/stores/{id}/
PATCH  /api/v1/merchant/stores/{id}/open/
PATCH  /api/v1/merchant/stores/{id}/close/
-- Products (per store type)
GET    /api/v1/merchant/stores/{id}/products/
POST   /api/v1/merchant/stores/{id}/products/
GET    /api/v1/merchant/stores/{id}/products/{pid}/
PATCH  /api/v1/merchant/stores/{id}/products/{pid}/
DELETE /api/v1/merchant/stores/{id}/products/{pid}/
-- Orders
GET    /api/v1/merchant/orders/
GET    /api/v1/merchant/orders/{id}/
PATCH  /api/v1/merchant/orders/{id}/accept/
PATCH  /api/v1/merchant/orders/{id}/reject/
PATCH  /api/v1/merchant/orders/{id}/pickup-confirmed/
-- Reports
GET    /api/v1/merchant/reports/revenue/
GET    /api/v1/merchant/reports/products/
```

### Rider Endpoints

```
GET    /api/v1/rider/profile/
PATCH  /api/v1/rider/profile/
PATCH  /api/v1/rider/online/                    ← Toggle online/offline
GET    /api/v1/rider/dashboard/
-- Orders
GET    /api/v1/rider/orders/active/
POST   /api/v1/rider/orders/{id}/accept/
POST   /api/v1/rider/orders/{id}/reject/
POST   /api/v1/rider/orders/{id}/deliver/       ← Mark as delivered (+ GPS coords)
-- Location
POST   /api/v1/rider/location/update/           ← GPS coordinate push
-- Wallet
GET    /api/v1/rider/wallet/
GET    /api/v1/rider/wallet/transactions/
-- Remittance
GET    /api/v1/rider/remittance/
-- Referral
GET    /api/v1/rider/referral/
```

### User Endpoints

```
GET    /api/v1/user/profile/
PATCH  /api/v1/user/profile/
-- Discovery
GET    /api/v1/user/merchants/?lat=X&lng=Y&type=SHOP   ← Nearby merchants
GET    /api/v1/user/merchants/{id}/products/
GET    /api/v1/user/search/?q=keyword&type=SHOP&lat=X&lng=Y
-- Cart & Orders
POST   /api/v1/user/orders/                     ← Place order
GET    /api/v1/user/orders/
GET    /api/v1/user/orders/{id}/
POST   /api/v1/user/orders/{id}/cancel/         ← Only pre-pickup
-- Delivery fare calculator
POST   /api/v1/user/delivery/fare-estimate/
-- Rider tracking
GET    /api/v1/user/orders/{id}/rider-location/ ← Returns lat/lng if in_transit
-- Wallet
GET    /api/v1/user/wallet/
GET    /api/v1/user/wallet/transactions/
-- Points
GET    /api/v1/user/points/
GET    /api/v1/user/points/history/
-- Referral
GET    /api/v1/user/referral/
```

### Shared Endpoints

```
POST   /api/v1/chat/messages/                   ← Send message
GET    /api/v1/chat/threads/                    ← Get chat thread(s)
GET    /api/v1/chat/threads/{id}/messages/      ← Get messages in thread
POST   /api/v1/notifications/fcm-token/         ← Register FCM token
```

---

## 5. WEBSOCKET EVENT MAP

WebSocket URL: `wss://ws.rapex.ph/ws/`

### Consumer Groups

```
Group Name Pattern             Members
──────────────────────────     ─────────────────────────────────
order_{order_id}               Customer + Merchant + Rider + Admin watching
rider_{rider_id}               Rider only (receive pings)
user_{user_id}                 User only (wallet updates, notifications)
merchant_{merchant_id}         Merchant (new orders, status updates)
admin_panel                    All logged-in admins
chat_thread_{thread_id}        Admin + thread participant
```

### Events

| Event Type | Direction | Payload Example |
|---|---|---|
| `order.new` | Server → Merchant, Admin | `{order_id, store_type, total, items_count}` |
| `order.accepted` | Server → User, Admin | `{order_id, status, merchant_name}` |
| `order.status_changed` | Server → User, Merchant, Admin | `{order_id, old_status, new_status, timestamp}` |
| `order.rider_assigned` | Server → User, Merchant | `{order_id, rider_name, vehicle_type}` |
| `order.picked_up` | Server → User | `{order_id, rider_lat, rider_lng}` |
| `rider.location` | Rider → Server → User, Merchant | `{rider_id, lat, lng, timestamp}` |
| `rider.ping` | Server → Rider | `{order_id, merchant_address, customer_area, order_total, expires_at}` |
| `wallet.updated` | Server → Rider/User | `{new_balance, transaction_type, amount}` |
| `chat.message` | Server → Thread Participants | `{thread_id, sender_role, body, timestamp}` |
| `notification.push` | Server → Recipient | `{title, body, data}` |
| `system.alert` | Server → All | `{message, severity}` |

---

## 6. CORE DATA FLOWS

### Order Placement → Delivery Complete Flow

```
1. User places order (POST /api/v1/user/orders/)
   → Order created: status = PENDING_MERCHANT
   → WebSocket: order.new → Merchant group
   → Push notification → Merchant FCM
   → 3-minute Celery countdown task scheduled

2. Merchant accepts (PATCH /orders/{id}/accept/)
   → status = PREPARING (or COOKING for food)
   → WebSocket: order.status_changed → User
   → Push: "Your order is being prepared"
   → Rider auto-ping begins (Celery task: find riders within 2km)

3. Rider ping (WebSocket: rider.ping → Rider)
   → Rider wallet checked: must have ≥ order total
   → 3-minute window for rider response

4. Rider accepts (POST /rider/orders/{id}/accept/)
   → status = RIDER_ASSIGNED
   → WebSocket: order.rider_assigned → User, Merchant
   → Rider navigation: show merchant map

5. Merchant confirms pickup (PATCH /orders/{id}/pickup-confirmed/)
   → Rider wallet debited: PAYMENT_TO_MERCHANT
   → status = PICKED_UP → IN_TRANSIT
   → WebSocket: order.picked_up → User (starts live map)
   → User GPS enforcement begins
   → Push: "Your order is on the way!"

6. Rider location updates (POST /rider/location/update/)
   → Current lat/lng saved to RiderProfile
   → WebSocket: rider.location → User (every 5 seconds)

7. Rider confirms delivery (POST /rider/orders/{id}/deliver/)
   → System validates: rider GPS within 50m of delivery address
   → status = DELIVERED
   → Commission auto-calculated and deducted from rider wallet
   → Loyalty points credited to user (Celery async)
   → WebSocket: order.status_changed → User, Merchant
   → Push: "Order delivered!" → User
   → Remittance record updated

8. Celery: Loyalty points credited after 30s (async)
   → UserLoyaltyPoints.total_points += earned_points
   → PointsTransaction created
   → Push / In-App: "You earned X points!"
```

### Wallet Top-Up Flow

```
1. Rider/User opens chat → sends top-up request + GCash screenshot
2. Admin sees unread badge on chat thread
3. Admin opens thread → views GCash screenshot inline
4. Admin clicks "Confirm Top-Up" → enters amount
5. API call: POST /api/v1/admin/riders/{id}/wallet/load/
   → WalletTransaction(type=TOP_UP) created atomically
   → RapexWallet.balance updated
   → Check: if pending remittance → auto-deduct from this top-up
   → WebSocket: wallet.updated → Rider/User
   → Chat auto-reply: "₱500 credited. New balance: ₱750."
   → Push notification to account holder
```

---

## 7. AUTHENTICATION ARCHITECTURE

```
Registration Flow:
  1. POST /auth/otp/request/ → (phone) → Semaphore SMS sends OTP
  2. POST /auth/otp/verify/ → (phone + otp) → Returns temp_token (10min JWT)
  3. POST /auth/register/user/ → (temp_token + form data) → Account created
  4. POST /auth/token/ → (phone + password or temp_token) → JWT pair

Login Flow:
  1. POST /auth/otp/request/ → OTP sent
  2. POST /auth/otp/verify/ → temp_token returned
  3. POST /auth/token/ → access_token (15min) + refresh_token (7d) in httpOnly cookies

Device Binding:
  - Login request includes: device_id (generated by client, stored in secure storage)
  - Server hashes: device_fingerprint = SHA256(device_id + user_agent + platform)
  - JWT payload includes: session_id, device_fingerprint
  - Middleware validates fingerprint on every request
  - New fingerprint → old sessions revoked (stored in Redis blacklist)

Token Refresh:
  - Client auto-refreshes access token 2 minutes before expiry
  - POST /auth/token/refresh/ with refresh token cookie
  - Returns new access token

Logout:
  - POST /auth/logout/ → refresh token added to Redis blacklist
  - All tokens for session_id invalidated
```

---

## 8. WALLET ENGINE DESIGN

### DB Transaction Safety

```python
# Every wallet operation uses atomic transactions
with transaction.atomic():
    wallet = RapexWallet.objects.select_for_update().get(owner_id=rider_id)
    
    new_balance = wallet.balance + amount  # positive=credit, negative=debit
    if new_balance < 0:
        raise InsufficientBalanceError()
    
    wallet.balance = new_balance
    wallet.save()
    
    WalletTransaction.objects.create(
        wallet=wallet,
        transaction_type=txn_type,
        amount=amount,
        balance_after=new_balance,
        ...
    )
    
    # Push real-time balance update via Channels
    async_to_sync(channel_layer.group_send)(
        f"user_{owner_id}",
        {"type": "wallet.updated", "new_balance": str(new_balance)}
    )
```

### Auto-Penalty on Top-Up Rule

```python
def process_top_up(rider_id, requested_amount, admin_id):
    with transaction.atomic():
        remittance = RiderRemittanceRecord.objects.filter(
            rider_id=rider_id, status='OVERDUE'
        ).first()
        
        if remittance:
            penalty = min(remittance.amount_owed, requested_amount)
            # Deduct penalty first
            create_wallet_transaction(rider_id, -penalty, 'PENALTY_DEDUCTION')
            remittance.amount_paid += penalty
            if remittance.amount_paid >= remittance.amount_owed:
                remittance.status = 'PAID'
            remittance.save()
            
            net_credit = requested_amount - penalty
        else:
            net_credit = requested_amount
        
        if net_credit > 0:
            create_wallet_transaction(rider_id, net_credit, 'TOP_UP')
```

---

## 9. ORDER STATE MACHINE

```
States and valid transitions:

PENDING_MERCHANT      → MERCHANT_ACCEPTED (merchant accepts within 3 min)
                      → TIMEOUT_CANCELLED (3-min timer expires, no response)
                      → CANCELLED (user cancels before merchant accepts)

MERCHANT_ACCEPTED     → PREPARING (for Shop, Fresh Market, Pre-Loved)
                      → COOKING (for Ready-to-Eat)

PREPARING             → FOR_PICKUP (rider assigned)
COOKING               → READY_FOR_PICKUP (food ready + rider assigned)

FOR_PICKUP            → PICKED_UP (merchant confirms rider took the order)
READY_FOR_PICKUP      → PICKED_UP (same)

PICKED_UP             → IN_TRANSIT (delivery session starts)
                      [CANCEL LOCKED FROM THIS POINT — NO TRANSITIONS TO CANCELLED]

IN_TRANSIT            → DELIVERED (rider marks delivery, GPS validated)
                      → FAILED (system or admin marks as failed)

DELIVERED             [Terminal state]
CANCELLED             [Terminal state]
TIMEOUT_CANCELLED     [Terminal state]
FAILED                [Terminal state]
```

### 3-Minute Timer (Celery)

```python
# When order created, schedule auto-cancel task
cancel_order_if_not_accepted.apply_async(
    args=[order_id],
    countdown=180,  # 3 minutes
    task_id=f"order_timeout_{order_id}"
)

# When merchant accepts: revoke the task
celery_app.control.revoke(f"order_timeout_{order_id}")
```

---

## 10. NOTIFICATION PIPELINE

```
Event occurs in Django view/service
    ↓
notifications.service.send_notification(
    recipient_id, role, event_type, data
)
    ↓
Celery async task: dispatch_notification.delay(...)
    ↓
    ├── FCM push (for mobile): firebase_admin.messaging.send()
    ├── OneSignal (for web push): requests.post(onesignal_api)
    ├── In-App via WebSocket: channel_layer.group_send()
    └── SMS via Semaphore: requests.post(semaphore_api)
    ↓
Notification record created in DB
Status updated: SENT → DELIVERED (on callback/receipt)
```

---

## 11. FILE STORAGE ARCHITECTURE

All user-uploaded files (KYC photos, product images, GCash screenshots) stored in MinIO or Cloudflare R2.

```
Storage structure:
  rapex-media/
  ├── kyc/
  │   ├── users/{user_id}/id_photo.jpg
  │   ├── users/{user_id}/selfie.jpg
  │   ├── merchants/{merchant_id}/id_photo.jpg
  │   ├── merchants/{merchant_id}/selfie.jpg
  │   ├── merchants/{merchant_id}/business_doc.pdf
  │   ├── riders/{rider_id}/id_photo.jpg
  │   └── riders/{rider_id}/selfie.jpg
  ├── products/
  │   └── {store_id}/{product_id}/{image_name}.jpg
  ├── stores/
  │   └── {store_id}/logo.jpg
  │   └── {store_id}/banner.jpg
  ├── chat/
  │   └── {thread_id}/{message_id}/{filename}
  └── referrals/
      └── {account_role}/{account_id}/qr_code.png
```

Upload Policy:
- KYC files: Private (only accessible via signed URL, 1-hour expiry)
- Product images: Public CDN via Cloudflare (cacheable)
- Chat attachments: Private (signed URL per request)

---

## 12. INFRASTRUCTURE DIAGRAM

```
INTERNET
    │
    ▼
┌─────────────────────────────────────┐
│         Cloudflare (DNS + CDN)       │
│   DDoS protection, static caching   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│         Hostinger VPS               │
│         (Ubuntu 22.04 LTS)          │
│                                     │
│  ┌────────────────────────────────┐ │
│  │    Nginx (Port 80/443)         │ │
│  │  SSL termination, routing       │ │
│  └───┬──────────┬─────────────────┘ │
│      │          │                   │
│  ┌───▼──┐  ┌───▼───┐               │
│  │Next.js│  │Daphne │               │
│  │ apps  │  │(ASGI/ │               │
│  │:3000– │  │  WS)  │               │
│  │ 3004  │  │:8001  │               │
│  └──────┘  └───┬───┘               │
│                │                   │
│  ┌─────────────▼──────────────────┐ │
│  │    Gunicorn (WSGI) :8000       │ │
│  │    Django Application           │ │
│  └──────────┬──────────────────── ┘ │
│             │                       │
│  ┌──────────▼─────────────────────┐ │
│  │  PgBouncer :6432 (Pool)        │ │
│  └──────────┬─────────────────────┘ │
│             │                       │
│  ┌──────────▼──────┐  ┌──────────┐  │
│  │  PostgreSQL 16  │  │ Redis 7  │  │
│  │    :5432        │  │  :6379   │  │
│  └─────────────────┘  └────┬─────┘  │
│                             │        │
│  ┌──────────────────────────▼──────┐ │
│  │  Celery Worker + Beat           │ │
│  └─────────────────────────────────┘ │
│                                      │
│  ┌──────────────────────────────────┐ │
│  │  MinIO Object Storage :9000     │ │
│  └──────────────────────────────────┘ │
└──────────────────────────────────────┘
         │
         ▼ (External API Calls)
┌────────────────────────────────────────┐
│  Google Maps API (Places/Directions)   │
│  Firebase FCM (Push Notifications)     │
│  Semaphore SMS API (OTP/Alerts)        │
│  OneSignal (Web Push)                  │
└────────────────────────────────────────┘
```

---

*End of RAPEX System Blueprint — v1.0 MVP*

---

## 13. DOCKER ARCHITECTURE

All backend and frontend services run as Docker containers orchestrated by Docker Compose. The mobile app (React Native / Expo) runs natively on developer machines and is NOT containerized.

### docker-compose Service Map

```
┌────────────────────────── Docker Compose Network: rapex-net ──────────────────────────┐
│                                                                          │
│   ┌────────────────────────────────┐                              │
│   │    nginx (:80 / :443)            │                              │
│   │    SSL termination, routing      │                              │
│   └───┬────────────┬───────────┬──┘                              │
│         │              │           │                              │
│   ┌─────┴───┐   ┌───┴───┐   ┌───┴───────┐                  │
│   │  gunicorn   │   │  daphne   │   │    user     │                  │
│   │  :8000       │   │  :8001    │   │  :3000      │                  │
│   │  (Django/WSGI)│   │  (ASGI/WS)│   │  (Next.js)  │                  │
│   └─────────────┘   └──────────┘   └─────────────┘                  │
│                                                                          │
│   ┌─────────────┐  ┌─────────────┐  ┌───────────────┐  ┌────────────┐    │
│   │  merchant   │  │   rider     │  │    admin      │  │ superadmin │    │
│   │  :3001       │  │   :3002    │  │   :3003       │  │  :3004     │    │
│   └─────────────┘  └─────────────┘  └───────────────┘  └────────────┘    │
│                                                                          │
│   ┌─────────────┐  ┌─────────────┐  ┌───────────────┐                    │
│   │celery-worker│  │ celery-beat │  │   pgbouncer   │                    │
│   └─────────────┘  └─────────────┘  └─────┬─────────┘                    │
│                                            │                              │
│   ┌─────────────┐  ┌─────────────┐  ┌─────┴─────────┐                    │
│   │    redis     │  │    minio    │  │  postgresql    │                    │
│   │    :6379     │  │ :9000/:9001 │  │    :5432       │                    │
│   └─────────────┘  └─────────────┘  └───────────────┘                    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Named Docker Volumes

| Volume | Purpose |
|---|---|
| `postgres-data` | PostgreSQL database files (persistent) |
| `redis-data` | Redis AOF persistence file |
| `minio-data` | MinIO object storage files |
| `static-files` | Django `collectstatic` output (shared with Nginx) |

### Service Summary

| Service Name | Base Image | Port(s) | Description |
|---|---|---|---|
| `nginx` | `nginx:1.25-alpine` | 80, 443 | Reverse proxy + SSL termination |
| `backend` | `python:3.12-slim` (custom) | 8000 | Django + Gunicorn WSGI |
| `daphne` | same image as backend | 8001 | Django Channels ASGI / WebSocket |
| `celery-worker` | same image as backend | — | Celery task worker |
| `celery-beat` | same image as backend | — | Celery beat scheduler |
| `postgres` | `postgres:16-alpine` | 5432 | Primary database |
| `pgbouncer` | `edoburu/pgbouncer:latest` | 6432 | Connection pooler |
| `redis` | `redis:7-alpine` | 6379 | Cache + broker + channel layer |
| `minio` | `minio/minio:latest` | 9000, 9001 | Object storage (S3-compatible) |
| `user` | `node:20-alpine` (custom) | 3000 | User/Customer Next.js app |
| `merchant` | `node:20-alpine` (custom) | 3001 | Merchant Next.js dashboard |
| `rider` | `node:20-alpine` (custom) | 3002 | Rider Next.js dashboard |
| `admin` | `node:20-alpine` (custom) | 3003 | Admin Next.js dashboard |
| `superadmin` | `node:20-alpine` (custom) | 3004 | SuperAdmin Next.js dashboard |

### Key Design Decisions

- `backend`, `daphne`, `celery-worker`, `celery-beat` share the **same Docker image** (built from `backend/Dockerfile`). Service entrypoint differs per container.
- Backend image uses **multi-stage build** to keep production image lean.
- All source code directories are **volume-mounted** in development for hot-reload without rebuilding.
- Production compose (`docker-compose.prod.yml`) removes volume mounts, uses pre-built images.
- Nginx container mounts `static-files` volume to serve Django static files without proxying to Django.
- Mobile (React Native / Expo): NOT in Docker. Runs locally with Expo CLI connecting to `localhost:8000` (or LAN IP).

---

*End of RAPEX System Blueprint — v1.0 MVP*
