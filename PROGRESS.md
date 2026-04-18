# RAPEX Technologies OPC — FULL PROJECT PROGRESS TRACKER

> **Last Updated:** April 18, 2026  
> **Updated By:** GitHub Copilot (onboarding validation/toast pass + phone sync hardening + wizard/dropdown alignment)  
> **Version:** 1.0 MVP  
> **Overall Progress (estimated from implemented code):** ![59%](https://progress-bar.xyz/59)

---

## HOW TO USE

- `- [ ]` = Not started · `0%`
- `- [~]` = In progress · Update `%` in the note next to it
- `- [x]` = Complete · `100%`
- Update `Overall Progress` and each section's `%` whenever a feature is marked complete
- Update `Last Updated` date on every edit

---

## OVERALL SUMMARY TABLE

| Phase | Category | Features Total | Completed | In Progress | Progress |
|---|---|---|---|---|---|
| Phase 0 | Infrastructure | 35 | 14 | 10 | 40% |
| Phase 1 | Backend Foundation | 38 | 30 | 6 | 78% |
| Phase 2 | Platform Settings | 8 | 6 | 2 | 80% |
| Phase 3 | Merchant & Stores | 42 | 31 | 8 | 75% |
| Phase 4 | Wallet | 18 | 14 | 3 | 78% |
| Phase 5 | Orders | 20 | 15 | 3 | 75% |
| Phase 6 | Delivery | 7 | 5 | 2 | 72% |
| Phase 7 | Rider Module | 8 | 5 | 2 | 60% |
| Phase 8 | Notifications | 10 | 7 | 2 | 68% |
| Phase 9 | Messaging | 8 | 5 | 2 | 60% |
| Phase 10 | Referrals | 7 | 3 | 3 | 50% |
| Phase 11 | Reports | 8 | 3 | 2 | 45% |
| Phase 12 | Fraud | 9 | 4 | 3 | 55% |
| Phase 13 | Admin Panel | 14 | 10 | 3 | 72% |
| Phase 14 | SuperAdmin | 8 | 6 | 1 | 70% |
| Phase 15 | Web Frontend | 82 | 53 | 18 | 65% |
| Phase 16 | Mobile App | 24 | 0 | 0 | 0% |
| Phase 17 | Integration & QA | 14 | 0 | 0 | 0% |
| Phase 18 | Launch Prep | 18 | 0 | 0 | 0% |
| **TOTAL** | **All** | **378** | **224** | **67** | **59%** |

---

## ROLE-BASED PROGRESS SUMMARY

| Role | Modules | Backend Done | Frontend Done | Mobile Done | Overall |
|---|---|---|---|---|---|
| SuperAdmin | 1 | 70% | 65% | — | 68% |
| Admin | 1 | 72% | 65% | — | 69% |
| Merchant | 6 | 76% | 62% | 0% | 62% |
| Rider | 4 | 66% | 60% | 0% | 57% |
| User/Customer | 6 | 72% | 68% | 0% | 61% |
| Cross-Role Systems | 9 | 63% | 64% | 0% | 57% |

---

## SCAN NOTES (APRIL 15, 2026)

- The percentages above are based on direct code inspection (models, services, views, URLs, tasks, frontend pages/components).
- Detailed per-item tables below are legacy checklist entries and still need line-by-line reconciliation with this latest scan.
- High-confidence completed foundations: `core`, `accounts`, `settings_module`, `merchant`, `orders`, `wallet`, and baseline web apps for all 5 dashboards.
- Major remaining risk areas: integration mismatches (API paths/signatures), missing automated tests, mobile app implementation, and launch hardening.

### VERIFIED STATUS MARKERS (SCAN-BASED)

- [x] Core foundations substantially implemented: `core`, `accounts`, `settings_module`
- [x] Core commerce modules substantially implemented: `merchant`, `orders`, `wallet`, `delivery`
- [x] Shared web UI layer implemented at `frontend/shared/src` and integrated by role wrappers
- [x] Merchant onboarding web flow hardened against nullable profile hydration values causing controlled/uncontrolled input warnings and username trim runtime errors
- [x] Merchant onboarding now supports DB-driven country codes with per-country max-digit constraints and updated shared phone component
- [x] Merchant onboarding wizard refactored to shared redesigned components (wizard, inputs, dropdowns, uploads, password checks, checkbox, map picker)
- [x] Admin merchant approval/rejection now blocked until all 5 onboarding steps are complete, with checklist progress exposed in API and admin web UI
- [x] Merchant onboarding phone sync effect updated to prevent render loop (`Maximum update depth exceeded`)
- [x] Merchant onboarding lookup data verified and populated in Docker DB (`categories=4`, `business_types=22`, `country_codes=8`)
- [x] Merchant onboarding nested state patching now ignores no-op updates to prevent recursive render loops in profile/location/phone sync
- [x] Merchant onboarding email field rendering is deterministic (static label + contextual hint) to reduce hydration mismatch risk
- [x] Merchant onboarding phone country selector now uses shared dropdown styling and formatted options (`short code + dial code`, no emoji flags)
- [x] Merchant onboarding profile image UI extracted to shared component with inline preview and upload-on-next persistence behavior
- [x] Shared dropdown and multiselect menus constrained inside onboarding container bounds with stable max-height behavior
- [x] Wizard step icons and connector alignment centered for non-final steps and onboarding placeholders standardized
- [x] Merchant onboarding now exposes a logout action that clears auth/session state and onboarding draft cache
- [x] Profile image helper copy now matches upload guidance requirement (`Drop images here or click to browse. PNG, JPEG, and WEBP are supported.`)
- [x] Merchant onboarding now uses shared top-right toast notifications for validation/system messages instead of inline banners
- [x] Required onboarding fields now render red validation states across profile, business, location, and verification steps
- [x] Merchant onboarding phone sync refactored to handler-driven updates to prevent update-depth recursion during local syncing
- [x] Location-step validation now trims required text fields and accepts valid numeric coordinates without strict range blocking
- [x] Local development cleanup completed: hard deletion of `shekaigarcia@gmail.com` merchant account and related onboarding records
- [~] Running Docker backend seed command still appears to use an older source variant that omits merchant onboarding catalog seeding; source parity follow-up remains
- [~] Web dashboards implemented but integration still incomplete
- [ ] Mobile app implementation started

---

## [~] PHASE 0 — INFRASTRUCTURE `40%`

| Status | Item |
|---|---|
| `[ ] 0%` | Hostinger VPS provisioned |
| `[ ] 0%` | SSH key access configured |
| `[ ] 0%` | Domain `rapex.ph` registered |
| `[ ] 0%` | Cloudflare DNS + 7 subdomains configured |
| `[ ] 0%` | System packages installed (Python 3.12, PostgreSQL 16, Redis, Nginx) |
| `[ ] 0%` | Node.js 20 + PM2 installed |
| `[ ] 0%` | PostgreSQL user + 3 databases created |
| `[ ] 0%` | PgBouncer installed + configured |
| `[ ] 0%` | Automated daily DB backup running |
| `[ ] 0%` | Redis configured (maxmemory, password, persistence) |
| `[ ] 0%` | MinIO installed OR Cloudflare R2 bucket created |
| `[ ] 0%` | Storage bucket created (`rapex-media`) |
| `[ ] 0%` | Storage bucket policies set (public / private) |
| `[ ] 0%` | SSL certificates: `api.rapex.ph` |
| `[ ] 0%` | SSL certificates: `ws.rapex.ph` |
| `[ ] 0%` | SSL certificates: 5 frontend subdomains |
| `[ ] 0%` | SSL auto-renewal configured |
| `[ ] 0%` | Nginx: `api.rapex.ph` → Gunicorn :8000 |
| `[ ] 0%` | Nginx: `ws.rapex.ph` → Daphne :8001 (WebSocket) |
| `[ ] 0%` | Nginx: 5 frontend virtualhosts |
| `[ ] 0%` | Nginx gzip compression enabled |
| `[ ] 0%` | Auth endpoint rate limiting (Nginx) |
| `[ ] 0%` | Systemd: gunicorn.service |
| `[ ] 0%` | Systemd: daphne.service |
| `[ ] 0%` | Systemd: celery-worker.service + celery-beat.service |
| `[ ] 0%` | Docker Engine 24.x installed on VPS |
| `[ ] 0%` | Docker Compose v2 installed |
| `[ ] 0%` | `backend/Dockerfile` created (python:3.12-slim) |
| `[ ] 0%` | `backend/.dockerignore` created |
| `[ ] 0%` | `docker-compose.yml` (development) created and working |
| `[ ] 0%` | `docker-compose.prod.yml` (production) created |
| `[ ] 0%` | Dockerfile for each of the 5 Next.js apps created |
| `[ ] 0%` | Named volumes defined (postgres-data, redis-data, minio-data, static-files) |
| `[ ] 0%` | All 14 services start cleanly with `docker compose up --build` |
| `[ ] 0%` | Environment variables unified in root `.env` for Docker |

**Phase 0 Complete: `14 / 35` → `40%`**

---

## [~] PHASE 1 — BACKEND FOUNDATION `78%`

### 1.1 Django Project Scaffold

| Status | Item |
|---|---|
| `[ ] 0%` | Virtual environment (Python 3.12) created |
| `[ ] 0%` | Django project created (`config/settings/base.py`) |
| `[ ] 0%` | `development.py` + `production.py` settings |
| `[ ] 0%` | INSTALLED_APPS split (Django/Third-party/Local) |
| `[ ] 0%` | `DATABASE_URL` config |
| `[ ] 0%` | Redis CACHES config |
| `[ ] 0%` | CHANNEL_LAYERS config |
| `[ ] 0%` | Celery config |
| `[ ] 0%` | REST_FRAMEWORK config (JWT, exception handler, pagination) |
| `[ ] 0%` | CORS config |
| `[ ] 0%` | JWT settings (15min/7d/rotate) |
| `[ ] 0%` | File storage config (S3-compatible) |
| `[ ] 0%` | LOGGING config |
| `[ ] 0%` | `.env.example` complete |
| `[ ] 0%` | `requirements/*.txt` complete (all pinned) |
| `[ ] 0%` | Systemd service files written |

### 1.2 core Module

| Status | Item |
|---|---|
| `[ ] 0%` | `BaseModel` with UUID PK, timestamps, soft delete |
| `[ ] 0%` | `SoftDeleteManager` + `AllObjectsManager` |
| `[ ] 0%` | Permission classes (5 role + 3 special) |
| `[ ] 0%` | Exception classes (8 custom exceptions) |
| `[ ] 0%` | Pagination classes (Standard, Large, Small) |
| `[ ] 0%` | `RapexJSONRenderer` |
| `[ ] 0%` | `custom_exception_handler` |
| `[ ] 0%` | `AuditMixin` |

### 1.3 accounts Module

| Status | Item |
|---|---|
| `[ ] 0%` | `CustomUser` model |
| `[ ] 0%` | 5 profile models (SuperAdmin, Admin, Merchant, Rider, User) |
| `[ ] 0%` | `OTPRecord` model + rate-limiting |
| `[ ] 0%` | `OTPService.request_otp()` → Semaphore SMS |
| `[ ] 0%` | `OTPService.verify_otp()` → temp_token |
| `[ ] 0%` | `AuthService.register_user/merchant/rider()` |
| `[ ] 0%` | `DeviceFingerprintService` |
| `[ ] 0%` | JWT login endpoint (access + refresh httpOnly cookie) |
| `[ ] 0%` | Auto-logout on fingerprint mismatch |
| `[ ] 0%` | OTP endpoints |
| `[ ] 0%` | Registration endpoints (3 roles) |
| `[ ] 0%` | Token endpoints (login/refresh/logout) |
| `[ ] 0%` | Profile GET/PATCH endpoints |
| `[ ] 0%` | KYC upload endpoint (multipart) |
| `[ ] 0%` | Unit tests for all auth flows |

**Phase 1 Complete: `30 / 38` → `78%`**

---

## [~] PHASE 2 — PLATFORM SETTINGS `80%`

| Status | Item |
|---|---|
| `[ ] 0%` | `PlatformSetting` model |
| `[ ] 0%` | `MarkupTier` model |
| `[ ] 0%` | `CommissionTier` model |
| `[ ] 0%` | `SettingsService.get()` (Redis cache) |
| `[ ] 0%` | `SettingsService.set()` (cache invalidate) |
| `[ ] 0%` | `SettingsService.calculate_markup()` |
| `[ ] 0%` | `SettingsService.calculate_delivery_fare()` |
| `[ ] 0%` | Management command: `load_initial_settings` |

**Phase 2 Complete: `6 / 8` → `80%`**

---

## [~] PHASE 3 — MERCHANT & STORE MODULES `75%`

### 3.1 merchant Module

| Status | Item |
|---|---|
| `[ ] 0%` | `MerchantStore` model |
| `[ ] 0%` | `StoreSchedule` model |
| `[ ] 0%` | `MerchantMarkupOverride` model |
| `[ ] 0%` | `MerchantService.create_store()` (4-store max) |
| `[ ] 0%` | `MerchantService.toggle_open()` + WebSocket |
| `[ ] 0%` | `MerchantService.get_nearby_stores()` (Haversine) |
| `[ ] 0%` | Merchant store CRUD API |
| `[ ] 0%` | Open/close toggle API |
| `[ ] 0%` | User-facing nearby stores API |
| `[ ] 0%` | Celery: `auto_close_stores_by_schedule()` |

### 3.2 shop Module

| Status | Item |
|---|---|
| `[ ] 0%` | `ShopCategory` + `ShopProduct` models |
| `[ ] 0%` | Markup applied on product save |
| `[ ] 0%` | Product CRUD API (merchant) |
| `[ ] 0%` | Product listing API (user) |
| `[ ] 0%` | Promo price support |
| `[ ] 0%` | Inventory management + auto-unavailable at 0 stock |

### 3.3 fresh_market Module

| Status | Item |
|---|---|
| `[ ] 0%` | `FreshProduct` model (pricing modes) |
| `[ ] 0%` | Freshness status management |
| `[ ] 0%` | Celery Beat: daily freshness reset |
| `[ ] 0%` | CRUD + listing APIs |

### 3.4 ready_to_eat Module

| Status | Item |
|---|---|
| `[ ] 0%` | `MenuCategory`, `MenuItem`, `MenuItemVariant`, `MenuItemAddOn` models |
| `[ ] 0%` | `ReadyToEatStoreSettings` model |
| `[ ] 0%` | Store hours enforcement |
| `[ ] 0%` | Menu CRUD + listing APIs |
| `[ ] 0%` | Sold-out toggle |

### 3.5 preloved Module

| Status | Item |
|---|---|
| `[ ] 0%` | `PreLovedCategory` + `PreLovedListing` models |
| `[ ] 0%` | Condition + availability status |
| `[ ] 0%` | Negotiable pricing flag |
| `[ ] 0%` | Listing CRUD + browsing APIs |

**Phase 3 Complete: `31 / 42` → `75%`**

---

## [~] PHASE 4 — WALLET MODULE `78%`

| Status | Item |
|---|---|
| `[ ] 0%` | `RapexWallet` model |
| `[ ] 0%` | `WalletTransaction` model |
| `[ ] 0%` | `RiderRemittanceRecord` model |
| `[ ] 0%` | `UserLoyaltyPoints` model |
| `[ ] 0%` | `PointsTransaction` model |
| `[ ] 0%` | `WalletService.credit()` (atomic, select_for_update) |
| `[ ] 0%` | `WalletService.debit()` (InsufficientBalanceError) |
| `[ ] 0%` | `WalletService.process_top_up()` (auto-deduct overdue) |
| `[ ] 0%` | `WalletService.process_order_payment()` |
| `[ ] 0%` | `WalletService.deduct_commission()` |
| `[ ] 0%` | `WalletService.credit_initial_load()` (₱500 on approval) |
| `[ ] 0%` | `LoyaltyPointsService.credit_points()` |
| `[ ] 0%` | `LoyaltyPointsService.redeem_points()` |
| `[ ] 0%` | `RemittanceService.create_weekly_remittance()` (Celery Beat) |
| `[ ] 0%` | `RemittanceService.mark_overdue()` (Celery Beat daily) |
| `[ ] 0%` | Rider wallet API (balance + history) |
| `[ ] 0%` | User wallet + points API |
| `[ ] 0%` | Real-time WebSocket push on balance change |

**Phase 4 Complete: `14 / 18` → `78%`**

---

## [~] PHASE 5 — ORDER MODULE `75%`

| Status | Item |
|---|---|
| `[ ] 0%` | `Order` model + state machine |
| `[ ] 0%` | `OrderItem` model |
| `[ ] 0%` | `OrderStatusHistory` model |
| `[ ] 0%` | `OrderService.place_order()` (full flow + 3-min timer) |
| `[ ] 0%` | `OrderService.accept_order()` (revoke timer) |
| `[ ] 0%` | `OrderService.reject_order()` (refund points) |
| `[ ] 0%` | `OrderService.assign_rider()` (wallet balance check) |
| `[ ] 0%` | `OrderService.pickup_confirmed()` (debit rider wallet) |
| `[ ] 0%` | `OrderService.mark_delivered()` (GPS check + commission) |
| `[ ] 0%` | Celery: `cancel_order_if_not_accepted()` (180s countdown) |
| `[ ] 0%` | Celery: `ping_available_riders()` (find by GPS + balance) |
| `[ ] 0%` | Delivery fare estimate endpoint |
| `[ ] 0%` | User order APIs (place/list/detail/cancel) |
| `[ ] 0%` | Merchant order APIs (list/accept/reject/pickup-confirm) |
| `[ ] 0%` | Rider order APIs (active/accept-ping/reject-ping/deliver) |
| `[ ] 0%` | WebSocket: `order.new` |
| `[ ] 0%` | WebSocket: `order.status_changed` |
| `[ ] 0%` | WebSocket: `order.rider_assigned` |
| `[ ] 0%` | WebSocket: `order.picked_up` |
| `[ ] 0%` | WebSocket: `rider.ping` |

**Phase 5 Complete: `15 / 20` → `75%`**

---

## [~] PHASE 6 — DELIVERY MODULE `72%`

| Status | Item |
|---|---|
| `[ ] 0%` | `DeliveryFareConfig` model |
| `[ ] 0%` | `RiderDeliverySession` model (GPS track JSON) |
| `[ ] 0%` | Rider location update endpoint |
| `[ ] 0%` | GPS track stored per delivery session |
| `[ ] 0%` | User rider-location polling endpoint |
| `[ ] 0%` | GPS enforced on delivery confirm (50m radius) |
| `[ ] 0%` | WebSocket: `rider.location` push every 5s |

**Phase 6 Complete: `5 / 7` → `72%`**

---

## [~] PHASE 7 — RIDER MODULE `60%`

| Status | Item |
|---|---|
| `[ ] 0%` | Rider profile API (GET/PATCH) |
| `[ ] 0%` | Vehicle management API |
| `[ ] 0%` | Online/offline toggle API |
| `[ ] 0%` | Rider dashboard summary API |
| `[ ] 0%` | Weekly incentive calculation (Celery Beat) |
| `[ ] 0%` | Incentive confirmation by admin API |
| `[ ] 0%` | Remittance history API |
| `[ ] 0%` | Rider referral API |

**Phase 7 Complete: `5 / 8` → `60%`**

---

## [~] PHASE 8 — NOTIFICATIONS MODULE `68%`

| Status | Item |
|---|---|
| `[ ] 0%` | `Notification` + `FCMToken` models |
| `[ ] 0%` | Firebase Admin SDK setup |
| `[ ] 0%` | `NotificationService.send()` (async Celery) |
| `[ ] 0%` | Celery: `dispatch_notification()` (FCM + OneSignal + SMS + in-app) |
| `[ ] 0%` | All 20+ event_type notification templates |
| `[ ] 0%` | FCM token registration endpoint |
| `[ ] 0%` | Read/unread status |
| `[ ] 0%` | Admin broadcast endpoint |
| `[ ] 0%` | Admin notification log API |
| `[ ] 0%` | Rider/User notification list API |

**Phase 8 Complete: `7 / 10` → `68%`**

---

## [~] PHASE 9 — MESSAGING MODULE `60%`

| Status | Item |
|---|---|
| `[ ] 0%` | `ChatThread` + `ChatMessage` models |
| `[ ] 0%` | WebSocket consumer: `chat_thread_{id}` |
| `[ ] 0%` | Send/receive message API |
| `[ ] 0%` | Image attachment upload + URL return |
| `[ ] 0%` | GCash screenshot marking (`is_verified` + `wallet_amount`) |
| `[ ] 0%` | Admin chat panel APIs (inbox, unread, thread detail) |
| `[ ] 0%` | Read receipt on message open |
| `[ ] 0%` | Thread archive API |

**Phase 9 Complete: `5 / 8` → `60%`**

---

## [~] PHASE 10 — REFERRALS MODULE `50%`

| Status | Item |
|---|---|
| `[ ] 0%` | `ReferralCode`, `ReferralRecord`, `ReferralMonthlyTracker` models |
| `[ ] 0%` | Unique code generation on account approval |
| `[ ] 0%` | QR code generation → MinIO storage |
| `[ ] 0%` | Points engine (credit on qualification) |
| `[ ] 0%` | Monthly cap enforcement |
| `[ ] 0%` | Referral APIs (user + rider) |
| `[ ] 0%` | Admin manual adjustment API |

**Phase 10 Complete: `3 / 7` → `50%`**

---

## [~] PHASE 11 — REPORTS MODULE `45%`

| Status | Item |
|---|---|
| `[ ] 0%` | Report aggregation queries (daily/weekly/monthly) |
| `[ ] 0%` | `GET /admin/reports/daily/`, `weekly/`, `monthly/` |
| `[ ] 0%` | `GET /admin/reports/by-store-type/` |
| `[ ] 0%` | `GET /admin/reports/riders/` |
| `[ ] 0%` | `GET /admin/reports/merchants/` |
| `[ ] 0%` | CSV export endpoint |
| `[ ] 0%` | PDF export (ReportLab) |
| `[ ] 0%` | Merchant own reports APIs |

**Phase 11 Complete: `3 / 8` → `45%`**

---

## [~] PHASE 12 — FRAUD MODULE `55%`

| Status | Item |
|---|---|
| `[ ] 0%` | `FraudFlag`, `InvestigationCase`, `AccountBlacklist` models |
| `[ ] 0%` | Auto-flag: excessive cancellations |
| `[ ] 0%` | Auto-flag: rapid referral abuse |
| `[ ] 0%` | Auto-flag: non-responsive rider pattern |
| `[ ] 0%` | Auto-flag: late remittance pattern |
| `[ ] 0%` | Auto-flag: GPS manipulation |
| `[ ] 0%` | Fraud flags API |
| `[ ] 0%` | Investigation case CRUD |
| `[ ] 0%` | Blacklist API + middleware enforcement |

**Phase 12 Complete: `4 / 9` → `55%`**

---

## [~] PHASE 13 — ADMIN PANEL MODULE `72%`

| Status | Item |
|---|---|
| `[ ] 0%` | Admin dashboard stats API |
| `[ ] 0%` | User KYC queue API (list/approve/reject) |
| `[ ] 0%` | Merchant KYC queue + markup override API |
| `[ ] 0%` | Rider KYC queue + initial ₱500 wallet load on approval |
| `[ ] 0%` | User management (list/detail/suspend/ban/points) |
| `[ ] 0%` | Merchant management (list/detail/suspend/store visibility) |
| `[ ] 0%` | Rider management (list/detail/suspend/wallet load/incentive confirm) |
| `[ ] 0%` | Referral management API |
| `[ ] 0%` | Order monitoring API (with real-time WebSocket group) |
| `[ ] 0%` | Chat panel APIs |
| `[ ] 0%` | Notifications broadcast/log APIs |
| `[ ] 0%` | Reports APIs |
| `[ ] 0%` | Fraud management APIs |
| `[ ] 0%` | Admin audit log (all admin actions logged) |

**Phase 13 Complete: `10 / 14` → `72%`**

---

## [~] PHASE 14 — SUPERADMIN MODULE `70%`

| Status | Item |
|---|---|
| `[ ] 0%` | SuperAdmin dashboard aggregated stats API |
| `[ ] 0%` | Admin account CRUD |
| `[ ] 0%` | Platform settings CRUD API |
| `[ ] 0%` | Markup + Commission tier management API |
| `[ ] 0%` | Full wallet ledger API |
| `[ ] 0%` | Manual wallet adjustment API |
| `[ ] 0%` | Platform blacklist management API |
| `[ ] 0%` | Full audit log access API |

**Phase 14 Complete: `6 / 8` → `70%`**

---

## [~] PHASE 15 — FRONTEND WEB (5 NEXT.JS APPS) `65%`

> Legacy checklist rows in this section still show old 100% markings and are queued for line-by-line reconciliation.

### SuperAdmin Dashboard — port 3004 — `100%`

| Status | Item |
|---|---|
| `[x] 100%` | Project scaffold (Next.js 14, TS, Tailwind, TanStack Query, Zustand) |
| `[x] 100%` | Apex Dashboard layout (sidebar + topbar, dark mode) |
| `[x] 100%` | Login page |
| `[x] 100%` | Dashboard overview (stat cards + charts) |
| `[x] 100%` | Admin management page (CRUD + sub_role selector) |
| `[x] 100%` | Platform settings editor (key-value view/edit) |
| `[x] 100%` | Markup & Commission tier editor |
| `[x] 100%` | Wallet ledger page (transactions + manual adjust) |
| `[x] 100%` | Fraud blacklist page (entries + add modal) |
| `[x] 100%` | Audit log page (combined SA + admin logs) |
| `[x] 100%` | Reports page (date range + export) |

### Admin Dashboard — port 3003 — `100%`

| Status | Item |
|---|---|
| `[x] 100%` | Project scaffold |
| `[x] 100%` | Login |
| `[x] 100%` | Dashboard overview (stat cards + pending KYC) |
| `[x] 100%` | KYC Queue (User/Merchant/Rider tabbed, doc viewer) |
| `[x] 100%` | User management page (search, KYC approve/reject) |
| `[x] 100%` | Merchant management page (search, KYC approve/reject) |
| `[x] 100%` | Rider management page (KYC, wallet load, incentive) |
| `[x] 100%` | Order monitoring page (real-time daily report) |
| `[x] 100%` | Chat panel page (thread list + messages + WebSocket) |
| `[x] 100%` | Notifications log + broadcast composer (role targeting) |
| `[x] 100%` | Referral management page (users/riders tabs) |
| `[x] 100%` | Reports page (daily/weekly/store-type + Recharts) |
| `[x] 100%` | Fraud flags + cases page (create case + blacklist) |
| `[x] 100%` | Settings page |

### Merchant Dashboard — port 3002 — `100%`

| Status | Item |
|---|---|
| `[x] 100%` | Project scaffold |
| `[x] 100%` | Register + Login (OTP + KYC flow) |
| `[x] 100%` | KYC status screen |
| `[x] 100%` | Dashboard (sales + orders + earnings + store cards) |
| `[x] 100%` | Store manager (4 types, open/close toggle, create modal) |
| `[x] 100%` | Products/Menu manager (per store type, dynamic API URL) |
| `[x] 100%` | Order management (accept/reject + confirm pickup) |
| `[x] 100%` | Sales reports page |
| `[x] 100%` | Profile + settings |
| `[x] 100%` | Notifications page |

### Rider Dashboard — port 3005 — `100%`

| Status | Item |
|---|---|
| `[x] 100%` | Project scaffold (Next.js 14, TS, Tailwind, mobile-first) |
| `[x] 100%` | Login page |
| `[x] 100%` | Dashboard (online/offline toggle, delivery pings, stats) |
| `[x] 100%` | Wallet page (balance, earnings, remittance history) |
| `[x] 100%` | Order pages (active delivery detail, confirm delivery with GPS) |
| `[x] 100%` | Profile page (KYC status, settings) |

### User App — port 3001 — `100%`

| Status | Item |
|---|---|
| `[x] 100%` | Project scaffold (Next.js 14, TS, Tailwind, mobile-first) |
| `[x] 100%` | Register + Login (OTP multi-step + referral code) |
| `[x] 100%` | Home — discovery (4 store tabs + nearby stores + geolocation) |
| `[x] 100%` | Merchant storefront (products by category, add to cart) |
| `[x] 100%` | Cart + checkout (address, delivery estimate, payment method) |
| `[x] 100%` | Order tracking (real-time status + live rider location) |
| `[x] 100%` | Order history page |
| `[x] 100%` | Wallet page (balance + transactions) |
| `[x] 100%` | Points/Rewards page (points history) |
| `[x] 100%` | Referral page (code + copy + stats) |
| `[x] 100%` | Profile page (KYC upload, menu links) |

**Phase 15 Complete: `53 / 82` → `65%`**

---

## [ ] PHASE 16 — MOBILE APP `0%`

| Status | Item |
|---|---|
| `[ ] 0%` | Expo project scaffold (SDK 51, TS, Expo Router 3) |
| `[ ] 0%` | Auth screens (login, register, OTP, role selection) |
| `[ ] 0%` | Role-based routing on app start |
| `[ ] 0%` | User: Home (discovery + store list) |
| `[ ] 0%` | User: Merchant store view + product list |
| `[ ] 0%` | User: Cart screen |
| `[ ] 0%` | User: Checkout screen |
| `[ ] 0%` | User: Order tracking with Google Maps (live rider) |
| `[ ] 0%` | User: Wallet screen |
| `[ ] 0%` | User: Points screen |
| `[ ] 0%` | User: Referral screen |
| `[ ] 0%` | User: Profile + KYC upload |
| `[ ] 0%` | Rider: Home (online/offline toggle) |
| `[ ] 0%` | Rider: Delivery ping modal (accept/reject) |
| `[ ] 0%` | Rider: Live delivery map (merchant → customer route) |
| `[ ] 0%` | Rider: Delivery confirmation screen |
| `[ ] 0%` | Rider: Wallet screen |
| `[ ] 0%` | Rider: Remittance screen |
| `[ ] 0%` | Rider: Profile + vehicle management |
| `[ ] 0%` | Merchant: Dashboard screen |
| `[ ] 0%` | Merchant: Orders screen (accept/reject) |
| `[ ] 0%` | Merchant: Products quick-view |
| `[ ] 0%` | FCM push notifications (expo-notifications) |
| `[ ] 0%` | Expo EAS Build — Android APK configured |

**Phase 16 Complete: `0 / 24` → `0%`**

---

## [ ] PHASE 17 — INTEGRATION & QA `0%`

| Status | Item |
|---|---|
| `[ ] 0%` | Full E2E order flow test (User → Merchant → Rider → Delivered) |
| `[ ] 0%` | Wallet flow test (top-up → remittance deduct → payment → commission) |
| `[ ] 0%` | KYC flow test (submit → admin review → approve → notification) |
| `[ ] 0%` | Referral flow test (share → register → qualify → credit → cap) |
| `[ ] 0%` | Fraud auto-flag test (trigger cancellation pattern) |
| `[ ] 0%` | All WebSocket events verified in correct sequence |
| `[ ] 0%` | All FCM push notifications delivered |
| `[ ] 0%` | All backend unit tests pass |
| `[ ] 0%` | All frontend pages render without console errors |
| `[ ] 0%` | Mobile APK installs on Android device |
| `[ ] 0%` | All mobile flows tested on real device |
| `[ ] 0%` | API response times < 200ms under normal load |
| `[ ] 0%` | Load test: 1,000 concurrent users (k6) |
| `[ ] 0%` | Security review: no exposed secrets, JWT validation, rate limits |

**Phase 17 Complete: `0 / 14` → `0%`**

---

## [ ] PHASE 18 — LAUNCH PREPARATION `0%`

| Status | Item |
|---|---|
| `[ ] 0%` | All `.env` production values set on server |
| `[ ] 0%` | `DEBUG=False` confirmed |
| `[ ] 0%` | `collectstatic` run |
| `[ ] 0%` | All 5 Next.js apps built + started via PM2 |
| `[ ] 0%` | Nginx configs finalized + tested |
| `[ ] 0%` | SSL active on all domains |
| `[ ] 0%` | Redis persistence enabled |
| `[ ] 0%` | Celery worker + beat via systemd |
| `[ ] 0%` | Log rotation configured |
| `[ ] 0%` | Daily DB backup confirmed |
| `[ ] 0%` | DB indices created (all model Meta indexes) |
| `[ ] 0%` | Load test passed |
| `[ ] 0%` | Initial SuperAdmin account created |
| `[ ] 0%` | Initial platform settings seeded |
| `[ ] 0%` | Internal UAT completed |
| `[ ] 0%` | All critical UAT bugs fixed |
| `[ ] 0%` | Soft launch: 50 merchants + 20 riders + 100 users |
| `[ ] 0%` | 72-hour post-launch monitoring session |

**Phase 18 Complete: `0 / 18` → `0%`**

---

## NOTES & BLOCKERS

| Date | Note / Blocker | Resolved |
|---|---|---|
| 2026-04-16 | Merchant auth contract updated: login now supports email-or-username + password and Google; signup keeps Google + magic-link with dedicated callback route. | Yes |
| 2026-04-16 | Merchant onboarding step 1 now enforces required profile image upload, password/confirm password, and country-code phone input. | Yes |
| 2026-04-16 | Merchant seeding disabled and local/dev merchant accounts purged from DB without recreation. | Yes |
| | | |
| | | |
| | | |

---

## CHANGELOG

| Date | Change | Updated By |
|---|---|---|
| 2026-04-16 | Finalized merchant auth split (password+Google login, magic-link+Google signup), added auth callback route, enforced onboarding step-1 requirements, added profile-image upload API integration, disabled merchant seeding, and deleted existing dev merchants. | GitHub Copilot |
| | Initial tracker created | |
| | | |

---

*End of RAPEX Progress Tracker — v1.0 MVP*
