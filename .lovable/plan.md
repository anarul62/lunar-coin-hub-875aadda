# Lottery System Plan

A full lottery feature inside `/invest/lottery` channel with admin plan setup and automated AI draws.

## 1. Database (new migration)

**`lottery_plans`** — admin-defined lottery products
- `id, channel_id, name, image_url, game_image_url`
- `total_tickets` (e.g. 100), `ticket_price`, `currency` (BDT/USDT/INR/XCOIN)
- `xcoin_bonus` (extra X coin shown on card, nullable)
- `prize_mode` ('auto' | 'manual')
- `pct_first, pct_second, pct_third, pct_4_11, pct_company` (numeric percents)
- `pct_4_11_enabled` (bool)
- `draw_at` (timestamptz – countdown end), `duration_minutes` (for next cycle auto-recreate later)
- `status` ('open' | 'drawing' | 'completed'), `enabled, sort_order`

**`lottery_tickets`** — every ticket slot for a plan
- `id, plan_id, ticket_number` (1..total_tickets), `code` (e.g. DRAW-8X2V)
- `user_id` (null = available), `booked_at`
- unique(plan_id, ticket_number)

**`lottery_entries`** — a user's paid entry (1 entry = N tickets)
- `id, plan_id, user_id, tickets_count, amount_paid, currency, created_at`
- `tickets_assigned` int default 0

**`lottery_results`** — draw outcome
- `id, plan_id, ticket_id, user_id, rank` (1,2,3, or 4..11), `prize_amount, currency, paid` bool

Auto-seed `lottery_tickets` rows when a plan is created (1..total_tickets, codes random).
RLS: public read for plans/tickets/results; user inserts their own entries; admin full via public policies (existing pattern).

## 2. Admin Panel

**`/admin/lottery-plans`** (new) — list / add / edit / delete plans tied to lottery channels.
Fields: name, game image, total tickets, ticket price, currency, X coin bonus, draw time, prize mode (auto/manual), percent inputs, 4–11 toggle.

In auto mode defaults: 1st=30, 2nd=20, 3rd=10, 4-11=3.75 each, company=10.

Sidebar link added in `AdminLayout`.

## 3. User Pages

**`/invest/lottery`** — channel page, two tabs:
- **Lottery**: cards matching uploaded design (game image left, prize pool + 1st prize center, ticket price button right, countdown top-right). Currency icon (diamond = XCOIN, etc.) Shows xcoin bonus if set. Click price button → confirmation modal.
- **Dashboard**: list of plans user has entered → tap into View Tickets / Prizes / Leaderboard view.

**Confirmation modal** (matches screenshot 2)
- Total Entries (already bought) · Total (price per ticket) · `19/100` progress bar · total_ticket selector (default 1, +/–) · price recalculated · Conform button → deducts balance → creates `lottery_entry` → redirects to ticket grid.

**`/invest/lottery/:planId/tickets`** — ticket grid (screenshot 3)
- 3-column grid of `LUCKY DRAW` ticket images. Sold tickets show red `SOLD` ribbon overlay, owned-by-others disabled. User picks N tickets equal to remaining unassigned from their entries, then **Book** → assigns `user_id` on those `lottery_tickets`. Redirect to dashboard view.

**`/invest/lottery/:planId/details`** — dashboard details (screenshots 1, 4, 5)
- Header with prize pool, registration end, tournament spots (sold/total), results out.
- Tabs: **Prizes** (ranks + amounts based on current sold revenue × percent), **View Tickets** (user's booked tickets with numbers), **Leaderboard** (after draw shows ranks).
- Footer: `TOURNAMENT ENDS IN mm:ss` countdown.

## 4. Draw Logic (AI/auto)

Edge function `lottery-draw` (cron-friendly, also callable):
- For each plan where `draw_at <= now()` and status='open':
  - Collect sold tickets (those with user_id). If 0, mark completed, no winners.
  - Compute pool = sold_count × ticket_price.
  - Shuffle sold tickets; pick rank 1, 2, 3, then 4..11 (only if `pct_4_11_enabled`).
  - For each winner: prize = pool × pct / 100. Insert `lottery_results`, credit user `balance_usdt` (or `user_xcoin.balance` if currency XCOIN), insert notification.
  - Set plan status='completed'.

Trigger from client when a user opens details page past `draw_at` if still 'open' (safety call to edge function via `supabase.functions.invoke`).

## 5. Files to create/edit

Create:
- `supabase/migrations/<ts>_lottery.sql`
- `supabase/functions/lottery-draw/index.ts`
- `src/pages/admin/AdminLotteryPlans.tsx`
- `src/pages/lottery/LotteryChannel.tsx` (replaces channel render when type='lottery')
- `src/pages/lottery/LotteryConfirm.tsx` (modal component)
- `src/pages/lottery/LotteryTickets.tsx`
- `src/pages/lottery/LotteryDetails.tsx`
- `src/assets/lucky-ticket.png`, `src/assets/sold-ribbon.png` (from uploads)

Edit:
- `src/App.tsx` (routes)
- `src/pages/InvestChannel.tsx` (if channel.type==='lottery' → redirect/render lottery list)
- `src/components/admin/AdminLayout.tsx` (sidebar link)

## 6. Out of scope (for this iteration)
- Auto-recreate next cycle after a plan completes (can add later).
- Real-time leaderboard score; for now shows entry numbers + winners post-draw.

Confirm and I'll implement.
