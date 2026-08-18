ALTER TABLE `invitation_codes` ADD `max_uses` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `invitation_codes` ADD `used_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `invitation_codes` ADD `is_revoked` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `is_suspended` integer DEFAULT false NOT NULL;