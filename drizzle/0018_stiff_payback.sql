ALTER TABLE "BottleUsage" ADD COLUMN "revenue" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "BottleUsage" ADD COLUMN "expenses" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "BottleUsage" ADD COLUMN "done" boolean DEFAULT false NOT NULL;