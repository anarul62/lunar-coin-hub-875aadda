## Problems

1. **Countdown shows 1 hour instead of 5 minutes**
   The admin form has two separate timing fields:
   - `duration_minutes` (defaults to **60**) → used for the very first round's `draw_at`.
   - `recreate_days/hours/minutes` (e.g. 5 min) → only used by the edge function when auto-creating the *next* round.

   You set recreate = 5 min, but the first round still uses the 60-minute default → user sees "Ends in 58:57". Editing an existing plan in the dialog also doesn't sync `draw_at` from the recreate interval.

2. **X coin bonus not credited to wallet**
   `plan.xcoin_bonus` is displayed as "+ 100 X coin" on the lottery card but is **never written to `user_xcoin`** — not on purchase, not on draw. So users never receive it.

## Fix

### A. Single source of truth for round duration
- Drop the separate `duration_minutes` input from the admin "Add plan" form.
- When `auto_recreate` is ON: initial `draw_at` = now + (days·24h + hours·60m + minutes). This is also what the edge function already uses for next rounds, so admin and user always see the same number.
- When `auto_recreate` is OFF: require an explicit `draw_at` (datetime picker). If empty, fall back to recreate interval; if that's also zero, error.
- In the **Edit dialog**, add a button "Reset draw time using recreate interval" so changing 60 → 5 immediately reschedules the current open round (otherwise the already-scheduled `draw_at` keeps running until the next round).

### B. Credit X coin bonus on ticket purchase
- In `LotteryChannel.tsx > ConfirmDialog.submit` (and in `LotteryTickets.tsx > book` for the per-ticket booking flow), after a successful insert/update credit:
  `user_xcoin.balance += plan.xcoin_bonus * tickets_purchased`
- Add a notification row "You earned X{bonus} coin for buying N ticket(s)".
- Bonus is per ticket (matches the "+ 100 X coin" displayed alongside ticket price).

### Files to edit
- `src/pages/admin/AdminLotteryPlans.tsx` — remove `duration_minutes` input, recompute initial `draw_at` from recreate interval, add reset-draw button in edit dialog.
- `src/pages/lottery/LotteryChannel.tsx` — credit `xcoin_bonus * count` to `user_xcoin` after entry insert.
- `src/pages/lottery/LotteryTickets.tsx` — credit `xcoin_bonus * ids.length` after booking succeeds (so users who book later still get the bonus exactly once per ticket — guarded by the insert succeeding for previously-null user_id rows).

No DB migration needed.
