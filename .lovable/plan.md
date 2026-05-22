## Overview

Build two new role systems on top of the existing admin: **Sub-Admins** (with granular feature permissions) and **Agents** (referral managers with their own login + dashboard).

---

## 1. Database Changes

### Extend `app_role` enum
- Add `'subadmin'` and `'agent'` to the existing enum.

### New table: `admin_permissions`
- `user_id` (uuid, FK to auth.users)
- `permissions` (jsonb array of feature keys, e.g. `["users","banners","kyc","deposits"]`)
- Only super-admin (`gamingtom076@gmail.com`) can edit.
- RLS: admins manage; users view own.

### New table: `agents`
- `user_id` (uuid) — auth user
- `agent_code` (text, unique) — referral code shown to users
- `name`, `email`, `phone`
- `created_by` (uuid) — which admin created
- `active` (bool)
- RLS: admins manage all; agents view own row.

### Extend `profiles`
- Add `agent_id` (uuid, nullable) — populated when a user signs up under an agent's code.
- `handle_new_user` trigger updated: if invitation code matches an `agent_code`, set `agent_id`.

---

## 2. Admin Panel — Sub-Admin Management

**Route:** `/admin/manage-admins` (new)

- List existing admins + sub-admins (from `user_roles` joined with `profiles`).
- "Add Sub-Admin" button → modal with: email, password, name, **permission checkboxes** for each admin feature (Users, Banners, KYC, Deposits, Withdrawals, Banners, Invest Plans, Lottery, SEO, Agents, etc.).
- Creates auth user via edge function (service role), assigns `subadmin` role, writes `admin_permissions` row.
- Edit permissions / delete sub-admin.

**AdminLayout** updated:
- Reads logged-in user's role + permissions.
- Hides sidebar items the sub-admin doesn't have permission for.
- Super-admin (`gamingtom076@gmail.com`) always sees everything.

---

## 3. Admin Panel — Agent Management

### `/admin/add-agent` (replace placeholder)
- Form: Agent name, email, password, phone, **agent refcode** (auto-generated, editable).
- Creates auth user (edge function), assigns `agent` role, inserts into `agents`.
- Below: table of all agents → refcode, name, email, created date, status, **delete** button.

### `/admin/agent-data` (replace placeholder)
- Table of agents with aggregated stats per agent:
  - Total invited users (count of profiles where `agent_id = agent.user_id`)
  - Total deposits (sum of approved deposits from those users)
  - Today's deposits
  - Total withdrawals
- Row click → detailed view: list of users under that agent + each user's deposit/withdraw history.

---

## 4. Agent Panel (new)

### `/agent/login`
- Email + password login.
- Verifies `agent` role; rejects others.

### `/agent` (dashboard, also reachable at `/agent-data1`)
- Shows logged-in agent's:
  - Agent refcode (copy button + share link `?ref=CODE`)
  - Total invited members
  - Active members (have deposited)
  - Total deposit volume
  - Today's deposits
  - List of downline users (name masked, phone last-4, deposit total)

---

## 5. Edge Function

**`admin-create-user`** — uses service role to:
- Create auth user with email/password.
- Assign role (`subadmin` or `agent`).
- Insert permissions or agents row.
- Only callable by authenticated admin (verified via JWT + `has_role` check).

---

## 6. Routing & Nav

- Add routes in `App.tsx` for `/admin/manage-admins`, `/agent/login`, `/agent`, `/agent-data1`.
- Replace placeholders for `/admin/add-agent` and `/admin/agent-data`.
- Add "Manage Admins" link in admin sidebar (super-admin only).

---

## Technical Notes

- Sub-admin permission keys map to sidebar items in `AdminLayout`.
- Agent refcode reuses the existing referral flow — when a user registers with an agent's code as `invitation_code`, the trigger links them via `agent_id`.
- All new tables get RLS using existing `has_role()` helper.
- Super-admin gate: hard-code `gamingtom076@gmail.com` check for managing sub-admins (cannot be revoked by another admin).

---

Approve to proceed, or tell me what to adjust (e.g. different permission granularity, agent commission system, etc.).
