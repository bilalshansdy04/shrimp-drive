ALTER TABLE `files` ADD `is_encrypted` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `invitation_codes` ADD `encryption_key` text;--> statement-breakpoint
ALTER TABLE `users` ADD `encryption_key` text;