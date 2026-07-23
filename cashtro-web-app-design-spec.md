# Cashtro Web App — Design & Navigation Spec

**What this is:** The web counterpart to the SmartSpend mobile app — same backend, same features, browser-based experience for users who prefer desktop/laptop access to their cashbooks, invoices, budgets, and AI insights.

---

## 1. Navigation Decision: Sidebar + Slim Top Bar

**Chosen pattern: Left sidebar (collapsible to icon rail) + a slim top bar for search/notifications/profile.**

### Why not a top navbar (like Reference 1 – FinSight)?
FinSight's flat top nav works because it only has 5 sections (Dashboard, Accounts, Transactions, Budgets, Investments). Cashtro has significantly more surface area — Dashboard, Cashbooks (with shared ledgers + passbook), Invoices, Transactions, Budgets/Wealth Hub, Investments/Goals, Subscriptions, AI ChatHub, Notifications, Settings/Security — and some of those need sub-navigation (e.g. Transactions → History / Reports, like Reference 3). A top bar runs out of room fast and forces a second-level dropdown menu, which is less discoverable than a persistent sidebar.

### Why a sidebar (like Reference 3 – ACRU, and Reference 2 – Finora)?
- Scales cleanly to 8–10 top-level items plus nested sub-items without crowding.
- Matches the pattern already established in the Cashtro Admin Console — same mental model for anyone who uses both, and reuses component/design work.
- Collapsible to an icon-only rail (as in both references) reclaims horizontal space for financial data — tables, charts, and cards need width more than nav does.
- Leaves the top bar free for the things users actually reach for constantly: quick search, notifications, and profile/account switcher — exactly as in Reference 3.

**Primary structural reference: Reference 3 (ACRU)** — sidebar with grouped/nested nav, top quick-search bar, stat row, chart, secondary widget cards, right-rail "quick actions" card, transaction list.
**Secondary influence: Reference 1 (FinSight)** — restrained whitespace, quieter color use, understated card borders instead of heavy shadows, disciplined typography hierarchy.
**Selective accent only: Reference 2 (Finora)** — the soft gradient background and rounded "my card" widget are visually appealing but too saturated/playful for a financial-trust product at this scope; borrow the *rounded card + soft depth* feel only, not the colorful backdrop.

---

## 2. Design Tokens (reuse existing Cashtro system — do not invent new colors)

Pulled directly from the project's established tokens:

| Token | Light Mode | Dark Mode |
|---|---|---|
| Background | `#F5F7FB` | `#0F172A` |
| Surface / Cards | `#FFFFFF` | `#1E293B` |
| Primary Text | `#232333` | `#F8FAFC` |
| Secondary Text | `#64748B` | `#94A3B8` |
| Border | `rgba(15,23,42,0.06)` | `rgba(255,255,255,0.08)` |
| Input Background | `#F1F5F9` | `#334155` |
| Primary Accent | `#2D8CFF` | `#38BDF8` |
| Primary Gradient | `#2563EB → #7C3AED` | same, reduced opacity |
| Success | `#059669` text / `#ECFDF5` bg | dark-mode equivalents, same hue family |
| Warning | `#D97706` text / `#FFFBEB` bg | " |
| Danger | `#DC2626` text / `#FEF2F2` bg | " |

**Typography:** `Inter`, same scale discipline as FinSight — large bold numerals for balances/totals, medium-weight section headings, muted secondary-text for labels/metadata. No decorative fonts.

**Depth:** Soft 1px border + very light shadow on cards (FinSight-style), not the heavier shadow in Finora. Corner radius: consistent medium-large radius (12–16px) for a premium, rounded-but-serious feel — matches Finora's card/pill roundness without its saturation.

---

## 3. Navigation Structure

### Sidebar (top → bottom)
1. Logo / workspace switcher (top)
2. **Dashboard**
3. **Cashbooks**
   - My Cashbooks
   - Shared Ledgers
   - Passbook
4. **Transactions**
   - History
   - Reports
5. **Invoices**
   - All Invoices
   - Templates & Branding
6. **Budgets & Wealth Hub**
   - Categories
   - Savings Goals
7. **Investments** *(if applicable to web scope)*
8. **Subscriptions** (recurring bills, scheduled payments)
9. **AI ChatHub**
10. **Notifications**
11. — divider —
12. **Support / Learning Center**
13. **Settings** (Profile, Security, Multi-currency, Billing)
14. Collapse-sidebar toggle (bottom, like Reference 3)

Collapses to icon-only rail below a set width or via manual toggle; nested items appear as a flyout/expand-in-place on hover or click when collapsed.

### Top Bar (persistent, all screens)
- Quick search (global: transactions, invoices, contacts)
- Notification bell (badge count)
- Settings quick-icon
- Profile menu (avatar, name, role/plan, dropdown: Profile / Switch Cashbook / Logout)

---

## 4. Core Screens & Layout Pattern

Each screen follows the same skeleton established in Reference 3, restyled with Cashtro tokens:

**Page header row:** Page title + primary action button (e.g. "+ New Invoice", "+ Add Transaction") top-right.

**Stat row:** 3–4 compact cards (icon badge, label, big number, small trend delta with up/down arrow and color) — same pattern as Balance/Savings/Income/Expenses in Reference 2, restyled calmer per Reference 1.

**Primary chart panel:** Large card, cash-flow / spending / income-vs-expense line or bar chart with a period selector (7d/30d/Monthly dropdown, top-right of the card) — modeled on Reference 3's main chart card.

**Secondary widget row:** 2–3 cards depending on screen: budget progress bar, category breakdown (donut, like Reference 1), goal tracker with progress bars (like Reference 3).

**Right rail (desktop only, optional per screen):** A "quick actions" card — for Cashtro this becomes things like current Cashbook balance + Send/Request or Create Invoice shortcuts (echoing Reference 2/3's "My Card" widget, but showing cashbook or invoice data instead of a bank card), plus an "Upcoming" list (recurring subscriptions/scheduled payments, echoing Reference 2's "Upcoming Bills" and Reference 3's "Upgrade to Pro" slot repurposed as a genuine upsell or reminder card).

**List/table panel:** Recent transactions / invoices / activity — row pattern: icon or avatar, name, sub-label (account/category), date, amount (color-coded income/expense) — same as Reference 1 & 2's transaction lists.

### Screen-by-screen mapping
| Screen | Stat row | Main panel | Secondary widgets | Right rail |
|---|---|---|---|---|
| Dashboard | Balance, Income, Expenses, Savings | Cash-flow chart | Category donut, budget progress | Quick actions + upcoming subscriptions |
| Cashbooks | Total cashbooks, shared count, active goals | Passbook timeline | Member list, recent shared activity | Create/Join cashbook |
| Transactions | Total, income, expense (page) | Filterable table | — | Filters panel (mobile: drawer) |
| Invoices | Draft/Sent/Paid counts | Invoice list/grid | GST summary card | Quick "New Invoice" |
| Budgets | Spent, remaining, % used | Category breakdown chart | Goal tracker cards | Add goal |
| AI ChatHub | — | Chat thread | Voice message support | Suggested prompts |
| Settings | — | Tabbed form (Profile/Security/Currency/Billing) | — | — |

---

## 5. Responsive Behavior
- **Desktop (≥1280px):** Full sidebar (labeled) + right rail visible.
- **Tablet (768–1279px):** Sidebar auto-collapses to icon rail; right rail widgets move below main content or into a toggleable panel.
- **Mobile (<768px):** Sidebar becomes an off-canvas drawer (hamburger trigger in top bar); stat rows stack to 2-col then 1-col; charts remain full-width and scrollable where needed; tables convert to stacked card rows (consistent with the Admin Console's mobile table pattern for visual family resemblance).

---

## 6. Component Inventory (build once, reuse across all screens)
- Sidebar nav item (with optional nested/expandable state)
- Top bar (search input, icon buttons, profile dropdown)
- Stat card (icon badge + label + number + trend delta)
- Chart card (header + period selector + chart canvas)
- Donut/breakdown card with legend
- Progress-bar card (budget/goal)
- Quick-actions rail card (balance + primary/secondary action buttons)
- Upcoming/reminders list card
- Data table (desktop) / stacked list (mobile)
- Tabbed settings panel
- Chat bubble (user/AI, with voice-message variant)

---

## 7. Explicitly Out of Scope for This Design Pass
- No new features beyond what's listed in the Cashtro Project Overview.
- No divergence from the established color tokens — accents pull only from the existing gradient/semantic palette.
- Dark mode uses the same token table above; not a separate visual language.
