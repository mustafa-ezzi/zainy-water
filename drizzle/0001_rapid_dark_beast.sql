CREATE TABLE "Miscellaneous" (
	"id" varchar PRIMARY KEY NOT NULL,
	"moderator_id" varchar(255) NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"isPaid" boolean NOT NULL,
	"payment" integer NOT NULL,
	"filled_bottles" integer NOT NULL,
	"empty_bottles" integer NOT NULL,
	"damaged_bottles" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "FOC" CASCADE;--> statement-breakpoint
ALTER TABLE "Miscellaneous" ADD CONSTRAINT "miscellaneous_moderator_fk" FOREIGN KEY ("moderator_id") REFERENCES "public"."Moderator"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "misc_moderator_id_idx" ON "Miscellaneous" USING btree ("moderator_id");--> statement-breakpoint
CREATE INDEX "misc_is_paid_idx" ON "Miscellaneous" USING btree ("isPaid");