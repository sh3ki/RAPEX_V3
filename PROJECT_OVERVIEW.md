# RAPEX TECHNOLOGIES OPC — PROJECT OVERVIEW

---

## TABLE OF CONTENTS

1. [Platform Concept & Vision](#1-platform-concept--vision)
2. [Application Architecture](#2-application-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Hosting & Infrastructure](#4-hosting--infrastructure)
5. [Platform Roles Overview](#5-platform-roles-overview)
6. [UI/UX Design System](#6-uiux-design-system)
7. [SuperAdmin — Full Feature Breakdown](#7-superadmin--full-feature-breakdown)
8. [Admin — Full Feature Breakdown](#8-admin--full-feature-breakdown)
9. [Merchant — Full Feature Breakdown](#9-merchant--full-feature-breakdown)
10. [Rider — Full Feature Breakdown](#10-rider--full-feature-breakdown)
11. [User / Customer — Full Feature Breakdown](#11-user--customer--full-feature-breakdown)
12. [The 4 Shopping Platforms (Merchant Cores)](#12-the-4-shopping-platforms-merchant-cores)
13. [Commission, Markup & Wallet System](#13-commission-markup--wallet-system)
14. [Delivery System & Pricing](#14-delivery-system--pricing)
15. [Anti-Scam & Security Systems](#15-anti-scam--security-systems)
16. [Key Business Logic Rules](#16-key-business-logic-rules)
17. [Notifications & Messaging Infrastructure](#17-notifications--messaging-infrastructure)

---

## 1. PLATFORM CONCEPT & VISION

### What is RAPEX?

RAPEX is a **hyper-local, all-in-one shopping and on-demand delivery platform** built specifically for Filipino communities at the barangay and municipal level.

Think of it as **Shopee or Lazada — but combined with the speed and immediacy of Grab** — where:
- Merchants are **local businesses in your area** (not warehouses days away)
- Orders are **processed and dispatched immediately** by nearby riders
- Delivery happens **within minutes**, not days
- The platform targets **small-time, community-level merchants** — sari-sari stores, karinderias, pharmacies, street vendors, wet market vendors, hardware stores, and any local business of any size or type

Unlike national platforms (Shopee, Lazada, TikTok Shop) where shipping takes 1–7 days because sellers are dispersed nationwide, RAPEX operates on a **regional, proximity-based model**:

```
User places order → Nearby merchant processes it → Local rider picks it up → Delivered in minutes
```

This is not just a food delivery app. RAPEX is a **full commerce ecosystem** with 4 separate shopping platforms under one roof:

| Shopping Platform | What it Covers |
|---|---|
| **Shop** | General merchandise — sari-sari, hardware, pharmacy, convenience, retail, clothing, etc. |
| **Fresh Market** | Raw produce — vegetables, fruits, raw meat, seafood, eggs, dairy, and wet market goods |
| **Ready-to-Eat Food** | Cooked and prepared food — karinderya, fast food, street food, home-cooked meals |
| **Pre-Loved** | Second-hand and pre-owned items — clothes, gadgets, appliances, collectibles |

Each of these 4 platforms has its own dedicated section in the user app, its own merchant store type, and its own product creation logic — but they all share the **same unified delivery, wallet, and order management infrastructure**.

### Target Merchants
- Sari-sari stores
- Karinderias and home-based food stalls
- Wet market vendors (fish, meat, vegetables)
- Street food vendors
- Small pharmacies
- Hardware stores
- Small groceries
- Clothing and apparel stalls
- Auto parts and motorcycle supply shops
- Pre-loved / ukay-ukay stores
- Home-based sellers
- Any micro, small, or medium local business

### Target Users
- Everyday Filipino consumers who want fast, local delivery
- Users who want to avoid long lines and queues
- Students, workers, households ordering daily necessities
- Anyone within delivery range of a local RAPEX merchant

### Initial Launch Coverage (MVP)
> Kawit · Imus · Dasmariñas · Bacoor · Gen. Trias · Tanza · Naic · Cavite City · Amadeo · Tagaytay

### Expansion Roadmap
- **Phase 2:** Full CALABARZON region
- **Phase 3:** NCR (National Capital Region)
- **Phase 4:** Luzon major cities
- **Long-term:** Visayas, Mindanao, Nationwide

---

## 2. APPLICATION ARCHITECTURE

### Pattern: Modular-Monolith

```
MODULAR-MONOLITH
```

The application is built as a **Modular Monolith** — a single deployable codebase organized into clearly separated, loosely-coupled internal modules. Each module owns its own models, services, APIs, and business logic. Modules communicate through well-defined internal interfaces, not network calls.

**Modules include:**
`core` · `accounts` · `superadmin` · `admin_panel` · `merchant` · `shop` · `fresh_market` · `ready_to_eat` · `preloved` · `orders` · `delivery` · `rider` · `wallet` · `notifications` · `messaging` · `referrals` · `reports` · `fraud` · `settings`

This pattern enables:
- Rapid MVP development with a single deployment pipeline
- Clean architectural boundaries that can be split into microservices post-MVP
- Easier debugging and testing compared to distributed systems
- Single database with module-scoped schema ownership

---

## 3. TECH STACK

| Layer | Technology | Purpose |
|---|---|---|
| **Backend** | Django 5.x (Python) + Django REST Framework | REST API, business logic, ORM, admin |
| **Frontend (Web)** | Next.js 14+ (React) | SSR + CSR web dashboards for all roles |
| **Mobile App** | React Native (Expo) — Android-first for MVP | Merchant, Rider, and User mobile apps |
| **Database** | PostgreSQL 16 | Primary relational database |
| **Cache / Session** | Redis 7 | Session storage, rate limiting, pub/sub |
| **Task Queue** | Celery + Redis | Background jobs: notifications, auto-deductions, remittances |
| **Real-Time** | Django Channels + Redis Channel Layer | WebSocket: live order tracking, chat, alerts |
| **Push Notifications** | Firebase Cloud Messaging (FCM) | Mobile push notifications |
| **Push Notifications (Alt)** | OneSignal | Web + Mobile push fallback |
| **Maps & Location** | Google Maps SDK / Places API / Directions API | Address pin, live tracking, proximity discovery |
| **OTP / SMS** | Semaphore SMS API (PH) or Vonage | OTP for registration and login |
| **File Storage** | MinIO (self-hosted on VPS) or Cloudflare R2 | Product images, KYC documents, GCash screenshots |
| **Reverse Proxy** | Nginx | Load balancing, SSL termination, static file serving |
| **WSGI Server** | Gunicorn | Django application server |
| **Connection Pooling** | PgBouncer | PostgreSQL high-concurrency connection pooling |
| **Receipts** | Thermal receipt format | Bluetooth portable printer compatible |
| **Auth** | JWT (djangorestframework-simplejwt) + OTP | Stateless API auth with device binding |

---

## 4. HOSTING & INFRASTRUCTURE

### MVP Hosting

| Spec | Details |
|---|---|
| **Provider** | Hostinger VPS |
| **Target Registered Users** | ~100,000 users |
| **Target Concurrent Users** | ~10,000 simultaneous sessions |
| **Optimization Priority** | Maximum efficiency · Speed · Reliability |

### Infrastructure Design Principles

| Component | Approach |
|---|---|
| **Database** | PostgreSQL + PgBouncer connection pooling to handle 10,000 concurrent DB connections efficiently |
| **Caching** | Redis caches hot data: nearby merchants, product listings, active orders, session tokens |
| **Background Jobs** | Celery workers handle: push notifications, auto-deductions, remittance deadlines, referral point credits |
| **WebSockets** | Django Channels + Redis for real-time: order status, live rider tracking, chat messaging |
| **Web Server** | Gunicorn (multiple workers) behind Nginx for Django; Next.js served separately |
| **Next.js Optimization** | SSG for static pages, ISR for product listings, CSR for real-time dashboards |
| **File Storage** | MinIO on VPS for images and KYC documents with enforced owner-first taxonomy (`merchant/{id}`, `rider/{id}`, `user/{id}`) and centralized path generation via backend storage helpers; CDN layer via Cloudflare for fast asset delivery |
| **SSL** | Let's Encrypt SSL via Nginx for all subdomains |
| **Environment Config** | `.env` per environment (development, staging, production) |
| **Monitoring** | Uptime monitoring + error logging (Sentry or self-hosted equivalent) |

### Subdomain Structure (Planned)
```
app.rapex.ph          → User web app (Next.js)
merchant.rapex.ph     → Merchant dashboard (Next.js)
rider.rapex.ph        → Rider dashboard (Next.js)
admin.rapex.ph        → Admin dashboard (Next.js)
superadmin.rapex.ph   → SuperAdmin dashboard (Next.js)
api.rapex.ph          → Django REST API backend
ws.rapex.ph           → Django Channels WebSocket server
```

---

## 5. PLATFORM ROLES OVERVIEW

RAPEX has **5 distinct roles**. Each role has its own **dedicated login page**, its own **web dashboard**, and its own **set of permissions**.

| Role | Web App | Mobile App | Authority Level | Description |
|---|---|---|---|---|
| **SuperAdmin** | ✅ Dedicated Dashboard | ❌ Web only | Highest — governs all | Platform owner. Full control over everything including Admin accounts, all financials, all system settings |
| **Admin** | ✅ Dedicated Dashboard | ❌ Web only | High — daily ops | Operations manager. Manages users, merchants, riders, fraud, reports, referrals, messaging |
| **Merchant** | ✅ Dedicated Dashboard | ✅ React Native | Medium — own store | Runs up to 4 store types. Manages products, orders, schedule, promotions, chat support |
| **Rider** | ✅ Dedicated Dashboard | ✅ React Native | Limited — own account | Accepts deliveries, manages wallet, remittance, tracking, referrals |
| **User / Customer** | ✅ Web App | ✅ React Native | Limited — own account | Browses 4 shopping platforms, orders, tracks, wallet, rewards, referrals |

---

## 6. UI/UX DESIGN SYSTEM

### Web Dashboard Template: Apex Dashboard

All web dashboards across **every role** (SuperAdmin, Admin, Merchant, Rider, User) are built to **exactly replicate** the Apex Dashboard template in every visual and structural aspect.

- **Reference:** https://apex-dashboard.pages.dev/
- **Documentation:** https://apex-dashboard.pages.dev/docs

Every component, layout pattern, spacing, typography, animation, and interaction from Apex Dashboard is adopted as-is and customized only for RAPEX branding and color theme. This includes:

Implementation rule (web):
- Reusable UI is built once in `frontend/shared/src` and reused by all role dashboards.
- Role dashboards keep thin wrappers/config only (sidebar sections, auth wiring, route composition).
- Shared components are the default for layout, tables, forms, badges, cards, and charts to keep Apex parity consistent across all apps.

| Apex Dashboard Element | Implementation in RAPEX |
|---|---|
| **Sidebar navigation** | Per-role sidebar with collapsible sections, icons, active state highlighting |
| **Top navigation bar** | Search bar, notification bell, user avatar, quick action button (e.g., "+ New Order") |
| **Stat cards** | Dashboard KPI cards with icon, value, trend indicator, sparkline chart |
| **Line / Area charts** | Revenue over time, order volume, delivery trends |
| **Bar charts** | Merchant performance, rider rankings, category breakdowns |
| **Donut / Pie charts** | Traffic sources, order type distribution, wallet breakdown |
| **Data tables** | Sortable, filterable, paginated tables for users, orders, transactions, etc. |
| **Modals** | Confirmation dialogs, detail views, form inputs |
| **Notification panel** | Dropdown notification list with read/unread states |
| **Breadcrumbs** | Navigation trail on all inner pages |
| **Badges & status pills** | Order status, account status, verification status |
| **Dark / Light mode toggle** | Switches applied globally across all dashboard components |
| **Customization panel icon** | Slide-in panel to customize theme, color accent, sidebar style |
| **Responsive grid layout** | Adapts to desktop, tablet, and large-screen monitors |

### RAPEX Color Theme

| Color | Hex (Approx.) | Usage |
|---|---|---|
| **Purple (Primary)** | `#7C3AED` | Primary brand — CTA buttons, active nav items, accent borders, highlights |
| **Violet (Secondary)** | `#A78BFA` | Secondary brand — badges, secondary buttons, chart accents, tags |
| **White** | `#FFFFFF` | Text on dark backgrounds, card surfaces in dark mode |
| **Dark BG** | `#0F0F14` | Dark mode background (primary) |
| **Dark Surface** | `#1A1A24` | Dark mode card/panel background |
| **Light BG** | `#F5F5F5` | Light mode page background |

### Theme Modes
- **Dark Mode** — Default. Dark background with Purple/Violet accents
- **Light Mode** — Optional. White/light-grey background with Purple/Violet accents
- **Customizable** — User can change accent color, sidebar style (expanded/compact/icon-only), and mode from the Apex-style customization panel

### Mobile App Design (React Native)
- Same Purple / Violet / White color scheme as web
- Bottom navigation tab bar with icons for fast switching between the 4 shopping platforms
- Taglish (Tagalog + English) UI copy for accessibility to first-time Filipino app users
- Fast-action buttons with large tap targets: Accept, Mark Ready, Confirm Pickup, Track, etc.
- Clean card-based UI for product listings, order cards, and transaction history

---

## 7. SUPERADMIN — FULL FEATURE BREAKDOWN

> **Access:** Web Dashboard only · Separate login page · Highest authority on the platform
> **Authority:** Governs all Admins and all platform data. Can do everything Admin can do, plus more.

---

### 7.1 SuperAdmin Master Dashboard

**Purpose:** Bird's-eye view of the entire RAPEX platform — all regions, all roles, all metrics in one screen.

| Sub-Feature | Details |
|---|---|
| Platform-Wide Revenue Overview | Total revenue across all regions, all store types, all time ranges |
| Total Registered Users | Count of all active, pending, suspended users |
| Total Active Merchants | Count by store type: Shop, Fresh Market, Ready-to-Eat, Pre-Loved |
| Total Active Riders | Count with active/inactive/suspended breakdown |
| Live Order Activity | Real-time count of Pending, Ongoing, Completed orders platform-wide |
| Platform Wallet Summary | Total wallet balance held across all rider and user wallets |
| Top Performing Regions | Revenue and order volume ranked by municipality/barangay |
| Admin Activity Log | Timeline of Admin actions (approvals, suspensions, overrides) |
| System Health Indicators | API response time, WebSocket connections, background job queue status |
| Daily/Weekly/Monthly KPI Cards | Apex-style stat cards for all major platform metrics |

---

### 7.2 Admin Account Management

**Purpose:** Create, manage, and control all Admin accounts on the platform.

| Sub-Feature | Details |
|---|---|
| Create Admin Accounts | Full form: name, email, role assignment, access permissions |
| Assign Admin Sub-Roles | Super Admin, Support, Finance, Logistics, Compliance |
| View All Admin Accounts | List of all admins with last login, status, activity summary |
| Edit Admin Permissions | Granular toggle of which dashboard sections each admin can access |
| Suspend / Deactivate Admin | Immediately revoke access without deleting account |
| Reset Admin Password | Force password reset via email |
| Admin Activity Audit Log | Full log of every action taken by every admin account |
| Two-Factor Authentication (Admin) | Enforce 2FA for all admin accounts |

---

### 7.3 SuperAdmin Financial Control

**Purpose:** Full financial oversight and control that surpasses Admin-level finance access.

| Sub-Feature | Details |
|---|---|
| Platform-Wide Revenue Reports | Aggregate revenue from all commissions, markups, and platform fees |
| Commission Override | Override commission rates globally or per merchant, bypassing Admin-level settings |
| Rapex Platform Fee Management | Set and modify the global Rapex platform fee (default: 10% of total commission) |
| Full Wallet Ledger | View every single wallet transaction across all riders and users |
| Payout Records | Track and record any payouts or financial adjustments made to riders/merchants |
| Manual Financial Adjustment | Credit or debit any wallet at the highest authority level |
| Financial Audit Export | Export full platform financial data as CSV or PDF for any date range |
| Revenue by Store Type | Breakdown of revenue per shopping platform (Shop, Fresh Market, etc.) |

---

### 7.4 Platform-Wide System Settings

**Purpose:** Root-level configuration of the entire RAPEX platform.

| Sub-Feature | Details |
|---|---|
| Global Markup Engine Config | Set all tiered markup rates across all store types |
| Global Commission Rates | Set all admin-side commission rates globally |
| Rider Search Radius Config | Set default and maximum delivery radius (default: 2 km) |
| Delivery Pricing Rules | Set base fares, distance surcharges, and speed tier pricing |
| Weekly Incentive Configuration | Set delivery target (default: 40) and bonus amount (default: ₱250) |
| Referral Points Configuration | Set referral point values and monthly caps per role |
| OTP Provider Settings | Configure SMS provider credentials (Semaphore, Vonage, etc.) |
| FCM / Push Config | Manage Firebase project credentials and notification templates |
| Google Maps API Key Management | Manage and rotate API keys for Maps, Places, and Directions |
| Feature Flags | Toggle specific platform features on/off without redeployment |
| Maintenance Mode | Put the entire platform or specific modules into maintenance mode |
| Terms & Conditions / Privacy Policy | Update platform legal documents from dashboard |

---

### 7.5 Full Data Access & Override

**Purpose:** SuperAdmin can access and override any data record on the platform.

| Sub-Feature | Details |
|---|---|
| View/Edit Any User Record | Full access to any user's profile, KYC, wallet, orders, points |
| View/Edit Any Merchant Record | Full access to any merchant's store, products, orders, revenue |
| View/Edit Any Rider Record | Full access to any rider's profile, wallet, deliveries, remittances |
| Override Any Order | Manually update order status, reassign riders, force completion |
| Delete Records | Permanent deletion of any record (soft or hard delete) with audit log entry |
| Access All Chat Threads | View any Admin ↔ Rider or Admin ↔ User chat thread |

---

### 7.6 SuperAdmin Fraud & Compliance

| Sub-Feature | Details |
|---|---|
| Platform-Wide Fraud Dashboard | Aggregated view of all flagged accounts, orders, and transactions |
| Account Blacklist | Permanent platform-wide ban on a user, merchant, or rider |
| Investigation Case Management | Open, assign, escalate, and close fraud investigation cases |
| Export All Fraud Logs | Full export of all fraud records for legal or audit purposes |
| Compliance Reports by Region | KYC compliance rates per barangay/municipality |

---

---

## 8. ADMIN — FULL FEATURE BREAKDOWN

> **Access:** Web Dashboard only · Separate Admin login page
> **Authority:** Manages all daily operations under SuperAdmin governance

---

### 8.1 Admin Dashboard

**Purpose:** Real-time operational command center for day-to-day platform management.

| Sub-Feature | Details |
|---|---|
| Live Order Activity Widget | Live count of Pending, Ongoing, and Completed orders |
| Total Revenue Card | Revenue today, this week, this month — with trend vs. prior period |
| Active Users Card | Currently active users on the platform |
| Active Riders Card | Riders currently on delivery + idle riders available |
| Merchant Status Summary | Active stores by type: Shop, Fresh Market, Ready-to-Eat, Pre-Loved |
| Wallet Balances Overview | Total wallet balance across all riders |
| Top Delivery Locations | Most active barangays and municipalities by order volume |
| Recent Order Feed | Live feed of most recent orders with status and quick-action links |
| Pending Approvals Alert | Badge count of pending user, merchant, and rider KYC approvals |
| Rider Incentive Progress | Count of riders currently qualifying for weekly bonus |
| Revenue Overview Chart | Monthly area chart: Revenue, Orders, Profit (toggle) — Apex style |
| Traffic Sources Donut Chart | Breakdown by store type or delivery method |

---

### 8.2 User Management

**Purpose:** Full control and visibility over all registered customer accounts.

| Sub-Feature | Details |
|---|---|
| User List View | Paginated, sortable table of all registered users |
| Search & Filter | Filter by: name, barangay, municipality, status, registration date, verification status |
| View User Profile | Full details: name, age, birthday, address, contact, valid ID, selfie photo |
| KYC Photo Review | View submitted ID and live selfie side by side for verification |
| Approve User | Manually approve user account after KYC review |
| Suspend User | Temporarily disable a user account with reason logging |
| Ban User | Permanently block a user from the platform |
| View Wallet & Points Balance | See current wallet and loyalty points balance per user |
| View Order History | See all past orders placed by a specific user |
| Assign / Deduct Loyalty Points | Manually adjust a user's loyalty points |
| View Referral Activity | See referral code usage and points earned by the user |
| Export User Data | Download user list as CSV |

---

### 8.3 Merchant Management

**Purpose:** Oversee registration, compliance, and status of all merchant stores.

| Sub-Feature | Details |
|---|---|
| Merchant List View | Paginated table with store name, type, status, location, registration date |
| Filter by Store Type | Filter merchants by: Shop, Fresh Market, Ready-to-Eat, Pre-Loved |
| Filter by Status | Active, Pending Approval, Suspended, Flagged |
| Filter by Location | Barangay, Municipality |
| View Merchant Profile | Personal info, business name, store type, address map pin, documents |
| KYC Document Review | View uploaded DTI/Mayor's Permit and live selfie ID |
| Approve Merchant Registration | Manually approve pending merchant applications |
| Reject with Reason | Decline application with a written reason sent to merchant |
| Suspend Merchant | Temporarily disable store visibility and order acceptance |
| Edit Merchant Status | Activate, re-approve, or deactivate existing merchants |
| View Merchant Products | Browse all products listed per store |
| Override Markup per Merchant | Manually override markup % for a specific merchant (e.g., for a promotion) |
| View Compliance per Barangay | Summary of compliant merchants per geographic area |
| View Merchant Sales Summary | Revenue, orders, and commission per merchant |
| Flagged Merchant Review | Review merchants auto-flagged during KYC or by fraud system |

---

### 8.4 Rider Management

**Purpose:** Manage and monitor all registered delivery riders.

| Sub-Feature | Details |
|---|---|
| Rider List View | Paginated table with name, vehicle type, wallet balance, status, deliveries |
| Filter by Status | Active (on delivery), Idle, Suspended, Pending Approval |
| Filter by Vehicle Type | Bicycle, Motorcycle, 4-Wheels |
| View Rider Profile | Name, age, birthday, address, vehicle info, ID and selfie photos |
| KYC Photo Review | Review submitted valid ID and selfie holding ID |
| Approve Rider Registration | Manually approve pending rider applications |
| Block / Suspend Rider | Immediately restrict rider from accepting orders |
| View Wallet Balance | Real-time RAPEX Wallet balance per rider |
| View Remittance Status | Amount owed to admin, due date, paid/overdue status |
| View Weekly Deliveries | Count of deliveries this week and incentive qualification status |
| Incentive Qualification Check | Confirm if rider meets 40-delivery threshold for ₱250 bonus |
| Manual Wallet Load | Admin credits top-up after GCash screenshot verification via chat |
| Background Check Flag | Mark rider for additional background verification review |
| View Rider's Delivery Map | Visual map of rider's completed deliveries by area |
| Export Rider Data | Download rider list and performance data as CSV |

---

### 8.5 Referral Management

**Purpose:** Monitor and control the referral points system across all roles.

| Sub-Feature | Details |
|---|---|
| Referral Overview Dashboard | Total referrals made, active referrers, points distributed this month |
| User Referral Logs | View which users referred others, referral dates, points earned |
| Rider Referral Logs | View rider referral QR scan activity and points credited |
| Filter by Role / Date / Status | Granular filtering across all referral records |
| Monitor Monthly Cap Enforcement | Verify no user/rider exceeded 100 pts/month cap |
| Manual Points Adjustment | Admin can credit or deduct referral points from any account |
| Referral Fraud Detection | Flag sudden spikes in referral activity for review |
| Export Referral Report | CSV/PDF export of all referral activity |

---

### 8.6 Reports & Analytics

**Purpose:** Business intelligence, performance reporting, and data exports.

| Sub-Feature | Details |
|---|---|
| Daily Revenue Report | Total revenue for the current and past days |
| Weekly Summary Report | Orders, revenue, and rider performance for the week |
| Monthly Performance Report | Full P&L-style monthly overview |
| Revenue by Store Type | Breakdown: Shop vs. Fresh Market vs. Ready-to-Eat vs. Pre-Loved |
| Revenue by Region | Revenue per barangay and municipality |
| Rider Ranking Report | Top riders by delivery count, earnings, and incentive attainment |
| Merchant Sales Performance | Top and lowest performing stores by revenue and order volume |
| Commission Collected Report | Total commissions earned across all orders |
| Wallet Movement Report | All top-ups, deductions, and adjustments for a period |
| Order Volume Chart | Daily/weekly/monthly order volume with trend lines |
| Downloadable CSV | All reports exportable as CSV |
| Downloadable PDF | All reports exportable as formatted PDF |
| Visual Charts | Apex-style bar, line, area, and donut charts for all metrics |

---

### 8.7 Notification & Alert System

**Purpose:** Monitor and control all platform alerts sent across all roles.

| Sub-Feature | Details |
|---|---|
| Notification Control Panel | View all sent and scheduled notifications platform-wide |
| Broadcast Announcement | Send a platform-wide message to all users, all merchants, or all riders |
| Remittance Deadline Alerts | Auto-alerts to riders when remittance is due within 24 hours |
| Failed Delivery Alert | Notify admin when an order is marked failed or unresolved |
| Unassigned Rider Alert | Alert when no rider picks up an order after the 3-minute window |
| Inactive Account Alerts | Flag accounts with extended inactivity |
| Wallet Low Balance Alert | Notify rider and admin when wallet drops below critical threshold |
| New KYC Pending Alert | Alert admin when a new user/merchant/rider application is submitted |
| Notification Log | View full history of all notifications sent with delivery status |
| SMS vs. In-App Toggle | Configure per-event whether to send via SMS, in-app, push, or all |

---

### 8.8 Fraud & Risk Logs

**Purpose:** Investigation and risk management to protect platform integrity.

| Sub-Feature | Details |
|---|---|
| Fraud Dashboard | Aggregated view of all flagged events: accounts, transactions, orders |
| Flagged Transactions Log | All orders tagged as suspicious with reason and reporter |
| Non-Responsive Rider Log | Riders who repeatedly failed to respond to assigned orders |
| Late Remittance Auto-Deduct Log | Full records of all auto-deductions due to unpaid remittances |
| Suspicious Account Log | User or merchant accounts flagged for unusual activity |
| Cancel Pattern Detection | Log of accounts with unusually high order cancellation rates |
| Investigation Case Creation | Convert any log entry into a formal investigation case |
| Case Status Tracking | Open, Under Review, Resolved, Escalated to SuperAdmin |
| Exportable Investigation Reports | Download all fraud/risk data for documentation or legal use |
| Permanent Account Blacklist | Hard-ban any account with full audit trail |

---

### 8.9 Messaging System

**Purpose:** Admin-to-all-roles direct communication for support, top-up verification, and alerts.

| Sub-Feature | Details |
|---|---|
| Admin ↔ Rider Chat | Dedicated per-rider chat thread for top-up requests and account support |
| Admin ↔ User Chat | Dedicated per-user chat thread for top-up verification and support |
| Admin ↔ Merchant Chat | Dedicated per-merchant chat thread for compliance and store issues |
| GCash Screenshot Verification Thread | Top-up requests include screenshot upload from rider/user; admin approves in-thread |
| Predefined Quick Replies (Canned Responses) | Admin can send preset messages for common scenarios |
| Message Search | Search across all chat threads by keyword, user name, or date |
| Unread Badge Counters | Admin sees unread count per thread |
| Chat Notification | In-app and push alert when a new message arrives |
| Auto-Credit After Top-Up Approval | Approving top-up in chat auto-credits wallet in real time |
| Message Archive | All threads are preserved indefinitely for audit trail |

---

### 8.10 System Settings

**Purpose:** Operational configuration for the Admin level (within SuperAdmin-set boundaries).

| Sub-Feature | Details |
|---|---|
| Rider Search Radius Setting | Adjust default 2 km rider search radius |
| Markup % Configuration | Set or override markup tiers for all or specific merchant types |
| Incentive Threshold Settings | Set weekly delivery target and bonus amount for riders |
| Admin Sub-Role Management | Create support/finance/logistics sub-roles and assign to admin accounts |
| Granular Permission Control | Toggle access to specific dashboard sections per admin sub-role |
| System Announcement Banner | Post a visible announcement banner on all user/merchant/rider dashboards |
| KYC Auto-Approval Rules | Configure which KYC documents pass auto-approval vs. manual review |
| Platform Maintenance Mode | Put specific modules into read-only or maintenance mode |
| App Version Control | Set minimum required app version for mobile clients |

---

---

## 9. MERCHANT — FULL FEATURE BREAKDOWN

> **Access:** Web Dashboard + React Native Mobile App (Android-first)
> **Login:** Separate Merchant login page
> **UI:** Apex Dashboard template (web) — Purple/Violet/White — Taglish-accessible UI (mobile)

### Merchant Store Types (The 4 Cores)

A merchant can register and operate **one or more** of the following 4 store types. Each store type is treated as its own separate store with its own products, orders, settings, and analytics. In the merchant dashboard, each active store type appears as a **separate section in the sidebar**.

| Store Type | Icon | What it Sells | Merchant Example |
|---|---|---|---|
| **Shop** | 🛒 | General merchandise — household items, clothing, hardware, pharmacy, accessories, etc. | Sari-sari store, pharmacy, hardware, clothing stall |
| **Fresh Market** | 🥦 | Raw produce — vegetables, fruits, raw meat, seafood, eggs, dairy, condiments | Wet market vendor, live fish stall, vegetable vendor |
| **Ready-to-Eat Food** | 🍱 | Cooked and prepared food items — packed meals, viand, soups, pastries, beverages | Karinderya, home-based food seller, street food vendor |
| **Pre-Loved** | ♻️ | Pre-owned and second-hand items — clothes, gadgets, appliances, books, collectibles | Ukay-ukay, Facebook seller, thrift shop |

---

### 9.1 Merchant Registration & KYC

| Sub-Feature | Details |
|---|---|
| Personal Information Input | Full name, birthday, home address, contact number |
| Business Details Input | Business name, store type(s) selected (up to all 4), operating hours |
| Legal Document Upload | DTI Certificate, Mayor's Permit, or any valid business registration |
| Live Selfie + Valid ID | Camera-only capture — no gallery uploads (anti-fraud) |
| Map-Based Business Address | Google Maps API for precise store location pin |
| Auto-Approval (Basic KYC) | System auto-approves if documents pass basic validation rules |
| Manual Review for Flagged Entries | Admin reviews applications that are auto-flagged by the system |
| OTP Verification | OTP via mobile number or email during registration |
| Multi-Store Registration | Merchant can activate multiple store types under one account |

---

### 9.2 Merchant Dashboard

**Purpose:** Unified home screen showing performance across all active store types.

| Sub-Feature | Details |
|---|---|
| Total Revenue Card | Combined and per-store-type revenue today / this week / this month |
| Active Orders Widget | Live count of orders per store type |
| Pending Orders Alert | Badge count of orders needing action |
| Best-Selling Products | Top 5 products across all active stores |
| Sales Overview Chart | Monthly revenue breakdown by store type — Apex area/bar chart |
| Store Status Indicator | Open/Closed status per store type with quick toggle |
| Recent Orders Feed | Latest incoming orders with status and quick-accept button |
| Rider's Wallet Balance (on assign) | Shown when a rider is assigned to any pending order |
| Commission Summary | Total RAPEX commission deducted this period |

---

### 9.3 Shop — Product & Order Management (General Merchandise)

**Purpose:** Manage the general merchandise store — the Shopee-like storefront for everyday goods.

| Sub-Feature | Details |
|---|---|
| Add / Edit / Delete Products | Product name, description, category, base price, images |
| Product Category Management | Create and manage categories (e.g., Household, Clothing, Electronics, Health) |
| Multi-Image Upload per Product | Upload up to multiple photos per product |
| Auto-Markup Display | See: Base Price → Auto-applied Markup % → Final Selling Price |
| Inventory Toggle | Enable stock quantity tracking per product (optional) |
| Product Availability Toggle | Mark individual products as available or out of stock |
| Bulk Product Management | Enable/disable multiple products at once |
| Promo/Discount per Product | Set custom discount amount or percentage per product |
| Order Receive & Accept/Reject | Accept or reject incoming orders within 3-minute window |
| Order Status Management | Update: Pending → Preparing → For Pickup → Completed |
| Rider Assignment View | See assigned rider's name, contact, vehicle, and wallet balance |
| "Picked Up" Confirmation | Tap to confirm rider physically collected the order |

---

### 9.4 Fresh Market — Product & Order Management (Raw Produce)

**Purpose:** Manage a wet market / fresh produce store with weight-based or unit-based pricing.

| Sub-Feature | Details |
|---|---|
| Add / Edit / Delete Fresh Products | Product name, type (vegetable, fruit, meat, seafood, dairy, egg), base price |
| Pricing Mode Selection | Per piece / Per kilo / Per pack / Per bundle |
| Weight-Based Price Entry | Enter price per gram/kilo for meat and seafood items |
| Freshness / Availability Toggle | Mark products as "Fresh Today" or "Limited Stock" |
| Category Tags | Auto-tag: Vegetables, Fruits, Raw Meat, Seafood, Eggs, Dairy, Condiments |
| Daily Stock Reset Option | Option to reset stock counts daily (for perishables) |
| Product Images | Upload fresh product photos |
| Auto-Markup Applied | Same markup tier system applied to raw produce pricing |
| Order Accept/Reject | Same 3-minute window as other store types |
| Order Notes Visibility | See any buyer notes (e.g., "sukli lang 1/2 kilo ng tilapia") |
| Prepare & Pickup Flow | Same status progression as Shop orders |

---

### 9.5 Ready-to-Eat Food — Product & Order Management (Cooked Food)

**Purpose:** Manage a food stall or home-cooked meal store, similar to GrabFood merchant side.

| Sub-Feature | Details |
|---|---|
| Add / Edit / Delete Menu Items | Food name, description (e.g., "Adobo + Rice"), price, image |
| Menu Category Management | Viands, Soups, Rice Meals, Snacks, Beverages, Desserts, Combo Meals |
| Serving Size Options | e.g., Solo, Bilhan, Family Size with different prices |
| Add-Ons / Extras | Optional add-ons per item (e.g., extra rice, extra sauce) |
| Sold Out Toggle | Instantly mark an item as sold out |
| Store Hours for Food | Set specific open and close times (e.g., 7am–2pm for a karinderya) |
| Auto-Hide When Closed | Store disappears from user food tab outside operating hours |
| Order Accept/Reject with Timer | 3-minute window to accept; auto-cancel if not responded |
| Preparation Time Estimate | Merchant sets estimated prep time shown to customer |
| Order Status | Pending → Cooking → Ready for Pickup → Delivered |
| Special Instructions from Buyer | Visible notes (e.g., "walang sili", "extra rice") |
| Daily Revenue Summary | How much sold today per menu item |

---

### 9.6 Pre-Loved Shop — Product & Order Management (Second-Hand Items)

**Purpose:** Manage a pre-loved / second-hand items store with condition-based listings.

| Sub-Feature | Details |
|---|---|
| Add / Edit / Delete Listings | Item name, description, category, condition, asking price, images |
| Item Condition Rating | New / Like New / Good / Fair / For Parts — selectable tag |
| Multi-Image Upload | Up to multiple photos showing item condition |
| Category Management | Clothes, Shoes, Bags, Gadgets, Appliances, Books, Collectibles, Furniture, Others |
| Price Negotiable Toggle | Mark item as "Price Negotiable" — visible to buyers |
| Item Availability Toggle | Mark as Available, Reserved, or Sold |
| Sold History | View all sold pre-loved items with buyer, price, and date |
| Order Accept/Reject | If buyer confirms purchase, merchant accepts/rejects within 3 min |
| Pickup or Delivery | Buyer chooses delivery or self-pickup for each item |
| Pre-Loved Marketplace View | How the store appears on the user's Pre-Loved tab |

---

### 9.7 Order Management (Unified Across All Store Types)

**Purpose:** Central order management for all store types.

| Sub-Feature | Details |
|---|---|
| Unified Order Inbox | All orders from Shop, Fresh Market, Ready-to-Eat, Pre-Loved in one inbox (filterable by type) |
| Order Detail View | Item list, buyer info (non-personal — order only), delivery/pickup choice, total |
| Accept / Reject with Timer | 3-minute countdown per order with sound/vibration alert |
| Order Status Progression | Type-specific: Shop/Pre-loved: Pending→Preparing→For Pickup→Completed; Food: Pending→Cooking→Ready→Delivered |
| Rider Info on Assignment | See rider name, contact, vehicle, and wallet balance |
| "Picked Up" Confirmation | Tap to confirm handoff to rider |
| Order History | Full past order log with filter by date, type, and status |

---

### 9.8 Sales Reports & Analytics

**Purpose:** Business performance data across all active store types.

| Sub-Feature | Details |
|---|---|
| Revenue per Store Type | Separate revenue charts for Shop, Fresh Market, Ready-to-Eat, Pre-Loved |
| Top-Selling Products per Store | Best performers in each store type |
| Filter by Date Range | Daily, weekly, monthly, custom date range |
| Commission Deducted per Order | Transparent view of RAPEX commission per transaction |
| Order Volume Chart | Apex-style bar or line chart of orders over time |
| Geographic Breakdown | Orders categorized by buyer's barangay/municipality |
| Export to CSV | Full transaction history downloadable |

---

### 9.9 Messaging System

**Purpose:** Communication between merchant and RAPEX Admin for support.

| Sub-Feature | Details |
|---|---|
| Merchant ↔ Admin Chat | Dedicated support thread with RAPEX Admin |
| Image Upload | Send photos of products, documents, or issues to admin |
| Predefined FAQs | Quick-select common support questions |
| Canned Replies (from Admin) | Fast responses from admin to common merchant queries |
| Notification on New Message | Push alert when admin sends a reply |
| No Customer-to-Merchant Chat | Order support goes through admin only; no direct buyer messages |

---

### 9.10 Shop Settings (Per Store Type)

**Purpose:** Configure each individual store's availability and operational settings.

| Sub-Feature | Details |
|---|---|
| Store Display Name & Description | Customize store name and short description shown to buyers |
| Store Profile Photo / Banner | Upload store logo and banner image |
| Set Operating Hours | Per-day time slots for open and close |
| Auto-Hide Outside Hours | Store automatically hidden in user app outside set hours |
| Manual Pause Toggle | Instantly pause store (e.g., no riders, emergency, out of stock) |
| Store Visibility Toggle | Fully hide or show store across all platforms |
| Store Category Tags | Add searchable tags to store (e.g., "halal", "homemade", "organic") |

---

### 9.11 Notification & Alert System (Merchant)

| Sub-Feature | Details |
|---|---|
| New Order Alert | Sound + push + in-app alert for every new incoming order |
| Order Accept Countdown Alert | Warning when 3-minute window is running out |
| Rider Assigned Notification | Alert when a rider accepts the delivery for their order |
| Delivery Completed Notification | Confirmation when order reaches the customer |
| Admin Broadcast Alerts | Platform-wide or targeted messages from RAPEX Admin |
| Firebase Cloud Messaging | Push notifications via FCM on mobile app |

---

### 9.12 Security & Login

| Sub-Feature | Details |
|---|---|
| OTP-Based Login | Secure login via OTP to mobile number or email |
| Forgot Password / Reset | OTP-based password recovery |
| Single Device Lock | Account can only be active on one device at a time |
| Session Forced Logout | Auto-logout if another device logs in |

---

---

## 10. RIDER — FULL FEATURE BREAKDOWN

> **Access:** Web Dashboard + React Native Mobile App (Android-first)
> **Login:** Separate Rider login page

---

### 10.1 Rider Registration Module

| Sub-Feature | Details |
|---|---|
| Personal Information | Full Name, Age, Birthday, Home Address, Contact Number |
| Vehicle Information | Vehicle type: Bicycle / Motorcycle / 4-Wheels |
| Valid ID Upload | Camera-only government-issued ID capture |
| Live Selfie Holding ID | Anti-spoofing — live camera selfie required |
| Google Maps Address Pin | Precise home address via Google Maps |
| OTP SMS Verification | Mobile number verification via OTP |
| Admin Approval Workflow | Registration sent to admin queue for review and approval |

---

### 10.2 Rider Dashboard (Home Screen)

| Sub-Feature | Details |
|---|---|
| Active Order Summary | Current delivery status and order details |
| RAPEX Wallet Balance | Real-time wallet balance displayed prominently |
| Daily Earnings Tracker | Total earnings earned today |
| Weekly Earnings Tracker | Total earnings this week |
| Weekly Incentive Progress Bar | Visual progress toward 40 deliveries = ₱250 bonus |
| Completed Deliveries Count | Daily and weekly count |

---

### 10.3 Order Acceptance & Management

| Sub-Feature | Details |
|---|---|
| Real-Time Incoming Order Alerts | Push + sound alert for new orders within 2 km radius |
| View Order Details | Item list, merchant pickup address, customer drop-off address |
| Delivery Type Indicator | Shows what vehicle type is required |
| Required Wallet Balance Display | Minimum wallet balance needed shown before accepting |
| Accept / Reject Slide Gesture | Swipe UI for accept or reject decision |
| 3-Minute Response Timer | Auto-escalation if rider doesn't respond |
| Active Order Tracking View | Real-time view of current delivery progress |

---

### 10.4 Live Delivery Map

| Sub-Feature | Details |
|---|---|
| Customer Drop-Off Location | Pinned on Google Maps |
| Real-Time GPS Navigation | Google Maps SDK with turn-by-turn routing |
| Tracking Locked During Delivery | Cannot be disabled until order is marked delivered |
| Merchant Pickup Location | Map pin for merchant store |
| Navigation Directions | Live route from rider → merchant → customer |
| Delivery Auto-Complete | Map tracking ends only after delivery is confirmed |

---

### 10.5 RAPEX Wallet System

| Sub-Feature | Details |
|---|---|
| Initial Admin Load | ₱500 loaded by admin upon rider approval |
| Pay Merchant at Pickup | Rider pays merchant from wallet for COD orders |
| Real-Time Deductions | Wallet debited immediately after each delivery completion |
| Admin Commission Auto-Deduct | Platform commission auto-taken from wallet post-delivery |
| Wallet Top-Up Request | Via in-app chat with admin + GCash screenshot |
| Low Balance Alert | Push notification when wallet nears zero |
| Penalty Auto-Deduction | Unpaid remittance auto-deducted from next top-up |
| Wallet Transaction Log | Full history of every credit and debit |

---

### 10.6 Transaction & History Logs

| Sub-Feature | Details |
|---|---|
| Filter by Date | Custom date range filter |
| Filter by Status | Delivered, Cancelled, In Progress |
| Commission per Delivery | Breakdown of commission deducted per order |
| Summary by Barangay | Geographic delivery summary |
| Remittance Status Column | Paid, Pending, Overdue per transaction |

---

### 10.7 Remittance Report System

| Sub-Feature | Details |
|---|---|
| Outstanding Balance View | Exact amount owed to RAPEX Admin |
| 24-Hour Remittance Warning | Push + in-app alert when due date is approaching |
| Overdue Remittance Warning | Escalated alert when past due date |
| Auto-Deduction on Next Top-Up | System deducts unpaid amount automatically |
| Remittance History | Full log of all past remittances |
| Penalty Transparency | Rider sees how and when penalties were applied |

---

### 10.8 In-App Chat with Admin

| Sub-Feature | Details |
|---|---|
| Direct Chat (Rider ↔ Admin) | Dedicated per-rider message thread |
| GCash Screenshot Upload | Upload payment proof in chat for top-up verification |
| Admin Confirmation & Wallet Load | Admin approves → wallet credited in real time |
| Secure Thread | All messages saved and auditable |

---

### 10.9 Rider Referral System

| Sub-Feature | Details |
|---|---|
| Unique Referral QR Code | Generated per rider account |
| Points on Referral | 2 pts credited per referred and approved rider |
| Monthly Cap Enforcement | Max 100 pts/month |
| Points Credited to Wallet | Referral points added to RAPEX Wallet |
| Referral History | View all referred riders and status |

---

### 10.10 Notification System (Rider)

| Sub-Feature | Details |
|---|---|
| New Order Alert | Immediate push + sound for new nearby order |
| Wallet Low Balance Alert | Push when approaching zero balance |
| Remittance Due Alert | 24-hour advance warning |
| Remittance Overdue Warning | Escalated follow-up alert |
| Incentive Progress Update | Weekly push on delivery count toward bonus |
| Admin Broadcast | Receive platform announcements from admin |

---

### 10.11 Security & Verification

| Sub-Feature | Details |
|---|---|
| Camera-Only Selfie ID | No gallery uploads during registration |
| Mandatory GPS | Cannot use the app without location permissions |
| Background Check Flag | Admin can flag for additional verification |
| Single Device Login | Account locked to one device at a time |
| Session Forced Logout | Unauthorized device access immediately terminates session |

---

---

## 11. USER / CUSTOMER — FULL FEATURE BREAKDOWN

> **Access:** Web App + React Native Mobile App (Android-first)
> **Login:** Separate User login page
> **UI:** 4-tab bottom navigation (Shop · Fresh Market · Ready-to-Eat · Pre-Loved) + Apex-style web

---

### 11.1 User Registration & Identity Verification

| Sub-Feature | Details |
|---|---|
| Full Registration Form | Full Name, Age, Birthday, Home Address, Contact Number |
| Valid ID Selection | Choose from preloaded list of accepted government IDs |
| Live Selfie Holding Valid ID | Camera-only — no gallery uploads (anti-fraud KYC) |
| OTP Verification | Mobile/email OTP before account activation |
| Admin Verification Queue | Submission sent to admin for KYC review |

---

### 11.2 Home Screen — 4-Tab Shopping Navigation

**Purpose:** The core user experience — 4 separate shopping tabs, each powered by its own merchant core.

| Tab | Icon | Merchant Source | Description |
|---|---|---|---|
| **Shop** | 🛒 | Shop merchants | General merchandise: groceries, household, clothing, hardware, pharmacy |
| **Fresh Market** | 🥦 | Fresh Market merchants | Raw produce: vegetables, fruits, meat, seafood, eggs |
| **Ready-to-Eat** | 🍱 | Ready-to-Eat merchants | Cooked food: packed meals, viand, karinderya orders |
| **Pre-Loved** | ♻️ | Pre-Loved merchants | Second-hand: clothes, gadgets, appliances, collectibles |

Each tab functions independently but shares the same cart, checkout, wallet, and delivery infrastructure.

---

### 11.3 Location-Based Merchant Discovery (Per Tab)

| Sub-Feature | Details |
|---|---|
| Location Permission on Launch | App requests GPS on first open |
| 2 km Radius Auto-Load | Nearby merchants auto-loaded per tab based on coordinates |
| Store Distance Display | Distance from user to each store shown on card |
| Store Open/Closed Indicator | Real-time open/closed status label per store |
| Category Filter per Tab | Filter by subcategory within each tab (e.g., in Fresh Market: Vegetables, Meat, Seafood) |
| Search by Store Name | Search for specific merchants within each tab |

---

### 11.4 Product Browsing, Filtering & Search

| Sub-Feature | Details |
|---|---|
| Browse Products per Store | View all available items in a merchant's store |
| Search Products by Name | Real-time search across all nearby products |
| Filter by Category | Per-tab category filters |
| Filter by Price Range | Set min/max price filter |
| Filter by Popularity | Sort by best-selling |
| Filter by Distance | Sort stores nearest-to-farthest |
| Product Detail View | Name, image(s), price, description, availability, store name |
| Add to Cart | Add directly from browse or product detail screen |

---

### 11.5 Cart & Checkout System

| Sub-Feature | Details |
|---|---|
| Shopping Cart | Add, remove, adjust quantities per item |
| Multi-Store Cart | One store per order (consistent with merchant order workflow) |
| Order Review Screen | Full item breakdown with prices before confirming |
| Delivery or Pickup Selection | User chooses Delivery or In-Store Self-Pickup |
| Delivery Vehicle Selection | Bicycle (₱30) / Motorcycle (₱40) / 4-Wheels (₱80) |
| Delivery Speed Selection | Standard (+₱10, 10–15 min) or Saver (minimum fare, 15–25 min) |
| Fare Auto-Calculated | Delivery fee automatically added to order total |
| Distance Surcharge Applied | Auto-added ₱6/km beyond base coverage |
| Wallet Points Redemption | Apply earned points as cash discount |
| Wallet Top-Up Prompt | Prompted to top up wallet if order total exceeds ₱1,001+ |
| Order Summary Confirmation | Final screen showing all items, fees, and total before placing order |

---

### 11.6 Real-Time Order & Rider Tracking

| Sub-Feature | Details |
|---|---|
| Live Rider Map | Rider's GPS position shown on map after pickup |
| Rider Profile Card | Rider name, photo, vehicle type (view only — no direct call/chat) |
| Anti-Scam Info Reveal | Rider info only shown after official assignment and pickup confirmation |
| Order Status Timeline | Order Placed → Merchant Approved → Preparing → Rider Picked Up → In Transit → Delivered |
| ETA Indicator | Estimated time of arrival displayed during transit |

---

### 11.7 RAPEX Wallet (User)

| Sub-Feature | Details |
|---|---|
| Wallet Balance Display | Shown in profile (medium-size) |
| Points Balance Display | Alongside wallet balance |
| Top-Up via Admin Chat | Send GCash screenshot via in-app chat; admin credits wallet |
| Wallet Required for Large Orders | Orders ₱1,001+ require wallet top-up before checkout can proceed |
| Points-to-Peso Redemption | 1 point = ₱1 cash value, applicable at checkout |

---

### 11.8 Points Rewards System

| Sub-Feature | Details |
|---|---|
| Points Earning Rule | Every ₱300 spent = 1 point (₱1 value) |
| Rollover Accumulation | Amounts below ₱300 carry over until threshold is reached |
| Auto-Credit on Delivery | Points auto-credited after order is marked Delivered |
| Redemption at Checkout | Points applied as discount on any order |
| Points History | View earning and spending history |

---

### 11.9 Referral System (QR-Based)

| Sub-Feature | Details |
|---|---|
| Unique Referral QR per User | Generated per account |
| 5 Points per Successful Referral | Credited after referred user is verified and places first order |
| Monthly Cap | Max 100 referral points per month |
| Referral Status Tracking | Pending / Verified per referral |
| QR Share Feature | Share to messaging apps or display in-person |

---

### 11.10 Order History & Status Tracking

| Sub-Feature | Details |
|---|---|
| Order Cards | Each order shown as a card with summary: store, total, date, status |
| Status Detail View | Full status timeline per order |
| Item & Price Breakdown | Full receipt view of past orders |
| Reorder Button | Quickly re-place an identical past order |
| Filter by Tab / Store Type | View history per shopping platform (Shop, Food, etc.) |

---

### 11.11 No Cancellation After Pickup (Anti-Scam)

| Sub-Feature | Details |
|---|---|
| Cancel Button Disabled After Pickup | Permanently disabled once rider accepts the order |
| In-App Message | "Order in transit and cannot be canceled" message shown |
| No Override for User | Rule is absolute — user cannot bypass regardless of reason |

---

### 11.12 Mandatory Live Location (Anti-Scam)

| Sub-Feature | Details |
|---|---|
| Location Required on App Open | App prompts for location permission immediately |
| Blocked During Delivery if Off | Order progression blocked until location is re-enabled |
| Auto-Prompt on Phone Restart | When phone reconnects, app immediately re-requests location |
| Cannot Proceed Without GPS | All delivery orders require active location — no workaround |

---

### 11.13 In-App Chat with Admin (Wallet Support)

| Sub-Feature | Details |
|---|---|
| Admin-Only Chatroom | No access to merchants, riders, or other users |
| GCash Receipt Upload | Send payment screenshot for top-up verification |
| Admin Verification & Credit | Admin reviews and credits wallet in real time |
| Chat History Preserved | Full thread saved for user's reference and audit |

---

### 11.14 Push Notifications (User)

| Sub-Feature | Details |
|---|---|
| Order Confirmed Alert | When merchant accepts the order |
| Rider Assigned Alert | When a rider picks up |
| Order On the Way | "Your order is on the way" |
| Delivery Completed | Confirmation notification |
| Promo Alerts | Optional alerts for platform-wide or merchant-specific promos |
| Firebase / OneSignal | Delivered via FCM or OneSignal |

---

---

## 12. THE 4 SHOPPING PLATFORMS (MERCHANT CORES)

Each shopping platform is a separate, self-contained vertical within RAPEX. They share the same infrastructure but have distinct product types, UI patterns, and business logic.

| Platform | Merchant Core | User Tab | Unique Logic |
|---|---|---|---|
| **Shop** | Shop store type | Shop tab | Standard product listings, markup-based pricing, inventory optional |
| **Fresh Market** | Fresh Market store type | Fresh Market tab | Weight/unit/bundle pricing, freshness toggle, perishable daily reset |
| **Ready-to-Eat Food** | Ready-to-Eat store type | Ready-to-Eat tab | Menu-based with serving sizes, add-ons, prep time, karinderya-style |
| **Pre-Loved** | Pre-Loved store type | Pre-Loved tab | Condition rating, negotiable price toggle, per-item availability |

---

## 13. COMMISSION, MARKUP & WALLET SYSTEM

### Merchant-Side Markup (Applied on Merchant's Base Price)

| Price Range | Markup Added | Example |
|---|---|---|
| ₱1 – ₱100 | +15% | ₱50 item → ₱57.50 → rounded to ₱58 |
| ₱101 – ₱1,000 | +10% | ₱200 item → ₱220 |
| ₱1,001+ | +5% | ₱1,500 item → ₱1,575 |

> All final prices rounded to nearest peso. Merchants see Base Price / Markup % / Final Price.

### Admin-Side Commission (Taken from Total Order Commission)

| Order Total | Commission Rate |
|---|---|
| ₱1 – ₱100 | 20% of the collected markup |
| ₱101 – ₱1,000 | 15% of the collected markup |
| ₱1,001+ | 10% of the collected markup |

> **Rapex Platform Fee: 10%** — Calculated from the total commission of the placed order.

### Rider Incentive

| Condition | Reward |
|---|---|
| 40 completed deliveries in a week | ₱250 bonus |

### User Loyalty Points

| Rule | Detail |
|---|---|
| Earning Rate | ₱300 spent = 1 point (₱1 value) |
| Rollover | Purchases below ₱300 accumulate toward threshold |
| Redemption | Points used as cash at checkout |

### Referral Points

| Role | Points per Referral | Monthly Cap |
|---|---|---|
| User | 5 pts per verified referral | 100 pts/month |
| Rider | 2 pts per verified referral | 100 pts/month |

### Wallet Top-Up Flow

1. Rider/User initiates top-up request via **in-app chat with Admin**
2. Sends **GCash screenshot** as payment proof
3. Admin manually verifies screenshot
4. Admin credits wallet — **real-time balance update**
5. If remittance was unpaid, the outstanding amount is **auto-deducted from the next top-up**
6. New rider initial balance: **₱500 loaded by admin** upon approval

---

## 14. DELIVERY SYSTEM & PRICING

### Vehicle Types & Base Fares

| Vehicle | Base Fare | Coverage |
|---|---|---|
| Bicycle | ₱30 | 1–2 kg payload, within 2 km |
| Motorcycle | ₱40 | Within 2 km |
| 4 Wheels | ₱80 | Within 1.5 km (update pending) |

### Delivery Speed Options

| Speed | Add-on Fee | Estimated Time |
|---|---|---|
| Standard Delivery | +₱10.00 | 10–15 minutes |
| Saver Delivery | Minimum fare | 15–25 minutes |

> **Distance Surcharge:** ₱6 per kilometer beyond base coverage distance

### Delivery Flow

```
User places order
    → Merchant accepts within 3 min
    → System auto-pings riders within 2 km radius
    → Rider accepts within 3 min
    → Rider picks up from merchant ("Picked Up" confirmed by merchant)
    → Rider delivers to customer (live GPS tracking active)
    → Order marked Delivered
    → Commission auto-deducted from Rider wallet
    → Points credited to User
```

---

## 15. ANTI-SCAM & SECURITY SYSTEMS

| Feature | Scope | Details |
|---|---|---|
| **Camera-Only KYC** | Merchant, Rider, User | Live selfie + ID capture — gallery upload blocked entirely |
| **Mandatory GPS During Delivery** | User | Location must stay active from order placement to delivery; re-prompted if disabled |
| **Anti-Scam Order Lock** | User, Rider, Merchant | Cancel button permanently disabled once rider picks up order |
| **Wallet Threshold for Large Orders** | User | Orders ₱1,001+ require wallet top-up before checkout can proceed |
| **Rider Wallet Visible to Merchant** | Merchant | Merchant sees rider's wallet before handing over the order |
| **One Device Session Enforcement** | Merchant, Rider, User | Only one active login per account; new device login forces logout of previous |
| **GCash Screenshot Verification** | Rider, User | Admin manually verifies payment screenshot before crediting wallet |
| **Background Check Flag** | Rider | Admin can flag rider for additional background check before activation |
| **Anti-Spoofing Camera Enforcement** | Merchant, Rider, User | Pre-taken gallery photos cannot be submitted as KYC selfie |
| **Admin 2FA** | Admin, SuperAdmin | Two-factor authentication enforced for all admin-level accounts |

---

## 16. KEY BUSINESS LOGIC RULES

| Rule | Detail |
|---|---|
| **Merchant Accept Window** | Must accept or reject order within **3 minutes** or it auto-cancels/escalates |
| **Rider Response Window** | Must respond to ping within **3 minutes** or order falls through to next rider / manual assign |
| **Rider Auto-Ping Radius** | System auto-pings all idle riders within **2 km** of merchant |
| **No Cancel After Pickup** | Order is permanently locked once rider confirms pickup |
| **Mandatory User GPS** | User must maintain active GPS throughout entire delivery |
| **Wallet Threshold** | Orders above **₱1,001** require user wallet to be loaded |
| **Remittance Penalty** | Unpaid remittance = auto-deducted from rider's next wallet top-up |
| **Inventory Toggle** | Merchants can optionally enable per-product stock quantity tracking |
| **Store Auto-Hide** | Store disappears from user app when outside set operating hours |
| **Manual Store Pause** | Merchant can instantly pause store visibility for any reason |
| **Initial Rider Load** | New approved riders start with **₱500** in RAPEX Wallet loaded by admin |
| **Pre-Loved Price Negotiation** | Pre-loved items can be marked as negotiable; final price agreed before order confirmation |
| **Fresh Market Daily Reset** | Perishable products can have their availability reset daily by merchant |
| **Ready-to-Eat Prep Time** | Merchant sets preparation time per food item; shown to buyer at checkout |

---

## 17. NOTIFICATIONS & MESSAGING INFRASTRUCTURE

### Notification Channels

| Channel | Technology | Used For |
|---|---|---|
| Mobile Push | Firebase Cloud Messaging (FCM) | All order, wallet, delivery, and alert events on mobile |
| Web Push | OneSignal | Browser-based push for web dashboard users |
| In-App | WebSocket (Django Channels) | Real-time in-dashboard notification bell and badge |
| SMS | Semaphore API (PH) or Vonage | OTP, remittance deadlines, critical account alerts |

### Messaging Threads

| Thread | Parties | Purpose |
|---|---|---|
| Admin ↔ Rider | Admin + Individual Rider | Wallet top-up verification, remittance issues, account support |
| Admin ↔ User | Admin + Individual User | Wallet top-up, account questions, KYC queries |
| Admin ↔ Merchant | Admin + Individual Merchant | KYC review, compliance, store issues, promotions |

> All threads are **one-to-one between Admin and the party**. No cross-role messaging. No user-to-merchant or user-to-rider direct contact outside of order tracking.

---

*End of RAPEX Technologies OPC — Project Overview*
*Last Updated: March 2026 — MVP Phase*
