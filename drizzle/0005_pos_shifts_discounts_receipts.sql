-- POS Shifts (Shift Kasir)
CREATE TABLE `pos_shifts` (
  `id` int AUTO_INCREMENT NOT NULL,
  `businessId` int NOT NULL,
  `userId` int NOT NULL,
  `warehouseId` int,
  `status` enum('open','closed') NOT NULL DEFAULT 'open',
  `openedAt` timestamp NOT NULL DEFAULT (now()),
  `closedAt` timestamp,
  `openingCash` bigint NOT NULL DEFAULT 0,
  `closingCash` bigint,
  `expectedCash` bigint,
  `cashDifference` bigint,
  `totalSales` bigint NOT NULL DEFAULT 0,
  `totalTransactions` int NOT NULL DEFAULT 0,
  `totalRefunds` bigint NOT NULL DEFAULT 0,
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `pos_shifts_id` PRIMARY KEY(`id`)
);

-- Discount Codes
CREATE TABLE `discount_codes` (
  `id` int AUTO_INCREMENT NOT NULL,
  `businessId` int NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `discountType` enum('percentage','fixed') NOT NULL,
  `discountValue` bigint NOT NULL,
  `minPurchase` bigint NOT NULL DEFAULT 0,
  `maxDiscount` bigint,
  `maxUses` int,
  `currentUses` int NOT NULL DEFAULT 0,
  `validFrom` varchar(10),
  `validUntil` varchar(10),
  `isActive` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `discount_codes_id` PRIMARY KEY(`id`)
);

-- POS Receipts (groups cart items into a single checkout with split payment support)
CREATE TABLE `pos_receipts` (
  `id` int AUTO_INCREMENT NOT NULL,
  `businessId` int NOT NULL,
  `receiptCode` varchar(30) NOT NULL,
  `shiftId` int,
  `subtotal` bigint NOT NULL,
  `discountAmount` bigint NOT NULL DEFAULT 0,
  `discountCodeId` int,
  `grandTotal` bigint NOT NULL,
  `payments` json NOT NULL,
  `customerPaid` bigint NOT NULL DEFAULT 0,
  `changeAmount` bigint NOT NULL DEFAULT 0,
  `isRefunded` boolean NOT NULL DEFAULT false,
  `refundedAt` timestamp,
  `refundReason` text,
  `refundAmount` bigint,
  `clientId` int,
  `notes` text,
  `date` varchar(10) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `pos_receipts_id` PRIMARY KEY(`id`)
);

-- Add shiftId and receiptId to transactions table
ALTER TABLE `transactions` ADD COLUMN `shiftId` int;
ALTER TABLE `transactions` ADD COLUMN `receiptId` int;
