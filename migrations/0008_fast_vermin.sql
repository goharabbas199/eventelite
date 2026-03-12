ALTER TABLE "planned_services" ADD COLUMN "vendor_cost" numeric;--> statement-breakpoint
ALTER TABLE "planned_services" ADD COLUMN "client_price" numeric;--> statement-breakpoint
ALTER TABLE "planned_services" ADD COLUMN "status" text DEFAULT 'Planned';