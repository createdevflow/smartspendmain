# Cashtro Admin Console — UI Redesign Spec

**Goal:** Visual-only redesign. Make the existing admin panel feel rich, premium, clean, organised, and consistent (fonts, spacing, color system, component style) across every screen — including responsive behavior on tablet/mobile.

**Hard constraint:** Do NOT change functionality, routes, data, business logic, or add new features/modules. This is a UI/styling pass only, applied consistently on top of what already exists.

---

## 1. Current State — Screen Inventory (from screenshots)

| # | Screen | Key elements observed |
|---|--------|------------------------|
| 1 | **Dashboard Overview** | 8 stat cards (Total Users, Active Sessions, Transactions, Cashbooks, New This Month, Verified Users, Active Goals, Failed Logins) in a 4-col grid, each with icon + badge + big number + label. Below: "New Users (Last 6 Months)" bar chart + "Recent Activity" audit feed. |
| 2 | **User Management** | Search bar + 4 filter dropdowns + Clear button. Table: checkbox, User (avatar+name+email), Plan badge, Role, Status badge, Last Login, Joined, Actions (kebab menu with dropdown: View Profile / Suspend). Pagination footer. |
| 3 | **Transactions** | 3 summary cards (Total Records, Total Income, Total Expense — color coded blue/green/red). Search + type filter + date range. Table: User, Type badge (income/expense), Amount (color coded), Category (icon+name), Payment method, Date. |
| 4 | **Plans & Pricing** | Toggle (Cards / Feature Matrix) + "New Plan" button. 3 pricing cards (Free/Pro/Business) each with edit/duplicate/delete icons, price, description, feature checklist (some struck-through = disabled), "+N more features" link, active user count. Top accent bar color-coded per plan (gray/blue/purple). |
| 5 | **Shared Cashbooks** | Search bar. Table: Cashbook (colored dot + name + ID), Owner (name+email), Members (badge), Created date, Actions (View Members button). |
| 6 | **Tax Export Logs** | 3 stat cards (Total Exports, Unique Users, Total Tx Exported). Table: User, Year badge, Transactions, Total Amount (green), Exported At. |
| 7 | **Communication Center** | "New Notification" primary button. 4 stat cards (Total Campaigns, Sent, Scheduled, Drafts). 4 action cards (Notification Campaigns, In-App Chat Hub, New Notification, Delivery Logs) each icon+title+subtitle. "Recent Campaigns" table below (Title w/ emoji, Type, Audience badge, Status badge, Sent count, Actions). |
| 8 | **New Notification Form** | Two-column layout: left = Content (title/subtitle/message/banner URL/action button/deep link), Notification Type (8 icon tiles in grid, single-select), Audience (list of selectable rows: All Users/Free/Premium/Android/iOS/Selected). Right = Delivery Channels (checkboxes), Schedule (datetime), live Preview card (blue). |
| 9 | **System Settings** | Horizontal tab bar (General / Feature Toggles / Security & Auth / Notifications / Integrations / AI Management / Maintenance). General tab: text inputs (App Name, Support Email), dropdown (Default Plan), number input (Free Trial Days), toggle switches (Enable Public Registration, Require Email Verification) under an "Access Control" section header. |
| 10 | **Media Library** | "Run Maintenance & Cleanup" primary button. 4 stat cards (Total Files, Storage Used, Compression Savings %, Total Served). Search + module filter + status filter + grid/list view toggle. Dark file-preview tiles with type badge (WEBP/OCTET-STREAM), size, checkbox, path + ID below. |
| 11 | **Logs & Monitoring** | 4 stat cards (Failed Logins-red, Total Logins-green, Suspensions-amber, Data Deletes-purple), each with a colored left border accent. Search + action filter. Table: Action (colored pill), User, IP, User Agent, Date. |
| 12 | **Support Tickets** | Two-pane layout: left = ticket list (status tabs All/Open/Answered/Closed, searchable), right = conversation thread (user bubble left-aligned, admin bubble right-aligned/blue) + reply textarea + Send button. |
| 13 | **Blog Management** | "Categories"/"Tags"/"New Post" buttons. Status tabs (All/Published/Drafts/Scheduled/Archived). Post cards: thumbnail, status+category badges, title, excerpt, meta (date/read time/author), edit/delete/feature icons. |
| 14 | **New Blog Post Editor** | Two-column: left = title/slug/excerpt inputs + rich text toolbar + block inserter (Paragraph/Image/Document/Heading/List/Callout/Quote/Code). Right = Status dropdown, Featured checkbox, Cover Image upload, Category dropdown, Tags input. |
| 15 | **Admin Login** | Split screen: left = brand panel with headline "Command Center for Modern Finance" + subtext + logo + copyright. Right = white card with shield icon, "Welcome back" heading, Email + Password fields, full-width blue "Secure Sign In →" button. |

**Persistent chrome across all screens:** Fixed left sidebar (Cashtro logo/wordmark top, nav items with icons, active item highlighted light-blue, Admin profile card pinned at bottom with avatar initial + email).

---

## 2. Design System Observations (current, to be refined not replaced)

- **Brand color:** Blue (~`#2563EB` primary blue), used for active nav state, primary buttons, links, chart bars, preview cards.
- **Semantic colors:** Green = income/success/active, Red = expense/failed/danger, Amber/Orange = pending/warning, Purple = secondary accents.
- **Typography:** Clean sans-serif (system/Inter-style), bold large numbers on stat cards, muted gray labels/subtext.
- **Layout pattern:** Fixed sidebar + content area with page title/subtitle header + primary action button top-right, stat-card row, then filters, then table/grid.
- **Components repeated everywhere:** Stat cards, filter bars, data tables with badges, kebab/action menus, tab bars, toggle switches.

---

## 3. Redesign Requirements

### 3.1 Design tokens (define once, apply everywhere)
- Lock a single **brand blue** (primary) + **neutral gray scale** (backgrounds, borders, text) + **semantic set** (success green, danger red, warning amber, info purple) as CSS variables/theme tokens. Reuse the existing brand blue — do not invent a new brand color.
- One **type scale**: page title, section heading, card label, body, caption — consistent sizes/weights across all 15 screens (currently sizes are close but not perfectly consistent).
- One **spacing scale** (4/8/12/16/24/32) applied consistently to card padding, gaps, section margins.
- One **radius + shadow** system: consistent corner radius and a subtle elevation shadow for cards/modals (currently flat/inconsistent shadows).

### 3.2 Component polish (reuse the exact same component everywhere it appears)
- **Stat cards** (used on Dashboard, Transactions, Tax Exports, Communication, Media Library, Logs): unify icon-badge style, number weight/size, label color, corner radius, hover state. Give the "colored left border" treatment (seen on Logs) a consistent optional variant.
- **Tables** (Users, Transactions, Shared Cashbooks, Tax Exports, Logs): consistent header row styling (uppercase gray label), row hover state, zebra or divider consistency, badge pill styling (status/type/plan), consistent action-menu (kebab) styling and dropdown shadow.
- **Badges/pills**: one consistent shape/padding/font-weight for all badge types (status, plan, type, role) — only the color changes per semantic meaning.
- **Buttons**: one primary (filled blue), one secondary (outline/gray), one destructive (red) style — apply consistently (currently "Export CSV", "Refresh", "New Plan", "Save Changes" etc. look close but should be pixel-consistent).
- **Toggle switches, tabs, filters/dropdowns**: unify style across Settings tabs, Blog status tabs, Support ticket tabs, and all filter dropdowns.
- **Forms** (New Notification, New Blog Post, Settings, Login): consistent input height/border/focus state/label style across every form in the app.
- **Empty/preview states** (Notification live preview, blog editor placeholder): keep but restyle to match token system.

### 3.3 Premium feel
- Subtle depth via shadow + soft borders instead of flat harsh dividers.
- Consistent icon set/weight (currently mixed line icons — pick one icon family and stick to it).
- Micro-interactions: hover/active states on cards, rows, buttons, nav items (transition, not decoration).
- Sidebar: refine active-state highlight, spacing between nav groups, profile card at bottom.

### 3.4 Responsiveness (all screens, including login)
- Sidebar collapses to a hamburger/off-canvas drawer or icon-only rail below tablet breakpoint.
- Stat-card grids reflow: 4-col → 2-col → 1-col as width shrinks.
- Tables become horizontally scrollable or convert to stacked cards on mobile (pick one pattern, apply consistently to all 5 table screens).
- Two-column forms (Notification, Blog Editor, Login) stack to single column on mobile.
- Filter bars wrap or collapse into a "Filters" drawer/sheet on small screens.
- Login screen: brand panel (left) stacks above or hides gracefully on narrow viewports; form remains centered and usable.

### 3.5 What NOT to touch
- No new pages, modules, fields, filters, or buttons.
- No renaming of existing labels/routes.
- No change to data shown, table columns, or business rules.
- No change to which actions exist (only how they look).

---

## 4. Screens in scope for this pass
1. Login
2. Dashboard Overview
3. User Management (+ row action dropdown)
4. Transactions
5. Plans & Pricing (Cards + Feature Matrix view)
6. Shared Cashbooks
7. Tax Export Logs
8. Communication Center + New Notification form
9. System Settings (all tabs)
10. Media Library
11. Logs & Monitoring
12. Support Tickets
13. Blog Management + New/Edit Blog Post editor
14. Shared sidebar + top chrome across all of the above
