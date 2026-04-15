CREATE TABLE `monthly_bills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`amount` bigint NOT NULL,
	`dueDay` int NOT NULL DEFAULT 1,
	`category` varchar(100) NOT NULL DEFAULT 'Tagihan',
	`icon` varchar(10) NOT NULL DEFAULT '📋',
	`isActive` boolean NOT NULL DEFAULT true,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monthly_bills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savings_goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`targetAmount` bigint NOT NULL,
	`currentAmount` bigint NOT NULL DEFAULT 0,
	`icon` varchar(10) NOT NULL DEFAULT '✈️',
	`color` varchar(10) NOT NULL DEFAULT '#3b82f6',
	`targetDate` varchar(10),
	`isCompleted` boolean NOT NULL DEFAULT false,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `savings_goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `businesses` ADD `debtEnabled` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `businesses` ADD `personalSetupDone` boolean DEFAULT false NOT NULL;