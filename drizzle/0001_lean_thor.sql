CREATE TABLE "admin_property" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(1000),
	"type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"configuration" jsonb,
	"owner_id" varchar(255),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE "admin_property" ADD CONSTRAINT "admin_property_owner_id_admin_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."admin_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "property_name_idx" ON "admin_property" USING btree ("name");--> statement-breakpoint
CREATE INDEX "property_type_idx" ON "admin_property" USING btree ("type");--> statement-breakpoint
CREATE INDEX "property_status_idx" ON "admin_property" USING btree ("status");--> statement-breakpoint
CREATE INDEX "property_owner_idx" ON "admin_property" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "property_active_idx" ON "admin_property" USING btree ("is_active");--> statement-breakpoint
ALTER TABLE "admin_user" ADD CONSTRAINT "admin_user_email_unique" UNIQUE("email");