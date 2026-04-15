CREATE TABLE `bank_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`accountName` varchar(100) NOT NULL,
	`accountType` enum('bank','ewallet','cash') NOT NULL DEFAULT 'bank',
	`icon` varchar(10) NOT NULL DEFAULT '🏦',
	`color` varchar(10) NOT NULL DEFAULT '#3b82f6',
	`initialBalance` bigint NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bank_accounts_id` PRIMARY KEY(`id`)
);
