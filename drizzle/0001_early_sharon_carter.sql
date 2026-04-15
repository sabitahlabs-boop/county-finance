CREATE TABLE `businesses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`slug` varchar(100) NOT NULL,
	`businessName` varchar(255) NOT NULL,
	`businessType` varchar(50) NOT NULL DEFAULT 'retail',
	`address` text,
	`phone` varchar(30),
	`npwp` varchar(30),
	`isPkp` boolean NOT NULL DEFAULT false,
	`hasEmployees` boolean NOT NULL DEFAULT false,
	`employeeCount` int NOT NULL DEFAULT 0,
	`annualOmzetEstimate` bigint NOT NULL DEFAULT 0,
	`brandColor` varchar(10) NOT NULL DEFAULT '#2d9a5a',
	`plan` enum('free','pro','bisnis') NOT NULL DEFAULT 'free',
	`planExpiry` timestamp,
	`waNumber` varchar(20),
	`bankName` varchar(100),
	`bankAccount` varchar(50),
	`bankHolder` varchar(255),
	`onboardingCompleted` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `businesses_id` PRIMARY KEY(`id`),
	CONSTRAINT `businesses_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `monthly_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`period` varchar(7) NOT NULL,
	`totalPemasukan` bigint NOT NULL DEFAULT 0,
	`totalPengeluaran` bigint NOT NULL DEFAULT 0,
	`labaBersih` bigint NOT NULL DEFAULT 0,
	`hppTotal` bigint NOT NULL DEFAULT 0,
	`grossMarginPct` decimal(5,2) DEFAULT '0',
	`txCount` int NOT NULL DEFAULT 0,
	`taxEstimate` bigint NOT NULL DEFAULT 0,
	`lastCalculated` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monthly_cache_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`sku` varchar(50),
	`category` varchar(100),
	`hpp` bigint NOT NULL,
	`sellingPrice` bigint NOT NULL,
	`stockCurrent` int NOT NULL DEFAULT 0,
	`stockMinimum` int NOT NULL DEFAULT 5,
	`unit` varchar(20) NOT NULL DEFAULT 'pcs',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stock_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`productId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`movementType` enum('in','out','adjustment','opening') NOT NULL,
	`qty` int NOT NULL,
	`direction` int NOT NULL,
	`referenceTxId` int,
	`notes` text,
	`stockBefore` int NOT NULL,
	`stockAfter` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stock_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tax_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`periodMonth` varchar(7) NOT NULL,
	`taxCode` varchar(30) NOT NULL,
	`omzetAmount` bigint NOT NULL DEFAULT 0,
	`taxAmount` bigint NOT NULL,
	`paymentDate` varchar(10),
	`ntpn` varchar(50),
	`status` enum('LUNAS','BELUM','TERLAMBAT') NOT NULL DEFAULT 'BELUM',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tax_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tax_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taxCode` varchar(30) NOT NULL,
	`taxName` varchar(100) NOT NULL,
	`rate` decimal(10,6) NOT NULL,
	`basis` varchar(20) NOT NULL,
	`validFrom` varchar(10) NOT NULL,
	`validUntil` varchar(10) NOT NULL DEFAULT '9999-12-31',
	`conditionField` varchar(50),
	`conditionOperator` varchar(10),
	`conditionValue` varchar(100),
	`notes` text,
	`referenceLaw` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tax_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`txCode` varchar(30) NOT NULL,
	`date` varchar(10) NOT NULL,
	`type` enum('pemasukan','pengeluaran') NOT NULL,
	`category` varchar(100) NOT NULL,
	`description` text,
	`amount` bigint NOT NULL,
	`paymentMethod` varchar(30) NOT NULL DEFAULT 'tunai',
	`productId` int,
	`productQty` int,
	`productHppSnapshot` bigint,
	`taxRelated` boolean NOT NULL DEFAULT true,
	`isDeleted` boolean NOT NULL DEFAULT false,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
