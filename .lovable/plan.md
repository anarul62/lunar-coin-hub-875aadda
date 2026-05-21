## X Coin System + Wallet Hub + Attendance + Rewards Feed

A complete virtual-coin economy with admin management, redemption codes, attendance bonus, and a unified rewards/announcements feed.

---

### 1. Database (new tables via migration)

- **`xcoin_settings`** (single-row, key/value via `app_settings` row `xcoin_settings`): `xcoin_per_usdt` (e.g. 1000 xcoin = 1 USDT), `min_convert_xcoin`, `description`.
- **`user_xcoin`**: `user_id`, `balance` (numeric), `updated_at`.
- **`xcoin_transactions`**: `user_id`, `type` (`attendance`, `redeem_code`, `convert_to_usdt`, `admin_adjust`), `amount`, `meta jsonb`, `created_at`. Powers admin "today redeem", "convert list", per-user history.
- **`xcoin_gift_codes`**: `code` (unique), `amount`, `max_users`, `used_count`, `expire_at`, `note`, `created_by`, `created_at`.
- **`xcoin_gift_redemptions`**: `code_id`, `user_id`, `amount`, `created_at` (unique on code_id+user_id).
- **`attendance_rewards`**: `day` (1..7), `amount_xcoin`, `active`. Seeded with 7 tiers.
- **`attendance_checkins`**: `user_id`, `date`, `day_index`, `amount_xcoin`. Unique on user_id+date.
- **`announcements`** (Rewards feed): `id`, `type` (`notice`, `gift_code`, `announcement`), `title`, `body`, `gift_code` (nullable), `image_url`, `created_at`, `active`.

All with permissive RLS (user-scoped read/write where appropriate, public read for settings/codes/announcements, admin via public-UI policy pattern already used in this project).

---

### 2. User-side pages/components

- **`/wallet`** — redesign to match screenshot 1:
  - Top: Total balance card (existing).
  - Middle: light-cyan panel with X-coin logo + **Total x coin: N**, an **(i)** info button (popover showing market price `1 USDT = X xcoin`, min convert), and a **Convert** button → opens convert dialog (xcoin → USDT, deducts xcoin, credits balance_usdt, inserts xcoin_transactions).
  - Two cards: **Redeem X coin** → `/redeem-xcoin`; **Attendance bonus** → `/attendance`.

- **`/redeem-xcoin`** — gift code redemption (matches screenshot 4): hero image, "Hi / We have a gift for you", input field, **Receive** button, history list of past redemptions. Server validates code (not expired, not over max_users, not already redeemed), credits xcoin.

- **`/attendance`** — matches screenshot 3: hero, "Attended consecutively N Day", "Accumulated ₹X" (xcoin total), 7 day tiles with reward amounts (from `attendance_rewards`, INR-displayed via xcoin→USDT→INR rate), bottom **Attendance** button. One check-in per calendar day; consecutive streak resets on miss. Credits day's xcoin to user.

- **`/rewards`** — unified feed of admin-posted announcements + gift-code posts + notifications. Gift-code posts show **Copy** button.

Wire **Wallet** tile on Profile and **Reward** action on home/profile to these routes.

---

### 3. Admin pages

- **`/admin/xcoin`** — dashboard:
  - KPIs: total xcoin in circulation, today redeemed, today converted.
  - Settings card: `xcoin_per_usdt`, `min_convert_xcoin`, info text.
  - Tabs/sections:
    - **Generate code**: amount, max_users, expire time, optional note → POST creates code (random 10-char). Lists generated codes with time, used_count/max, redemption list (user ref code + their xcoin balance), **Delete** button, **Post to Rewards feed** button (creates `announcements` row of type `gift_code`).
    - **Redemption activity**: list of `xcoin_transactions` type `redeem_code` (user, ref code, time, amount).
    - **Convert list**: `xcoin_transactions` type `convert_to_usdt`.
    - **User balances**: searchable user list with xcoin balance, ref code.

- **`/admin/attendance`** — edit the 7 day-tier xcoin amounts (active toggle).

- **`/admin/announcements`** — create/edit/delete posts to Rewards feed (notice, announcement, gift_code).

Add sidebar entries under existing admin layout.

---

### 4. Technical details

- Currency conversion: xcoin → USDT uses `xcoin_per_usdt`. Display in INR via existing `getUsdInrRate()`.
- All balance mutations done client-side with fresh re-read pattern (matches existing project pattern).
- Codes generated as `XC` + 8 uppercase alphanumerics; uniqueness enforced by DB.
- Attendance streak computed from latest `attendance_checkins` row for user; if yesterday's date present → day_index+1 (capped at 7, then resets), else 1.
- Use existing semantic Tailwind tokens; cyan accent block on wallet matches screenshot.

---

### 5. Files to create
- migration with all tables + RLS + seed for attendance_rewards & app_settings xcoin row
- `src/pages/Wallet.tsx` (rewrite)
- `src/pages/RedeemXcoin.tsx`
- `src/pages/Attendance.tsx`
- `src/pages/Rewards.tsx`
- `src/pages/admin/AdminXcoin.tsx`
- `src/pages/admin/AdminAttendance.tsx`
- `src/pages/admin/AdminAnnouncements.tsx`
- edit `src/App.tsx` (routes), `src/components/admin/AdminLayout.tsx` (nav), `src/components/BottomNav.tsx` / Profile for Reward entry if needed.

Confirm to proceed and I'll ship it in one pass.