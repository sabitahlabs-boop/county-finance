CREATE TABLE `affiliates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`refCode` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`scalevUrl` text NOT NULL,
	`whatsapp` varchar(30),
	`isActive` boolean NOT NULL DEFAULT true,
	`clickCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `affiliates_id` PRIMARY KEY(`id`),
	CONSTRAINT `affiliates_refCode_unique` UNIQUE(`refCode`)
);
