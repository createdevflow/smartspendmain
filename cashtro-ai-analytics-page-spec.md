# Cashtro Mobile — AI Analytics & Insights Page Redesign

**Scope:** SmartSpend Mobile App — the "AI Analytics & Insights" screen.
**Goal:** Tighten the AI section to exactly what AI should own (trend + forecast + one insight statement), and upgrade the rest of the page into a genuinely useful, data-driven analytics dashboard — fully responsive, built from real transaction records.

**Assumption (please correct if wrong):** The existing "one more section at end" is treated below as a placeholder — I've proposed a **Savings & Cash Flow Health** section as the most natural 4th block given what's already there (Category breakdown + 7-day Income vs Expense). Swap this for whatever your current 4th section actually is if it's different — the responsive/component rules still apply the same way.

---

## 1. Page Structure

### Section A — AI Insights (AI-owned, kept minimal on purpose)
- **One chart only:** Accumulated Trend vs AI Forecast — a single line chart showing the user's actual cumulative spend/net-cashflow trend (solid line) plotted against the AI-projected trend for the remainder of the period (dotted/lighter line), with a clear visual break where "actual" ends and "forecast" begins.
- **One AI statement below the chart:** a short, natural-language insight/suggestion generated server-side (e.g. "You're on track to spend 12% more than last month — mostly driven by Dining Out. Consider setting a ₹3,000 cap for the rest of the month."). Plain text, not a list, not multiple cards — one clear statement, optionally with a single suggested action button (e.g. "Set Budget Cap").
- No other charts or stats belong in this section — keep it as the one clearly "AI" surface on the page so it doesn't blur with the real-data analytics below.

### Section B — Visual Analytics (real data, non-AI, deterministic)
Everything below is computed directly from the user's actual transaction/cashbook records — no AI involved, just aggregation.

1. **Expense by Category**
   - Donut/pie chart + ranked list (category, amount, % of total).
   - Tap a category to filter the 7-day chart and merchant list below by that category.
   - Period selector (This Month / Last Month / Custom).

2. **7-Day Income vs Expense**
   - Grouped bar or dual-line chart, one bar/line pair per day.
   - Net delta per day shown on hover/tap.
   - Optional toggle to extend to 30-day view without changing the chart type.

3. **Savings & Cash Flow Health** *(proposed 4th section — replace with actual if different)*
   - Net cash flow trend (income − expense) over a rolling 30/90-day window.
   - Savings rate gauge (% of income saved this period vs. target/previous period).
   - Small comparison line: this month vs. same period last month.

### New analytics to add (to make this a genuinely complete analytics page)
Add these as additional cards within Section B, using the same visual language as the existing sections — don't over-build, keep each card focused on one insight:
- **Top Merchants / Recurring Expenses** — ranked list of where money actually goes repeatedly (useful for spotting subscriptions/creep).
- **Month-over-Month Comparison** — simple bar pair (this month vs last month) for total income/expense/net.
- **Spending by Day-of-Week** — small heatmap or bar strip showing which days spend spikes (useful behavioral insight, cheap to compute from existing transaction dates).
- **Budget vs Actual** (if budgets/goals already exist elsewhere in the app) — progress bars per active budget category, pulling from the existing Budgets/Wealth Hub data rather than duplicating logic.

---

## 2. Data Requirements
- All Section B cards must be computed from the full set of the user's transaction records (not a sample or the last-N-fetched page) — aggregate server-side, return pre-computed summaries to the client rather than shipping raw transactions for client-side math.
- Respect existing multi-cashbook / shared-cashbook scoping — analytics should reflect whichever cashbook(s) are currently in scope on this screen, same as the rest of the app.
- Category/merchant analytics should degrade gracefully for users with very little transaction history (see Empty States below) instead of showing broken/empty charts.

## 3. Empty & Loading States
- **Loading:** skeleton chart shapes matching final geometry — no spinners replacing entire cards.
- **Empty (new user / no data in period):** each card shows a short explanation ("Add a few transactions to see your category breakdown") rather than a blank or zero chart.
- **AI section specifically:** if there isn't enough data for a meaningful forecast, show a plain message instead of a fabricated/flat forecast line ("Add more transactions this month to unlock AI forecasting").

## 4. Responsiveness
- Charts resize fluidly to container width — no fixed-pixel chart widths.
- Stack Section B cards to single column on narrow screens; allow 2-column on tablet-width, single scrollable row of cards is acceptable for category/merchant lists on small phones.
- Respect existing app design tokens (colors, type scale, dark mode) — no new visual language introduced for this page.
- Ensure charts remain legible (labels don't overlap/truncate) at the smallest supported device width.

## 5. Explicitly Out of Scope
- No changes to how AI ChatHub or voice insights work elsewhere in the app.
- No new data sources — this page only surfaces analytics already derivable from existing transaction/cashbook/budget records.
- Don't turn Section B into an AI feature — keep the AI/insight boundary exactly at Section A.
