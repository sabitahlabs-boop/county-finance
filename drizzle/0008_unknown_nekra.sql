ALTER TABLE `products` ADD `priceType` enum('fixed','dynamic') DEFAULT 'fixed' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `discountPercent` decimal(5,2) DEFAULT '0' NOT NULL;