CREATE TABLE `team_invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`role` enum('manager','kasir','gudang','viewer') NOT NULL DEFAULT 'viewer',
	`permissions` json NOT NULL,
	`token` varchar(64) NOT NULL,
	`invitedBy` int NOT NULL,
	`status` enum('pending','accepted','expired') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_invites_id` PRIMARY KEY(`id`),
	CONSTRAINT `team_invites_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','manager','kasir','gudang','viewer') NOT NULL DEFAULT 'viewer',
	`permissions` json NOT NULL,
	`invitedBy` int,
	`status` enum('active','suspended') NOT NULL DEFAULT 'active',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`)
);
