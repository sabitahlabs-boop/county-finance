ALTER TABLE `businesses` ADD `appMode` enum('personal','umkm') DEFAULT 'umkm' NOT NULL;--> statement-breakpoint
ALTER TABLE `businesses` ADD `posEnabled` boolean DEFAULT false NOT NULL;