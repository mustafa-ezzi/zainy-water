ALTER TABLE "Admin" ADD COLUMN "license_key" varchar;--> statement-breakpoint
ALTER TABLE "Admin" ADD COLUMN "isAuthorized" boolean DEFAULT false NOT NULL;