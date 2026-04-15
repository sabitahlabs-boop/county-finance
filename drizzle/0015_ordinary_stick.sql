CREATE TABLE `budgets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`period` varchar(7) NOT NULL,
	`category` varchar(100) NOT NULL,
	`budgetAmount` bigint NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budgets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(30),
	`company` varchar(255),
	`address` text,
	`notes` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `debt_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`debtId` int NOT NULL,
	`amount` bigint NOT NULL,
	`paymentDate` varchar(10) NOT NULL,
	`paymentMethod` varchar(30) NOT NULL DEFAULT 'tunai',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `debt_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `debts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`type` enum('hutang','piutang') NOT NULL,
	`counterpartyName` varchar(255) NOT NULL,
	`clientId` int,
	`description` text,
	`totalAmount` bigint NOT NULL,
	`paidAmount` bigint NOT NULL DEFAULT 0,
	`dueDate` varchar(10),
	`status` enum('belum_lunas','lunas','terlambat') NOT NULL DEFAULT 'belum_lunas',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `debts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `businesses` ADD `calculatorEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `businesses` ADD `signatureUrl` text;--> statement-breakpoint
ALTER TABLE `transactions` ADD `clientId` int;