ALTER TABLE "clients" ADD COLUMN "guest_count" integer;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "client_notes" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "internal_notes" text;--> statement-breakpoint
ALTER TABLE "clients" DROP COLUMN "notes";--> statement-breakpoint
ALTER TABLE "venues" DROP COLUMN "note";