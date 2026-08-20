ALTER TABLE `users` ADD `is_encryption_active` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `base_storage` integer DEFAULT 8589934592 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `invitation_bonus_storage` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `custom_storage_bonus` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `is_active` integer DEFAULT true NOT NULL;