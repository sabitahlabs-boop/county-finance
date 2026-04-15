CREATE TABLE `pro_activations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderCode` varchar(100) NOT NULL,
	`buyerEmail` varchar(320),
	`buyerName` varchar(255),
	`notes` text,
	`usedByBusinessId` int,
	`usedByUserId` int,
	`usedAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pro_activations_id` PRIMARY KEY(`id`),
	CONSTRAINT `pro_activations_orderCode_unique` UNIQUE(`orderCode`)
);
