ALTER TABLE "BottleUsage" ADD COLUMN "empty_returned" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "BottleUsage" ADD COLUMN "remaining_returned" integer DEFAULT 0 NOT NULL;