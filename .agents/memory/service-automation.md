---
name: Service automation pattern
description: How planned service creation triggers vendor payment + AI task generation; schema additions to tasks table
---

## Rule
When a planned service is saved with a vendorId, two automations run in parallel via `Promise.allSettled`:
1. A `vendor_payments` record is auto-created (status: "Unpaid", amount from service cost).
2. `runAI({ feature: "service_checklist", ... })` generates 6-10 task strings; each is persisted as a task with `serviceId` and `aiGenerated=true`.

## Schema additions to tasks table
- `service_id INTEGER` — optional FK to planned_services (nullable; nulled on service delete)
- `ai_generated BOOLEAN DEFAULT FALSE`
The application requires both fields; confirm they exist in the target database before testing this flow.

**Why:** Automation is fire-and-forget (errors logged but don't fail the 201 response), preserving data integrity for the service record itself. Tasks are detached (serviceId nulled) on service deletion to avoid orphan issues.

**How to apply:** Reconcile development with the project schema before enabling service automation. For production, use the supported Publish schema flow rather than direct DDL.

## Frontend display
- Service rows in ClientDetails.tsx show a `<Bot>` icon with task count badge when AI tasks exist.
- Clicking expands an indigo sub-row with the AI checklist (Sparkles icon header, checkboxes toggle via updateTask mutation).
- Event Checklist shows all tasks; AI-generated ones get an inline "AI" badge with Sparkles icon.
- React.Fragment with explicit key is used for the mapped service rows (not shorthand `<>`).
