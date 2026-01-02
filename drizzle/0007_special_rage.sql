ALTER TABLE "Admin" DROP CONSTRAINT "Admin_name_unique";--> statement-breakpoint
ALTER TABLE "Admin" ADD COLUMN "clerk_id" varchar(255) NOT NULL;--> statement-breakpoint
CREATE INDEX "admin_clerk_id_idx" ON "Admin" USING btree ("clerk_id");--> statement-breakpoint
ALTER TABLE "Admin" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "Admin" DROP COLUMN "password";--> statement-breakpoint
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_clerk_id_unique" UNIQUE("clerk_id");