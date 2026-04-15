CREATE TABLE `pro_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(64) NOT NULL,
	`email` varchar(320) NOT NULL,
	`buyerName` varchar(255),
	`notes` text,
	`isUsed` boolean NOT NULL DEFAULT false,
	`usedByUserId` int,
	`usedAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pro_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `pro_links_token_unique` UNIQUE(`token`)
);
