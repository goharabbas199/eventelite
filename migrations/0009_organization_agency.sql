CREATE TABLE "organizations" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
  "id" serial PRIMARY KEY NOT NULL,
  "full_name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "password_hash" text,
  "firebase_uid" text UNIQUE,
  "role" text NOT NULL DEFAULT 'owner',
  "phone" text,
  "bio" text,
  "avatar_url" text,
  "email_verified" boolean NOT NULL DEFAULT false,
  "google_id" text,
  "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_verifications" (
  "id" serial PRIMARY KEY NOT NULL,
  "email" text NOT NULL,
  "code" text NOT NULL,
  "type" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
INSERT INTO "organizations" ("name") VALUES ('EventElite Agency');
--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "standard_cost" numeric;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "organization_id" integer;
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "organization_id" integer;
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "organization_id" integer;
--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "organization_id" integer;
--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "organization_id" integer;
--> statement-breakpoint
ALTER TABLE "quotations" ADD COLUMN "organization_id" integer;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "organization_id" integer;
--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "organization_id" integer;
--> statement-breakpoint
UPDATE "users" SET "organization_id" = (SELECT "id" FROM "organizations");
--> statement-breakpoint
UPDATE "clients" SET "organization_id" = (SELECT "id" FROM "organizations");
--> statement-breakpoint
UPDATE "events" SET "organization_id" = (SELECT "id" FROM "organizations");
--> statement-breakpoint
UPDATE "vendors" SET "organization_id" = (SELECT "id" FROM "organizations");
--> statement-breakpoint
UPDATE "venues" SET "organization_id" = (SELECT "id" FROM "organizations");
--> statement-breakpoint
UPDATE "quotations" SET "organization_id" = (SELECT "id" FROM "organizations");
--> statement-breakpoint
UPDATE "invoices" SET "organization_id" = (SELECT "id" FROM "organizations");
--> statement-breakpoint
UPDATE "app_settings" SET "organization_id" = (SELECT "id" FROM "organizations");
--> statement-breakpoint
ALTER TABLE "app_settings" DROP CONSTRAINT "app_settings_pkey";
--> statement-breakpoint
ALTER TABLE "app_settings" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_pkey" PRIMARY KEY ("organization_id", "key");
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "clients" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "vendors" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "venues" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "quotations" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT;
--> statement-breakpoint
CREATE INDEX "users_organization_id_idx" ON "users" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "clients_organization_id_idx" ON "clients" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "events_organization_id_idx" ON "events" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "vendors_organization_id_idx" ON "vendors" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "venues_organization_id_idx" ON "venues" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "quotations_organization_id_idx" ON "quotations" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "invoices_organization_id_idx" ON "invoices" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "app_settings_organization_id_idx" ON "app_settings" USING btree ("organization_id");