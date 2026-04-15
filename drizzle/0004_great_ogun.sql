CREATE TABLE `product_compositions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`materialName` varchar(255) NOT NULL,
	`materialProductId` int,
	`qty` decimal(10,3) NOT NULL,
	`unit` varchar(20) NOT NULL DEFAULT 'pcs',
	`costPerUnit` bigint NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_compositions_id` PRIMARY KEY(`id`)
);
