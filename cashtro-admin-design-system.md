# Cashtro Admin Console — DESIGN.md
*(Reconciled with established Cashtro brand tokens — see "Reconciliation Notes" at bottom)*

## Product feel

Build a dense admin console for operators who manage records, users, and system state all day.
Prioritize scannability, keyboard speed, and information density over marketing polish. Support
a first-class light theme (primary) and dark theme, with the same layout, state, and semantic roles.

## Color system

### Brand
- Blue: `#2563EB` — primary actions, active nav, selected rows, links (light mode)
- Blue (dark mode): `#3B82F6` — same role, lightened for dark surfaces
- Indigo: `#6366F1` — secondary emphasis, focus accents
- Violet: `#8B5CF6` — chart/data highlight only, never for actions or status

### Surfaces (light — default theme)
- Canvas: `#F3F4F6` — app background
- Surface: `#FFFFFF` — panels, tables, cards
- Surface Elevated/Raised: `#F8FAFC` — hover rows, menus, inputs, popovers
- Border: `#E5E7EB` — separators and outlines

### Surfaces (dark)
- Canvas: `#0F0F0F` — dark app background
- Surface: `#1A1A1A` — dark panels, tables, cards
- Surface Raised: `#2A2A2A` — dark hover rows, menus, inputs
- Border: `#333333` — dark separators and outlines

### Text (light)
- Text Primary: `#111827` — headings, values, body
- Text Secondary: `#6B7280` — labels, metadata
- Text Muted: `#9CA3AF` — captions, disabled, placeholders

### Text (dark)
- Text Primary: `#FAFAFA` — headings, values, body
- Text Secondary: `#A1A1A1` — labels, metadata
- Text Muted: `#737373` — captions, disabled, placeholders

### Semantic (light)
- Success: `#059669` text / `#ECFDF5` bg — healthy, active, completed
- Warning: `#D97706` text / `#FFFBEB` bg — degraded, pending review
- Danger: `#DC2626` text / `#FEF2F2` bg — errors, destructive, offline
- Info: `#2563EB` text — informational, links

### Semantic (dark)
- Success: `#22C55E` — healthy, active, completed on dark surfaces
- Warning: `#F59E0B` — degraded, pending review on dark surfaces
- Danger: `#EF4444` — errors, destructive, offline on dark surfaces
- Info: `#3B82F6` — informational, links on dark surfaces

Keep semantic colors recognizable and test contrast in both themes. Never use color alone to convey status — always pair with a text label or icon.

## Typography

- Display Font: Inter
- Body Font: Inter
- Code Font: JetBrains Mono
- Use weights 400, 500, 600, 700.
- Use mono and tabular numbers for IDs, counts, and timestamps.

### Type scale
- Page Title: 20px / 28px / 600 / -0.02em
- Section Heading: 15px / 22px / 600
- Card Title: 14px / 20px / 600
- Body: 13px / 20px / 400
- Label: 11px / 16px / 500 / 0.05em (uppercase)
- Caption: 11px / 16px / 400
- Data / Mono: 13px / 18px / 500

## Spacing

- Base unit: 4px
- Scale: 4, 8, 12, 16, 20, 24, 32, 40px
- Desktop page gutter: 24px
- Mobile page gutter: 12px
- Card padding: 16px
- Dense row padding: 6px 12px
- Section gap: 24px

## Border radius

- 4px: badges, tags, compact controls
- 8px: buttons, inputs, cards, table shells
- 12px: featured stat panels
- 50%: avatars
- 100px: status pills

## Elevation

- Operational surfaces are flat with a 1px border — no drop shadows on inline cards.
- Menu / popover: `0 8px 24px rgba(0,0,0,0.5)`
- Focus ring: `0 0 0 2px rgba(37,99,235,0.5)` (light) / `0 0 0 2px rgba(59,130,246,0.5)` (dark)
- Reserve shadows for overlays only.

## Layout

- Persistent left sidebar (240px) with grouped navigation.
- Main content: full-bleed with 24px gutters (admin, not marketing).
- Sticky top bar: page title left, global actions and account right.
- Dense two- or three-column grids for stat rows.

## Sidebar navigation

- Group links under compact uppercase labels.
- Nav item height: 34px.
- Default: transparent background, Text Secondary.
- Hover: Surface Raised.
- Active: Blue accent (`#2563EB` light / `#3B82F6` dark) with Text Primary and a left indicator bar.
- Collapse to icons on tablet, drawer on mobile.

## Data table (core surface)

- Header height: 34px; row height: 36px (dense).
- Header text: 11px / 500 / Text Secondary, uppercase.
- Body text: 13px / Text Primary; IDs and counts tabular/mono.
- Support sort, filter, pagination, row selection, and inline row actions.
- Status is a semantic badge plus text, never color alone.
- Sticky header on scroll; sticky first column when useful.
- Bulk actions bar appears when rows are selected.

## Stat cards

- Anatomy: label, large value, optional trend, optional context.
- Value: 24px / 600, tabular.
- Trend uses semantic color on the delta only (not the whole card).
- Skeleton preserves final geometry while loading.

## Buttons

- Primary: Blue background (`#2563EB`), white text, 8px radius.
- Secondary: Surface Raised, 1px Border, Text Primary.
- Ghost: transparent, Text Secondary, for toolbar/icons.
- Destructive: Danger text/border; filled danger only on confirm step.
- Heights: 28px small, 32px medium, 36px large.
- Include hover, active, focus-visible, disabled, loading states for every variant.

## Inputs and filters

- Surface Raised background, 1px Border, 8px radius.
- Focus uses Blue border + the defined focus ring.
- Filter bar sits above tables; chips show active filters with clear buttons.
- Error uses Danger border plus helper text below the field.

## Badges and status

- Success/Warning/Danger/Info: semantic text on subtle tinted background (per tokens above).
- Neutral: Text Secondary on Surface Raised.
- Always pair status color with a text label — never color alone.

## States

- **Loading** — skeleton rows match table geometry; no colored blocks.
- **Empty** — explain what is missing and offer one action inside the table shell.
- **Error** — state what failed with a retry action; keep filters and selection intact.
- **Disabled** — keep labels readable; explain why the action is unavailable (tooltip/helper text).

## Responsive behavior

- Desktop above 1024px: persistent 240px sidebar, dense multi-column grids.
- Tablet 768–1024px: sidebar collapses to icons; tables scroll horizontally.
- Mobile below 768px: compact top bar/drawer trigger; tables scroll inside an intentional region with a visible scroll hint.
- Never wrap table cells into unreadable stacks; scroll instead.
- Bulk action bar stays reachable on all sizes.

## Accessibility

- All controls keyboard reachable with visible focus.
- Real table markup with header scope and row-selection semantics.
- Maintain 4.5:1 contrast for body text on both dark and light surfaces.
- Icon-only buttons require accessible labels (aria-label).
- Status includes text or icon, never color alone.
- Respect `prefers-reduced-motion`.
- Announce bulk-action results and destructive confirmations to screen readers.

## Motion

- 100–160ms transitions for hover, selection, and menus.
- Avoid layout-shifting animation in dense tables.
- Disable non-essential motion under `prefers-reduced-motion`.

## Agent implementation checklist

- Read this file before generating any UI.
- Use exact tokens above — no arbitrary colors, no new grays outside this scale.
- Preserve the 240px sidebar and 36px dense table rows.
- Make the data table the primary, fully-stated surface (sort/filter/select/paginate).
- Include loading, empty, error, success, disabled, hover, active, and focus states for every component.
- Test desktop, tablet, mobile, light, dark, and keyboard navigation.

## Do

- Prioritize density and scannability over decoration.
- Make the data table complete: sort, filter, select, paginate.
- Use semantic colors only for meaning (never decoratively).
- Keep IDs, counts, and timestamps tabular/mono.
- Show a bulk-action bar on row selection.
- Use visible focus states everywhere.

## Don't

- Don't add marketing hero blocks to the admin shell.
- Don't use decorative gradients or glassmorphism.
- Don't wrap dense table cells into unreadable stacks.
- Don't communicate status with color alone.
- Don't use arbitrary colors outside this palette.
- Don't hide destructive actions behind color only — always pair with confirm step + label.

---

## Reconciliation Notes (what changed from the uploaded file, and why)

1. **Light-mode neutrals** (Canvas, Text Primary/Secondary, Border) realigned to the exact grays already established in the Cashtro Project Overview (`#F3F4F6` / `#111827` / `#6B7280`), instead of the uploaded file's slightly different grays. Border and Muted were derived from the same Tailwind gray ramp (`#E5E7EB`, `#9CA3AF`) so the whole neutral scale is now internally consistent — one ramp, not two.
2. **Light-mode semantic colors** reverted to the values already defined for the Admin Console (Success `#059669`, Warning `#D97706`, Danger `#DC2626` with their matching tint backgrounds) rather than the darker variants in the uploaded file — these already meet contrast requirements and match your established brand, so darkening further was unnecessary drift.
3. **Dark mode** — your project never defined admin dark-mode tokens before. The uploaded file's dark palette was well-built and brand-consistent (blue accent lightens correctly for dark backgrounds), so it's kept as-is and adopted as the official dark theme.
4. **Everything structural** (layout, spacing, radius, typography scale, table density, button/input specs, states, responsive rules, accessibility, motion) is unchanged — it was already at the quality bar you're asking for.

## License

MIT
