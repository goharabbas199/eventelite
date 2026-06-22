---
name: Zinc dark design system
description: The full UI overhaul to zinc-950 palette — tokens, components, migration strategy, and key conventions.
---

## Design tokens (index.css)
- Dark background: `--background: 240 10% 4%` (zinc-950)
- Dark card: `--card: 240 6% 9%` (zinc-900 equiv) — all shadcn Card, Dialog, Popover auto-use this
- Dark border: `--border: 240 4% 15%` — all shadcn inputs/borders auto-use this
- Light: `--background: 0 0% 97%`, `--card: 0 0% 100%`, `--border: 240 5% 90%`

## Key utility classes (index.css)
- `.stat-card` = `bg-white/90 dark:bg-zinc-900/70 border border-zinc-200/70 dark:border-zinc-800/60 backdrop-blur-sm`
- `.glass`, `.glass-sm`, `.glass-lg`, `.glass-card` = glassmorphism variants
- `.badge-*` = semantic color chips (badge-blue, badge-emerald, badge-amber, badge-slate, badge-red, etc.)
- `.chip` = small inline badge
- `.eyebrow` = section label (10px, all-caps, zinc-400/500)

## Shared components
- `Layout.tsx` — `bg-zinc-50 dark:bg-zinc-950` page wrapper; MutationObserver+IO for .reveal; 3D tilt via event delegation
- `Sidebar.tsx` — `bg-zinc-950 border-r border-zinc-800/60`; active = `bg-zinc-800`; hover = `hover:bg-zinc-900`
- `Header.tsx` — `bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/60`
- `StatsCard.tsx` — uses `.stat-card` CSS class; icon pill with `/10` opacity bg

## Migration strategy (slate→zinc)
- Updating CSS custom properties in index.css cascades to ALL shadcn components automatically (Card, Input, Popover, etc.)
- Hardcoded `dark:bg-slate-*` / `dark:border-slate-*` / `dark:text-slate-*` on plain divs must be manually replaced
- Most efficient: bulk `sed -i` with a table of ~40 pattern substitutions across all page files in one bash pass
- slate-800 → zinc-900/60, slate-700 → zinc-800, slate-900 → zinc-950, slate-950 → zinc-950
- slate-text-100 → white, slate-text-300 → zinc-300, slate-text-400 → zinc-400

**Why:** zinc is a neutral gray with no blue tint (unlike slate which has a blue cast). zinc-950 produces a richer, more premium B2B SaaS feel than slate-950.

**How to apply:** When adding new UI, always use `dark:bg-zinc-*`, `dark:border-zinc-*`, `dark:text-zinc-*`. Never introduce slate classes in dark-mode rules. Light mode can still use `bg-white`, `bg-zinc-50`, `text-zinc-700` etc.
