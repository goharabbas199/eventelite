ALTER TABLE "clients" ALTER COLUMN "budget" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "contact_name" text;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "contact_phone" text;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "contact_email" text;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "note" text;