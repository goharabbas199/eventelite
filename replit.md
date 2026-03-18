# EventElite — Event Agency Management Dashboard

## Stack
- **Frontend**: Vite + React + TypeScript + TanStack Query + Wouter + ShadCN UI + Tailwind
- **Backend**: Express + Drizzle ORM + PostgreSQL + Zod
- **Storage**: Cloudinary (image uploads)
- **Auth**: SESSION_SECRET env var

## Key Architecture Notes
- Single-port setup: Express serves both API and Vite frontend
- Shared types at `shared/schema.ts` (Drizzle + Zod)
- API routes defined in `shared/routes.ts` and `server/routes.ts`
- Storage abstraction via `IStorage` interface in `server/storage.ts`

## DB Tables
| Table | Purpose |
|-------|---------|
| vendors | Vendor profiles |
| vendor_products | Products per vendor |
| venues | Venue profiles |
| venue_images | Extra images for venues |
| booking_options | Pricing options per venue |
| clients | Client events |
| planned_services | Services booked per client |
| expenses | Manual expenses per client |
| payments | Client payment records |
| vendor_payments | Vendor payment records |
| tasks | Event checklist items per client |
| events | Central event entity (clientId, eventName, eventType, eventDate, venueId, guestCount, budget, status) |
| invoices | Invoice records (clientId, quotationId, invoiceNumber, amount, status, dueDate) |

## Modules / Pages
- `/` — Dashboard (KPIs, recent activity)
- `/vendors` — Vendor list + create
- `/vendors/:id` — Vendor details + products
- `/venues` — Venue list
- `/venues/create` — Create venue
- `/venues/:id` — Venue details + booking options
- `/clients` — Client list with filters, sort, CSV export
- `/clients/:id` — Client details (Financial Summary, Planned Services, Expenses, Payments, Vendor Payments, Task Checklist)
- `/events` — Events management (CRUD, status tracking: lead/pending/confirmed/completed)
- `/calendar` — Monthly event calendar view, click-to-view event details
- `/invoices` — Invoice management, generate from accepted quote, client portal link
- `/portal/:id` — Public client portal (view invoice + event details, print/PDF)
- `/budget` — Budget Planner
- `/analytics` — Analytics dashboard (revenue, expenses, profit charts)
- `/settings` — Settings page
- `/search` — Global search results

## Features Implemented
1. **Dashboard** — Quick action buttons (New Client, New Quote, Add Vendor, Budget View), KPI cards + performance KPIs (Win Rate, Avg Deal Size, Events This Month, Profit Margin), Revenue chart, Upcoming Events, Recent Clients list, Pipeline Status breakdown
2. **Settings** — Full functional 7-tab settings page: Profile (editable name/email/role/bio), Business (company info, timezone, currency), Notifications (9 toggles per group), Appearance (theme/density/accent), Plan & Billing (3-tier plan cards, billing info), Security (password change, 2FA), Support (help links, feedback)
3. **Analytics** — Revenue by month, events by type, revenue vs expenses per client, pipeline by status, Top Clients by revenue, CSV export, profit margin + completion rate KPIs
4. **Sidebar** — Pro Plan badge with ACTIVE status, "Agency Dashboard" subtitle, Menu label, active-item dot indicator
5. **Budget Planner** — Client health quick-switcher, 4 KPI cards (Budget/Committed/Paid Out/Remaining), tabbed view (Overview/Services/Expenses), category breakdown bars + pie chart
6. **Quotation Builder** — Pipeline stats bar, readiness checklist, financial summary with profit/margin, saved quotes sidebar with search + status filter tabs, print preview
7. **Financial Summary** — 6 KPI cards per client (Budget, Total Expenses, Received, Balance Due, Vendor Pending, Net Profit)
8. **Client Payment Tracker** — Track payments received from clients (date, amount, method, notes)
9. **Vendor Payment Tracker** — Track payments to vendors, mark as Paid
10. **Event Checklist** — Add/complete/delete tasks per event (keyboard-enter supported)
11. **Event Templates** — Auto-create default services on new client based on event type
12. **Profit Simulator** — Interactive markup % calculator in ClientDetails right column
13. **Events Module** — Full CRUD for events entity; status pipeline (lead → pending → confirmed → completed); auto-fills from client (eventType, guestCount, eventDate, budget); venue linking
14. **Event Calendar** — Monthly calendar grid view; events shown as color-coded chips by status; click to open event detail modal; scrollable list of events for current month
15. **Invoice System** — Create invoices manually or generate from an accepted quote (auto-fills client + amount); status tracking (unpaid/paid/overdue); mark-as-paid action; linked to client portal
16. **Client Portal** — Public URL at `/portal/:invoiceId`; shows invoice amount, status, client details, event info, and linked quote items; print/PDF button

## Event Templates
| Type | Default Services |
|------|-----------------|
| Wedding | Venue, Catering, Decoration, Photography, DJ |
| Corporate | Venue, Catering, AV Equipment, Photography |
| Birthday | Venue, Catering, Decoration, Photography |
| Engagement | Venue, Catering, Decoration, Photography |
| Conference | Venue, Catering, AV Equipment |

## Mobile / Responsive Improvements (March 2026)
- **Header**: Dark mode toggle (sun/moon), Cmd+K/Ctrl+K keyboard shortcut for search, avatar click → Settings
- **Sidebar mobile nav**: Primary tabs = Home, Clients, Events, Invoices; Calendar moved to "More" drawer
- **AI Assistant**: Mobile height fixed with `clamp()`; quick actions horizontally scrollable on mobile; mode selector is a compact `<select>` on mobile
- **Dashboard**: Pipeline value visible on all screen sizes (not hidden on mobile)
- **index.css**: `.scrollbar-hide` utility added for custom scroll containers
- All pages already have mobile card lists / responsive grid breakpoints

## UI/UX Polish & Enhancements (March 2026)
- **Input Fields**: Enhanced focus states with indigo border color; smoother transitions; consistent rounded corners (rounded-xl)
- **Textarea**: Better focus styling with indigo border; vertical resizing allowed; smooth transitions
- **Buttons & Icons**: Improved hover states with color shifts and animations; dark mode toggle has subtle rotation on hover
- **Sidebar Navigation**: Better hover states with improved contrast and subtle shadows; smooth transitions (200ms); active state now has deeper shadow
- **Dashboard Quick Actions**: Enhanced gradient colors on hover; icon scale (110%) and arrow opacity changes; improved shadow depth
- **Cards**: Added hover effects (shadow lift, border color change); smooth transitions; cursor-pointer on interactive cards
- **StatsCard**: Better hover feedback (lift, shadow, border color); only on clickable stats
- **Tables**: Row hover states with light background and subtle shadow; cursor pointer for clickable rows
- **Select Fields**: Smoother focus transitions; border color changes on focus; cursor-pointer
- **Badges & Chips**: Smooth color transitions
- **Links**: Better color transition timing across the app
- **General**: All transitions use consistent 200ms duration for fluid feel; active states have faster 75ms feedback

## Advanced Visual Effects (March 2026)
- **Glass Morphism**: Added `.glass`, `.glass-sm`, `.glass-lg`, `.glass-card` utilities with backdrop blur and transparency for modern frosted glass effects
- **3D Transforms**: 
  - `.card-3d` class applies `transform-style: preserve-3d` with 1000px perspective
  - Hover transforms: Cards rotate (rotateX/rotateY) and translate up with shadow expansion
  - Buttons use `.button-3d` for scale (1.02) and lift (-2px) on hover
  - Active state: buttons scale down (0.98) with subtle press feedback
- **Gradient Overlays**: `.gradient-overlay` and `.gradient-overlay::before` provide animated indigo-to-purple gradient on card hover
- **Depth Layering**: `.depth-1` through `.depth-4` utilities for multi-layer shadow effects creating visual hierarchy
- **Glow Effects**: `.glow-on-hover` creates indigo glow (0-40px blur radius) on interactive elements; adapts to dark mode
- **Floating Animation**: `.float-effect` keyframe animates subtle Y-axis floating (0 to -8px) over 3s loop
- **Shimmer Loading**: `.shimmer` class for loading states with animated gradient sweep
- **Hover Lift**: `.hover-lift` class for 1px upward translation with shadow-xl on interactive elements
- **Dynamic Button Feedback**: `.button-3d` active state: `translateY(2px)` press effect for tactile feel
- **Applied to**:
  - Dashboard stat cards (StatsCard component): 3D rotations + gradient overlay + glow
  - Dashboard quick action buttons: 3D button transforms + glow shadow
  - Chart and upcoming events cards: 3D transforms + gradient overlays + shadow expansion
  - Recent clients and pipeline cards: 3D depth effects
  - Event cards on Events page: 3D transforms + gradient overlays + hover lift
  - Invoice stat cards: 3D transforms + gradient overlays
  - All card components maintain responsive 3D effects on mobile (subtle, not jarring)

## Important Notes
- `budget` field stored as numeric string; always convert with `Number()` for calculations
- Payment amounts stored as `numeric` strings; convert with `String()` before insert
- `insertClientSchema` uses `z.union([z.string(), z.number()])` with transform for budget/guestCount
- `createPlannedService` path built via `buildUrl(api.plannedServices.create.path, { clientId })`
- Cloudinary upload via `/api/upload` (multipart/form-data)
