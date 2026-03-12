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

## Modules / Pages
- `/` — Dashboard (KPIs, recent activity)
- `/vendors` — Vendor list + create
- `/vendors/:id` — Vendor details + products
- `/venues` — Venue list
- `/venues/create` — Create venue
- `/venues/:id` — Venue details + booking options
- `/clients` — Client list with filters, sort, CSV export
- `/clients/:id` — Client details (Financial Summary, Planned Services, Expenses, Payments, Vendor Payments, Task Checklist)
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

## Event Templates
| Type | Default Services |
|------|-----------------|
| Wedding | Venue, Catering, Decoration, Photography, DJ |
| Corporate | Venue, Catering, AV Equipment, Photography |
| Birthday | Venue, Catering, Decoration, Photography |
| Engagement | Venue, Catering, Decoration, Photography |
| Conference | Venue, Catering, AV Equipment |

## Important Notes
- `budget` field stored as numeric string; always convert with `Number()` for calculations
- Payment amounts stored as `numeric` strings; convert with `String()` before insert
- `insertClientSchema` uses `z.union([z.string(), z.number()])` with transform for budget/guestCount
- `createPlannedService` path built via `buildUrl(api.plannedServices.create.path, { clientId })`
- Cloudinary upload via `/api/upload` (multipart/form-data)
