CREATE TABLE "venue_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"venue_id" integer NOT NULL,
	"image_url" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "venues" RENAME COLUMN "image_url" TO "main_image";