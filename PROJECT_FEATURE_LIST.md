# RAPEX TECHNOLOGIES OPC — COMPLETE FEATURE & FUNCTIONALITY SPEC

> **Version:** 1.0 MVP  
> **Date:** March 2026  
> **Architecture:** Modular-Monolith · Django 5.x + Next.js 14+ + React Native (Expo)  
> **Database:** PostgreSQL 16 · Cache: Redis 7 · Queue: Celery · Real-Time: Django Channels  
> **UI:** Apex Dashboard (exact copy) · Orange `#FF6B00` · Purple `#7C3AED` · Dark Mode default  
> **Roles:** SuperAdmin · Admin · Merchant · Rider · User/Customer

---

## TABLE OF CONTENTS

1. [SuperAdmin Role](#1-superadmin-role)
2. [Admin Role](#2-admin-role)
3. [Merchant Role — 4 Store Cores](#3-merchant-role)
4. [Rider Role](#4-rider-role)
5. [User / Customer Role](#5-user--customer-role)
6. [Cross-Role & Shared Systems](#6-cross-role--shared-systems)

---

## 1. SUPERADMIN ROLE

> **URL:** `superadmin.rapex.ph` · Web dashboard only · Highest authority on the platform  
> **UI:** Apex Dashboard — exact copy. Sidebar collapses to icon-only mode. Dark mode default.

---

### 1.1 SuperAdmin Login & Authentication

**Feature:** Secure isolated login portal with 2FA enforcement.

**Functionality:**
- Separate login page at `superadmin.rapex.ph/login` — completely isolated from all other role logins
- Email + password authentication validated against Django `SuperAdminUser` model
- On successful credentials, system sends a 6-digit TOTP code to registered email (2FA mandatory for all SuperAdmin accounts — cannot be disabled)
- JWT access token (15-min expiry) + refresh token (7-day expiry) issued on 2FA confirmation
- Tokens stored in httpOnly cookies (not localStorage) to prevent XSS
- Device fingerprint recorded on every login — new device triggers re-authentication
- Failed login attempts: after 5 failures, account locked for 30 minutes + email alert sent
- Session activity logged in `SuperAdminAuditLog` table with IP, timestamp, device, action
- Forced logout of all sessions button available in security settings

---

### 1.2 Master Dashboard

**Feature:** Real-time bird's-eye platform overview across all regions, all roles, all financials.

**Functionality:**
- **Apex Stat Cards (Top Row):** 6 cards rendered in a responsive grid — Total Revenue Today, Total Active Orders, Registered Users, Active Merchants, Active Riders, Platform Wallet Total. Each card shows: icon (SVG), primary value, delta vs. yesterday (green up / red down indicator), sparkline chart (7-day mini line chart)
- **Live Order Activity Widget:** WebSocket-connected counter showing real-time Pending / In-Transit / Completed orders. Updates without page refresh via Django Channels
- **Revenue Overview Chart:** Apex-style area chart. X-axis: last 30 days. Y-axis: revenue in pesos. Hoverable data points showing daily breakdown. Toggle between: Total Revenue / Commission Collected / Markup Collected
- **Top Regions Table:** A sortable table of top 10 barangays/municipalities by order volume. Columns: Region Name, Order Count, Revenue, Active Merchants, Active Riders
- **Admin Activity Timeline:** Scrollable card feed of actions taken by all admin accounts in the last 24 hours (e.g., "Admin Juan approved merchant ID #4521", "Admin Maria suspended user ID #112")
- **System Health Card:** Shows: API avg response time (ms), active WebSocket connections, Celery queue depth, Redis memory usage, PostgreSQL connection pool usage. Color-coded: green (healthy), yellow (warning), red (critical)
- **Merchant Breakdown Donut Chart:** Orders by store type — Shop / Fresh Market / Ready-to-Eat / Pre-Loved. Percentage labels.
- All data refreshes every 30 seconds via background polling or WebSocket push

---

### 1.3 Admin Account Management

**Feature:** Full lifecycle management of all Admin accounts.

**Functionality:**
- **Admin List View:** Paginated table (25/page). Columns: Name, Email, Sub-Role, Status (Active/Suspended), Last Login, Actions. Sortable by last login and name. Search by name or email.
- **Create Admin Form:** Fields: Full Name, Email, Password (auto-generated + emailed), Sub-Role (dropdown: Operations Manager / Support Agent / Finance Officer / Compliance Officer / Logistics Manager), Dashboard Permissions (granular checkboxes per section: User Mgmt, Merchant Mgmt, Rider Mgmt, Reports, Finance, Fraud, etc.)
- **Permission Matrix:** Visual grid — rows are Admin accounts, columns are feature modules. Checkboxes can be toggled per cell. Bulk permission templates ("Support Agent Template", "Finance Template") apply a preset set of permissions
- **Edit Admin:** All fields editable. Permission changes apply immediately on next request (JWT re-validation)
- **Suspend Admin:** Soft-disables account. All active JWT sessions invalidated immediately. Admin cannot log in until reactivated.
- **Delete Admin:** Soft-delete only. All audit log entries preserved. Account data retained for 1 year per compliance requirements
- **Force Password Reset:** Sends password reset email. Account marked `requires_password_change = True` — redirected to reset page on next login
- **Audit Log per Admin:** Click any admin to view their full action history: logins, logouts, records modified, approvals, rejections, etc. Exportable as CSV.

---

### 1.4 Financial Control

**Feature:** Platform-wide financial oversight — every peso tracked.

**Functionality:**
- **Revenue Dashboard:** Aggregate revenue from: markup collected, commission collected, platform fees. Period selector: Today / This Week / This Month / Custom. Displayed as line chart + KPI cards
- **Commission Override Panel:** Table of all commission rules with inline editing. Override per store type or per individual merchant account. Override requires documented reason (text field). Overrides logged in audit trail.
- **Platform Fee Config:** Single-field form to set the global Rapex platform fee percentage (default: 10%). Change triggers a confirmation modal showing projected impact on current month revenue.
- **Full Wallet Ledger:** Paginated table of every wallet transaction across the entire platform. Filters: by role (rider/user), by date range, by transaction type (top-up/deduction/penalty). Export to CSV/PDF. Each row shows: Account Name, Role, Transaction Type, Amount, Before Balance, After Balance, Timestamp, Performed By.
- **Manual Financial Adjustment:** Form fields: Account Type, Account Search (autocomplete), Adjustment Type (credit/debit), Amount, Reason (required), Internal Reference Note. Creates an `AdminFinancialAdjustment` record. Immediately updates wallet balance. Sends in-app + push notification to account holder.
- **Payout Records:** Track any manual payouts or credits to merchants/riders. Workflow: Create Payout Record → Confirm with GCash reference → Mark as Disbursed.
- **Financial Export:** Full platform financial data export as CSV or formatted PDF. Date range selector. Includes: per-order breakdown, commission, markup, fees, wallet movements.

---

### 1.5 Platform-Wide System Settings

**Feature:** Root-level platform configuration that governs all lower-level settings.

**Functionality:**
- **Markup Engine:** Table with 3 rows (₱1–₱100, ₱101–₱1,000, ₱1,001+). Each row has an editable % field. Inline save. Change immediately affects all new orders across all store types.
- **Commission Rates:** Same layout as markup engine — per price tier, editable rates per store type (Shop, Fresh Market, Ready-to-Eat, Pre-Loved configurable separately or globally)
- **Rider Search Radius:** Number input (default: 2 km). Immediate effect on rider ping system.
- **Delivery Pricing:** Form for base fares (Bicycle/Motorcycle/4-Wheels), speed add-ons (Standard/Saver), and distance surcharge per km. Preview calculator embedded: enter a distance, see computed fare.
- **Incentive Config:** Weekly delivery target (default: 40) and bonus amount (default: ₱250) — editable number inputs. Effective from next Monday's cycle.
- **Referral Config:** Point values and monthly caps per role (User: 5pts, Rider: 2pts; cap: 100pts/month) — editable.
- **SMS Provider:** Dropdown (Semaphore / Vonage) + API key input fields + test SMS button.
- **FCM Config:** Firebase project credentials (JSON upload or pasted JSON key). Test notification button sends a test push to a specified test device.
- **Google Maps API:** API key input + usage stats display (requests today, this month, quota remaining).
- **Feature Flags:** Toggle list of platform features with on/off switch. Examples: "Pre-Loved negotiation enabled", "Rider weekly incentive active", "User wallet threshold enforced". Changes apply immediately without redeployment.
- **Maintenance Mode:** Global toggle + per-module toggles. Shows a configurable maintenance message to affected users. Can set a scheduled end time.
- **Legal Documents:** Rich-text editor (Markdown-based) for Terms & Conditions and Privacy Policy text. "Publish" button versions the document and sends update notification to all users.

---

### 1.6 Full Data Access & Override

**Feature:** Unrestricted read/write access to every record on the platform.

**Functionality:**
- **Universal Search:** Single search bar on the Override panel. Type any name, phone number, email, or order ID. Returns matching records from all tables: Users, Merchants, Riders, Orders, Wallets.
- **User Record Override:** Opens full user profile in an edit modal. Every field is editable including: name, contact, address, KYC status, wallet balance, points balance, account status. Every edit is logged with before/after values in the audit trail.
- **Merchant Record Override:** Edit any merchant's store data including markup overrides, store status, product visibility, KYC approval status.
- **Rider Record Override:** Edit rider profile, vehicle info, wallet balance, remittance status, account flags.
- **Order Override:** Change order status to any value. Reassign to a different rider (with notification sent). Force-complete an order (bypasses normal flow). Force-cancel with reason. All overrides timestamped in order history.
- **Hard Delete:** Available for User, Merchant, Rider, Order, and Product records. Requires confirmation modal with "TYPE DELETE" text input. Creates an `IrreversibleDeleteLog` entry before deletion.
- **Chat Thread Access:** View read-only versions of all Admin ↔ Rider, Admin ↔ User, and Admin ↔ Merchant chat threads from the SuperAdmin panel.

---

### 1.7 Fraud & Compliance

**Feature:** Platform-wide fraud investigation and compliance enforcement.

**Functionality:**
- **Fraud Dashboard:** KPI cards: Active Investigations, Blacklisted Accounts, Flagged Transactions This Month, KYC Failure Rate. Timeline chart of fraud events over the past 30 days.
- **Account Blacklist:** Search any account and add to platform-wide blacklist with reason and duration (permanent or with expiry date). Blacklisted accounts get `BANNED` status and all active sessions revoked. Email notification sent to account.
- **Investigation Cases:** Create, assign to admin, track status (Open / Under Review / Resolved / Escalated). Each case has: subject account(s), evidence attachments, timeline of events, notes thread, resolution record.
- **Fraud Export:** Full export of all blacklists, investigations, and fraud flags as CSV for legal documentation or external audit.
- **KYC Compliance Report:** Per-barangay and per-municipality compliance table showing: total registered, KYC approved, KYC pending, KYC rejected, % compliant.

---

---

## 2. ADMIN ROLE

> **URL:** `admin.rapex.ph` · Web dashboard only  
> **UI:** Apex Dashboard — exact copy. All 10 modules in sidebar. Role-based permission filtering.

---

### 2.1 Admin Dashboard

**Feature:** Real-time operational command center for daily platform management.

**Functionality:**
- **Apex Stat Cards (responsive 2-3 column grid):**
  - *Total Revenue Today* — sum of all completed orders' markup collected, with trend arrow vs. yesterday
  - *Active Orders Now* — live count via WebSocket subscription, updates in real time
  - *Pending Approvals* — count of User + Merchant + Rider KYC applications awaiting admin action. Clicking navigates to appropriate queue.
  - *Active Riders* — count of riders currently on a delivery
  - *Idle Riders* — count of online riders not currently assigned
  - *Active Merchants* — count of stores currently set to "Open"
- **Revenue Chart:** Apex area/line chart. Toggle: Revenue / Orders / Commission. Date filters: 7D / 30D / 90D / Custom. Y-axis auto-scaled. Hover tooltip shows exact values.
- **Live Order Feed:** Auto-refreshing table of the last 20 orders with columns: Order ID, Customer Location, Merchant, Store Type, Total, Status, Rider. Status uses color-coded badges (Apex badge style). Click row to open order detail modal.
- **Pending Approvals Widget:** Card showing counts for: User KYC Pending, Merchant KYC Pending, Rider KYC Pending. Quick action buttons navigate to each queue.
- **Rider Incentive Progress Widget:** Shows count of riders who have hit 0–9 / 10–19 / 20–29 / 30–39 / 40+ deliveries this week. Visual progress bar.
- **Top Merchants Today:** Small table of top 5 merchants by order volume today.
- **Geographic Heatmap Card:** Text-based table (or embedded Google Maps heatmap if API budget allows) showing top order-volume barangays today.

---

### 2.2 User Management

**Feature:** Full visibility and control over all customer accounts.

**Functionality:**
- **User List Table:** Server-side paginated (25/page). Columns: Name, Contact, Barangay, Municipality, Verification Status (badge), Wallet Balance, Registration Date, Actions. Searchable by name, contact, or barangay. Filterable by: Status (All/Active/Suspended/Banned), Verification (Pending/Approved/Rejected), Date Range.
- **KYC Review Modal:** Opens when admin clicks "Review" on a pending user. Two-panel layout: left = submitted form data (name, birthday, address, contact); right = KYC images (valid ID photo and selfie photo side by side). Admin sees both images at full resolution in a lightbox. Approve or Reject buttons. Rejection requires a typed reason which is sent to the user via push notification and in-app message.
- **User Profile Detail Page:** Full user record: personal info, KYC status, wallet balance, points balance, order history (paginated table), referral activity log.
- **Account Actions:** Suspend (with reason → duration → confirm), Unsuspend, Ban (permanent with reason), Unban. All actions require confirmation modal and are logged.
- **Manual Points Adjustment:** Form to credit or deduct points with a required reason. Confirmation shows new projected balance. Immediately updates `UserPoints` table.
- **Wallet View:** Read-only wallet balance + full wallet transaction ledger for the user. Admin cannot manually credit user wallets directly in this panel — must go through chat top-up flow.
- **Export:** Download current filtered user list as CSV.

---

### 2.3 Merchant Management

**Feature:** Onboarding, compliance, and operational oversight of all merchant stores.

**Functionality:**
- **Merchant List Table:** Columns: Store Name, Owner Name, Store Types (icon badges: 🛒 🥦 🍱 ♻️), Municipality/Barangay, KYC Status, Active Status, Orders Today, Registration Date. Filters: by store type, by status, by municipality. Search by store name or owner name.
- **KYC Review Modal:** Three-panel: left = business info (store name, type, operating hours, map address pin preview), middle = ID document photo, right = live selfie. Approve / Reject with reason. On approve, system changes `MerchantAccount.kyc_status = APPROVED` and sends welcome push notification + SMS.
- **Merchant Profile Detail:** Full store data, all active products by store type, order history, revenue summary, commission collected, map location.
- **Override Markup per Merchant:** Inline editable markup % fields per price tier for a specific merchant — overrides global settings. Requires reason documentation. Change logged in `MerchantMarkupOverride` table.
- **Store Status Control:** Force-close a merchant store (makes it invisible in user app), force-reopen.
- **Product Visibility Override:** Admin can mark any individual product as Hidden platform-wide (e.g., for compliance reasons).
- **Compliance Dashboard per Barangay:** Table showing per-barangay count of: Total Merchants, KYC Compliant, KYC Pending, Suspended, flagged.
- **Suspend / Reject / Ban:** Same confirmation flow as User Management. Rejection sends detailed reason to merchant.

---

### 2.4 Rider Management

**Feature:** Onboarding, monitoring, and financial oversight of all delivery riders.

**Functionality:**
- **Rider List Table:** Columns: Name, Vehicle Type (icon), Wallet Balance, Deliveries This Week, Incentive Progress (mini progress bar), Status badge, Registration Date. Filters: Status, Vehicle Type, Remittance Status (On Time / Due Soon / Overdue). Search by name.
- **KYC Review Modal:** Three-panel: left = personal info + vehicle info; middle = valid ID photo; right = selfie holding ID. Review same flow as merchant KYC.
- **Rider Profile Detail:** Personal info, vehicle, all delivery history (paginated), wallet transaction log, remittance history, referral log.
- **Wallet Management:**
  - *Initial Load:* On approval, admin triggers initial ₱500 wallet load via a button. Creates `WalletTransaction(type=INITIAL_LOAD, amount=500)`. Push notification sent to rider.
  - *Manual Top-Up (via Chat):* After verifying GCash screenshot in chat, admin clicks "Confirm Top-Up" button inside the chat thread. Enters amount. System credits wallet and marks the chat message as `VERIFIED`.
  - *Penalty Deduction:* If remittance overdue, admin can trigger manual penalty deduction with documented reason.
- **Remittance Dashboard Table:** Shows all riders with: Outstanding Balance, Due Date, Status (OK / Due in 24h / Overdue). Quick action: mark remittance as paid (with GCash reference number field).
- **Background Check Flag:** Toggle per rider to flag for additional background investigation. Flagged riders show a warning badge on their profile.
- **Weekly Incentive Verification:** Table of riders who reached 40 deliveries this week. Admin confirms and credits ₱250 bonus to wallet. Bulk confirm available.
- **Delivery Map View:** View an individual rider's last 30 delivery drop-off points on a Google Maps embed. Shows geographic coverage and routing patterns.
- **Export:** Download rider list and performance data as CSV.

---

### 2.5 Referral Management

**Feature:** Monitor and govern the referral points ecosystem.

**Functionality:**
- **Referral Overview Cards:** Total Referrals This Month, Total Points Distributed, Top Referrers (User/Rider), Monthly Cap Triggers (accounts that hit the 100pt cap).
- **User Referral Log Table:** Columns: Referrer Name, Referred User, Date, Points Credited, Status (Pending/Credited). Filter by date range. Search by referrer.
- **Rider Referral Log Table:** Same layout as user referrals. Shows QR scan confirmations.
- **Monthly Cap Monitoring:** Visual indicator per account showing current-month points accumulation vs. 100pt cap. Auto-enforcement handled by system; admin can view exceptions.
- **Manual Points Adjustment:** Credit or deduct referral points to/from any account. Required reason field. Immediate effect.
- **Fraud Detection View:** Accounts flagged for unusual referral activity (e.g., 10+ referrals in one day). Shows pattern: referral dates, IP addresses of referred accounts (where available), account ages.
- **Referral Report Export:** Full referral activity data as CSV or PDF for any date range.

---

### 2.6 Reports & Analytics

**Feature:** Business intelligence, KPI reporting, and data export.

**Functionality:**
- **Report Type Selector:** Left sidebar nav items within Reports section: Daily Summary / Weekly Summary / Monthly Report / Revenue by Store Type / Revenue by Region / Rider Performance / Merchant Performance / Commission Report / Wallet Movement.
- **Daily Summary:** Auto-generated at midnight. Shows: Total Orders, Revenue, Commission, New Registrations (User/Merchant/Rider), Pending Actions. Printable PDF layout.
- **Weekly Summary:** Monday–Sunday aggregation. Includes: top 5 merchants, top 5 riders, order volume chart (7 bar chart), revenue vs. prior week comparison.
- **Monthly Report:** Full P&L-style layout. Revenue, commissions, operating metrics, growth rates vs. prior month. Suitable for management review.
- **Revenue by Store Type:** Donut chart + table showing revenue split: Shop / Fresh Market / Ready-to-Eat / Pre-Loved. Filter by month.
- **Revenue by Region:** Table sorted by municipality then barangay. Columns: Region, Orders, Revenue, Commission, Active Merchants, Active Riders. Heatmap coloring optional.
- **Rider Performance Report:** Rankings table: Rider Name, Deliveries Completed, Total Earnings, Remittance Status, Incentive Earned. Filter by week/month.
- **Merchant Performance:** Merchant Name, Store Type, Orders, Revenue, Commission Paid, Avg Order Value. Filter by period and store type.
- **Chart Controls:** All charts use Apex Dashboard's chart component — full-screen expand option, zoom, pan, data download (CSV from chart).
- **Export:** Every report page has a "Download CSV" and "Download PDF" button at the top.

---

### 2.7 Notification & Alert System

**Feature:** Platform-wide alert management and broadcast messaging.

**Functionality:**
- **Notification Log Table:** All notifications ever sent via the platform. Columns: Recipient (Role + Name), Channel (Push/SMS/In-App), Event Type, Message Preview, Sent At, Delivery Status (Delivered/Failed). Filterable by channel, role, date range.
- **Broadcast Compose Form:** Target audience selector (All Users / All Merchants / All Riders / All — Any combination). Message title + body text input. Schedule option: Send Now or Schedule for specific datetime. Preview how message appears on mobile before sending.
- **Alert Configuration Table:** Per-event toggle list:
  - Remittance Deadline (24h Warning) → Rider Push + SMS
  - Remittance Overdue → Rider Push + SMS
  - Failed Delivery Alert → Admin In-App
  - No Rider Found (3-min timeout) → Admin In-App
  - New KYC Pending (User/Merchant/Rider) → Admin Push
  - Wallet Low Balance → Rider Push
  - System Registration (Welcome) → User/Merchant/Rider SMS → auto
- **Resend Failed Notification:** Any failed notification can be resent individually or in bulk.
- **Notification Stats:** Cards showing: Notifications Sent Today, SMS Sent This Month, Push Delivered Rate (%), Failed Count.

---

### 2.8 Fraud & Risk Logs

**Feature:** Fraud investigation tools and risk management log system.

**Functionality:**
- **Fraud Dashboard Cards:** Open Investigations, Blacklisted Accounts, Flagged Transactions This Month, Repeat Offenders.
- **Flagged Transaction Log:** Auto-flagged by system rules (e.g., order placed with no GPS, multiple orders cancelled in one day, unusually large order amount for a new user). Table: Account, Flag Reason, Order/Transaction Reference, Date, Status (Review Pending / Investigated / Cleared / Escalated).
- **Non-Responsive Rider Log:** Riders who failed to respond to order pings within the 3-minute window. Shows pattern: how many times, which time slots, reason if provided. Repeat offenders highlighted.
- **Late Remittance Auto-Deduct Log:** Full record of every automatic deduction applied: Account, Amount Deducted, Due Date, Deduction Date, New Balance After Deduction.
- **Cancel Pattern Detection:** Accounts with 3+ cancellations in 7 days get auto-flagged. Log shows pattern timeline. Admin can clear or escalate.
- **Investigation Case Create:** Button on any flagged log row → opens "New Investigation Case" form. Auto-populates with the flagged event data. Assign to an admin. Set priority.
- **Case Tracker:** Kanban-style board or table view of all cases: Open / Under Review / Resolved. Each case card shows: case ID, subject, assigned to, last update, priority badge.
- **Blacklist from Investigation:** One-click "Blacklist Account" from open case. Creates permanent ban + closes case as "Resolved — Action Taken".
- **Export:** All fraud logs exportable as CSV or PDF with full audit trail.

---

### 2.9 Messaging System (Admin Chat)

**Feature:** Admin-to-all-roles direct communication for top-up, support, and compliance.

**Functionality:**
- **Chat Inbox List:** Left panel lists all chat threads. Tabs: Riders / Users / Merchants. Shows: Name, last message preview, unread count badge, time of last message. Sorted by most recent activity.
- **Thread View:** Right panel shows message thread. Messages aligned: admin messages right (orange background), other party messages left (grey background). Timestamps on each message.
- **Message Input:** Rich text-capable input. Can send: plain text, images (embed preview), file attachments (PDF/JPG/PNG). Send on Enter or click send button.
- **GCash Screenshot Flow:**
  1. Rider/User sends top-up request message with GCash screenshot attachment
  2. Screenshot auto-displayed as full inline image in thread (tappable to expand)
  3. Admin reviews image, sees GCash reference number and amount
  4. Admin clicks "Confirm Top-Up" button (appears in thread context). Enter amount field.
  5. System calls wallet credit API → balance updated in real time
  6. Auto-reply inserted in thread: "₱[amount] has been credited to your RAPEX Wallet. New balance: ₱[balance]"
  7. Thread message marked with ✅ VERIFIED badge
- **Quick Reply Templates:** Dropdown of pre-saved canned responses: "Your top-up has been received and is being processed", "Your KYC has been approved", "This account has been flagged for review", etc. Editable templates.
- **Message Search:** Keyword search across all threads. Highlights matching messages.
- **Thread Archive:** Mark threads as archived (removed from inbox but preserved). All threads stored permanently for audit.
- **Unread Badge:** Tab-level and sidebar-level unread indicators update in real time via WebSocket.

---

### 2.10 System Settings (Admin Level)

**Feature:** Operational configuration within SuperAdmin-defined boundaries.

**Functionality:**
- **Rider Search Radius:** Number input. Immediate effect. Shows current active value. Change logs to `AdminSettingsChangeLog`.
- **Markup Config (Admin-Level Override):** Admin can set store-type-specific markup tiers within SuperAdmin's global limits. E.g., Fresh Market markups can differ from Shop markups.
- **Weekly Incentive Settings:** Editable: delivery threshold (default 40), bonus amount (default ₱250). Shows current active values and next Monday's cycle start.
- **Sub-Role Management:** Create custom admin sub-roles (e.g., "Night Shift Support"). Define permission set with the same permission matrix as SuperAdmin's admin management panel.
- **KYC Auto-Approval Rules:** Toggle which document types pass auto-approval. E.g., "PhilSys ID: Auto-Approve", "Barangay Clearance: Manual Review Required". Rule changes logged.
- **System Announcement Banner:** Input: message text, background color (orange/purple/red), display duration (hours). Banner appears at top of ALL user/merchant/rider web and mobile dashboards.
- **App Version Control:** Enter minimum required version for Android mobile app. Users on older versions see a "Required Update" modal on launch.
- **Maintenance Mode (Module-Level):** Toggle per individual module: "Pre-Loved module under maintenance" — hides the Pre-Loved tab from user app without affecting other modules.

---

---

## 3. MERCHANT ROLE

> **URL:** `merchant.rapex.ph` (web) + React Native mobile app · Android-first  
> **Login:** Separate Merchant login page  
> **Store Types:** A merchant runs up to 4 stores simultaneously — each with its own sidebar section.

---

### 3.1 Merchant Registration & KYC

**Feature:** Merchant account creation with full business identity verification.

**Functionality:**
- **Step 1 — Personal Info:** Full name, birthday (date picker), home address (with Google Places autocomplete for street, barangay, municipality auto-fill), mobile number.
- **Step 2 — Business Info:** Business name, select store type(s) (multi-select: Shop / Fresh Market / Ready-to-Eat / Pre-Loved), operating hours per day (time range picker per weekday, individual enable/disable per day), business address (separate from home address, Google Maps pin).
- **Step 3 — Legal Documents:** Upload DTI Certificate or Mayor's Permit or any valid business registration. File picker restricted to JPG/PNG/PDF. Max 5MB per file.
- **Step 4 — KYC Selfie:** Camera opens automatically (no gallery option). Instruction overlay: "Hold your valid ID up to your face clearly". Capture button. Preview with retake option. Upload triggers background EXIF metadata strip (anti-tampering).
- **Step 5 — OTP:** 6-digit OTP sent via Semaphore SMS to registered mobile. 5-minute expiry. Resend available after 60 seconds.
- **Submission:** All data sent to `MerchantKYCSubmission` table with `status=PENDING`. Admin notified via push. Merchant sees "Under Review" screen with estimated review time.
- **Auto-Approval:** Background Celery task checks if all required fields present and document file is a valid image/PDF. If checks pass → auto-approve. If any check fails → queue for manual review.
- **Rejection Flow:** Admin sets rejection reason → pushed to merchant as notification + displayed on their login screen with resubmit option.

---

### 3.2 Merchant Dashboard (Unified)

**Feature:** Single dashboard home screen showing combined performance across all active stores.

**Functionality:**
- **Top Stat Row:**
  - *Total Revenue Today* (all stores combined) — Apex card with peso value + trend vs. yesterday
  - *Active Orders* — real-time count via WebSocket, with store-type breakdown on hover
  - *Pending Orders* — red badge count, click navigates to order inbox
  - *Commission Paid Today* — transparent breakdown of RAPEX deductions
- **Store Status Toggle Bar:** One toggle per active store type. Orange toggle = Open, grey = Closed. Merchant can flip any store open/closed from the dashboard header. Change broadcasts to user app within 5 seconds.
- **Revenue Breakdown Chart:** Apex bar/area chart. Toggle between: All Stores Combined / Shop Only / Fresh Market Only / Ready-to-Eat Only / Pre-Loved Only. X-axis: last 14 days.
- **Best-Selling Products Widget:** Top 5 products across all stores with name, store type icon, units sold today, revenue contribution.
- **Recent Orders Feed:** Auto-refresh table of last 10 orders. Accept/Reject buttons inline for Pending orders. Timer countdown shows seconds remaining to accept.
- **Order Countdown Alerts:** When a new order arrives, an audio chime plays (configurable on/off), a floating notification appears (bottom-right, Apex toast style), and the Pending Orders badge increments.

---

### 3.3 Shop — Product Management (General Merchandise)

**Feature:** Full product catalog management for the general merchandise store.

**Functionality:**
- **Product List View:** Apex-style data table. Columns: Product Photo (thumbnail), Name, Category, Base Price, Markup %, Final Price, Stock Status, Available (toggle), Actions. Sortable. Searchable.
- **Add Product Form:**
  - Name (text, max 100 chars)
  - Description (multi-line text, max 500 chars)
  - Category (dropdown — merchant creates categories or selects from existing)
  - Base Price (number input with ₱ prefix. Min ₱1)
  - Auto-Markup Preview: As merchant types base price, system instantly shows markup % and final selling price in orange below the field
  - Images: Drag-and-drop multi-image uploader. Min 1, max 6 images. Accepts JPG/PNG. Max 2MB each. First image = primary/thumbnail.
  - Inventory Toggle: "Enable Stock Tracking" checkbox. If enabled: Stock Quantity field appears. Shows "Out of Stock" badge to users when 0 reached.
  - Stock Quantity (optional): number input
  - Availability: Toggle (Available / Unavailable). Unavailable items still visible in merchant list but hidden from user app.
- **Edit Product:** Same form, pre-populated. Base price change auto-recalculates markup.
- **Bulk Status Update:** Select multiple products via checkboxes → "Set Available" or "Set Unavailable" bulk action.
- **Product Categories:** Sidebar panel to create/rename/delete categories. Used as tabs in the user's shopping view.
- **Promo/Discount per Product:** Toggle "On Promo" → enter original price (shown with strikethrough) and discounted price. Promo badge shown on product card in user app.

---

### 3.4 Fresh Market — Product Management (Raw Produce)

**Feature:** Product catalog for wet market / raw produce store.

**Functionality:**
- **Same table structure as Shop** — with additional columns: Pricing Mode, Freshness Status
- **Add/Edit Product:**
  - Name (e.g., "Pechay Tagalog", "Bangus - Medium", "Itlog ng Manok")
  - Product Type tag: Vegetables / Fruits / Raw Meat / Live/Fresh Seafood / Eggs / Dairy / Condiments / Others
  - Pricing Mode: Per Piece / Per Kilo / Per 100g / Per Pack / Per Bundle (dropdown)
  - Base Price: unit price based on selected pricing mode (auto-labeled: "₱__ / kilo", "₱__ / piece", etc.)
  - Markup auto-calculated same as other store types
  - Freshness Status: Toggle — "Fresh Today" / "Limited Stock" / "Out of Stock"
  - Daily Reset Option: Checkbox "Auto-reset to 'Out of Stock' at midnight each day" — designed for perishables
  - Images: Same multi-image uploader
  - Notes field: Optional merchant notes shown on product detail (e.g., "Best before noon", "Caught this morning")
- **Order Notes from Buyers:** When viewing Fresh Market orders, buyer's custom notes (e.g., "Sukli lang 1/2 kilo ng tilapia") shown prominently in a yellow highlighted box in the order detail.

---

### 3.5 Ready-to-Eat Food — Menu Management (Cooked Food)

**Feature:** Menu management for karinderya, home cooks, or food stall merchants.

**Functionality:**
- **Menu Item Add/Edit Form:**
  - Item Name (e.g., "Adobong Manok + Rice")
  - Description (e.g., "Homemade chicken adobo with steamed white rice")
  - Category: Viands / Soups / Rice Meals / Snacks / Beverages / Desserts / Combo Meals / Others
  - Serving Sizes: Dynamic rows — merchant can add multiple sizes (Solo ₱55, Bilhan ₱90, Family ₱200). Each size is a separate orderable variant.
  - Add-Ons: Optional add-on items per menu item. E.g., "Extra Rice +₱15", "Extra Sauce +₱5". Add-ons shown at checkout for buyer to select.
  - Image Upload: same multi-image uploader
  - Sold Out Toggle: Instantly marks item as unavailable mid-day
  - Markup auto-applied: shown as "Base Price → Final Price" preview
- **Store Hours for Food:** Per-day time picker. Outside these hours, the entire Ready-to-Eat store is automatically hidden from the user app's food tab. Visual indicator shows "Your store is currently closed" when merchant logs in outside hours.
- **Preparation Time Estimate:** Global setting (applies to all items in the store) + per-item override. Dropdown: 10 min / 15 min / 20 min / 30 min / 45 min / 1 hour. Shown to buyer on order confirmation screen as "Estimated ready in X minutes."
- **Special Instructions Visibility:** Buyer notes (e.g., "walang sili", "extra sauce") displayed prominently in a highlighted box in the order detail view.
- **Daily Revenue Summary:** Bottom of menu management page — table showing each menu item with: Units Sold Today, Revenue Today. Reset at midnight.

---

### 3.6 Pre-Loved Shop — Listings Management (Second-Hand)

**Feature:** Second-hand / pre-loved item listing management.

**Functionality:**
- **Listing Add/Edit Form:**
  - Title (e.g., "Adidas Ultraboost — Size 9 — Like New")
  - Description (detailed condition notes, any defects, original price, reason for selling)
  - Category: Clothing / Shoes / Bags / Gadgets / Appliances / Books / Collectibles / Furniture / Sports / Others
  - Condition Rating: Dropdown — New (never used) / Like New (used once or twice) / Good (used, minor wear) / Fair (visible wear, fully functional) / For Parts (damaged/non-functional)
  - Asking Price (₱ number input). Markup applied same as other types.
  - Price Negotiable Toggle: If enabled, "NEGO" badge shown on listing in user app. Buyers see a note "Seller is open to price negotiation."
  - Multi-Image Upload: Up to 8 images. First image = main photo. Encourage multiple angles + condition shots.
  - Availability: Available / Reserved / Sold
  - Delivery Available Toggle: If enabled, item can be ordered for delivery. If disabled, self-pickup only.
- **Listings Status Management:** From the list view, merchant can bulk-mark items as Sold, change condition, or archive.
- **Sold History:** Separate tab showing all completed Pre-Loved sales. Columns: Item, Buyer Note (if any), Final Price, Date Sold, Delivery or Pickup.

---

### 3.7 Unified Order Management

**Feature:** Central inbox for all incoming orders across all active store types.

**Functionality:**
- **Order Inbox:** Top navigation tabs: All / Shop / Fresh Market / Ready-to-Eat / Pre-Loved. Each tab shows order count badge. Default: All tab selected.
- **Order Cards:** Each order displayed as a card (or row in table view — toggle). Card shows: Order ID, Store Type icon, Items Summary (e.g., "3 items — Pork Adobo, Rice x2, Coke"), Total Amount, Delivery or Pickup label, Time Received, Status badge, Time Remaining (countdown from 3 minutes for Pending orders).
- **Order Detail Modal:** Full item breakdown table (item name, qty, unit price, subtotal), Delivery type (Delivery / Pickup), Delivery address (for delivery orders), Order special notes, Pre-estimated fare, Order total. For Food orders: shows preparation time estimate.
- **Accept Flow:** Click "Accept" → status changes to `PREPARING` for Shop/Pre-Loved/Fresh Market, or `COOKING` for Ready-to-Eat → push notification sent to customer confirming order acceptance.
- **Reject Flow:** Click "Reject" → required: select rejection reason from dropdown (Out of Stock / Store Closing / Cannot Fulfill / Other) + optional custom message. Customer notified immediately with reason. Order marked `CANCELLED`.
- **3-Minute Countdown:** Visual countdown timer per Pending order. When timer hits 0: auto-reject, customer notified, order marked `TIMEOUT_CANCELLED`. No action required from merchant on auto-timeout.
- **Status Progression per Store Type:**
  - Shop / Pre-Loved / Fresh Market: `PENDING` → `PREPARING` → `FOR_PICKUP` (Rider Assigned) → `COMPLETED`
  - Ready-to-Eat: `PENDING` → `COOKING` → `READY_FOR_PICKUP` (Rider Assigned) → `DELIVERED`
- **"Picked Up" Confirmation:** When rider arrives and physically takes the order, merchant taps "Rider Has Picked Up" button. This advances the order to `IN_TRANSIT` and activates the live GPS tracking screen for the customer. This step cannot be skipped.
- **Rider Info During Fulfillment:** After rider is assigned, merchant sees: Rider Name, Vehicle Type, Vehicle Plate, RAPEX Wallet Balance (to confirm rider can make payment).

---

### 3.8 Sales Reports & Analytics (Merchant)

**Feature:** Merchant-level business analytics across all active stores.

**Functionality:**
- **Revenue Cards:** Today / This Week / This Month revenue per store type. Each card with trend indicator.
- **Revenue Chart:** Apex area chart. Store type filter dropdown. Date range picker.
- **Top-Selling Products:** Table per store type — Product Name, Units Sold, Revenue, % of Total Revenue. Sortable.
- **Commission Breakdown:** Table per order showing: Order ID, Gross Order Total, Markup Amount, Admin Commission Deducted, Net to Merchant. Transparent financial record.
- **Order Volume Chart:** Bar chart — orders per day for selected period. X-axis: days, Y-axis: order count.
- **Geographic Summary:** Table of orders by customer barangay — how far customers are ordering from.
- **Period Comparison:** Toggle to compare current period vs. previous period side by side.
- **CSV Export:** Full transaction history downloadable. Date range filter before export.

---

### 3.9 Messaging — Chat with Admin

**Feature:** Direct communication channel with RAPEX Admin for support.

**Functionality:**
- **Chat Interface:** Same chat UI style as Admin's — merchant messages on right, admin messages on left. Merchant cannot initiate with any other role.
- **Message Types Supported:** Text, Image (JPG/PNG), File (PDF for documents like permits, reports).
- **Common Use Cases:** KYC resubmission queries, compliance clarification, promotional requests, technical support, product policy questions.
- **Notifications:** In-app notification bell badge + push notification when admin replies. Sound alert on new message arrival.
- **Chat History:** All messages persist indefinitely. Merchant can scroll back to all past conversations.
- No direct chat with customers or riders. All buyer concerns routed through admin.

---

### 3.10 Store Settings (Per Store Type)

**Feature:** Individual store configuration for each activated store type.

**Functionality:**
- **Accessed from Sidebar:** "Shop Settings", "Fresh Market Settings", etc. appear as separate sidebar items for each active store.
- **Store Profile:** Display name, short description (max 200 chars, shown on store page in user app), store logo (square, max 1MB), banner image (1200×400px recommended).
- **Operating Hours:** Per-day time range pickers. Toggle individual days off (e.g., no Sunday). Outside set hours, store is auto-hidden from the user app.
- **Manual Open/Close Toggle:** Override the schedule — instantly open or close the store regardless of schedule. "Closed" stores show a "Store is temporarily closed" message in the user app.
- **Store Visibility Toggle:** Fully hide the store (does not appear in search or browse at all). Different from "Closed" — Closed stores are visible but non-orderable; Hidden stores are invisible.
- **Store Tags:** Multi-select from predefined tags + custom tags. Tags appear in search indexing. Examples: "Halal", "Homemade", "Organic", "Open 24h", "Accepts Senior Discount".
- **Delivery Settings:** Toggle whether the store accepts delivery orders, pickup orders, or both.

---

### 3.11 Notifications (Merchant)

**Feature:** Order alerts and platform communications.

**Functionality:**
- **New Order Alert:** Sound chime (configurable on/off) + push notification (FCM) + in-app toast notification. Title: "New Order! Tap to review." Opens order detail immediately on tap.
- **3-Minute Countdown Alert:** At 1 minute remaining, a secondary push alert fires: "Order #[ID] expires in 60 seconds!"
- **Rider Assigned Alert:** "A rider has been assigned to your order. Prepare for pickup."
- **Delivery Completed:** "Your order to [Customer Area] has been successfully delivered."
- **Admin Message:** Badge update on in-app chat icon + push notification on new admin message.
- **Store Broadcast from Admin:** Platform-wide or merchant-targeted messages from admin (e.g., "New commission rate effective next Monday") shown as a banner + push.
- **Notification Center:** Bell icon in Apex topbar. Dropdown shows last 20 notifications. Mark all read button.

---

### 3.12 Security & Login (Merchant)

**Functionality:**
- OTP-based login: enter mobile number → receive SMS OTP → enter OTP → authenticated
- Alternative: Email + password login with OTP on new device
- Forgot Password: OTP-verified reset flow
- Single device session: Logging in on Device B immediately revokes Device A's session. Device A sees "You have been logged out from another device."
- Session expiry: JWT access token refresh every 15 minutes. Refresh token valid 7 days.
- Account lock: 5 failed OTP/password attempts → 30-minute lockout

---

---

## 4. RIDER ROLE

> **URL:** `rider.rapex.ph` (web) + React Native mobile app · Android-first

---

### 4.1 Rider Registration & KYC

**Feature:** Rider account creation and identity verification.

**Functionality:**
- **Step 1 — Personal Info:** Full Name, Age, Birthday, Home Address (Google Places autocomplete), Contact Number, Emergency Contact (name + number)
- **Step 2 — Vehicle Info:** Vehicle Type selection (Bicycle / Motorcycle / 4-Wheels), vehicle plate number (for Motorcycle and 4-Wheels), vehicle model/description
- **Step 3 — Valid ID:** Camera-only capture. Accepts: any Philippine government-issued ID. Instruction overlay: "Place your ID on a flat surface." Preview + retake.
- **Step 4 — Live Selfie with ID:** Camera opens automatically. Instruction: "Hold your valid ID clearly next to your face." Anti-spoofing: camera must be live (no static photo). Preview + retake.
- **Step 5 — OTP:** Same OTP flow as merchant. Mobile number verified.
- **Admin Approval:** Registration sent to admin KYC queue. Rider sees "Application Submitted — Under Review" screen. Timeline: typical 24-hour review SLA.
- **On Approval:** Admin triggers ₱500 initial wallet credit. Rider receives push notification: "Your application has been approved! Your RAPEX Wallet has been loaded with ₱500. You can start accepting orders."
- **Rejection:** Rider notified with specific reason. Resubmit available from login screen.

---

### 4.2 Rider Home Screen / Dashboard

**Feature:** Primary screen when rider opens app — all key operational data visible.

**Functionality:**
- **Online/Offline Toggle:** Large, prominent toggle at the top. When Offline, rider does not receive order pings. When Online, rider is included in the auto-ping pool for nearby orders. Status synced to server immediately on toggle.
- **Wallet Balance Card:** Large orange card showing current RAPEX Wallet balance prominently. Tappable to go to wallet detail.
- **Today's Earnings:** Total delivery earnings credited today (gross, before commission deduction).
- **Weekly Delivery Count + Progress Bar:** "X of 40 deliveries" with a progress bar toward the ₱250 incentive. Color changes: grey (0–29), yellow (30–39), green (40+, incentive achieved).
- **Active Delivery Card:** When on a delivery — shows current order: merchant name, customer drop-off address, order total, a "View Map" button and delivery status. This card is persistent until delivery is confirmed.
- **Recent Deliveries:** Scrollable list of last 5 completed deliveries with: order ID, location, earnings, date/time.
- **Top Navigation:** Wallet icon (quick access), notification bell with badge, settings gear.

---

### 4.3 Order Acceptance

**Feature:** Real-time order ping and acceptance/rejection workflow.

**Functionality:**
- **Incoming Order Alert:** System checks: Is rider Online? Is rider's wallet ≥ order total? Is rider within 2 km of merchant? If all yes → push notification fires + full-screen order card appears (overrides whatever screen rider is on).
- **Order Card Content:**
  - Merchant Name and Store Type icon
  - Pickup Address (merchant)
  - Drop-off Address (customer — barangay/street, not full personal address at this stage)
  - Delivery distance (km)
  - Estimated delivery time
  - Order Total (what rider will pay the merchant for COD)
  - Delivery Fee (what rider earns)
  - Required minimum wallet balance (auto-calculated and shown)
- **Accept:** Slide-to-accept gesture (iOS-style slider or tap-to-confirm button). On accept: order status updates to `RIDER_ASSIGNED`. Merchant notified. Customer notified. Rider navigated to pickup map.
- **Reject / Ignore:** If rider rejects or 3-minute timer expires, rider is removed from ping for this order. System pings next nearest rider. Rider marked as "declined" for this order (tracked for performance analytics, not penalized unless pattern becomes excessive).
- **Wallet Check:** If rider wallet balance is lower than order total, the Accept button is disabled with a tooltip: "Wallet balance insufficient for this order. Top up to accept." Rider must request top-up before they can accept.
- **Only One Active Delivery:** Rider cannot accept a new order while one is in progress.

---

### 4.4 Live Delivery Map

**Feature:** Real-time GPS-guided delivery navigation.

**Functionality:**
- **Map Screen Auto-Opens on Accept:** Google Maps SDK renders full-screen within the app. Cannot be dismissed until delivery is complete.
- **Two-Step Navigation:**
  - Phase 1: Rider → Merchant (Pickup Route). Merchant pin shown. Directions API provides turn-by-turn route. Distance and ETA displayed at bottom.
  - Phase 2 (after "Picked Up" confirmed): Rider → Customer (Delivery Route). Customer pin shown. New directions loaded.
- **Real-Time Rider Location Broadcast:** Every 5 seconds, rider's GPS coordinates pushed to Django Channels WebSocket server. Customer app receives updates and moves rider icon on their map. Admin and merchant can also track position.
- **GPS Must Stay Active:** If rider turns off location during active delivery, full-screen modal appears: "Location Required — Re-enable GPS to continue." Order cannot progress until GPS is re-enabled. Customer notified of delay.
- **Delivery Confirmation:** At drop-off location (system validates rider is within 50 meters of customer address via geofence), "Confirm Delivery" button activates. Rider taps. Order marked `DELIVERED`. Commission auto-deducted from wallet. Customer notified. Loyalty points auto-credited to customer.
- **Delivery Map Auto-Close:** Map and tracking session end immediately after delivery confirmed.

---

### 4.5 RAPEX Wallet (Rider)

**Feature:** The rider's core financial instrument for the platform.

**Functionality:**
- **Balance View:** Current balance shown on home screen and in Wallet detail page. Blue card (or orange, per design). Balance updates in real time after every transaction.
- **Transaction Ledger:** Full chronological list of every wallet event: Type (Initial Load / Top-Up / Payment to Merchant / Commission Deduction / Penalty / Incentive Bonus / Referral Credit), Amount (green for credits, red for debits), Balance After transaction, Timestamp, Reference note.
- **COD Payment Flow:** Rider pays merchant from wallet at pickup. Merchant confirms "Picked Up" → system records `WalletTransaction(type=PAYMENT_TO_MERCHANT, amount=order_total)`. Wallet debited instantly.
- **Commission Deduction:** After "Confirm Delivery" → system auto-calculates commission based on order value bracket → creates `WalletTransaction(type=COMMISSION_DEDUCTION)`. Transparent: rider can see commission amount in transaction log.
- **Top-Up Request Flow:**
  1. Rider opens chat with Admin from wallet screen or home screen
  2. Types top-up request: "Pa-load po ng ₱500" and uploads GCash screenshot (pay to RAPEX GCash number shown in chat)
  3. Admin verifies screenshot → clicks "Confirm Top-Up" → rider wallet credited in real time
  4. Auto-message in thread: "₱500 has been loaded to your wallet. New balance: ₱[X]"
- **Low Balance Alert:** When balance falls below ₱100, push alert fires: "Your RAPEX Wallet is below ₱100. Load up to continue accepting orders."
- **Auto-Penalty on Top-Up:** If rider has overdue remittance: when admin processes a top-up, system checks for outstanding remittance → auto-deducts overdue amount from the top-up before crediting remainder. E.g., top-up of ₱500 but ₱200 overdue → ₱200 deducted, ₱300 credited. Rider notified of the split in the chat message.
- **Incentive Credit:** On Monday morning: Celery task checks each rider's delivery count for prior week. Those who hit 40+ → ₱250 credited. Transaction type: `INCENTIVE_BONUS`. Admin gets a report of incentives paid.

---

### 4.6 Transaction History & Logs

**Feature:** Complete record of all financial activity.

**Functionality:**
- **Filter Controls:** Date range picker, transaction type dropdown (All / Top-Up / Delivery Payment / Commission / Penalty / Incentive / Referral), amount range input.
- **Summary Row:** Below filters, shows: Total Credits in Period, Total Debits in Period, Net Change.
- **Per-Row Detail:** Transaction type badge, amount, balance snapshot, order reference (linked — click to see order detail), timestamp, notes.
- **Remittance Status Column:** For commission deduction rows, shows corresponding remittance status: On Time / Overdue / Waived.
- **Export:** Rider can download their own transaction history as CSV (for personal tax records etc.).

---

### 4.7 Remittance Tracking

**Feature:** Clear, transparent record of revenue owed to RAPEX Admin.

**Functionality:**
- **Outstanding Balance Card:** Always visible on the remittance page. Bold display: total amount currently owed to RAPEX Admin.
- **Due Date Display:** Next remittance due date shown. At 24h before due: status badge changes from green to yellow. At overdue: changes to red with pulsing animation.
- **Auto-Alert Timeline:**
  - 72 hours before due: In-app notification reminder
  - 24 hours before due: Push notification + SMS: "Remittance due in 24 hours. Current outstanding: ₱[amount]. Please load your RAPEX Wallet to pay."
  - At due date: Status = OVERDUE. Push + SMS: "Remittance overdue. Amount will be deducted from your next top-up."
  - After top-up: Auto-deducted as described in wallet section
- **Remittance History Table:** All past remittances — date, amount, payment method (Wallet Auto-Deduct / Manual Admin Mark), status (Paid/Overdue).
- **Transparency Note:** System clearly explains: "Your total commission owed is calculated from [X] deliveries this period. ₱[Y] per delivery unit."

---

### 4.8 Chat with Admin

**Feature:** In-app direct message channel for top-up, support, and account queries.

**Functionality:**
- Same chat UI as described in Admin Messaging section from rider's perspective
- Rider can: send text, send images (for GCash screenshot), send files
- Rider cannot initiate chats with merchants, customers, or other riders
- Chat button accessible from: home screen nav, wallet screen (top-up shortcut), profile page
- Notification badge shows unread count on chat icon

---

### 4.9 Referral System

**Feature:** QR code-based rider referral for earning points.

**Functionality:**
- **Referral QR Code:** Generated on account approval. Accessible from Profile → Referral section. Displayed as a scannable QR code + a shareable link.
- **Share:** Share QR code image via messaging apps (WhatsApp, Messenger, Viber, etc.) directly from app.
- **Earning:** When a new rider uses this QR code during registration and gets approved: 2 points automatically credited to referrer's wallet. Push notification: "Your referral [Name] has been approved! You earned 2 referral points."
- **Monthly Cap:** System tracks monthly credit count. When cap (100 pts) reached, referral credits suspended until next month. Notification sent: "You've reached this month's referral point limit."
- **Referral History:** Table — Referred Rider Name, Date of Registration, Date of Approval, Status (Pending Approval / Credited / Cap Reached), Points Earned.
- **Points Usage:** Referral points go into RAPEX Wallet as cash-equivalent value (2 pts = ₱2).

---

### 4.10 Push Notifications (Rider)

All push events delivered via FCM to the rider's registered device:

| Event | Trigger | Channel |
|---|---|---|
| New Order Available | System pings within 2km radius | Push + Sound |
| Wallet Low Balance | Balance drops below ₱100 | Push |
| Top-Up Confirmed | Admin credits wallet | Push + In-App |
| Remittance Due 72h | 72h warning | In-App |
| Remittance Due 24h | 24h warning | Push + SMS |
| Remittance Overdue | Past due date | Push + SMS |
| Incentive Credited | Weekly 40-delivery bonus | Push + In-App |
| Referral Points Credited | New referred rider approved | Push |
| Admin Broadcast | Admin sends platform announcement | Push |
| Account Approved | KYC approved by admin | Push + SMS |
| Account Suspended | Account action taken | Push + SMS |

---

### 4.11 Security (Rider)

**Functionality:**
- Camera-only KYC (no gallery): `INPUT[capture=camera]` on all selfie upload fields
- Mandatory GPS: App checks `Geolocation.getCurrentPosition()` on launch. If denied, full-screen blocking modal: "GPS is required to use RAPEX Rider. Enable location to continue."
- Single device session enforcement: JWT contains device fingerprint (hash of device ID + user agent). Login from new device invalidates all previous tokens.
- Background check flag: Admin-set flag. Rider sees no visible change; admin sees warning badge.
- Account lock on repeated failures: 5 failed OTP attempts → 30-minute lockout + admin notified

---

---

## 5. USER / CUSTOMER ROLE

> **URL:** `app.rapex.ph` (web) + React Native mobile app · Android-first  
> **UI:** 4-tab bottom navigation + Apex-styled header and profile sections

---

### 5.1 User Registration & KYC

**Feature:** New customer account creation with identity verification.

**Functionality:**
- **Step 1 — Personal Info:** Full Name, Age, Birthday (date picker), Home Address (Google Places autocomplete — street, barangay, municipality auto-fill), Mobile Number.
- **Step 2 — Valid ID:** Select ID Type from dropdown (PhilSys / Passport / Driver's License / SSS / GSIS / PhilHealth / Voter's ID / UMID / Postal ID / Barangay ID). Camera-only capture. Preview + retake. ID type label saved alongside photo.
- **Step 3 — Live Selfie:** Camera opens holding both ID and face. Same flow as Merchant/Rider. Anti-spoofing.
- **Step 4 — OTP:** 6-digit OTP to mobile. 5-min expiry. Resend with 60-second cooldown.
- **Post-Registration:**
  - Account created with `status=PENDING_KYC`
  - Admin reviews and approves (or auto-approved if basic checks pass)
  - On approval: Push + SMS: "Welcome to RAPEX! Your account is verified. Start shopping now!"
  - Unique referral QR code generated on approval

---

### 5.2 Home Screen — 4-Tab Shopping Navigation

**Feature:** The primary user experience — 4 independent shopping platforms in one app.

**Functionality:**
- **Bottom Tab Bar (React Native):** 4 tabs with icons and labels:
  - 🛒 Shop (General Merchandise)
  - 🥦 Fresh Market (Raw Produce)
  - 🍱 Ready-to-Eat (Cooked Food)
  - ♻️ Pre-Loved (Second-Hand)
- **Tab State Independence:** Each tab maintains its own scroll position, search query, filters, and browsing state. Switching tabs does not reset the other tabs.
- **GPS on Launch:** On first open after login, app requests GPS permission. If denied: nudge modal explaining why location is needed. If still denied: shows "Enable location to see nearby merchants" placeholder on each tab.
- **Tab Home Layout (per tab):**
  - Search bar at top (tab-specific search)
  - Category filter chips (horizontal scroll) — categories specific to each store type
  - "Open Now" toggle filter
  - Merchant cards in vertical scrollable list or 2-column grid
  - Each merchant card: store banner/logo, store name, store type icon, distance from user, open/closed badge, count of products, estimated delivery time

---

### 5.3 Location-Based Merchant Discovery

**Feature:** Show only merchants near the user's current location.

**Functionality:**
- **Radius:** 2 km from user's GPS coordinates. Calculated using Haversine formula on the server. Query: `WHERE ST_Distance(merchant.location, user.location) <= 2000` (PostGIS or manual lat/lng formula).
- **Location Fallback:** If user denies GPS, fallback to last known location (stored in `UserLocation` model). If none, show empty state with enable-location CTA.
- **Distance Calculation:** Displayed on merchant card as "0.8 km away", "1.4 km away". Sorted by default: nearest first.
- **Category Filters per Tab:**
  - Shop: All / Grocery / Hardware / Clothing / Health & Pharmacy / Electronics / Others
  - Fresh Market: All / Vegetables / Fruits / Meat & Poultry / Seafood / Eggs & Dairy / Condiments
  - Ready-to-Eat: All / Rice Meals / Viand / Soups / Snacks & Desserts / Beverages / Combo
  - Pre-Loved: All / Clothes / Shoes & Bags / Gadgets / Appliances / Books / Collectibles
- **Open/Closed Filter:** "Show Open Only" toggle. Closed stores can still be seen (greyed out with "Closed" banner) unless toggle is on.
- **Store Search:** Search by store name within the current tab. Searches within the 2 km radius.

---

### 5.4 Product Browsing, Filtering & Search

**Feature:** Finding and exploring products within merchant stores.

**Functionality:**
- **Merchant Store Page:** Opens when a merchant card is tapped. Shows: store banner, store name, store description, operating hours, distance, Open/Closed status, delivery time estimate.
- **Products Displayed:** Category tabs within the store. Same product grid/list layout. Product card: thumbnail image, product name, final price (markup already applied), "Add to Cart" button, Out of Stock indicator.
- **Product Detail Page:** Tapping product opens detail. Shows: product images (swipeable gallery), name, full description, final price (with "base price ₱X before markup" shown for transparency), stock status, "Add to Cart" button, quantity selector.
- **Cross-Store Product Search:** Search bar in each tab header searches products across all nearby stores in that store type. Returns product cards with the merchant name subtitle.
- **Filters (within store or cross-store):**
  - Price Range: Min–Max slider
  - Sort By: Newest / Price Low to High / Price High to Low / Most Popular
  - Category: Filter chips
- **Add to Cart:** Cart is per-store (user cannot mix products from different stores in one order). If user tries to add from a different store while cart has items: modal warning "Your cart has items from [Store A]. Starting a new cart will clear your current items. Continue?"

---

### 5.5 Cart & Checkout System

**Feature:** Order review, configuration, and placement system.

**Functionality:**
- **Cart Page:** List of cart items — thumbnail, name, quantity selector (+/- buttons), unit price, line total. Remove item button (swipe left or ✕ button). Order subtotal at bottom.
- **Checkout Step 1 — Delivery Method:**
  - Delivery (address auto-filled from GPS + editable) or Self-Pickup (no delivery fee)
  - If Delivery: Vehicle selector
    - Bicycle (₱30 base) — shown with a bicycle icon
    - Motorcycle (₱40 base) — with motorcycle icon
    - 4-Wheels (₱80 base) — with car icon
  - Vehicle availability may be restricted by merchant (e.g., Fresh Market orders may require Motorcycle+)
- **Checkout Step 2 — Speed & Fare:**
  - Standard (+₱10, 10–15 min) or Saver (min fare, 15–25 min) selection
  - Distance auto-calculated: `fare = base_fare + speed_addon + (extra_km * 6)`
  - Fare breakdown shown with each component labeled (Base Fare / Speed Fee / Distance Surcharge)
  - Estimated total: Cart Subtotal + Delivery Fee = Order Total
- **Checkout Step 3 — Review & Wallet:**
  - Full order summary: each item, each fee
  - Wallet Balance shown: green if sufficient, red if insufficient
  - Points Balance shown: "You have X points (₱X value). Use points?" toggle
  - If order total > ₱1,001 and user wallet balance is insufficient: "Wallet Top-Up Required" modal appears. Cannot proceed until wallet balance meets or exceeds the order total.
  - If points toggle enabled: points discount applied, new total shown.
- **Place Order:** Button confirms. Creates `Order` record with status `PENDING_MERCHANT`. Merchant notified in real time.

---

### 5.6 Real-Time Order & Rider Tracking

**Feature:** Live visibility into order progress from placement to delivery.

**Functionality:**
- **Order Status Page (Auto-opens after order placed):**
  - Order status timeline: Horizontal or vertical step indicator with colored nodes (grey=pending, orange=current, green=completed)
  - Steps per store type:
    - Shop/Pre-Loved/Fresh Market: Order Placed → Merchant Accepted → Preparing → Rider Assigned → Order Picked Up → In Transit → Delivered
    - Ready-to-Eat: Order Placed → Merchant Accepted → Cooking → Ready → Rider Assigned → Picked Up → Delivered
  - Each completed step shows timestamp
- **Anti-Scam Rider Info Reveal:** Rider's name, photo, vehicle type, and plate number are ONLY visible AFTER "Order Picked Up" is confirmed by merchant. Before that: "Finding a rider..." or "Rider assigned" (name shown ONLY after merchant confirms pickup).
- **Live Map (After Pickup Confirmed):** Google Maps embed showing:
  - Rider's current GPS position (updates every 5 seconds via WebSocket)
  - Customer's drop-off pin
  - Route line (optional)
  - ETA counter: "Arriving in ~X minutes" (calculated from real-time distance + average speed)
- **Rider Profile Card (After Pickup Only):**
  - Rider photo (from KYC — cropped face)
  - Rider name
  - Vehicle type + plate number
  - "View on Map" button
  - NO phone number shown (anti-harassment / anti-scam)
- **Cannot Cancel After Pickup:** Cancel button permanently disabled (replaced by "Order is in transit and cannot be cancelled"). No way to override this rule from user side.

---

### 5.7 RAPEX Wallet (User)

**Feature:** Digital wallet for large-order transactions and points redemption.

**Functionality:**
- **Balance Display:** Shown on Profile page and at Checkout. Also displayed in the notification bar (optional user preference).
- **When is Wallet Required:** Orders above ₱1,001 total → wallet required. System checks: `if order_total > 1001 and user.wallet_balance < order_total: block_checkout()`.
- **Top-Up Request:**
  1. User goes to Profile → Wallet → "Request Top-Up"
  2. Opens chat with Admin
  3. Instructions shown: RAPEX GCash number and steps to pay
  4. User makes GCash payment, takes screenshot
  5. Sends screenshot in chat
  6. Admin verifies and credits wallet
- **Points-to-Wallet Redemption:** From wallet page, user can "Redeem Points" — converts their current points balance into wallet balance at 1:1 ratio (1 pt = ₱1).
- **Transaction History:** All wallet events: top-up credits, order deductions, points redemptions. With date, amount, balance after.

---

### 5.8 Loyalty Points Rewards System

**Feature:** Spend-based loyalty points that act as cash.

**Functionality:**
- **Earning Rule:** For every completed and delivered order: `points_earned = floor(order_total / 300)`. E.g., a ₱650 order earns 2 points. A ₱250 order earns 0 points but the ₱250 rolls over.
- **Rollover Accumulation:** `remaining_spend = cumulative_spend_since_last_point mod 300`. Stored in `UserPoints.rollover_balance`. Carries over across multiple orders until next threshold hit.
- **Auto-Credit Trigger:** Points credited automatically via Celery task when order status changes to `DELIVERED`.
- **Points Display:** Shown on profile, wallet page, and checkout. Always displayed as: "X points = ₱X value."
- **Redemption at Checkout:** Toggle "Use My Points" at checkout review step. Shows: "Applying 5 points = ₱5 discount. New total: ₱[X]". Points deducted from balance on order placement. If order is cancelled before merchant accepts, points are refunded.
- **Points History:** Chronological log: Order ID / Points Earned or Redeemed / Running Balance / Date.

---

### 5.9 Referral System

**Feature:** QR-based customer referral for earning loyalty points.

**Functionality:**
- **Referral QR:** Generated at account approval and viewable from Profile → Referrals.
- **Sharing:** Share button generates a deep link that opens the RAPEX app (or web page) with referral code pre-filled in registration. Share to any messaging app.
- **Earning:** When a referred friend completes registration, KYC, and places their first order: referrer earns 5 points. Celery task monitors `UserOrder.first_order` flag to trigger reward.
- **Monthly Cap:** Hard cap at 100 referral points per calendar month. If cap is hit: referral credits paused, notification sent.
- **Referral Tracking:** Table showing: Referred Person (name or masked — pending/approved status), Date Invited, Status (Invited / Registered / First Order Placed / Points Credited), Points Earned from this referral.

---

### 5.10 Order History

**Feature:** Complete archive of all past orders.

**Functionality:**
- **Order List:** Paginated cards or table. Default: Most recent first. Each order card: Order ID, Store Name, Store Type icon, Date and Time, Item summary (e.g., "Adobo + Rice, Extra Rice"), Total Amount, Delivery Fee, Status badge, Points Earned.
- **Filter by Tab:** Dropdown to see orders from: All / Shop / Fresh Market / Ready-to-Eat / Pre-Loved.
- **Filter by Status:** Delivered / Cancelled / In Progress.
- **Filter by Date Range:** Custom date picker.
- **Order Detail View:** Full receipt: itemized list, quantities, unit prices, subtotals, delivery fee, discount, grand total, delivery address, rider name (post-delivered orders), delivery timestamps.
- **Reorder:** "Order Again" button — pre-fills cart with the same items from the same store. User reviews and places new order.
- **Receipt Share:** Share button generates a formatted PDF receipt (or shareable image) for any delivered order. Useful for expense tracking.

---

### 5.11 No Cancellation After Pickup (Anti-Scam)

**Feature:** Absolute rule — prevent order abandonment after rider has picked up.

**Functionality:**
- Cancel button in active order view is conditionally rendered:
  - `status in [PENDING_MERCHANT, MERCHANT_ACCEPTED, PREPARING, COOKING]` → Cancel button visible and functional
  - `status in [RIDER_ASSIGNED, PICKED_UP, IN_TRANSIT, DELIVERED, FAILED]` → Cancel button replaced by a grey, disabled "Cannot Cancel" button with tooltip: "This order is in transit and cannot be cancelled."
- No API endpoint accepts a cancel request for orders in IN_TRANSIT or later status (backend validation, not just frontend hiding).
- If user somehow sends a cancel API request (e.g., via Postman): `403 Forbidden` with error message `ORDER_IN_TRANSIT_CANCEL_NOT_ALLOWED`.

---

### 5.12 Mandatory GPS

**Feature:** User's location must stay active throughout the delivery.

**Functionality:**
- On app launch: permission request with explanation modal. Permission required to use the delivery features.
- During an active delivery (order in `IN_TRANSIT`):
  - App polls GPS status every 30 seconds via `navigator.geolocation.watchPosition`
  - If GPS turns off during active delivery: full-screen modal appears (cannot dismiss): "Keep Your GPS On — Your rider needs your location to find you. Please re-enable GPS."
  - Order progression to `DELIVERED` requires GPS to be active (server validates before accepting delivery confirmation)
  - Rider's app shows "Customer Location Unavailable" warning if user GPS dropped
- After delivery completed: GPS enforcement relaxes (no forced location for browsing)

---

### 5.13 Chat with Admin (Wallet Support)

**Feature:** User's single point of contact for wallet top-up and support.

**Functionality:**
- Accessible from: Profile → Contact Support, and from Wallet → Request Top-Up
- Same chat UI as other roles
- User can only chat with Admin — no way to initiate contact with merchants or riders
- Primary use: GCash screenshot upload for wallet top-up verification
- Secondary use: KYC questions, account issues, order disputes (after delivery)
- All messages permanent, never deleted from user's view

---

### 5.14 Push Notifications (User)

| Event | Message | Channel |
|---|---|---|
| Order Confirmed by Merchant | "Your order from [Store] is being prepared!" | Push + In-App |
| Rider Assigned | "A rider is on the way to pick up your order." | Push |
| Order Picked Up | "Your order has been picked up! Track live now." | Push |
| Out for Delivery | "Your order is on the way!" | Push |
| Order Delivered | "Order delivered! Rate your experience." | Push + In-App |
| Points Credited | "You earned X points from your last order." | In-App |
| Referral Credited | "Your referral [Name] placed their first order! +5 points." | Push |
| Wallet Top-Up Confirmed | "₱[amount] has been added to your RAPEX Wallet." | Push + In-App |
| Admin Broadcast | Platform announcement | Push |
| KYC Approved | "Your account has been verified! Welcome to RAPEX." | Push + SMS |

---

---

## 6. CROSS-ROLE & SHARED SYSTEMS

---

### 6.1 Authentication & Security Layer (All Roles)

**Functionality:**
- **JWT Authentication:** `djangorestframework-simplejwt`. Access token: 15-min expiry. Refresh token: 7-day rolling expiry. Both stored in httpOnly cookies.
- **OTP System:** Celery task: generate 6-digit TOTP → send via Semaphore SMS → store hashed OTP in Redis with TTL=300s. Verify: compare hash, check TTL, mark used (prevent replay).
- **Device Binding:** On login, server computes `device_fingerprint = hash(device_id + user_agent + platform)`. Stored in `ActiveSession` table. New device = new fingerprint = old sessions revoked.
- **Rate Limiting:** Redis-backed rate limits: Max 5 OTP requests per phone per hour. Max 5 login failures per IP per 15 minutes.
- **HTTPS Only:** All subdomains served over HTTPS via Nginx + Let's Encrypt. HTTP → HTTPS redirect enforced.
- **CORS:** Django CORS headers configured per subdomain. Cross-origin requests only from known RAPEX origins.
- **Input Validation:** DRF serializers validate all incoming data. SQL injection prevented by ORM usage. XSS prevented by React's auto-escaping.

---

### 6.2 Google Maps Integration

**Functionality:**
- **Address Autocomplete (Registration & Checkout):** Google Places API. `places.autocomplete` filtered to Philippines only. Returns: formatted address, lat/lng, barangay, municipality, city components.
- **Map Pin (Business Address / Delivery):** Google Maps JavaScript SDK (web) and React Native Maps (mobile) with `@react-native-maps/maps` or `react-native-google-maps`. User drags pin to confirm precise location. Lat/lng stored in `location_lat` and `location_lng` fields.
- **Proximity Search (Nearby Merchants):** Haversine formula SQL query or PostGIS `ST_DWithin` for merchants within 2 km of user coordinates. Result sorted by distance ASC.
- **Live Rider Tracking:** WebSocket delivers lat/lng updates every 5 seconds. Frontend renders `<Marker>` position update. Smooth marker animation using `Animated` or `@react-spring`.
- **Directions / Routing:** Google Directions API for turn-by-turn routing from rider current location to merchant (pickup) and then to customer (delivery). Route polyline drawn on map.
- **Geofence Delivery Confirmation:** Using `google.maps.geometry.spherical.computeDistanceBetween()` client-side, validates rider is within 50m of customer before enabling "Confirm Delivery" button.

---

### 6.3 Wallet Ecosystem

**Functionality:**
- **Wallet Model:** `RapexWallet(owner_id, owner_type[RIDER/USER], balance, last_updated)`
- **Transaction Model:** `WalletTransaction(wallet, type[TOP_UP/DEDUCTION/COMMISSION/PENALTY/INCENTIVE/REFERRAL_CREDIT], amount, balance_after, reference, created_by, created_at, note)`
- **Atomicity:** All wallet operations wrapped in Django `transaction.atomic()`. No partial updates possible. If commission deduction fails, delivery status update rolls back.
- **Real-Time Balance Push:** After every wallet update, Django Channels pushes new balance to the account holder's WebSocket connection. Frontend balance card updates without page refresh.
- **Ledger Integrity:** Wallet balance is always derived from the sum of all `WalletTransaction` records for auditability. Periodic reconciliation task via Celery verifies `balance == sum(credits) - sum(debits)`.

---

### 6.4 Real-Time WebSocket Events

**Events handled via Django Channels:**

| Event Name | Publisher | Subscriber | Payload |
|---|---|---|---|
| `order.new` | Order POST API | Merchant, Admin | Order data |
| `order.status_update` | Status change API | Customer, Merchant, Admin | Order ID, new status |
| `rider.location_update` | Rider mobile app | Customer, Admin, Merchant | rider_id, lat, lng |
| `wallet.balance_update` | Wallet transaction | Account holder | new_balance |
| `chat.new_message` | Chat send API | Chat thread participants | message data |
| `notification.new` | Notification service | Target user | notification payload |
| `system.alert` | Admin broadcast | All connected clients | alert message |

---

### 6.5 Notification Infrastructure

**Channels and Routing:**

| Channel | Library | Use Case |
|---|---|---|
| Mobile Push | FCM (Firebase Cloud Messaging) | All role order/alert events on Android |
| Web Push | OneSignal Web SDK | Browser push for web dashboards |
| In-App | Django Channels WebSocket | Real-time bell updates in dashboards |
| SMS | Semaphore Philippines API | OTP + critical account alerts |
| Email | Django Email (SMTP) | Admin 2FA codes, password resets |

**Notification Model:** `Notification(recipient, role, channel, event_type, title, body, data_payload, sent_at, delivered_at, read_at, delivery_status)`

**Celery Task:** All notifications dispatched as async Celery tasks to avoid blocking the API response. Retry logic: 3 retries with exponential backoff for failed deliveries.

---

### 6.6 Anti-Scam Security Layer

| Rule | Implementation |
|---|---|
| Camera-Only KYC | HTML `capture="camera"` attribute on all file inputs. Backend validates EXIF: reject if EXIF creation software is a gallery app. |
| GPS Mandatory (Delivery) | Frontend + backend: delivery status transitions blocked without valid GPS coordinates in payload |
| Cancel Lock After Pickup | Backend state machine: transitions from IN_TRANSIT to CANCELLED returns 403 |
| Wallet Threshold | Backend `pre_save` signal on Order: if `total > 1001` and `user.wallet.balance < total`: raise `InsufficientWalletError` |
| Single Device Session | JWT payload includes `session_id`. On new login: `session_id` rotated, old tokens revoked via Redis blocklist |
| GCash Verification | Admin action required in chat thread before wallet credits are applied. No self-service wallet credit API exists. |
| Rider Info Reveal Gate | Order query serializer: rider personal info fields (name, plate) only included in response when `order.status in ['PICKED_UP', 'IN_TRANSIT', 'DELIVERED']` |

---

### 6.7 Referral Points Engine

**Functionality:**
- **Models:** `ReferralCode(owner, code, qr_code_url, created_at)`, `ReferralRecord(referrer, referred_account, role, date_invited, status, points_credited_at)`
- **Points Credit Rules:**
  - User referral: credited when referred user's first order reaches `DELIVERED` status. Celery task fires on order delivered signal.
  - Rider referral: credited when referred rider's account is `APPROVED` by admin.
- **Monthly Cap Enforcement:** `ReferralMonthlyTracker(account, month_year, points_credited)`. Before crediting: check if `points_credited + new_points <= 100`. If over cap: skip credit, notify referrer.
- **QR Code Generation:** Python `qrcode` library generates QR PNG on account approval. Stored in MinIO/R2 storage. URL saved in `ReferralCode.qr_code_url`.

---

### 6.8 UI/UX System — Apex Dashboard (All Web Dashboards)

**Functionality:**
- **Layout:** Persistent left sidebar (collapsible to icon-only mode). Top navigation bar. Content area (scrollable). Footer minimal.
- **Sidebar States:** Full (text + icons) / Compact (icons + tooltips) / Hidden (mobile overlay). State persisted in `localStorage`.
- **Apex Components Used:**
  - `ApexChart` (area, bar, line, donut, radial) for all charts
  - Data tables with built-in sort, filter, pagination
  - Modal dialogs with overlay backdrop
  - Toast notifications (bottom-right, auto-dismiss after 4 seconds)
  - Breadcrumb trail on all inner pages
  - Status badges with color-coded states
  - Skeleton loading states while data loads
  - Dark/Light mode toggle in topbar (preference saved to `localStorage`)
  - Customization panel (slide-in from right): sidebar style, accent color, mode
- **Responsive:** Designed mobile-first. On screens < 768px: sidebar collapses, top nav shows hamburger menu.
- **Theme Colors applied to Apex components:**
  - Primary: `#FF6B00` (orange) — buttons, active nav, chart accent 1
  - Secondary: `#7C3AED` (purple) — secondary buttons, chart accent 2, badges
  - Success: `#22C55E` (green)
  - Danger: `#EF4444` (red)
  - Warning: `#EAB308` (yellow)
  - Info: `#3B82F6` (blue)

---

*End of RAPEX Technologies OPC — Complete Feature & Functionality Specification*  
*Version: 1.0 MVP · March 2026*
