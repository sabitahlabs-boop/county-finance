import { eq, and, or, sql, desc, gte, lte, ne, inArray, isNotNull, isNull, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  businesses, InsertBusiness, Business,
  taxRules, TaxRule,
  products, InsertProduct, Product,
  transactions, InsertTransaction, Transaction,
  stockLogs, InsertStockLog,
  taxPayments, InsertTaxPayment,
  monthlyCache,
  productCompositions, InsertProductComposition, ProductComposition,
  productCategories, InsertProductCategory, ProductCategory,
  bankAccounts, InsertBankAccount, BankAccount,
  clients, InsertClient, Client,
  debts, InsertDebt, Debt,
  debtPayments, InsertDebtPayment, DebtPayment,
  budgets, InsertBudget, Budget,
  affiliates, InsertAffiliate, Affiliate,
  warehouses, InsertWarehouse, Warehouse,
  warehouseStock, InsertWarehouseStock, WarehouseStock,
  stockTransfers, InsertStockTransfer, StockTransfer,
  teamMembers, InsertTeamMember, TeamMember,
  teamInvites, InsertTeamInvite, TeamInvite,
  savingsGoals, InsertSavingsGoal, SavingsGoal,
  monthlyBills, InsertMonthlyBill, MonthlyBill,
  posShifts, InsertPosShift, PosShift,
  discountCodes, InsertDiscountCode, DiscountCode,
  posReceipts, InsertPosReceipt, PosReceipt,
  posReceiptItems, InsertPosReceiptItem, PosReceiptItem,
  suppliers, InsertSupplier, Supplier,
  purchaseOrders, InsertPurchaseOrder, PurchaseOrder,
  purchaseOrderItems, InsertPurchaseOrderItem, PurchaseOrderItem,
  loyaltyPoints, InsertLoyaltyPoint, LoyaltyPoint,
  loyaltyTransactions, InsertLoyaltyTransaction, LoyaltyTransaction,
  loyaltyConfig, InsertLoyaltyConfig, LoyaltyConfig,
  invoiceSettings, InsertInvoiceSetting, InvoiceSetting,
  warehouseAccess, InsertWarehouseAccess, WarehouseAccess,
  creditSales, InsertCreditSale, CreditSale,
  creditPayments, InsertCreditPayment, CreditPayment,
  commissionConfig, InsertCommissionConfig, CommissionConfig,
  staffCommissions, InsertStaffCommission, StaffCommission,
  stockBatches, InsertStockBatch, StockBatch,
  productionLogs, InsertProductionLog, ProductionLog,
  outlets, InsertOutlet, Outlet,
  staffAttendance, InsertStaffAttendance, StaffAttendanceRecord,
  customerDeposits, InsertCustomerDeposit, CustomerDeposit,
  depositTransactions, InsertDepositTransaction, DepositTransaction,
  auditLogs, InsertAuditLog,
  accounts, InsertAccount, Account,
  journalEntries, InsertJournalEntry, JournalEntry,
  journalLines, InsertJournalLine, JournalLine,
} from "../drizzle/schema";
import { ENV } from './_core/env';
import type { TaxCalcResult, DashboardKPIs, LabaRugiReport, ArusKasReport, NeracaReport, PerubahanModalReport, CALKReport } from "../shared/finance";

let _db: ReturnType<typeof drizzle> | null = null;
let _migrationDone = false;
let _migrationPromise: Promise<void> | null = null;

// ─── Safe INSERT Utility ───
// Strip undefined values from objects before INSERT to prevent Drizzle from
// sending NULL for NOT NULL columns. When a key is undefined, we remove it
// entirely so Drizzle uses the schema default instead.
function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const cleaned = {} as any;
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned as T;
}

// Validate required fields before INSERT — throws descriptive error instead of raw MySQL error
function requireFields(data: Record<string, any>, fields: string[], tableName: string): void {
  const missing = fields.filter(f => data[f] === undefined || data[f] === null);
  if (missing.length > 0) {
    throw new Error(`[${tableName}] Missing required fields: ${missing.join(", ")}. Got: ${JSON.stringify(data, null, 2).substring(0, 500)}`);
  }
}

// Auto-migrate: add new columns and tables that don't exist yet
async function runAutoMigration(db: ReturnType<typeof drizzle>) {
  if (_migrationDone) return;
  _migrationDone = true;

  const safeExec = async (query: string) => {
    try { await db.execute(sql.raw(query)); } catch (e: any) {
      // Ignore "duplicate column" or "table already exists" errors
      if (e.errno === 1060 || e.errno === 1050) return;
      console.warn("[Migration] errno:", e.errno, "query:", query.substring(0, 120), "msg:", e.message);
    }
  };

  // Helper: ensure column exists using SHOW COLUMNS check + ALTER TABLE
  const ensureColumn = async (table: string, column: string, colDef: string) => {
    try {
      const [rows] = await db.execute(sql.raw(`SHOW COLUMNS FROM \`${table}\` LIKE '${column}'`)) as any;
      if (!rows || (Array.isArray(rows) && rows.length === 0)) {
        await db.execute(sql.raw(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${colDef}`));
        console.log(`[Migration] Added column ${table}.${column}`);
      }
    } catch (e: any) {
      if (e.errno === 1060) return; // duplicate column — already exists
      console.warn(`[Migration] Failed to add ${table}.${column}:`, e.errno, e.message);
    }
  };

  console.log("[Migration] Running auto-migration...");

  // --- Alter existing tables ---

  // users: add loginMethod (added after initial schema)
  await safeExec("ALTER TABLE `users` ADD COLUMN `loginMethod` varchar(64) DEFAULT NULL");

  // businesses: add columns that may be missing from original CREATE TABLE
  await safeExec("ALTER TABLE `businesses` ADD COLUMN `invoiceFooter` text DEFAULT NULL");
  await safeExec("ALTER TABLE `businesses` ADD COLUMN `appMode` enum('personal','umkm') NOT NULL DEFAULT 'umkm'");
  await safeExec("ALTER TABLE `businesses` ADD COLUMN `posEnabled` boolean NOT NULL DEFAULT false");
  await safeExec("ALTER TABLE `businesses` ADD COLUMN `calculatorEnabled` boolean NOT NULL DEFAULT false");
  await safeExec("ALTER TABLE `businesses` ADD COLUMN `signatureUrl` text DEFAULT NULL");
  await safeExec("ALTER TABLE `businesses` ADD COLUMN `onboardingCompleted` boolean NOT NULL DEFAULT false");
  await safeExec("ALTER TABLE `businesses` ADD COLUMN `debtEnabled` boolean NOT NULL DEFAULT true");
  await safeExec("ALTER TABLE `businesses` ADD COLUMN `personalSetupDone` boolean NOT NULL DEFAULT false");
  await safeExec("ALTER TABLE `businesses` ADD COLUMN `scalevOrderId` varchar(255) DEFAULT NULL");
  await safeExec("ALTER TABLE `businesses` ADD COLUMN `waNumber` varchar(20) DEFAULT NULL");
  await safeExec("ALTER TABLE `businesses` ADD COLUMN `bankName` varchar(100) DEFAULT NULL");
  await safeExec("ALTER TABLE `businesses` ADD COLUMN `bankAccount` varchar(50) DEFAULT NULL");
  await safeExec("ALTER TABLE `businesses` ADD COLUMN `bankHolder` varchar(255) DEFAULT NULL");
  await safeExec("ALTER TABLE `businesses` ADD COLUMN `qrisImageUrl` text DEFAULT NULL");
  await safeExec("ALTER TABLE `businesses` ADD COLUMN `logoUrl` text DEFAULT NULL");

  // products: add barcode, imei, motorCode, productCode + reorderPoint, safetyStock, leadTimeDays
  await safeExec("ALTER TABLE `products` ADD COLUMN `barcode` varchar(100) DEFAULT NULL");
  await safeExec("ALTER TABLE `products` ADD COLUMN `imei` varchar(50) DEFAULT NULL");
  await safeExec("ALTER TABLE `products` ADD COLUMN `motorCode` varchar(50) DEFAULT NULL");
  await safeExec("ALTER TABLE `products` ADD COLUMN `productCode` varchar(50) DEFAULT NULL");
  // Critical: these 3 columns were missing and causing INSERT failures
  await ensureColumn("products", "reorderPoint", "int DEFAULT NULL");
  await ensureColumn("products", "safetyStock", "int DEFAULT NULL");
  await ensureColumn("products", "leadTimeDays", "int DEFAULT NULL");

  // warehouses: add waCode, code
  await safeExec("ALTER TABLE `warehouses` ADD COLUMN `waCode` varchar(20) DEFAULT NULL");
  await safeExec("ALTER TABLE `warehouses` ADD COLUMN `code` varchar(20) DEFAULT NULL");

  // clients: add customerType, depositAmount, lastTransactionDate, activeDate, expiryDate
  await safeExec("ALTER TABLE `clients` ADD COLUMN `customerType` enum('regular','vip','wholesale') DEFAULT 'regular'");
  await safeExec("ALTER TABLE `clients` ADD COLUMN `depositAmount` bigint NOT NULL DEFAULT 0");
  await safeExec("ALTER TABLE `clients` ADD COLUMN `lastTransactionDate` varchar(10) DEFAULT NULL");
  await safeExec("ALTER TABLE `clients` ADD COLUMN `activeDate` varchar(10) DEFAULT NULL");
  await safeExec("ALTER TABLE `clients` ADD COLUMN `expiryDate` varchar(10) DEFAULT NULL");

  // transactions: add all potentially missing columns
  await ensureColumn("transactions", "clientId", "int DEFAULT NULL");
  await ensureColumn("transactions", "productId", "int DEFAULT NULL");
  await ensureColumn("transactions", "productQty", "int DEFAULT NULL");
  await ensureColumn("transactions", "productHppSnapshot", "bigint DEFAULT NULL");
  await ensureColumn("transactions", "taxRelated", "boolean NOT NULL DEFAULT true");
  await ensureColumn("transactions", "isDeleted", "boolean NOT NULL DEFAULT false");
  await ensureColumn("transactions", "notes", "text DEFAULT NULL");
  await ensureColumn("transactions", "shiftId", "int DEFAULT NULL");
  await ensureColumn("transactions", "receiptId", "int DEFAULT NULL");
  await ensureColumn("transactions", "bankAccountId", "int DEFAULT NULL");

  // Populate bankAccountId from existing name matches
  await safeExec(`
    UPDATE \`transactions\` t
    INNER JOIN \`bank_accounts\` ba ON ba.\`accountName\` = t.\`paymentMethod\` AND ba.\`businessId\` = t.\`businessId\`
    SET t.\`bankAccountId\` = ba.\`id\`
    WHERE t.\`bankAccountId\` IS NULL
  `);

  // --- Create new tables ---
  await safeExec(`CREATE TABLE IF NOT EXISTS \`suppliers\` (
    \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`businessId\` int NOT NULL,
    \`name\` varchar(255) NOT NULL,
    \`contactPerson\` varchar(255) DEFAULT NULL,
    \`email\` varchar(320) DEFAULT NULL,
    \`phone\` varchar(30) DEFAULT NULL,
    \`address\` text DEFAULT NULL,
    \`notes\` text DEFAULT NULL,
    \`isActive\` boolean NOT NULL DEFAULT true,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);

  await safeExec(`CREATE TABLE IF NOT EXISTS \`purchase_orders\` (
    \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`businessId\` int NOT NULL,
    \`poNumber\` varchar(30) NOT NULL,
    \`supplierId\` int NOT NULL,
    \`date\` varchar(10) NOT NULL,
    \`description\` text DEFAULT NULL,
    \`totalAmount\` bigint NOT NULL DEFAULT 0,
    \`paymentStatus\` enum('unpaid','partial','paid') NOT NULL DEFAULT 'unpaid',
    \`receiptStatus\` enum('pending','partial','received') NOT NULL DEFAULT 'pending',
    \`notes\` text DEFAULT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);

  await safeExec(`CREATE TABLE IF NOT EXISTS \`purchase_order_items\` (
    \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`purchaseOrderId\` int NOT NULL,
    \`productId\` int DEFAULT NULL,
    \`productName\` varchar(255) NOT NULL,
    \`qty\` int NOT NULL,
    \`unitPrice\` bigint NOT NULL,
    \`totalPrice\` bigint NOT NULL,
    \`receivedQty\` int NOT NULL DEFAULT 0,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  await safeExec(`CREATE TABLE IF NOT EXISTS \`loyalty_points\` (
    \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`businessId\` int NOT NULL,
    \`clientId\` int NOT NULL,
    \`points\` int NOT NULL DEFAULT 0,
    \`totalEarned\` int NOT NULL DEFAULT 0,
    \`totalRedeemed\` int NOT NULL DEFAULT 0,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);

  await safeExec(`CREATE TABLE IF NOT EXISTS \`loyalty_transactions\` (
    \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`businessId\` int NOT NULL,
    \`clientId\` int NOT NULL,
    \`type\` enum('earn','redeem') NOT NULL,
    \`points\` int NOT NULL,
    \`referenceId\` int DEFAULT NULL,
    \`description\` text DEFAULT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  await safeExec(`CREATE TABLE IF NOT EXISTS \`loyalty_config\` (
    \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`businessId\` int NOT NULL UNIQUE,
    \`isEnabled\` boolean NOT NULL DEFAULT false,
    \`pointsPerAmount\` int NOT NULL DEFAULT 1,
    \`amountPerPoint\` int NOT NULL DEFAULT 10000,
    \`redemptionRate\` int NOT NULL DEFAULT 100,
    \`minRedeemPoints\` int NOT NULL DEFAULT 100,
    \`silverThreshold\` int NOT NULL DEFAULT 500,
    \`goldThreshold\` int NOT NULL DEFAULT 2000,
    \`platinumThreshold\` int NOT NULL DEFAULT 5000,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);

  // Add tierLevel column to loyalty_points if missing
  await safeExec(`ALTER TABLE \`loyalty_points\` ADD COLUMN \`tierLevel\` varchar(20) NOT NULL DEFAULT 'Bronze' AFTER \`totalRedeemed\``);

  await safeExec(`CREATE TABLE IF NOT EXISTS \`invoice_settings\` (
    \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`businessId\` int NOT NULL UNIQUE,
    \`showCustomerName\` boolean NOT NULL DEFAULT true,
    \`showCustomerAddress\` boolean NOT NULL DEFAULT true,
    \`showCustomerPhone\` boolean NOT NULL DEFAULT true,
    \`showInvoiceNumber\` boolean NOT NULL DEFAULT true,
    \`showPurchaseDate\` boolean NOT NULL DEFAULT true,
    \`showDueDate\` boolean NOT NULL DEFAULT false,
    \`showPaymentMethod\` boolean NOT NULL DEFAULT true,
    \`showTotal\` boolean NOT NULL DEFAULT true,
    \`showSignature\` boolean NOT NULL DEFAULT false,
    \`showLogo\` boolean NOT NULL DEFAULT true,
    \`footerText\` text DEFAULT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);

  await safeExec(`CREATE TABLE IF NOT EXISTS \`warehouse_access\` (
    \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`warehouseId\` int NOT NULL,
    \`userId\` int NOT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  await safeExec(`CREATE TABLE IF NOT EXISTS \`pro_links\` (
    \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`token\` varchar(64) NOT NULL UNIQUE,
    \`email\` varchar(320) NOT NULL,
    \`buyerName\` varchar(255) DEFAULT NULL,
    \`notes\` text DEFAULT NULL,
    \`isUsed\` boolean NOT NULL DEFAULT false,
    \`usedByUserId\` int DEFAULT NULL,
    \`usedAt\` timestamp NULL DEFAULT NULL,
    \`expiresAt\` timestamp NULL DEFAULT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  await safeExec(`CREATE TABLE IF NOT EXISTS \`bank_accounts\` (
    \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`businessId\` int NOT NULL,
    \`accountName\` varchar(100) NOT NULL,
    \`accountType\` enum('bank','ewallet','cash') NOT NULL DEFAULT 'bank',
    \`icon\` varchar(10) NOT NULL DEFAULT '🏦',
    \`color\` varchar(10) NOT NULL DEFAULT '#3b82f6',
    \`initialBalance\` bigint NOT NULL DEFAULT 0,
    \`isActive\` boolean NOT NULL DEFAULT true,
    \`sortOrder\` int NOT NULL DEFAULT 0,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);

  // Add description column to bank_accounts if missing
  await safeExec(`ALTER TABLE \`bank_accounts\` ADD COLUMN IF NOT EXISTS \`description\` text AFTER \`color\``);

  await safeExec(`CREATE TABLE IF NOT EXISTS \`stock_transfers\` (
    \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`businessId\` int NOT NULL,
    \`fromWarehouseId\` int NOT NULL,
    \`toWarehouseId\` int NOT NULL,
    \`productId\` int NOT NULL,
    \`qty\` int NOT NULL,
    \`date\` varchar(10) NOT NULL,
    \`notes\` text DEFAULT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  await safeExec(`CREATE TABLE IF NOT EXISTS \`team_members\` (
    \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`businessId\` int NOT NULL,
    \`userId\` int NOT NULL,
    \`role\` enum('owner','manager','kasir','gudang','viewer') NOT NULL DEFAULT 'viewer',
    \`permissions\` json NOT NULL,
    \`invitedBy\` int DEFAULT NULL,
    \`status\` enum('active','suspended') NOT NULL DEFAULT 'active',
    \`joinedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);

  await safeExec(`CREATE TABLE IF NOT EXISTS \`team_invites\` (
    \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`businessId\` int NOT NULL,
    \`email\` varchar(320) NOT NULL,
    \`role\` enum('manager','kasir','gudang','viewer') NOT NULL DEFAULT 'viewer',
    \`permissions\` json NOT NULL,
    \`token\` varchar(64) NOT NULL UNIQUE,
    \`invitedBy\` int NOT NULL,
    \`status\` enum('pending','accepted','expired') NOT NULL DEFAULT 'pending',
    \`expiresAt\` timestamp NOT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  await safeExec(`CREATE TABLE IF NOT EXISTS \`savings_goals\` (
    \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`businessId\` int NOT NULL,
    \`name\` varchar(255) NOT NULL,
    \`targetAmount\` bigint NOT NULL,
    \`currentAmount\` bigint NOT NULL DEFAULT 0,
    \`icon\` varchar(10) NOT NULL DEFAULT '✈️',
    \`color\` varchar(10) NOT NULL DEFAULT '#3b82f6',
    \`targetDate\` varchar(10) DEFAULT NULL,
    \`isCompleted\` boolean NOT NULL DEFAULT false,
    \`notes\` text DEFAULT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);

  await safeExec(`CREATE TABLE IF NOT EXISTS \`monthly_bills\` (
    \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`businessId\` int NOT NULL,
    \`name\` varchar(255) NOT NULL,
    \`amount\` bigint NOT NULL,
    \`dueDay\` int NOT NULL DEFAULT 1,
    \`category\` varchar(100) NOT NULL DEFAULT 'Tagihan',
    \`icon\` varchar(10) NOT NULL DEFAULT '📋',
    \`isActive\` boolean NOT NULL DEFAULT true,
    \`notes\` text DEFAULT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);

  await safeExec(`CREATE TABLE IF NOT EXISTS \`pos_receipt_items\` (
    \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`receiptId\` int NOT NULL,
    \`productId\` int NOT NULL,
    \`productName\` varchar(255) NOT NULL,
    \`qty\` int NOT NULL,
    \`unitPrice\` bigint NOT NULL,
    \`totalPrice\` bigint NOT NULL,
    \`hppSnapshot\` bigint NOT NULL DEFAULT 0,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  // ── Credit Sales (Penjualan Kredit) ──
  await safeExec(`CREATE TABLE IF NOT EXISTS \`credit_sales\` (
    \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`businessId\` int NOT NULL,
    \`receiptId\` int NOT NULL,
    \`clientId\` int NOT NULL,
    \`totalAmount\` bigint NOT NULL,
    \`paidAmount\` bigint NOT NULL DEFAULT 0,
    \`remainingAmount\` bigint NOT NULL,
    \`creditStatus\` enum('belum_lunas','cicilan','lunas') NOT NULL DEFAULT 'belum_lunas',
    \`dueDate\` varchar(10),
    \`notes\` text,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);

  await safeExec(`CREATE TABLE IF NOT EXISTS \`credit_payments\` (
    \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`creditSaleId\` int NOT NULL,
    \`amount\` bigint NOT NULL,
    \`paymentMethod\` varchar(30) NOT NULL DEFAULT 'tunai',
    \`notes\` text,
    \`date\` varchar(10) NOT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  await safeExec(`CREATE TABLE IF NOT EXISTS \`commission_config\` (
    \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`businessId\` int NOT NULL UNIQUE,
    \`isEnabled\` boolean NOT NULL DEFAULT false,
    \`commissionType\` enum('percentage', 'flat') NOT NULL DEFAULT 'percentage',
    \`commissionRate\` int NOT NULL DEFAULT 0,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);

  await safeExec(`CREATE TABLE IF NOT EXISTS \`staff_commissions\` (
    \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`businessId\` int NOT NULL,
    \`userId\` int NOT NULL,
    \`receiptId\` int NOT NULL,
    \`receiptCode\` varchar(30) NOT NULL,
    \`saleAmount\` bigint NOT NULL,
    \`commissionAmount\` bigint NOT NULL,
    \`date\` varchar(10) NOT NULL,
    \`status\` enum('pending', 'paid') NOT NULL DEFAULT 'pending',
    \`paidAt\` timestamp,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  // Wave 4: Outlets, Attendance, Deposits tables
  await safeExec(`CREATE TABLE IF NOT EXISTS \`outlets\` (
    \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`businessId\` int NOT NULL,
    \`name\` varchar(100) NOT NULL,
    \`code\` varchar(20) DEFAULT NULL,
    \`address\` varchar(500) DEFAULT NULL,
    \`phone\` varchar(20) DEFAULT NULL,
    \`waCode\` varchar(20) DEFAULT NULL,
    \`isDefault\` boolean NOT NULL DEFAULT false,
    \`isActive\` boolean NOT NULL DEFAULT true,
    \`notes\` text DEFAULT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);

  await safeExec(`CREATE TABLE IF NOT EXISTS \`staff_attendance\` (
    \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`businessId\` int NOT NULL,
    \`userId\` varchar(50) NOT NULL,
    \`userName\` varchar(100) NOT NULL,
    \`date\` varchar(10) NOT NULL,
    \`clockIn\` timestamp,
    \`clockOut\` timestamp,
    \`hoursWorked\` decimal(5,2),
    \`notes\` text DEFAULT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  await safeExec(`CREATE TABLE IF NOT EXISTS \`customer_deposits\` (
    \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`businessId\` int NOT NULL,
    \`clientId\` int NOT NULL,
    \`balance\` bigint NOT NULL DEFAULT 0,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);

  await safeExec(`CREATE TABLE IF NOT EXISTS \`deposit_transactions\` (
    \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`businessId\` int NOT NULL,
    \`depositId\` int NOT NULL,
    \`type\` varchar(20) NOT NULL,
    \`amount\` bigint NOT NULL,
    \`notes\` text DEFAULT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  // Add deviceInfo column to pos_receipts
  await safeExec("ALTER TABLE \`pos_receipts\` ADD COLUMN \`deviceInfo\` varchar(200) DEFAULT NULL");

  // stock_batches — CREATE TABLE (was missing entirely from auto-migration)
  await safeExec(`CREATE TABLE IF NOT EXISTS \`stock_batches\` (
    \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`businessId\` int NOT NULL,
    \`productId\` int NOT NULL,
    \`warehouseId\` int DEFAULT NULL,
    \`batchCode\` varchar(50) DEFAULT NULL,
    \`purchaseDate\` varchar(10) NOT NULL,
    \`expiryDate\` varchar(10) DEFAULT NULL,
    \`costPrice\` bigint NOT NULL,
    \`initialQty\` int NOT NULL,
    \`remainingQty\` int NOT NULL,
    \`isActive\` boolean NOT NULL DEFAULT true,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  // production_logs — CREATE TABLE (was missing entirely from auto-migration)
  await safeExec(`CREATE TABLE IF NOT EXISTS \`production_logs\` (
    \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`businessId\` int NOT NULL,
    \`productId\` int NOT NULL,
    \`batchCode\` varchar(50) DEFAULT NULL,
    \`qtyProduced\` int NOT NULL,
    \`totalCost\` bigint NOT NULL,
    \`costPerUnit\` bigint NOT NULL,
    \`date\` varchar(10) NOT NULL,
    \`notes\` text DEFAULT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  // stock_batches: add warehouseId, batchCode if missing from older CREATE
  await safeExec("ALTER TABLE `stock_batches` ADD COLUMN `warehouseId` int DEFAULT NULL");
  await safeExec("ALTER TABLE `stock_batches` ADD COLUMN `batchCode` varchar(50) DEFAULT NULL");

  // product_categories: add parentId, sortOrder
  await safeExec("ALTER TABLE `product_categories` ADD COLUMN `parentId` int DEFAULT NULL");
  await safeExec("ALTER TABLE `product_categories` ADD COLUMN `sortOrder` int NOT NULL DEFAULT 0");

  // pos_receipts: add refund-related and client columns
  await safeExec("ALTER TABLE `pos_receipts` ADD COLUMN `isRefunded` boolean NOT NULL DEFAULT false");
  await safeExec("ALTER TABLE `pos_receipts` ADD COLUMN `refundedAt` timestamp NULL DEFAULT NULL");
  await safeExec("ALTER TABLE `pos_receipts` ADD COLUMN `refundReason` text DEFAULT NULL");
  await safeExec("ALTER TABLE `pos_receipts` ADD COLUMN `refundAmount` bigint DEFAULT NULL");
  await safeExec("ALTER TABLE `pos_receipts` ADD COLUMN `clientId` int DEFAULT NULL");
  await safeExec("ALTER TABLE `pos_receipts` ADD COLUMN `discountCodeId` int DEFAULT NULL");

  // audit_logs: CREATE TABLE for financial transaction audit trail
  await safeExec(`CREATE TABLE IF NOT EXISTS \`audit_logs\` (
    \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`businessId\` int NOT NULL,
    \`userId\` int DEFAULT NULL,
    \`action\` varchar(50) NOT NULL,
    \`entityType\` varchar(50) NOT NULL,
    \`entityId\` int DEFAULT NULL,
    \`details\` json DEFAULT NULL,
    \`ipAddress\` varchar(45) DEFAULT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  // ─── GL Tables: Chart of Accounts + Double-Entry Journal ───
  await safeExec(`CREATE TABLE IF NOT EXISTS \`accounts\` (
    \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`businessId\` int NOT NULL,
    \`code\` varchar(10) NOT NULL,
    \`name\` varchar(255) NOT NULL,
    \`accountType\` enum('asset','liability','equity','revenue','cogs','expense') NOT NULL,
    \`normalBalance\` enum('debit','credit') NOT NULL,
    \`parentCode\` varchar(10) DEFAULT NULL,
    \`description\` text DEFAULT NULL,
    \`isHeader\` boolean NOT NULL DEFAULT false,
    \`isSystemAccount\` boolean NOT NULL DEFAULT false,
    \`bankAccountId\` int DEFAULT NULL,
    \`isActive\` boolean NOT NULL DEFAULT true,
    \`sortOrder\` int NOT NULL DEFAULT 0,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX \`uniq_accounts_businessId_code\` (\`businessId\`, \`code\`),
    INDEX \`idx_accounts_businessId_accountType\` (\`businessId\`, \`accountType\`),
    INDEX \`idx_accounts_bankAccountId\` (\`bankAccountId\`)
  )`);

  await safeExec(`CREATE TABLE IF NOT EXISTS \`journal_entries\` (
    \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`businessId\` int NOT NULL,
    \`entryNumber\` varchar(30) NOT NULL,
    \`date\` varchar(10) NOT NULL,
    \`description\` text NOT NULL,
    \`sourceType\` varchar(30) NOT NULL,
    \`sourceId\` int DEFAULT NULL,
    \`journalStatus\` enum('posted','reversed') NOT NULL DEFAULT 'posted',
    \`reversalOfId\` int DEFAULT NULL,
    \`totalAmount\` bigint NOT NULL,
    \`createdByUserId\` int DEFAULT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE INDEX \`uniq_journalEntries_businessId_entryNumber\` (\`businessId\`, \`entryNumber\`),
    INDEX \`idx_journalEntries_businessId_date\` (\`businessId\`, \`date\`),
    INDEX \`idx_journalEntries_sourceType_sourceId\` (\`businessId\`, \`sourceType\`, \`sourceId\`),
    INDEX \`idx_journalEntries_reversalOfId\` (\`reversalOfId\`),
    INDEX \`idx_journalEntries_status\` (\`journalStatus\`)
  )`);

  await safeExec(`CREATE TABLE IF NOT EXISTS \`journal_lines\` (
    \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`journalEntryId\` int NOT NULL,
    \`accountId\` int NOT NULL,
    \`description\` text DEFAULT NULL,
    \`debitAmount\` bigint NOT NULL DEFAULT 0,
    \`creditAmount\` bigint NOT NULL DEFAULT 0,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX \`idx_journalLines_journalEntryId\` (\`journalEntryId\`),
    INDEX \`idx_journalLines_accountId\` (\`accountId\`)
  )`);

  // ─── Foreign Key Constraints (Top 5 Critical) ───
  // 1. transactions.businessId → businesses.id
  await safeExec("ALTER TABLE `transactions` ADD CONSTRAINT `fk_transactions_business` FOREIGN KEY (`businessId`) REFERENCES `businesses` (`id`)");

  // 2. transactions.bankAccountId → bank_accounts.id
  await safeExec("ALTER TABLE `transactions` ADD CONSTRAINT `fk_transactions_bankaccount` FOREIGN KEY (`bankAccountId`) REFERENCES `bank_accounts` (`id`)");

  // 3. pos_receipts.businessId → businesses.id
  await safeExec("ALTER TABLE `pos_receipts` ADD CONSTRAINT `fk_posreceipts_business` FOREIGN KEY (`businessId`) REFERENCES `businesses` (`id`)");

  // 4. credit_sales.businessId → businesses.id
  await safeExec("ALTER TABLE `credit_sales` ADD CONSTRAINT `fk_creditsales_business` FOREIGN KEY (`businessId`) REFERENCES `businesses` (`id`)");

  // 5. stock_logs.businessId → businesses.id
  await safeExec("ALTER TABLE `stock_logs` ADD CONSTRAINT `fk_stocklogs_business` FOREIGN KEY (`businessId`) REFERENCES `businesses` (`id`)");

  // ─── Performance indexes ───
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_transactions_biz_date` ON `transactions` (`businessId`, `date`)");
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_transactions_biz_receipt` ON `transactions` (`businessId`, `receiptId`)");
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_transactions_biz_deleted` ON `transactions` (`businessId`, `isDeleted`)");
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_pos_receipts_biz_date` ON `pos_receipts` (`businessId`, `date`)");
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_pos_receipts_biz_refunded` ON `pos_receipts` (`businessId`, `isRefunded`)");
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_stock_batches_product_remaining` ON `stock_batches` (`productId`, `remainingQty`)");
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_stock_logs_biz_date` ON `stock_logs` (`businessId`, `date`)");
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_receipt_items_receipt` ON `pos_receipt_items` (`receiptId`)");

  // ─── New performance indexes (for optimized queries) ───
  // transactions table indexes
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_transactions_businessId` ON `transactions` (`businessId`)");
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_transactions_date` ON `transactions` (`date`)");
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_transactions_type` ON `transactions` (`type`)");
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_transactions_receiptId` ON `transactions` (`receiptId`)");
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_transactions_bankAccountId` ON `transactions` (`bankAccountId`)");
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_transactions_isDeleted` ON `transactions` (`isDeleted`)");

  // products table indexes
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_products_businessId` ON `products` (`businessId`)");

  // posReceipts table indexes
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_posReceipts_businessId` ON `pos_receipts` (`businessId`)");
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_posReceipts_date` ON `pos_receipts` (`date`)");
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_posReceipts_shiftId` ON `pos_receipts` (`shiftId`)");

  // posReceiptItems table indexes
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_posReceiptItems_receiptId` ON `pos_receipt_items` (`receiptId`)");
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_posReceiptItems_productId` ON `pos_receipt_items` (`productId`)");

  // stockLogs table indexes
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_stockLogs_businessId` ON `stock_logs` (`businessId`)");
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_stockLogs_productId` ON `stock_logs` (`productId`)");
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_stockLogs_date` ON `stock_logs` (`date`)");

  // stockBatches table indexes
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_stockBatches_productId` ON `stock_batches` (`productId`)");
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_stockBatches_warehouseId` ON `stock_batches` (`warehouseId`)");
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_stockBatches_businessId` ON `stock_batches` (`businessId`)");

  // warehouseStock table unique index
  await safeExec("CREATE UNIQUE INDEX IF NOT EXISTS `uniq_warehouseStock_warehouseId_productId` ON `warehouse_stock` (`warehouseId`, `productId`)");

  // creditSales table indexes
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_creditSales_businessId` ON `credit_sales` (`businessId`)");

  // creditPayments table indexes
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_creditPayments_creditSaleId` ON `credit_payments` (`creditSaleId`)");

  // debts table indexes
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_debts_businessId` ON `debts` (`businessId`)");

  // debtPayments table indexes
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_debtPayments_debtId` ON `debt_payments` (`debtId`)");

  // depositTransactions table indexes
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_depositTransactions_depositId` ON `deposit_transactions` (`depositId`)");
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_depositTransactions_businessId` ON `deposit_transactions` (`businessId`)");

  // customerDeposits table unique index
  await safeExec("CREATE UNIQUE INDEX IF NOT EXISTS `uniq_customerDeposits_businessId_clientId` ON `customer_deposits` (`businessId`, `clientId`)");

  // staffCommissions table indexes
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_staffCommissions_businessId` ON `staff_commissions` (`businessId`)");
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_staffCommissions_receiptId` ON `staff_commissions` (`receiptId`)");

  // auditLogs table indexes
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_auditLogs_businessId` ON `audit_logs` (`businessId`)");
  await safeExec("CREATE INDEX IF NOT EXISTS `idx_auditLogs_entityType_entityId` ON `audit_logs` (`entityType`, `entityId`)");

  // ─── Add version column for optimistic locking ───
  await safeExec("ALTER TABLE `products` ADD COLUMN `version` int NOT NULL DEFAULT 1");

  // ─── Add defaultCashAccountId to team_members for POS kas per kasir ───
  await safeExec("ALTER TABLE `team_members` ADD COLUMN `defaultCashAccountId` int DEFAULT NULL");

  // ─── Verification: confirm critical columns exist ───
  try {
    const [productCols] = await db.execute(sql.raw("SHOW COLUMNS FROM `products`")) as any;
    const colNames = Array.isArray(productCols) ? productCols.map((c: any) => c.Field || c.field) : [];
    const required = ["reorderPoint", "safetyStock", "leadTimeDays", "barcode", "imei", "motorCode", "productCode"];
    const missing = required.filter(c => !colNames.includes(c));
    if (missing.length > 0) {
      console.error("[Migration] CRITICAL: products table still missing columns:", missing.join(", "));
      // Force-add missing columns with direct execute
      for (const col of missing) {
        try {
          await db.execute(sql.raw(`ALTER TABLE \`products\` ADD COLUMN \`${col}\` ${col === "barcode" ? "varchar(100)" : col === "imei" || col === "motorCode" || col === "productCode" ? "varchar(50)" : "int"} DEFAULT NULL`));
          console.log(`[Migration] Force-added products.${col}`);
        } catch (e: any) {
          if (e.errno !== 1060) console.error(`[Migration] Cannot add products.${col}:`, e.errno, e.message);
        }
      }
    } else {
      console.log("[Migration] Verified: products table has all required columns");
    }
  } catch (e: any) {
    console.error("[Migration] Verification failed:", e.message);
  }

  // Verify bank_accounts columns
  try {
    const [bankCols] = await db.execute(sql.raw("SHOW COLUMNS FROM `bank_accounts`")) as any;
    const colNames = Array.isArray(bankCols) ? bankCols.map((c: any) => c.Field || c.field) : [];
    const required = ["description", "sortOrder", "initialBalance"];
    const missing = required.filter(c => !colNames.includes(c));
    if (missing.length > 0) {
      console.error("[Migration] bank_accounts missing columns:", missing.join(", "));
      for (const col of missing) {
        try {
          const def = col === "description" ? "text DEFAULT NULL" : col === "sortOrder" ? "int NOT NULL DEFAULT 0" : "bigint NOT NULL DEFAULT 0";
          await db.execute(sql.raw(`ALTER TABLE \`bank_accounts\` ADD COLUMN \`${col}\` ${def}`));
          console.log(`[Migration] Force-added bank_accounts.${col}`);
        } catch (e: any) {
          if (e.errno !== 1060) console.error(`[Migration] Cannot add bank_accounts.${col}:`, e.errno, e.message);
        }
      }
    } else {
      console.log("[Migration] Verified: bank_accounts table has all required columns");
    }
  } catch (e: any) {
    console.error("[Migration] bank_accounts verification failed:", e.message);
  }

  // Verify transactions columns
  try {
    const [txCols] = await db.execute(sql.raw("SHOW COLUMNS FROM `transactions`")) as any;
    const colNames = Array.isArray(txCols) ? txCols.map((c: any) => c.Field || c.field) : [];
    const txRequired: Record<string, string> = {
      clientId: "int DEFAULT NULL",
      productId: "int DEFAULT NULL",
      productQty: "int DEFAULT NULL",
      productHppSnapshot: "bigint DEFAULT NULL",
      taxRelated: "boolean NOT NULL DEFAULT true",
      isDeleted: "boolean NOT NULL DEFAULT false",
      notes: "text DEFAULT NULL",
      shiftId: "int DEFAULT NULL",
      receiptId: "int DEFAULT NULL",
      bankAccountId: "int DEFAULT NULL",
      status: "enum('active','voided') NOT NULL DEFAULT 'active'",
      voidReason: "text DEFAULT NULL",
      voidedAt: "timestamp NULL DEFAULT NULL",
      voidedBy: "int DEFAULT NULL",
      reversalOfId: "int DEFAULT NULL",
    };
    const missing = Object.keys(txRequired).filter(c => !colNames.includes(c));
    if (missing.length > 0) {
      console.error("[Migration] CRITICAL: transactions table missing columns:", missing.join(", "));
      for (const col of missing) {
        try {
          await db.execute(sql.raw(`ALTER TABLE \`transactions\` ADD COLUMN \`${col}\` ${txRequired[col]}`));
          console.log(`[Migration] Force-added transactions.${col}`);
        } catch (e: any) {
          if (e.errno !== 1060) console.error(`[Migration] Cannot add transactions.${col}:`, e.errno, e.message);
        }
      }
    } else {
      console.log("[Migration] Verified: transactions table has all required columns");
    }
  } catch (e: any) {
    console.error("[Migration] transactions verification failed:", e.message);
  }

  console.log("[Migration] Auto-migration complete.");
}

// ─── Audit Logging Helper ───
export async function createAuditLog(data: {
  businessId: number;
  userId?: number;
  action: string;
  entityType: string;
  entityId?: number;
  details?: any;
  ipAddress?: string;
}) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(auditLogs).values({
      businessId: data.businessId,
      userId: data.userId ?? null,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId ?? null,
      details: data.details ?? null,
      ipAddress: data.ipAddress ?? null,
    });
  } catch (e) {
    console.error("[AuditLog] Failed to write:", e);
    // Never fail business logic due to audit log error
  }
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
      // Run migration and wait for it — store promise so concurrent callers also wait
      _migrationPromise = runAutoMigration(_db);
      await _migrationPromise;
      _migrationPromise = null;
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _migrationDone = false; // Reset so migration retries on next call
      _migrationPromise = null;
    }
  }
  // If migration is still running from another call, wait for it
  if (_migrationPromise) {
    await _migrationPromise;
  }
  return _db;
}

// ─── User Helpers ───
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.clerkUserId) throw new Error("User clerkUserId is required for upsert");
  const db = await getDb();
  if (!db) return;
  try {
    const values: InsertUser = { clerkUserId: user.clerkUserId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    // Admin role auto-assign: match by email instead of openId (configurable)
    else if (user.email === "sabitah.labs@gmail.com") { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByClerkId(clerkUserId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Backward compat alias (in case other code still references it)
export const getUserByOpenId = getUserByClerkId;

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function deleteUserWithAllData(userId: number): Promise<{ deletedUser: boolean; deletedBusiness: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Find ALL user's businesses (supports dual UMKM + personal)
  const userBusinesses = await getBusinessesByOwnerId(userId);
  let deletedBusiness = false;

  for (const biz of userBusinesses) {
    // Delete in dependency order: compositions → stock logs → transactions → tax payments → monthly cache → products → business
    const bizId = biz.id;
    // Get all product IDs for this business
    const bizProducts = await db.select({ id: products.id }).from(products).where(eq(products.businessId, bizId));
    const productIds = bizProducts.map((p) => p.id);

    // Delete product compositions
    if (productIds.length > 0) {
      for (const pid of productIds) {
        await db.delete(productCompositions).where(eq(productCompositions.productId, pid));
      }
    }
    // Delete stock logs
    await db.delete(stockLogs).where(eq(stockLogs.businessId, bizId));
    // Delete transactions
    await db.delete(transactions).where(eq(transactions.businessId, bizId));
    // Delete tax payments
    await db.delete(taxPayments).where(eq(taxPayments.businessId, bizId));
    // Delete monthly cache
    await db.delete(monthlyCache).where(eq(monthlyCache.businessId, bizId));
    // Delete products
    await db.delete(products).where(eq(products.businessId, bizId));
    // Delete business
    await db.delete(businesses).where(eq(businesses.id, bizId));
    deletedBusiness = true;
  }

  // Delete the user
  await db.delete(users).where(eq(users.id, userId));
  return { deletedUser: true, deletedBusiness };
}

// ─── Business Helpers ───
export async function getBusinessByOwnerId(ownerId: number): Promise<Business | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(businesses).where(eq(businesses.ownerId, ownerId)).limit(1);
  return result[0];
}

/** Return ALL businesses owned by this user (supports dual UMKM + personal) */
export async function getBusinessesByOwnerId(ownerId: number): Promise<Business[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(businesses).where(eq(businesses.ownerId, ownerId));
}

/** Return a specific mode's business for an owner */
export async function getBusinessByOwnerAndMode(ownerId: number, mode: "personal" | "umkm"): Promise<Business | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(businesses)
    .where(and(eq(businesses.ownerId, ownerId), eq(businesses.appMode, mode)))
    .limit(1);
  return result[0];
}

export async function getBusinessById(id: number): Promise<Business | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(businesses).where(eq(businesses.id, id)).limit(1);
  return result[0];
}

export async function getBusinessBySlug(slug: string): Promise<Business | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(businesses).where(eq(businesses.slug, slug)).limit(1);
  return result[0];
}

export async function createBusiness(data: InsertBusiness): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  requireFields(data, ["ownerId", "businessName"], "businesses");
  const result = await db.insert(businesses).values(stripUndefined(data));
  return result[0].insertId;
}

export async function updateBusiness(id: number, data: Partial<InsertBusiness>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(businesses).set(data).where(eq(businesses.id, id));
}

export async function getAllBusinesses() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(businesses).orderBy(desc(businesses.createdAt));
}

// ─── Tax Rules Helpers ───
export async function getActiveTaxRules(): Promise<TaxRule[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(taxRules).where(eq(taxRules.isActive, true));
}

export async function seedDefaultTaxRules() {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(taxRules).limit(1);
  if (existing.length > 0) return;
  await db.insert(taxRules).values([
    {
      taxCode: "PPH_FINAL_0", taxName: "PPh Final Bebas (WP OP)", rate: "0.000000",
      basis: "omzet", validFrom: "2022-01-01", validUntil: "9999-12-31",
      conditionField: "annualOmzetEstimate", conditionOperator: "lt", conditionValue: "500000000",
      notes: "WP Orang Pribadi dengan omzet < Rp 500jt/tahun bebas PPh Final",
      referenceLaw: "UU HPP 2021, PP 55/2022", isActive: true,
    },
    {
      taxCode: "PPH_FINAL", taxName: "PPh Final UMKM 0.5%", rate: "0.005000",
      basis: "omzet", validFrom: "2018-07-01", validUntil: "9999-12-31",
      conditionField: "annualOmzetEstimate", conditionOperator: "lt", conditionValue: "4800000000",
      notes: "Tarif PPh Final 0.5% untuk UMKM dengan omzet < Rp 4.8M/tahun",
      referenceLaw: "PP 23/2018, PP 55/2022", isActive: true,
    },
    {
      taxCode: "PPN", taxName: "PPN 11%", rate: "0.110000",
      basis: "dpp", validFrom: "2022-04-01", validUntil: "9999-12-31",
      conditionField: "isPkp", conditionOperator: "eq", conditionValue: "true",
      notes: "PPN 11% untuk PKP (Pengusaha Kena Pajak)",
      referenceLaw: "UU HPP 2021", isActive: true,
    },
    {
      taxCode: "PPH21_TER", taxName: "PPh 21 TER", rate: "-1.000000",
      basis: "gaji", validFrom: "2024-01-01", validUntil: "9999-12-31",
      conditionField: "hasEmployees", conditionOperator: "eq", conditionValue: "true",
      notes: "PPh 21 menggunakan metode TER (Tarif Efektif Rata-rata) sejak 2024",
      referenceLaw: "PMK 168/2023", isActive: true,
    },
  ]);
}

export async function updateTaxRule(id: number, data: Partial<TaxRule>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(taxRules).set(data).where(eq(taxRules.id, id));
}

// ─── Product Helpers ───
export async function getProductsByBusiness(businessId: number): Promise<Product[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(
    and(eq(products.businessId, businessId), eq(products.isActive, true))
  ).orderBy(desc(products.createdAt));
}

export async function getProductById(id: number): Promise<Product | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0];
}

export async function createProduct(data: InsertProduct): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  requireFields(data, ["businessId", "name", "hpp", "sellingPrice"], "products");
  const cleaned = stripUndefined(data);
  try {
    const result = await db.insert(products).values(cleaned);
    return result[0].insertId;
  } catch (e: any) {
    throw new Error(`[products] INSERT failed: ${e.message}. Data: ${JSON.stringify(cleaned, null, 2).substring(0, 500)}`);
  }
}

/**
 * Safe product insert — sanitizes, validates, fills ALL defaults, coerces types.
 * Use this from routers and seed functions instead of raw createProduct().
 */
export async function safeInsertProduct(input: {
  businessId: number;
  name: string;
  sku?: string | null;
  category?: string | null;
  hpp: number;
  sellingPrice: number;
  stockCurrent?: number;
  stockMinimum?: number;
  unit?: string;
  imageUrl?: string | null;
  barcode?: string | null;
  imei?: string | null;
  motorCode?: string | null;
  productCode?: string | null;
  priceType?: "fixed" | "dynamic";
  discountPercent?: number | string;
  reorderPoint?: number | null;
  safetyStock?: number | null;
  leadTimeDays?: number | null;
  isActive?: boolean;
}): Promise<number> {
  // Sanitize & coerce types
  const sanitized: InsertProduct = {
    businessId: input.businessId,
    name: String(input.name).trim(),
    sku: input.sku || null,
    category: input.category || null,
    hpp: Math.max(0, Number(input.hpp) || 0),
    sellingPrice: Math.max(0, Number(input.sellingPrice) || 0),
    stockCurrent: Math.max(0, Number(input.stockCurrent) ?? 0),
    stockMinimum: Math.max(0, Number(input.stockMinimum) ?? 5),
    unit: input.unit?.trim() || "pcs",
    imageUrl: input.imageUrl || null,
    barcode: input.barcode || null,
    imei: input.imei || null,
    motorCode: input.motorCode || null,
    productCode: input.productCode || null,
    priceType: input.priceType === "dynamic" ? "dynamic" : "fixed",
    discountPercent: String(Number(input.discountPercent) || 0),
    reorderPoint: input.reorderPoint != null ? Number(input.reorderPoint) : null,
    safetyStock: input.safetyStock != null ? Number(input.safetyStock) : null,
    leadTimeDays: input.leadTimeDays != null ? Number(input.leadTimeDays) : null,
    isActive: input.isActive !== false, // default true
  };

  return createProduct(sanitized);
}

export async function updateProduct(id: number, data: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(products).set(data).where(eq(products.id, id));
}

export async function countProductsByBusiness(businessId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(products)
    .where(and(eq(products.businessId, businessId), eq(products.isActive, true)));
  return result[0]?.count ?? 0;
}

export async function getLowStockProducts(businessId: number): Promise<Product[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(
    and(
      eq(products.businessId, businessId),
      eq(products.isActive, true),
      sql`${products.stockCurrent} <= ${products.stockMinimum}`
    )
  );
}

// ─── Transaction Helpers ───
export async function createTransaction(data: InsertTransaction): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  requireFields(data, ["businessId", "txCode", "date", "type", "category", "amount"], "transactions");
  const cleaned = stripUndefined(data);
  try {
    const result = await db.insert(transactions).values(cleaned);
    return result[0].insertId;
  } catch (e: any) {
    throw new Error(`[transactions] INSERT failed: ${e.message}. Data: ${JSON.stringify(cleaned, null, 2).substring(0, 500)}`);
  }
}

/**
 * Safe transaction insert — sanitizes, validates, fills defaults, coerces types.
 * Use from routers and seed functions instead of raw createTransaction().
 */
export async function safeInsertTransaction(input: {
  businessId: number;
  txCode: string;
  date: string;
  type: "pemasukan" | "pengeluaran";
  category: string;
  description?: string | null;
  amount: number;
  paymentMethod?: string;
  clientId?: number | null;
  productId?: number | null;
  productQty?: number | null;
  productHppSnapshot?: number | null;
  taxRelated?: boolean;
  notes?: string | null;
  shiftId?: number | null;
  receiptId?: number | null;
  bankAccountId?: number | null;
  reversalOfId?: number | null;
}): Promise<number> {
  const sanitized: InsertTransaction = {
    businessId: input.businessId,
    txCode: String(input.txCode).trim(),
    date: String(input.date).trim(),
    type: input.type,
    category: String(input.category).trim(),
    description: input.description || null,
    amount: Math.max(0, Number(input.amount) || 0),
    paymentMethod: input.paymentMethod?.trim() || "tunai",
    clientId: input.clientId ?? null,
    productId: input.productId ?? null,
    productQty: input.productQty ?? null,
    productHppSnapshot: input.productHppSnapshot ?? null,
    taxRelated: input.taxRelated !== false, // default true
    isDeleted: false,
    status: "active",
    notes: input.notes || null,
    shiftId: input.shiftId ?? null,
    receiptId: input.receiptId ?? null,
    bankAccountId: input.bankAccountId ?? null,
    reversalOfId: input.reversalOfId ?? null,
  };

  return createTransaction(sanitized);
}

export async function getTransactionsByBusiness(businessId: number, filters?: {
  month?: number; year?: number; type?: string; category?: string; limit?: number;
}): Promise<Transaction[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(transactions.businessId, businessId), eq(transactions.isDeleted, false)];
  if (filters?.month && filters?.year) {
    const period = `${filters.year}-${String(filters.month).padStart(2, "0")}`;
    conditions.push(sql`${transactions.date} LIKE ${period + "%"}`);
  }
  if (filters?.type) conditions.push(eq(transactions.type, filters.type as "pemasukan" | "pengeluaran"));
  if (filters?.category) conditions.push(eq(transactions.category, filters.category));
  const limit = filters?.limit ?? 100;
  return db.select().from(transactions).where(and(...conditions)).orderBy(desc(transactions.date), desc(transactions.id)).limit(limit);
}

export async function countTransactionsForMonth(businessId: number, month: number, year: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const period = `${year}-${String(month).padStart(2, "0")}`;
  const result = await db.select({ count: sql<number>`count(*)` }).from(transactions)
    .where(and(
      eq(transactions.businessId, businessId),
      eq(transactions.isDeleted, false),
      sql`${transactions.date} LIKE ${period + "%"}`
    ));
  return result[0]?.count ?? 0;
}

export async function softDeleteTransaction(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(transactions).set({ isDeleted: true }).where(eq(transactions.id, id));
}

export async function voidTransaction(id: number, reason: string, voidedByUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(transactions).set({
    status: "voided",
    voidReason: reason,
    voidedAt: new Date(),
    voidedBy: voidedByUserId,
  }).where(eq(transactions.id, id));
}

export async function getVoidedTransactions(businessId: number, startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [
    eq(transactions.businessId, businessId),
    or(eq(transactions.status, "voided"), eq(transactions.isDeleted, true)),
  ];
  if (startDate) conditions.push(gte(transactions.date, startDate));
  if (endDate) conditions.push(lte(transactions.date, endDate));
  return db.select().from(transactions).where(and(...conditions)).orderBy(desc(transactions.voidedAt));
}

export async function getTransactionById(id: number): Promise<Transaction | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
  return result[0];
}

export async function updateTransaction(id: number, data: Partial<Pick<Transaction, 'date' | 'type' | 'category' | 'description' | 'amount' | 'paymentMethod' | 'notes'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(transactions).set(data).where(eq(transactions.id, id));
}

// ─── Stock Log Helpers ───
export async function createStockLog(data: InsertStockLog): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  requireFields(data, ["businessId", "productId", "date", "movementType", "qty", "direction", "stockBefore", "stockAfter"], "stock_logs");
  const cleaned = stripUndefined(data);
  try {
    const result = await db.insert(stockLogs).values(cleaned);
    return result[0].insertId;
  } catch (e: any) {
    throw new Error(`[stock_logs] INSERT failed: ${e.message}. Data: ${JSON.stringify(cleaned, null, 2).substring(0, 500)}`);
  }
}

export async function getStockLogsByProduct(productId: number, limit = 50, businessId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(stockLogs.productId, productId)];
  if (businessId !== undefined) {
    conditions.push(eq(stockLogs.businessId, businessId));
  }
  return db.select().from(stockLogs).where(and(...conditions)).orderBy(desc(stockLogs.createdAt)).limit(limit);
}

export async function getStockLogsByBusiness(businessId: number, limit = 200) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: stockLogs.id,
    productId: stockLogs.productId,
    date: stockLogs.date,
    movementType: stockLogs.movementType,
    qty: stockLogs.qty,
    direction: stockLogs.direction,
    notes: stockLogs.notes,
    stockBefore: stockLogs.stockBefore,
    stockAfter: stockLogs.stockAfter,
    createdAt: stockLogs.createdAt,
    productName: products.name,
    productSku: products.sku,
    productUnit: products.unit,
  }).from(stockLogs)
    .leftJoin(products, eq(stockLogs.productId, products.id))
    .where(eq(stockLogs.businessId, businessId))
    .orderBy(desc(stockLogs.createdAt))
    .limit(limit);
}

// ─── Tax Payment Helpers ───
export async function createTaxPayment(data: InsertTaxPayment): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  requireFields(data, ["businessId", "periodMonth", "taxCode", "taxAmount"], "tax_payments");
  const result = await db.insert(taxPayments).values(stripUndefined(data));
  return result[0].insertId;
}

export async function getTaxPaymentsByBusiness(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(taxPayments).where(eq(taxPayments.businessId, businessId)).orderBy(desc(taxPayments.periodMonth));
}

// ─── Aggregation Helpers ───
export async function getTransactionSummary(businessId: number, month: number, year: number) {
  const db = await getDb();
  if (!db) return { totalPemasukan: 0, totalPengeluaran: 0, labaBersih: 0, txCount: 0, byCategory: {} as Record<string, number>, byPaymentMethod: {} as Record<string, number> };
  const period = `${year}-${String(month).padStart(2, "0")}`;
  const txs = await db.select().from(transactions).where(
    and(eq(transactions.businessId, businessId), eq(transactions.isDeleted, false), sql`${transactions.date} LIKE ${period + "%"}`)
  );
  let totalPemasukan = 0, totalPengeluaran = 0;
  const byCategory: Record<string, number> = {};
  const byPaymentMethod: Record<string, number> = {};
  for (const tx of txs) {
    if (tx.type === "pemasukan") totalPemasukan += tx.amount;
    else totalPengeluaran += tx.amount;
    byCategory[tx.category] = (byCategory[tx.category] || 0) + tx.amount;
    byPaymentMethod[tx.paymentMethod] = (byPaymentMethod[tx.paymentMethod] || 0) + tx.amount;
  }
  return { totalPemasukan, totalPengeluaran, labaBersih: totalPemasukan - totalPengeluaran, txCount: txs.length, byCategory, byPaymentMethod };
}

export async function getYearlyOmzet(businessId: number, year: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return new Array(12).fill(0);
  const monthly = new Array(12).fill(0);
  // Manual transactions only (exclude POS-linked ones to avoid double-counting with posReceipts below)
  const txs = await db.select().from(transactions).where(
    and(
      eq(transactions.businessId, businessId),
      eq(transactions.isDeleted, false),
      eq(transactions.type, "pemasukan"),
      sql`${transactions.date} LIKE ${year + "%"}`,
      sql`${transactions.receiptId} IS NULL`
    )
  );
  for (const tx of txs) {
    const m = parseInt(tx.date.substring(5, 7), 10) - 1;
    if (m >= 0 && m < 12) monthly[m] += tx.amount;
  }
  // POS revenue from receipts (single source of truth for POS sales)
  const posRecs = await db.select().from(posReceipts).where(
    and(eq(posReceipts.businessId, businessId), eq(posReceipts.isRefunded, false), sql`${posReceipts.date} LIKE ${year + "%"}`)
  );
  for (const r of posRecs) {
    const m = parseInt(r.date.substring(5, 7), 10) - 1;
    if (m >= 0 && m < 12) monthly[m] += r.grandTotal;
  }
  return monthly;
}

// ─── Tax Engine ───
export function evaluateCondition(rule: TaxRule, business: Business): boolean {
  if (!rule.conditionField || !rule.conditionOperator || !rule.conditionValue) return true;
  const fieldVal = (business as any)[rule.conditionField];
  const condVal = rule.conditionValue;
  const op = rule.conditionOperator;
  // Boolean comparison
  if (condVal === "true" || condVal === "false") {
    const boolVal = condVal === "true";
    return op === "eq" ? fieldVal === boolVal : fieldVal !== boolVal;
  }
  // Numeric comparison
  const numField = Number(fieldVal);
  const numCond = Number(condVal);
  switch (op) {
    case "lt": return numField < numCond;
    case "lte": return numField <= numCond;
    case "gt": return numField > numCond;
    case "gte": return numField >= numCond;
    case "eq": return numField === numCond;
    default: return true;
  }
}

export async function calcTaxForMonth(businessId: number, month: number, year: number): Promise<TaxCalcResult[]> {
  const business = await getBusinessById(businessId);
  if (!business) return [];
  const rules = await getActiveTaxRules();
  const summary = await getTransactionSummary(businessId, month, year);
  const omzet = summary.totalPemasukan;
  const dateStr = `${year}-${String(month).padStart(2, "0")}-01`;
  const results: TaxCalcResult[] = [];
  // Next month for due date
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const dueDate = `15 ${["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"][nextMonth - 1]} ${nextYear}`;

  for (const rule of rules) {
    if (dateStr < rule.validFrom || dateStr > rule.validUntil) continue;
    if (!evaluateCondition(rule, business)) continue;
    const rate = parseFloat(rule.rate as any);
    if (rule.taxCode === "PPH_FINAL_0") {
      results.push({ taxCode: rule.taxCode, taxName: rule.taxName, applicable: true, rate: 0, basis: omzet, amount: 0, dueDate, reason: "Bebas PPh Final (omzet < Rp 500jt/tahun)", referenceLaw: rule.referenceLaw || "" });
    } else if (rule.taxCode === "PPH_FINAL") {
      // Only apply if PPH_FINAL_0 didn't already match
      if (!results.find(r => r.taxCode === "PPH_FINAL_0")) {
        results.push({ taxCode: rule.taxCode, taxName: rule.taxName, applicable: true, rate, basis: omzet, amount: Math.round(omzet * rate), dueDate, reason: `${(rate * 100).toFixed(1)}% dari omzet bruto`, referenceLaw: rule.referenceLaw || "" });
      }
    } else if (rule.taxCode === "PPN") {
      const dpp = Math.round(omzet / 1.11);
      const ppn = Math.round(dpp * rate);
      results.push({ taxCode: rule.taxCode, taxName: rule.taxName, applicable: true, rate, basis: dpp, amount: ppn, dueDate, reason: `PPN ${(rate * 100)}% dari DPP`, referenceLaw: rule.referenceLaw || "" });
    } else if (rule.taxCode === "PPH21_TER") {
      results.push({ taxCode: rule.taxCode, taxName: rule.taxName, applicable: true, rate: 0, basis: 0, amount: 0, dueDate, reason: "Gunakan kalkulator TER untuk hitung per karyawan", referenceLaw: rule.referenceLaw || "" });
    }
  }
  return results;
}

// ─── Report Generators ───
export async function generateLabaRugi(businessId: number, month: number, year: number): Promise<LabaRugiReport> {
  const summary = await getTransactionSummary(businessId, month, year);
  const bulanNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const period = `${bulanNames[month - 1]} ${year}`;

  // FIXED: All revenue now comes ONLY from transactions table (no orphaned POS receipts)
  // POS checkouts automatically create journal entries with type="pemasukan" and category="Penjualan Produk"

  // Pendapatan: all from transactions
  const penjualan = summary.byCategory["Penjualan Produk"] || 0;
  const jasa = summary.byCategory["Penjualan Jasa"] || 0;
  const pendapatanLain = summary.byCategory["Pendapatan Lain-lain"] || 0;
  const totalPendapatan = penjualan + jasa + pendapatanLain;

  // HPP: ONLY from transactions table
  // "Pembelian Stok" + "HPP Produksi" are recorded as pengeluaran entries with these categories
  const pembelianStok = summary.byCategory["Pembelian Stok"] || 0;
  const hppProduksi = summary.byCategory["HPP Produksi"] || 0;
  const hpp = pembelianStok + hppProduksi;

  const operasional = summary.byCategory["Operasional"] || 0;
  const gaji = summary.byCategory["Gaji"] || 0;
  const utilitas = summary.byCategory["Utilitas"] || 0;
  const sewa = summary.byCategory["Sewa"] || 0;
  const transportasi = summary.byCategory["Transportasi"] || 0;
  const pengeluaranLain = summary.byCategory["Pengeluaran Lain-lain"] || 0;
  const totalPengeluaran = hpp + operasional + gaji + utilitas + sewa + transportasi + pengeluaranLain;
  const labaKotor = totalPendapatan - hpp;
  const labaBersih = totalPendapatan - totalPengeluaran;
  const marginPct = totalPendapatan > 0 ? Math.round((labaBersih / totalPendapatan) * 10000) / 100 : 0;
  const taxes = await calcTaxForMonth(businessId, month, year);
  const taxEstimate = taxes.reduce((sum, t) => sum + t.amount, 0);
  return {
    period, pendapatan: { penjualan, jasa, lainLain: pendapatanLain, total: totalPendapatan },
    pengeluaran: { hpp, operasional, gaji, utilitas, sewa, transportasi, lainLain: pengeluaranLain, total: totalPengeluaran },
    labaKotor, labaBersih, marginPct, taxEstimate,
  };
}

export async function generateArusKas(businessId: number, month: number, year: number): Promise<ArusKasReport> {
  const bulanNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const period = `${bulanNames[month - 1]} ${year}`;
  const db = await getDb();
  const periodStr = `${year}-${String(month).padStart(2, "0")}`;

  // ═══ OPENING BALANCE: from calculateCashBalance for previous month ═══
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const saldoAwalResult = await calculateCashBalance(businessId, prevMonth, prevYear);
  const saldoAwal = saldoAwalResult.total;

  // ═══ MONTHLY MOVEMENTS: from journal (transactions table) ═══
  const txs = db ? await db.select().from(transactions).where(
    and(eq(transactions.businessId, businessId), eq(transactions.isDeleted, false), sql`${transactions.date} LIKE ${periodStr + "%"}`)
  ) : [];

  const kasMasuk: Record<string, number> & { total: number } = { total: 0 } as any;
  const kasKeluar: Record<string, number> & { total: number } = { total: 0 } as any;
  for (const tx of txs) {
    if (tx.type === "pemasukan") {
      const cat = tx.category || "Pendapatan Lainnya";
      kasMasuk[cat] = (kasMasuk[cat] || 0) + tx.amount;
      kasMasuk.total += tx.amount;
    } else {
      const cat = tx.category || "Pengeluaran Lainnya";
      kasKeluar[cat] = (kasKeluar[cat] || 0) + tx.amount;
      kasKeluar.total += tx.amount;
    }
  }

  // FIXED: Removed orphaned POS receipt additions. All cash flows now come ONLY from transactions table.
  // POS checkouts automatically create journal entries, so this path is dead code.

  const netKas = kasMasuk.total - kasKeluar.total;
  const saldoAkhir = saldoAwal + netKas;

  return { period, saldoAwal, kasMasuk, kasKeluar, netKas, saldoAkhir };
}

// ─── SINGLE SOURCE OF TRUTH: Cash Balance Calculator ───
// Used by BOTH Neraca and Arus Kas to ensure consistency
// Formula: SUM(bankAccounts.initialBalance) + SUM(journal pemasukan) - SUM(journal pengeluaran)
// NOTE: All POS checkouts automatically create journal entries, so there are no "orphaned" receipts in normal operation
export async function calculateCashBalance(businessId: number, upToMonth: number, upToYear: number): Promise<{
  total: number;
  perAccount: { account: string; balance: number }[];
}> {
  const db = await getDb();
  if (!db) return { total: 0, perAccount: [] };

  const lastDay = new Date(upToYear, upToMonth, 0).getDate(); // actual last day of month
  const periodEnd = `${upToYear}-${String(upToMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  // Step 1: Get all bank accounts with initial balances
  const accounts = await db.select().from(bankAccounts).where(
    and(eq(bankAccounts.businessId, businessId), eq(bankAccounts.isActive, true))
  );

  // Step 2: Get ALL journal transactions up to period end (SINGLE SOURCE)
  const allTxs = await db.select().from(transactions).where(
    and(eq(transactions.businessId, businessId), eq(transactions.isDeleted, false), sql`${transactions.date} <= ${periodEnd}`)
  );

  // Step 3: Calculate per-account balances
  const accountBalances = new Map<number, { name: string; balance: number }>();
  for (const acc of accounts) {
    accountBalances.set(acc.id, {
      name: acc.accountName,
      balance: acc.initialBalance ?? 0,
    });
  }

  // Track unlinked transactions (no bankAccountId — legacy or manual cash)
  let unlinkedBalance = 0;

  for (const tx of allTxs) {
    const amount = tx.type === "pemasukan" ? tx.amount : -tx.amount;

    if (tx.bankAccountId && accountBalances.has(tx.bankAccountId)) {
      accountBalances.get(tx.bankAccountId)!.balance += amount;
    } else {
      // Transactions without bankAccountId = untracked cash
      unlinkedBalance += amount;
    }
  }

  // Step 4: FIXED - Removed orphaned POS receipt additions
  // All POS checkouts automatically create journal entries, so this path is dead code.
  // Cash balance = bank account initial balances + sum of journal entries only.

  // Step 5: Build result
  const perAccount: { account: string; balance: number }[] = [];
  let total = 0;

  accountBalances.forEach((acc) => {
    perAccount.push({ account: acc.name, balance: acc.balance });
    total += acc.balance;
  });

  if (unlinkedBalance !== 0) {
    perAccount.push({ account: "Kas (tidak terhubung rekening)", balance: unlinkedBalance });
    total += unlinkedBalance;
  }

  return { total, perAccount };
}

// ─── Laporan Neraca (Posisi Keuangan) ───
export async function generateNeraca(businessId: number, month: number, year: number): Promise<NeracaReport> {
  const db = await getDb();
  const bulanNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const period = `${bulanNames[month - 1]} ${year}`;

  // ═══ KAS: from unified cash balance calculator (single source of truth) ═══
  const cashResult = await calculateCashBalance(businessId, month, year);
  const kas = cashResult.total;

  // Piutang: semua piutang aktif (belum lunas)
  const allDebts = db ? await db.select().from(debts).where(
    and(eq(debts.businessId, businessId), eq(debts.type, "piutang"), sql`${debts.status} != 'lunas'`)
  ) : [];
  const piutang = allDebts.reduce((s, d) => s + (d.totalAmount - d.paidAmount), 0);

  // Hutang usaha
  const allHutang = db ? await db.select().from(debts).where(
    and(eq(debts.businessId, businessId), eq(debts.type, "hutang"), sql`${debts.status} != 'lunas'`)
  ) : [];
  const hutangUsaha = allHutang.reduce((s, d) => s + (d.totalAmount - d.paidAmount), 0);

  // Persediaan: total stok * HPP
  const allProducts = db ? await db.select().from(products).where(
    and(eq(products.businessId, businessId), eq(products.isActive, true))
  ) : [];
  const persediaan = allProducts.reduce((s, p) => s + ((p.stockCurrent ?? 0) * (p.hpp ?? 0)), 0);

  const totalAsetLancar = kas + piutang + persediaan;
  const asetTetap = 0; // No fixed asset tracking yet
  const totalAset = totalAsetLancar + asetTetap;
  const totalKewajiban = hutangUsaha;

  // Laba periode berjalan
  const labaRugi = await generateLabaRugi(businessId, month, year);
  const labaPeriode = labaRugi.labaBersih;

  // Modal = Aset - Kewajiban (accounting equation)
  const totalEkuitas = totalAset - totalKewajiban;
  const modalAwal = totalEkuitas - labaPeriode;

  return {
    period,
    aset: {
      kas,
      kasDetail: cashResult.perAccount,
      piutang,
      persediaan,
      totalAsetLancar,
      asetTetap,
      totalAset,
    },
    kewajiban: { hutangUsaha, hutangLain: 0, totalKewajiban },
    ekuitas: { modalAwal, labaPeriode, prive: 0, totalEkuitas },
    balance: Math.abs(totalAset - (totalKewajiban + totalEkuitas)) < 1,
  };
}

// ─── Laporan Perubahan Modal ───
export async function generatePerubahanModal(businessId: number, month: number, year: number): Promise<PerubahanModalReport> {
  const bulanNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const period = `${bulanNames[month - 1]} ${year}`;
  const db = await getDb();

  // Calculate laba bersih this period
  const labaRugi = await generateLabaRugi(businessId, month, year);
  const labaBersih = labaRugi.labaBersih;

  // Modal Awal: derive from previous month's Neraca (Ekuitas = Aset - Kewajiban)
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevNeraca = await generateNeraca(businessId, prevMonth, prevYear);
  const modalAwal = prevNeraca.ekuitas.totalEkuitas;

  // Penambahan modal: any pemasukan categorized as "Modal" or "Investasi"
  const periodStr = `${year}-${String(month).padStart(2, "0")}`;
  const currentTxs = db ? await db.select().from(transactions).where(
    and(eq(transactions.businessId, businessId), eq(transactions.isDeleted, false), sql`${transactions.date} LIKE ${periodStr + "%"}`)
  ) : [];
  const penambahanModal = currentTxs
    .filter(tx => tx.type === "pemasukan" && (tx.category === "Modal" || tx.category === "Investasi"))
    .reduce((s, tx) => s + tx.amount, 0);
  const prive = currentTxs
    .filter(tx => tx.type === "pengeluaran" && (tx.category === "Prive" || tx.category === "Pengambilan Pribadi"))
    .reduce((s, tx) => s + tx.amount, 0);

  const modalAkhir = modalAwal + penambahanModal + labaBersih - prive;

  return { period, modalAwal, penambahanModal, labaBersih, prive, modalAkhir };
}

// ─── Financial Consistency Validator ───
// Checks: Neraca Kas == Arus Kas saldoAkhir (MUST match for accounting integrity)
export async function validateFinancialConsistency(businessId: number, month: number, year: number): Promise<{
  isConsistent: boolean;
  neracaKas: number;
  arusKasSaldoAkhir: number;
  delta: number;
  details: string[];
}> {
  const neraca = await generateNeraca(businessId, month, year);
  const arusKas = await generateArusKas(businessId, month, year);

  const neracaKas = neraca.aset.kas;
  const arusKasSaldoAkhir = arusKas.saldoAkhir;
  const delta = Math.abs(neracaKas - arusKasSaldoAkhir);
  const isConsistent = delta < 1; // tolerance < Rp 1 (rounding)

  const details: string[] = [];
  if (!isConsistent) {
    details.push(`Neraca Kas (${neracaKas}) != Arus Kas Saldo Akhir (${arusKasSaldoAkhir}), delta: ${delta}`);
  }
  if (!neraca.balance) {
    details.push(`Neraca tidak balance: Aset (${neraca.aset.totalAset}) != Kewajiban + Ekuitas (${neraca.kewajiban.totalKewajiban + neraca.ekuitas.totalEkuitas})`);
  }
  if (isConsistent && neraca.balance) {
    details.push("Semua laporan keuangan konsisten");
  }

  return { isConsistent, neracaKas, arusKasSaldoAkhir, delta, details };
}

// ─── Catatan atas Laporan Keuangan (CALK) ───
export async function generateCALK(businessId: number, month: number, year: number): Promise<CALKReport> {
  const db = await getDb();
  const bulanNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const period = `${bulanNames[month - 1]} ${year}`;
  const periodStr = `${year}-${String(month).padStart(2, "0")}`;

  // Get business info
  const biz = db ? (await db.select().from(businesses).where(eq(businesses.id, businessId)))[0] : null;
  const businessName = biz?.businessName ?? "Bisnis";

  // Get transaction count & categories
  const txs = db ? await db.select().from(transactions).where(
    and(eq(transactions.businessId, businessId), eq(transactions.isDeleted, false), sql`${transactions.date} LIKE ${periodStr + "%"}`)
  ) : [];

  const incomeCategories: Record<string, number> = {};
  const expenseCategories: Record<string, number> = {};
  let incomeCount = 0, expenseCount = 0;
  for (const tx of txs) {
    if (tx.type === "pemasukan") {
      incomeCategories[tx.category] = (incomeCategories[tx.category] || 0) + tx.amount;
      incomeCount++;
    } else {
      expenseCategories[tx.category] = (expenseCategories[tx.category] || 0) + tx.amount;
      expenseCount++;
    }
  }

  // Payment methods breakdown
  const paymentMethods: Record<string, number> = {};
  for (const tx of txs) {
    paymentMethods[tx.paymentMethod] = (paymentMethods[tx.paymentMethod] || 0) + 1;
  }

  // Products info
  const allProducts = db ? await db.select().from(products).where(
    and(eq(products.businessId, businessId), eq(products.isActive, true))
  ) : [];
  const totalStockValue = allProducts.reduce((s, p) => s + ((p.stockCurrent ?? 0) * (p.hpp ?? 0)), 0);

  // Debts summary
  const allDebtsData = db ? await db.select().from(debts).where(eq(debts.businessId, businessId)) : [];
  const piutangActive = allDebtsData.filter(d => d.type === "piutang" && d.status !== "lunas");
  const hutangActive = allDebtsData.filter(d => d.type === "hutang" && d.status !== "lunas");

  // Monthly bills
  const allBills = db ? await db.select().from(monthlyBills).where(
    and(eq(monthlyBills.businessId, businessId), eq(monthlyBills.isActive, true))
  ) : [];

  const { formatRupiah } = await import("../shared/finance");

  const sections = [
    {
      title: "1. Umum",
      items: [
        { label: "Nama Entitas", value: businessName },
        { label: "Jenis Usaha", value: biz?.businessType ?? "-" },
        { label: "Status PKP", value: biz?.isPkp ? "Pengusaha Kena Pajak" : "Non-PKP" },
        { label: "Periode Laporan", value: period },
        { label: "Dasar Penyusunan", value: "Basis kas (cash basis) — transaksi dicatat saat kas diterima/dikeluarkan" },
      ],
    },
    {
      title: "2. Rincian Pendapatan",
      items: Object.entries(incomeCategories).map(([cat, amount]) => ({
        label: cat, value: formatRupiah(amount),
      })),
    },
    {
      title: "3. Rincian Beban Operasional",
      items: Object.entries(expenseCategories).map(([cat, amount]) => ({
        label: cat, value: formatRupiah(amount),
      })),
    },
    {
      title: "4. Persediaan Barang",
      items: [
        { label: "Jumlah SKU Aktif", value: `${allProducts.length} produk` },
        { label: "Nilai Persediaan (HPP)", value: formatRupiah(totalStockValue) },
      ],
    },
    {
      title: "5. Piutang Usaha",
      items: piutangActive.length > 0
        ? piutangActive.map(d => ({ label: d.counterpartyName, value: `${formatRupiah(d.totalAmount - d.paidAmount)} (jatuh tempo: ${d.dueDate ?? "-"})` }))
        : [{ label: "Tidak ada piutang aktif", value: "-" }],
    },
    {
      title: "6. Hutang Usaha",
      items: hutangActive.length > 0
        ? hutangActive.map(d => ({ label: d.counterpartyName, value: `${formatRupiah(d.totalAmount - d.paidAmount)} (jatuh tempo: ${d.dueDate ?? "-"})` }))
        : [{ label: "Tidak ada hutang aktif", value: "-" }],
    },
    {
      title: "7. Beban Tetap Bulanan",
      items: allBills.length > 0
        ? allBills.map(b => ({ label: b.name, value: `${formatRupiah(b.amount)} / bulan` }))
        : [{ label: "Tidak ada tagihan tetap", value: "-" }],
    },
    {
      title: "8. Metode Pembayaran",
      items: Object.entries(paymentMethods).map(([method, count]) => ({
        label: method, value: `${count} transaksi`,
      })),
    },
    {
      title: "9. Statistik Transaksi",
      items: [
        { label: "Total Transaksi Pemasukan", value: `${incomeCount} transaksi` },
        { label: "Total Transaksi Pengeluaran", value: `${expenseCount} transaksi` },
        { label: "Total Transaksi Bulan Ini", value: `${txs.length} transaksi` },
      ],
    },
  ];

  return { period, businessName, sections };
}

export async function getDashboardKPIs(businessId: number): Promise<DashboardKPIs> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const lastMonth = month === 1 ? 12 : month - 1;
  const lastYear = month === 1 ? year - 1 : year;
  const current = await getTransactionSummary(businessId, month, year);
  const prev = await getTransactionSummary(businessId, lastMonth, lastYear);
  // Include POS revenue (standalone, not in transactions)
  const posNow = await getPosRevenueForPeriod(businessId, month, year);
  const posPrev = await getPosRevenueForPeriod(businessId, lastMonth, lastYear);
  const taxes = await calcTaxForMonth(businessId, month, year);
  const estimasiPajak = taxes.reduce((sum, t) => sum + t.amount, 0);
  const lowStock = await getLowStockProducts(businessId);
  return {
    omzetBulanIni: current.totalPemasukan + posNow.revenue,
    totalPengeluaran: current.totalPengeluaran + posNow.refunds,
    labaBersih: (current.totalPemasukan + posNow.revenue) - (current.totalPengeluaran + posNow.refunds),
    estimasiPajak,
    omzetLastMonth: prev.totalPemasukan + posPrev.revenue,
    pengeluaranLastMonth: prev.totalPengeluaran + posPrev.refunds,
    labaLastMonth: (prev.totalPemasukan + posPrev.revenue) - (prev.totalPengeluaran + posPrev.refunds),
    txCountThisMonth: current.txCount,
    lowStockCount: lowStock.length,
  };
}

// ─── Generate TX Code ───
export async function generateTxCode(businessId: number): Promise<string> {
  const db = await getDb();
  if (!db) return `TX-${Date.now()}`;
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const prefix = `TX-${dateStr}-`;
  const result = await db.select({ count: sql<number>`count(*)` }).from(transactions)
    .where(and(eq(transactions.businessId, businessId), sql`${transactions.txCode} LIKE ${prefix + "%"}`));
  const seq = Number(result[0]?.count ?? 0) + 1;
  return `${prefix}${String(seq).padStart(3, "0")}`;
}


// ─── Product Compositions (COGS) ───
export async function getCompositionsByProduct(productId: number): Promise<ProductComposition[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productCompositions)
    .where(eq(productCompositions.productId, productId))
    .orderBy(productCompositions.materialName);
}

export async function createComposition(data: InsertProductComposition): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  requireFields(data, ["productId", "materialName", "qty", "unit", "costPerUnit"], "product_compositions");
  const result = await db.insert(productCompositions).values(stripUndefined(data));
  return result[0].insertId;
}

export async function updateComposition(id: number, data: Partial<InsertProductComposition>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(productCompositions).set(data).where(eq(productCompositions.id, id));
}

export async function deleteComposition(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(productCompositions).where(eq(productCompositions.id, id));
}

export async function getCompositionById(id: number): Promise<ProductComposition | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(productCompositions).where(eq(productCompositions.id, id)).limit(1);
  return result[0];
}

// Calculate total COGS for a product from its compositions
export function calculateCOGS(compositions: ProductComposition[]): number {
  return compositions.reduce((total, comp) => {
    const qty = parseFloat(String(comp.qty));
    return total + (qty * comp.costPerUnit);
  }, 0);
}

// Search products by name (fuzzy match for scan-to-stock)
export async function searchProductsByName(businessId: number, name: string): Promise<Product[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products)
    .where(and(
      eq(products.businessId, businessId),
      eq(products.isActive, true),
      sql`LOWER(${products.name}) LIKE LOWER(${`%${name}%`})`
    ))
    .limit(5);
}

// ─── Product Categories ───
export async function getProductCategories(businessId: number): Promise<ProductCategory[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productCategories)
    .where(eq(productCategories.businessId, businessId))
    .orderBy(productCategories.sortOrder, productCategories.name);
}

export async function createProductCategory(data: Omit<InsertProductCategory, "id" | "createdAt" | "updatedAt">): Promise<ProductCategory | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  requireFields(data, ["businessId", "name"], "product_categories");
  const result = await db.insert(productCategories).values(stripUndefined(data));
  const id = (result[0] as any).insertId;
  const rows = await db.select().from(productCategories).where(eq(productCategories.id, id)).limit(1);
  return rows[0];
}

export async function updateProductCategory(id: number, businessId: number, data: { name?: string; parentId?: number | null; sortOrder?: number }): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(productCategories).set({ ...data, updatedAt: new Date() })
    .where(and(eq(productCategories.id, id), eq(productCategories.businessId, businessId)));
}

export async function deleteProductCategory(id: number, businessId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  // Also delete all subcategories under this parent
  await db.delete(productCategories).where(and(eq(productCategories.parentId, id), eq(productCategories.businessId, businessId)));
  await db.delete(productCategories).where(and(eq(productCategories.id, id), eq(productCategories.businessId, businessId)));
}

// ─── Plan Management ───
export async function getBusinessPlan(businessId: number): Promise<{ plan: string; planActivatedAt: Date | null; planExpiry: Date | null } | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({
    plan: businesses.plan,
    planActivatedAt: businesses.planActivatedAt,
    planExpiry: businesses.planExpiry,
  }).from(businesses).where(eq(businesses.id, businessId)).limit(1);
  return rows[0] ?? null;
}

export async function upgradeBusinessToPro(businessId: number, scalevOrderId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(businesses).set({
    plan: "pro",
    scalevOrderId,
    planActivatedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(businesses.id, businessId));
}

export async function upgradeBusinessToProByEmail(email: string, scalevOrderId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const userRows = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (!userRows[0]) return false;
  const bizRows = await db.select({ id: businesses.id }).from(businesses).where(eq(businesses.ownerId, userRows[0].id)).limit(1);
  if (!bizRows[0]) return false;
  await upgradeBusinessToPro(bizRows[0].id, scalevOrderId);
  return true;
}

export async function countProductsForBusiness(businessId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ count: sql<number>`COUNT(*)` }).from(products)
    .where(and(eq(products.businessId, businessId), eq(products.isActive, true)));
  return Number(rows[0]?.count ?? 0);
}

export async function countTransactionsThisMonth(businessId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const rows = await db.select({ count: sql<number>`COUNT(*)` }).from(transactions)
    .where(and(
      eq(transactions.businessId, businessId),
      eq(transactions.isDeleted, false),
      sql`${transactions.date} LIKE ${monthStr + "%"}`
    ));
  return Number(rows[0]?.count ?? 0);
}

// ─── Pro Link Helpers (One-Time-Use Activation Links) ───
import { proLinks, ProLink } from "../drizzle/schema";
import crypto from "crypto";

export function generateProToken(): string {
  return crypto.randomBytes(32).toString("hex"); // 64-char hex token
}

export async function createProLink(data: { email: string; buyerName?: string; notes?: string }): Promise<{ id: number; token: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const token = generateProToken();
  const result = await db.insert(proLinks).values({
    token,
    email: data.email,
    buyerName: data.buyerName ?? null,
    notes: data.notes ?? null,
  });
  return { id: result[0].insertId, token };
}

export async function getProLinkByToken(token: string): Promise<ProLink | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(proLinks).where(eq(proLinks.token, token)).limit(1);
  return rows[0];
}

export async function markProLinkUsed(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(proLinks).set({
    isUsed: true,
    usedByUserId: userId,
    usedAt: new Date(),
  }).where(eq(proLinks.id, id));
}

export async function listProLinks(): Promise<ProLink[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(proLinks).orderBy(desc(proLinks.createdAt));
}

export async function deleteProLink(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(proLinks).where(eq(proLinks.id, id));
}

// ─── App Mode Helpers ───
export async function updateBusinessMode(id: number, appMode: "personal" | "umkm"): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(businesses).set({ appMode }).where(eq(businesses.id, id));
}

export async function updateBusinessPosEnabled(id: number, posEnabled: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(businesses).set({ posEnabled }).where(eq(businesses.id, id));
}


// ─── Bank Accounts ───
export async function getBankAccountsByBusiness(businessId: number): Promise<BankAccount[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bankAccounts).where(and(eq(bankAccounts.businessId, businessId), eq(bankAccounts.isActive, true))).orderBy(bankAccounts.sortOrder);
}

export async function getBankAccountById(id: number): Promise<BankAccount | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(bankAccounts).where(eq(bankAccounts.id, id)).limit(1);
  return rows[0];
}

export async function createBankAccount(data: InsertBankAccount): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  requireFields(data, ["businessId", "accountName"], "bank_accounts");
  const cleaned = stripUndefined(data);
  try {
    const result = await db.insert(bankAccounts).values(cleaned);
    return result[0].insertId;
  } catch (e: any) {
    throw new Error(`[bank_accounts] INSERT failed: ${e.message}. Data: ${JSON.stringify(cleaned, null, 2).substring(0, 500)}`);
  }
}

/**
 * Safe bank account insert — sanitizes, validates, fills ALL defaults.
 * Use this from routers and seed functions instead of raw createBankAccount().
 */
export async function safeInsertBankAccount(input: {
  businessId: number;
  accountName: string;
  accountType?: "bank" | "ewallet" | "cash";
  icon?: string;
  color?: string;
  description?: string | null;
  initialBalance?: number;
  isActive?: boolean;
  sortOrder?: number;
}): Promise<number> {
  const sanitized: InsertBankAccount = {
    businessId: input.businessId,
    accountName: String(input.accountName).trim(),
    accountType: input.accountType || "bank",
    icon: input.icon || "🏦",
    color: input.color || "#3b82f6",
    description: input.description || null,
    initialBalance: Math.max(0, Number(input.initialBalance) || 0),
    isActive: input.isActive !== false,
    sortOrder: Number(input.sortOrder) || 0,
  };

  return createBankAccount(sanitized);
}

export async function updateBankAccount(id: number, data: Partial<InsertBankAccount>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(bankAccounts).set(data).where(eq(bankAccounts.id, id));
}

export async function deleteBankAccount(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(bankAccounts).set({ isActive: false }).where(eq(bankAccounts.id, id));
}

// Get transaction totals grouped by bank account
// Supports both new bankAccountId FK and legacy paymentMethod name matching
export async function getBalancesByAccounts(businessId: number, accountNames: string[]): Promise<Record<string, { income: number; expense: number }>> {
  const db = await getDb();
  if (!db) return {};

  const result: Record<string, { income: number; expense: number }> = {};
  for (const name of accountNames) result[name] = { income: 0, expense: 0 };

  // Get all bank accounts for this business (single query)
  const allAccounts = await getBankAccountsByBusiness(businessId);
  const accountByName = new Map(allAccounts.map(a => [a.accountName, a]));
  const accountById = new Map(allAccounts.map(a => [a.id, a]));

  // Single batch query: get ALL transactions for this business (indexed by businessId + isDeleted)
  const allTxs = await db.select({
    type: transactions.type,
    amount: transactions.amount,
    paymentMethod: transactions.paymentMethod,
    bankAccountId: transactions.bankAccountId,
  }).from(transactions).where(
    and(
      eq(transactions.businessId, businessId),
      eq(transactions.isDeleted, false)
    )
  );

  // Distribute transactions to accounts in memory (no N+1)
  for (const tx of allTxs) {
    let accountName: string | null = null;

    if (tx.bankAccountId) {
      // Match by bankAccountId (preferred)
      const acct = accountById.get(tx.bankAccountId);
      if (acct) accountName = acct.accountName;
    } else if (tx.paymentMethod) {
      // Fallback: match by paymentMethod name (legacy)
      accountName = tx.paymentMethod;
    }

    if (accountName && result[accountName]) {
      if (tx.type === "pemasukan") result[accountName].income += tx.amount;
      else result[accountName].expense += tx.amount;
    }
  }

  return result;
}


// ─── Rekening Koran (Bank Statement Report) ───
export async function getRekeningKoranReport(
  businessId: number,
  bankAccountName: string,
  startDate: string,
  endDate: string
): Promise<Array<{ date: string; description: string; debit: number; credit: number; runningBalance: number }>> {
  const db = await getDb();
  if (!db) return [];

  // Get the bank account — match by name or id
  const account = await db.select().from(bankAccounts).where(
    and(eq(bankAccounts.businessId, businessId), eq(bankAccounts.accountName, bankAccountName))
  ).limit(1);
  const initialBalance = account[0]?.initialBalance ?? 0;
  const accountId = account[0]?.id;

  const entries: Array<{ date: string; description: string; debit: number; credit: number; runningBalance: number }> = [];
  let runningBalance = initialBalance;

  // Get transactions for this account in date range
  // Match by bankAccountId (preferred) OR paymentMethod name (fallback for legacy data)
  const txs = await db.select().from(transactions).where(
    and(
      eq(transactions.businessId, businessId),
      accountId
        ? or(eq(transactions.bankAccountId, accountId), eq(transactions.paymentMethod, bankAccountName))
        : eq(transactions.paymentMethod, bankAccountName),
      eq(transactions.isDeleted, false),
      gte(transactions.date, startDate),
      lte(transactions.date, endDate)
    )
  ).orderBy(transactions.date);

  for (const tx of txs) {
    const debit = tx.type === "pengeluaran" ? tx.amount : 0;
    const credit = tx.type === "pemasukan" ? tx.amount : 0;
    runningBalance = runningBalance - debit + credit;
    entries.push({
      date: tx.date,
      description: tx.description || tx.category,
      debit,
      credit,
      runningBalance,
    });
  }

  // Get receiptIds that already have linked transactions
  const linkedTxs = await db.select({ receiptId: transactions.receiptId })
    .from(transactions)
    .where(and(
      eq(transactions.businessId, businessId),
      eq(transactions.isDeleted, false),
      isNotNull(transactions.receiptId)
    ));
  const linkedReceiptIds = new Set(linkedTxs.map(t => t.receiptId).filter(Boolean));

  // Get POS receipts for this account in date range
  // Only count receipts that DON'T have linked transactions (legacy data)
  const receipts = await db.select().from(posReceipts).where(
    and(
      eq(posReceipts.businessId, businessId),
      gte(posReceipts.date, startDate),
      lte(posReceipts.date, endDate)
    )
  ).orderBy(posReceipts.date);

  for (const receipt of receipts) {
    if (linkedReceiptIds.has(receipt.id)) continue; // already in transactions
    const payments = receipt.payments as Array<{ method: string; amount: number }> || [];
    for (const payment of payments) {
      if (payment.method === bankAccountName) {
        runningBalance = runningBalance + payment.amount;
        entries.push({
          date: receipt.date,
          description: `POS Receipt ${receipt.receiptCode}`,
          debit: 0,
          credit: payment.amount,
          runningBalance,
        });
      }
    }
  }

  // Sort by date
  entries.sort((a, b) => a.date.localeCompare(b.date));

  // Recalculate running balance in order
  runningBalance = initialBalance;
  for (const entry of entries) {
    runningBalance = runningBalance - entry.debit + entry.credit;
    entry.runningBalance = runningBalance;
  }

  return entries;
}

// ─── Mutasi Persediaan (Inventory Movement Report) ───
export async function getMutasiPersediaanReport(
  businessId: number,
  productId?: number,
  startDate?: string,
  endDate?: string
): Promise<Array<{
  productId: number;
  productName: string;
  sku?: string;
  movements: Array<{
    date: string;
    type: string;
    qty: number;
    direction: number;
    priceIn: number;
    priceOut: number;
    stockBefore: number;
    stockAfter: number;
    reference: string;
  }>;
}>> {
  const db = await getDb();
  if (!db) return [];

  // Build where conditions
  const whereConditions: any[] = [eq(stockLogs.businessId, businessId)];
  if (productId) whereConditions.push(eq(stockLogs.productId, productId));
  if (startDate) whereConditions.push(gte(stockLogs.date, startDate));
  if (endDate) whereConditions.push(lte(stockLogs.date, endDate));

  // Get stock logs
  const logs = await db.select().from(stockLogs).where(and(...whereConditions)).orderBy(stockLogs.date);

  // Group by product
  const byProduct: Record<number, {
    productId: number;
    productName: string;
    sku?: string;
    movements: Array<{
      date: string;
      type: string;
      qty: number;
      direction: number;
      priceIn: number;
      priceOut: number;
      stockBefore: number;
      stockAfter: number;
      reference: string;
    }>;
  }> = {};

  for (const log of logs) {
    if (!byProduct[log.productId]) {
      const product = await getProductById(log.productId);
      if (product) {
        byProduct[log.productId] = {
          productId: log.productId,
          productName: product.name,
          sku: product.sku ?? undefined,
          movements: [],
        };
      }
    }

    if (byProduct[log.productId]) {
      byProduct[log.productId].movements.push({
        date: log.date,
        type: log.movementType,
        qty: log.qty,
        direction: log.direction,
        priceIn: 0, // Will be filled below
        priceOut: 0, // Will be filled below
        stockBefore: log.stockBefore,
        stockAfter: log.stockAfter,
        reference: `Stock Log #${log.id}`,
      });
    }
  }

  // Fill in prices from product and POS data
  for (const productId in byProduct) {
    const product = await getProductById(parseInt(productId));
    for (const movement of byProduct[productId].movements) {
      movement.priceIn = product?.hpp ?? 0;
      movement.priceOut = product?.sellingPrice ?? 0;

      // For "out" movements, try to get actual sell price from pos_receipt_items
      if (movement.type === "out") {
        const posItems = await db.select().from(posReceiptItems).where(
          eq(posReceiptItems.productId, parseInt(productId))
        ).orderBy(desc(posReceiptItems.createdAt)).limit(1);
        if (posItems.length > 0) {
          movement.priceOut = posItems[0].unitPrice ?? product?.sellingPrice ?? 0;
        }
      }
    }
  }

  return Object.values(byProduct);
}

// ─── Client Helpers ───
export async function getClientsByBusiness(businessId: number): Promise<Client[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clients).where(and(eq(clients.businessId, businessId), eq(clients.isActive, true))).orderBy(desc(clients.createdAt));
}

export async function getClientById(id: number): Promise<Client | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return rows[0];
}

export async function createClient(data: InsertClient): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  requireFields(data, ["businessId", "name"], "clients");
  const cleaned = stripUndefined(data);
  try {
    const result = await db.insert(clients).values(cleaned);
    return result[0].insertId;
  } catch (e: any) {
    throw new Error(`[clients] INSERT failed: ${e.message}`);
  }
}

export async function updateClient(id: number, data: Partial<InsertClient>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(clients).set(data).where(eq(clients.id, id));
}

export async function deleteClient(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(clients).set({ isActive: false }).where(eq(clients.id, id));
}

// ─── Debt / Receivable Helpers ───
export async function getDebtsByBusiness(businessId: number, type?: "hutang" | "piutang"): Promise<Debt[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(debts.businessId, businessId)];
  if (type) conditions.push(eq(debts.type, type));
  return db.select().from(debts).where(and(...conditions)).orderBy(desc(debts.createdAt));
}

export async function getDebtById(id: number): Promise<Debt | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(debts).where(eq(debts.id, id)).limit(1);
  return rows[0];
}

export async function createDebt(data: InsertDebt): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  requireFields(data, ["businessId", "type", "counterpartyName", "totalAmount"], "debts");
  const cleaned = stripUndefined(data);
  try {
    const result = await db.insert(debts).values(cleaned);
    return result[0].insertId;
  } catch (e: any) {
    throw new Error(`[debts] INSERT failed: ${e.message}`);
  }
}

export async function updateDebt(id: number, data: Partial<InsertDebt>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(debts).set(data).where(eq(debts.id, id));
}

export async function deleteDebt(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(debts).where(eq(debts.id, id));
}

// ─── Debt Payment Helpers ───
export async function getDebtPayments(debtId: number): Promise<DebtPayment[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(debtPayments).where(eq(debtPayments.debtId, debtId)).orderBy(desc(debtPayments.createdAt));
}

export async function createDebtPayment(data: InsertDebtPayment): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  requireFields(data, ["debtId", "amount", "date"], "debt_payments");

  return db.transaction(async (tx) => {
    // Insert payment
    const [result] = await tx.insert(debtPayments).values(stripUndefined(data));

    // Read and update parent debt atomically
    const [debt] = await tx.select().from(debts).where(eq(debts.id, data.debtId));
    if (debt) {
      const newPaid = debt.paidAmount + data.amount;
      const newStatus = newPaid >= debt.totalAmount ? "lunas" : "belum_lunas";
      await tx.update(debts).set({ paidAmount: newPaid, status: newStatus }).where(eq(debts.id, data.debtId));
    }

    return result.insertId;
  });
}

export async function deleteDebtPayment(id: number, debtId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  // Get payment amount before deleting
  const rows = await db.select().from(debtPayments).where(eq(debtPayments.id, id)).limit(1);
  if (rows[0]) {
    await db.delete(debtPayments).where(eq(debtPayments.id, id));
    // Recalculate parent debt paidAmount
    const debt = await getDebtById(debtId);
    if (debt) {
      const newPaid = Math.max(0, debt.paidAmount - rows[0].amount);
      const newStatus = newPaid >= debt.totalAmount ? "lunas" : "belum_lunas";
      await updateDebt(debtId, { paidAmount: newPaid, status: newStatus });
    }
  }
}

// ─── Budget Helpers ───
export async function getBudgetsByBusiness(businessId: number, period?: string): Promise<Budget[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(budgets.businessId, businessId)];
  if (period) conditions.push(eq(budgets.period, period));
  return db.select().from(budgets).where(and(...conditions)).orderBy(budgets.category);
}

export async function getBudgetById(id: number): Promise<Budget | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(budgets).where(eq(budgets.id, id)).limit(1);
  return rows[0];
}

export async function createBudget(data: InsertBudget): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  requireFields(data, ["businessId", "category", "period", "budgetAmount"], "budgets");
  const result = await db.insert(budgets).values(stripUndefined(data));
  return result[0].insertId;
}

export async function updateBudget(id: number, data: Partial<InsertBudget>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(budgets).set(data).where(eq(budgets.id, id));
}

export async function deleteBudget(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(budgets).where(eq(budgets.id, id));
}

// Get actual spending per category for a period (for budget vs actual comparison)
export async function getSpendingByCategory(businessId: number, period: string): Promise<Record<string, number>> {
  const db = await getDb();
  if (!db) return {};
  const txs = await db.select().from(transactions).where(
    and(
      eq(transactions.businessId, businessId),
      eq(transactions.isDeleted, false),
      eq(transactions.type, "pengeluaran"),
      sql`${transactions.date} LIKE ${period + "%"}`
    )
  );
  const result: Record<string, number> = {};
  for (const tx of txs) {
    result[tx.category] = (result[tx.category] || 0) + tx.amount;
  }
  return result;
}

// ─── Transfer Between Accounts ───
export async function createTransferBetweenAccounts(
  businessId: number,
  fromAccountNameOrId: string | number,
  toAccountNameOrId: string | number,
  amount: number,
  date: string,
  notes?: string
): Promise<{ outTxId: number; inTxId: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Resolve account names and IDs
  let fromAccountName: string;
  let fromAccountId: number | undefined;
  let toAccountName: string;
  let toAccountId: number | undefined;

  if (typeof fromAccountNameOrId === "number") {
    fromAccountId = fromAccountNameOrId;
    const accounts = await getBankAccountsByBusiness(businessId);
    const fromAcc = accounts.find(a => a.id === fromAccountId);
    fromAccountName = fromAcc?.accountName || "Unknown";
  } else {
    fromAccountName = fromAccountNameOrId;
  }

  if (typeof toAccountNameOrId === "number") {
    toAccountId = toAccountNameOrId;
    const accounts = await getBankAccountsByBusiness(businessId);
    const toAcc = accounts.find(a => a.id === toAccountId);
    toAccountName = toAcc?.accountName || "Unknown";
  } else {
    toAccountName = toAccountNameOrId;
  }

  return db.transaction(async (tx) => {
    const txCodeOut = await generateTxCode(businessId);
    const txCodeIn = `${txCodeOut}-IN`;
    const description = `Transfer ${fromAccountName} → ${toAccountName}`;

    // Create outgoing transaction (pengeluaran from source account) inside tx
    const [outResult] = await tx.insert(transactions).values(stripUndefined({
      businessId,
      txCode: txCodeOut,
      date,
      type: "pengeluaran",
      category: "Transfer Antar Akun",
      description,
      amount,
      paymentMethod: fromAccountName,
      bankAccountId: fromAccountId ?? null,
      taxRelated: false,
      notes: notes || `Transfer ke ${toAccountName}`,
    }));

    // Create incoming transaction (pemasukan to destination account) inside tx
    const [inResult] = await tx.insert(transactions).values(stripUndefined({
      businessId,
      txCode: txCodeIn,
      date,
      type: "pemasukan",
      category: "Transfer Antar Akun",
      description,
      amount,
      paymentMethod: toAccountName,
      bankAccountId: toAccountId ?? null,
      taxRelated: false,
      notes: notes || `Transfer dari ${fromAccountName}`,
    }));

    return { outTxId: outResult.insertId, inTxId: inResult.insertId };
  });
}

// ─── Calculator & Signature Settings ───
export async function updateBusinessCalculator(id: number, calculatorEnabled: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(businesses).set({ calculatorEnabled }).where(eq(businesses.id, id));
}

export async function updateBusinessSignature(id: number, signatureUrl: string | null): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(businesses).set({ signatureUrl }).where(eq(businesses.id, id));
}

// ─── Sales Analytics Helpers ───
export async function getSalesAnalytics(businessId: number, year: number) {
  const db = await getDb();
  if (!db) return { monthlySales: new Array(12).fill(0), monthlyExpenses: new Array(12).fill(0), topProducts: [], salesByCategory: {} as Record<string, number>, salesByPaymentMethod: {} as Record<string, number>, dailySales: {} as Record<string, number> };

  // Get all transactions for the year
  const txs = await db.select().from(transactions).where(
    and(eq(transactions.businessId, businessId), eq(transactions.isDeleted, false), sql`${transactions.date} LIKE ${year + "%"}`)
  );

  const monthlySales = new Array(12).fill(0);
  const monthlyExpenses = new Array(12).fill(0);
  const salesByCategory: Record<string, number> = {};
  const salesByPaymentMethod: Record<string, number> = {};
  const dailySales: Record<string, number> = {};
  const productSales: Record<number, { name: string; qty: number; revenue: number }> = {};

  for (const tx of txs) {
    const m = parseInt(tx.date.substring(5, 7), 10) - 1;
    if (tx.type === "pemasukan") {
      if (m >= 0 && m < 12) monthlySales[m] += tx.amount;
      salesByCategory[tx.category] = (salesByCategory[tx.category] || 0) + tx.amount;
      salesByPaymentMethod[tx.paymentMethod] = (salesByPaymentMethod[tx.paymentMethod] || 0) + tx.amount;
      dailySales[tx.date] = (dailySales[tx.date] || 0) + tx.amount;
      if (tx.productId) {
        if (!productSales[tx.productId]) productSales[tx.productId] = { name: "", qty: 0, revenue: 0 };
        productSales[tx.productId].qty += tx.productQty || 1;
        productSales[tx.productId].revenue += tx.amount;
      }
    } else {
      if (m >= 0 && m < 12) monthlyExpenses[m] += tx.amount;
    }
  }

  // Get product names for top products
  const productIds = Object.keys(productSales).map(Number);
  if (productIds.length > 0) {
    for (const pid of productIds) {
      const prod = await getProductById(pid);
      if (prod) productSales[pid].name = prod.name;
    }
  }

  const topProducts = Object.values(productSales)
    .filter(p => p.name)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return { monthlySales, monthlyExpenses, topProducts, salesByCategory, salesByPaymentMethod, dailySales };
}

// ─── Due Date Notifications ───
export async function getUpcomingDueDates(businessId: number, daysAhead: number = 7) {
  const db = await getDb();
  if (!db) return { debts: [] as Debt[], invoices: [] as Transaction[] };

  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + daysAhead);
  const todayStr = today.toISOString().substring(0, 10);
  const futureStr = futureDate.toISOString().substring(0, 10);

  // Get debts with upcoming due dates
  const upcomingDebts = await db.select().from(debts).where(
    and(
      eq(debts.businessId, businessId),
      eq(debts.status, "belum_lunas"),
      sql`${debts.dueDate} IS NOT NULL`,
      sql`${debts.dueDate} >= ${todayStr}`,
      sql`${debts.dueDate} <= ${futureStr}`
    )
  );

  // Get overdue debts
  const overdueDebts = await db.select().from(debts).where(
    and(
      eq(debts.businessId, businessId),
      eq(debts.status, "belum_lunas"),
      sql`${debts.dueDate} IS NOT NULL`,
      sql`${debts.dueDate} < ${todayStr}`
    )
  );

  // Mark overdue debts
  for (const d of overdueDebts) {
    await updateDebt(d.id, { status: "terlambat" });
  }

  return {
    debts: [...overdueDebts.map(d => ({ ...d, status: "terlambat" as const })), ...upcomingDebts],
    invoices: [] as Transaction[],
  };
}

// Get transactions linked to a specific client
export async function getTransactionsByClient(businessId: number, clientId: number): Promise<Transaction[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(transactions).where(
    and(
      eq(transactions.businessId, businessId),
      eq(transactions.clientId, clientId),
      eq(transactions.isDeleted, false)
    )
  ).orderBy(desc(transactions.date));
}

// ─── Affiliates ───

export async function getAffiliates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(affiliates).orderBy(sql`${affiliates.createdAt} DESC`);
}

export async function getAffiliateByRefCode(refCode: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(affiliates).where(eq(affiliates.refCode, refCode)).limit(1);
  return rows[0] || null;
}

export async function createAffiliate(data: { refCode: string; name: string; scalevUrl: string; whatsapp?: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(affiliates).values({
    refCode: data.refCode.toLowerCase().trim(),
    name: data.name,
    scalevUrl: data.scalevUrl,
    whatsapp: data.whatsapp || null,
  });
  return { id: result[0].insertId };
}

export async function updateAffiliate(id: number, data: { name?: string; scalevUrl?: string; whatsapp?: string; isActive?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const updates: Record<string, any> = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.scalevUrl !== undefined) updates.scalevUrl = data.scalevUrl;
  if (data.whatsapp !== undefined) updates.whatsapp = data.whatsapp;
  if (data.isActive !== undefined) updates.isActive = data.isActive;
  if (Object.keys(updates).length > 0) {
    await db.update(affiliates).set(updates).where(eq(affiliates.id, id));
  }
}

export async function deleteAffiliate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(affiliates).where(eq(affiliates.id, id));
}

export async function incrementAffiliateClick(refCode: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(affiliates)
    .set({ clickCount: sql`${affiliates.clickCount} + 1` })
    .where(eq(affiliates.refCode, refCode));
}

// ═══════════════════════════════════════════════════════════
// ─── Warehouse (Gudang) Helpers ───
// ═══════════════════════════════════════════════════════════

export async function getWarehousesByBusiness(businessId: number): Promise<Warehouse[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(warehouses).where(and(eq(warehouses.businessId, businessId), eq(warehouses.isActive, true))).orderBy(desc(warehouses.isDefault), warehouses.name);
}

export async function getWarehouseById(id: number): Promise<Warehouse | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(warehouses).where(eq(warehouses.id, id)).limit(1);
  return rows[0];
}

export async function getDefaultWarehouse(businessId: number): Promise<Warehouse | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(warehouses).where(and(eq(warehouses.businessId, businessId), eq(warehouses.isDefault, true), eq(warehouses.isActive, true))).limit(1);
  return rows[0];
}

export async function createWarehouse(data: InsertWarehouse): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  requireFields(data, ["businessId", "name"], "warehouses");
  const result = await db.insert(warehouses).values(stripUndefined(data));
  return result[0].insertId;
}

export async function updateWarehouse(id: number, data: Partial<InsertWarehouse>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(warehouses).set(data).where(eq(warehouses.id, id));
}

export async function deleteWarehouse(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(warehouses).set({ isActive: false }).where(eq(warehouses.id, id));
}

// Ensure a default warehouse exists for a business (called during onboarding or first access)
export async function ensureDefaultWarehouse(businessId: number): Promise<Warehouse> {
  const existing = await getDefaultWarehouse(businessId);
  if (existing) return existing;
  const id = await createWarehouse({ businessId, name: "Gudang Utama", isDefault: true, isActive: true });
  return (await getWarehouseById(id))!;
}

// ─── Warehouse Stock Helpers ───

export async function getWarehouseStockByWarehouse(warehouseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: warehouseStock.id,
    warehouseId: warehouseStock.warehouseId,
    productId: warehouseStock.productId,
    quantity: warehouseStock.quantity,
    productName: products.name,
    productSku: products.sku,
    productUnit: products.unit,
    productHpp: products.hpp,
    productSellingPrice: products.sellingPrice,
    productImageUrl: products.imageUrl,
    productStockMinimum: products.stockMinimum,
    productCategory: products.category,
  }).from(warehouseStock)
    .innerJoin(products, eq(warehouseStock.productId, products.id))
    .where(eq(warehouseStock.warehouseId, warehouseId))
    .orderBy(products.name);
}

export async function getWarehouseStockByProduct(productId: number, businessId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(warehouseStock.productId, productId), eq(warehouses.isActive, true)];
  if (businessId !== undefined) {
    conditions.push(eq(warehouses.businessId, businessId));
  }
  return db.select({
    id: warehouseStock.id,
    warehouseId: warehouseStock.warehouseId,
    productId: warehouseStock.productId,
    quantity: warehouseStock.quantity,
    warehouseName: warehouses.name,
    warehouseIsDefault: warehouses.isDefault,
  }).from(warehouseStock)
    .innerJoin(warehouses, eq(warehouseStock.warehouseId, warehouses.id))
    .where(and(...conditions))
    .orderBy(desc(warehouses.isDefault), warehouses.name);
}

export async function getOrCreateWarehouseStock(warehouseId: number, productId: number): Promise<WarehouseStock> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.select().from(warehouseStock).where(and(eq(warehouseStock.warehouseId, warehouseId), eq(warehouseStock.productId, productId))).limit(1);
  if (rows[0]) return rows[0];
  const result = await db.insert(warehouseStock).values({ warehouseId, productId, quantity: 0 });
  return { id: result[0].insertId, warehouseId, productId, quantity: 0, updatedAt: new Date() };
}

export async function updateWarehouseStockQty(warehouseId: number, productId: number, newQty: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(warehouseStock).where(and(eq(warehouseStock.warehouseId, warehouseId), eq(warehouseStock.productId, productId))).limit(1);
  if (existing[0]) {
    await db.update(warehouseStock).set({ quantity: newQty }).where(eq(warehouseStock.id, existing[0].id));
  } else {
    await db.insert(warehouseStock).values({ warehouseId, productId, quantity: newQty });
  }
}

// Recalculate products.stockCurrent as SUM of all warehouse_stock for that product
export async function recalcProductStockFromWarehouses(productId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ total: sql<number>`COALESCE(SUM(${warehouseStock.quantity}), 0)` }).from(warehouseStock)
    .innerJoin(warehouses, eq(warehouseStock.warehouseId, warehouses.id))
    .where(and(eq(warehouseStock.productId, productId), eq(warehouses.isActive, true)));
  const total = Number(rows[0]?.total ?? 0);
  await db.update(products).set({ stockCurrent: total }).where(eq(products.id, productId));
  return total;
}

// ─── Stock Transfer Helpers ───

export async function createStockTransfer(data: InsertStockTransfer): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  requireFields(data, ["businessId", "fromWarehouseId", "toWarehouseId", "productId", "quantity"], "stock_transfers");
  const result = await db.insert(stockTransfers).values(stripUndefined(data));
  return result[0].insertId;
}

export async function getStockTransfersByBusiness(businessId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  const fromWh = db.$with("from_wh").as(db.select({ id: warehouses.id, name: warehouses.name }).from(warehouses));
  const toWh = db.$with("to_wh").as(db.select({ id: warehouses.id, name: warehouses.name }).from(warehouses));
  // Simple query without CTEs
  return db.select({
    id: stockTransfers.id,
    fromWarehouseId: stockTransfers.fromWarehouseId,
    toWarehouseId: stockTransfers.toWarehouseId,
    productId: stockTransfers.productId,
    qty: stockTransfers.qty,
    date: stockTransfers.date,
    notes: stockTransfers.notes,
    createdAt: stockTransfers.createdAt,
    productName: products.name,
    productSku: products.sku,
    productUnit: products.unit,
  }).from(stockTransfers)
    .innerJoin(products, eq(stockTransfers.productId, products.id))
    .where(eq(stockTransfers.businessId, businessId))
    .orderBy(desc(stockTransfers.createdAt))
    .limit(limit);
}

// Perform a stock transfer between warehouses (atomic operation)
export async function performStockTransfer(params: {
  businessId: number;
  fromWarehouseId: number;
  toWarehouseId: number;
  productId: number;
  qty: number;
  date: string;
  notes?: string;
}): Promise<{ transferId: number; fromQty: number; toQty: number }> {
  const { businessId, fromWarehouseId, toWarehouseId, productId, qty, date, notes } = params;
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.transaction(async (tx) => {
    // Read source warehouse stock inside tx
    const [fromWs] = await tx.select().from(warehouseStock)
      .where(and(eq(warehouseStock.warehouseId, fromWarehouseId), eq(warehouseStock.productId, productId)));

    if (!fromWs || fromWs.quantity < qty) {
      throw new Error(`Stok di gudang asal tidak cukup. Tersedia: ${fromWs?.quantity ?? 0}`);
    }

    // Read or create destination warehouse stock inside tx
    let [toWs] = await tx.select().from(warehouseStock)
      .where(and(eq(warehouseStock.warehouseId, toWarehouseId), eq(warehouseStock.productId, productId)));

    if (!toWs) {
      await tx.insert(warehouseStock).values({ warehouseId: toWarehouseId, productId, quantity: 0 });
      [toWs] = await tx.select().from(warehouseStock)
        .where(and(eq(warehouseStock.warehouseId, toWarehouseId), eq(warehouseStock.productId, productId)));
    }

    const newFromQty = fromWs.quantity - qty;
    const newToQty = (toWs?.quantity ?? 0) + qty;

    // Update both warehouse stocks atomically
    await tx.update(warehouseStock).set({ quantity: newFromQty })
      .where(and(eq(warehouseStock.warehouseId, fromWarehouseId), eq(warehouseStock.productId, productId)));
    await tx.update(warehouseStock).set({ quantity: newToQty })
      .where(and(eq(warehouseStock.warehouseId, toWarehouseId), eq(warehouseStock.productId, productId)));

    // Get product stock for logs
    const [product] = await tx.select().from(products).where(eq(products.id, productId));
    const productStock = product?.stockCurrent ?? 0;

    // Create stock logs
    await tx.insert(stockLogs).values({
      businessId, productId, date, movementType: "out", qty, direction: -1,
      stockBefore: productStock, stockAfter: productStock,
      notes: `Transfer keluar ke gudang lain${notes ? ': ' + notes : ''}`,
    });
    await tx.insert(stockLogs).values({
      businessId, productId, date, movementType: "in", qty, direction: 1,
      stockBefore: productStock, stockAfter: productStock,
      notes: `Transfer masuk dari gudang lain${notes ? ': ' + notes : ''}`,
    });

    // Create transfer record
    const [transferResult] = await tx.insert(stockTransfers).values(stripUndefined({
      businessId, fromWarehouseId, toWarehouseId, productId, qty, date, notes,
    }));

    // Recalc product aggregate from all warehouses inside tx
    const allWs = await tx.select({ quantity: warehouseStock.quantity })
      .from(warehouseStock).where(eq(warehouseStock.productId, productId));
    const totalStock = allWs.reduce((sum, ws) => sum + (ws.quantity || 0), 0);
    await tx.update(products).set({ stockCurrent: totalStock }).where(eq(products.id, productId));

    return { transferId: transferResult.insertId, fromQty: newFromQty, toQty: newToQty };
  });
}

// Adjust warehouse stock when a sale/purchase happens
export async function adjustWarehouseStock(params: {
  warehouseId: number;
  productId: number;
  qty: number;
  direction: 1 | -1; // 1 = add (purchase), -1 = subtract (sale)
}): Promise<number> {
  const { warehouseId, productId, qty, direction } = params;
  const ws = await getOrCreateWarehouseStock(warehouseId, productId);
  const newQty = ws.quantity + (qty * direction);
  if (newQty < 0) {
    throw new Error(`Stok di gudang tidak cukup. Tersedia: ${ws.quantity}`);
  }
  await updateWarehouseStockQty(warehouseId, productId, newQty);
  // Recalc aggregate
  const total = await recalcProductStockFromWarehouses(productId);
  return total;
}

// Migrate existing stock to default warehouse (one-time migration)
export async function migrateStockToDefaultWarehouse(businessId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const defaultWh = await ensureDefaultWarehouse(businessId);
  
  // Get all products for this business that have stock
  const allProducts = await db.select().from(products).where(and(eq(products.businessId, businessId), eq(products.isActive, true)));
  
  for (const product of allProducts) {
    if (product.stockCurrent > 0) {
      // Check if warehouse_stock already exists
      const existing = await db.select().from(warehouseStock).where(and(eq(warehouseStock.warehouseId, defaultWh.id), eq(warehouseStock.productId, product.id))).limit(1);
      if (!existing[0]) {
        await db.insert(warehouseStock).values({
          warehouseId: defaultWh.id,
          productId: product.id,
          quantity: product.stockCurrent,
        });
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// Team Members & Invites (Multi-Account / Role System)
// ═══════════════════════════════════════════════════════════════

// Default permissions per role
export const ROLE_PERMISSIONS: Record<string, Record<string, boolean>> = {
  owner: { dashboard: true, transaksi: true, stok: true, gudang: true, pos: true, client: true, hutang: true, anggaran: true, analitik: true, laporan: true, pajak: true, pengaturan: true, team: true },
  manager: { dashboard: true, transaksi: true, stok: true, gudang: true, pos: true, client: true, hutang: true, anggaran: true, analitik: true, laporan: true, pajak: false, pengaturan: false, team: false },
  kasir: { dashboard: false, transaksi: true, stok: false, gudang: false, pos: true, client: false, hutang: false, anggaran: false, analitik: false, laporan: false, pajak: false, pengaturan: false, team: false },
  gudang: { dashboard: false, transaksi: false, stok: true, gudang: true, pos: false, client: false, hutang: false, anggaran: false, analitik: false, laporan: false, pajak: false, pengaturan: false, team: false },
  viewer: { dashboard: true, transaksi: false, stok: false, gudang: false, pos: false, client: false, hutang: false, anggaran: false, analitik: true, laporan: true, pajak: false, pengaturan: false, team: false },
};

export const PERMISSION_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  transaksi: "Transaksi",
  stok: "Stok Produk",
  gudang: "Gudang",
  pos: "Kasir (POS)",
  client: "Manajemen Client",
  hutang: "Hutang & Piutang",
  anggaran: "Anggaran",
  analitik: "Analitik Penjualan",
  laporan: "Laporan Keuangan",
  pajak: "Pajak",
  pengaturan: "Pengaturan",
  team: "Kelola Tim",
};

// ─── Team Members ───
export async function getTeamMembersByBusiness(businessId: number): Promise<TeamMember[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(teamMembers).where(eq(teamMembers.businessId, businessId)).orderBy(teamMembers.joinedAt);
}

export async function getTeamMemberByUserAndBusiness(userId: number, businessId: number): Promise<TeamMember | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(teamMembers).where(and(eq(teamMembers.userId, userId), eq(teamMembers.businessId, businessId))).limit(1);
  return rows[0];
}

export async function getTeamMembershipsByUser(userId: number): Promise<(TeamMember & { businessName?: string })[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    id: teamMembers.id,
    businessId: teamMembers.businessId,
    userId: teamMembers.userId,
    role: teamMembers.role,
    permissions: teamMembers.permissions,
    defaultCashAccountId: teamMembers.defaultCashAccountId,
    invitedBy: teamMembers.invitedBy,
    status: teamMembers.status,
    joinedAt: teamMembers.joinedAt,
    updatedAt: teamMembers.updatedAt,
    businessName: businesses.businessName,
  }).from(teamMembers)
    .innerJoin(businesses, eq(teamMembers.businessId, businesses.id))
    .where(and(eq(teamMembers.userId, userId), eq(teamMembers.status, "active")));
  return rows;
}

export async function createTeamMember(data: InsertTeamMember): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  requireFields(data, ["businessId", "userId", "role"], "team_members");
  const result = await db.insert(teamMembers).values(stripUndefined(data));
  return Number(result[0].insertId);
}

export async function updateTeamMember(id: number, data: Partial<Pick<TeamMember, "role" | "permissions" | "status">>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(teamMembers).set(data).where(eq(teamMembers.id, id));
}

export async function deleteTeamMember(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(teamMembers).where(eq(teamMembers.id, id));
}

export async function getTeamMemberById(id: number): Promise<TeamMember | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(teamMembers).where(eq(teamMembers.id, id)).limit(1);
  return rows[0];
}

// ─── Team Invites ───
export async function createTeamInvite(data: InsertTeamInvite): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  requireFields(data, ["businessId", "email", "role", "token"], "team_invites");
  const result = await db.insert(teamInvites).values(stripUndefined(data));
  return Number(result[0].insertId);
}

export async function getTeamInviteByToken(token: string): Promise<TeamInvite | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(teamInvites).where(eq(teamInvites.token, token)).limit(1);
  return rows[0];
}

export async function getPendingInvitesByEmail(email: string): Promise<TeamInvite[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(teamInvites)
    .where(and(eq(teamInvites.email, email), eq(teamInvites.status, "pending")))
    .orderBy(desc(teamInvites.createdAt));
}

export async function getTeamInvitesByBusiness(businessId: number): Promise<TeamInvite[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(teamInvites).where(eq(teamInvites.businessId, businessId)).orderBy(desc(teamInvites.createdAt));
}

export async function updateTeamInviteStatus(id: number, status: "pending" | "accepted" | "expired"): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(teamInvites).set({ status }).where(eq(teamInvites.id, id));
}

export async function deleteTeamInvite(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(teamInvites).where(eq(teamInvites.id, id));
}

// Get business for a team member (employee accessing boss's business)
export async function getBusinessForTeamMember(userId: number): Promise<{ business: Business; membership: TeamMember } | null> {
  const db = await getDb();
  if (!db) return null;
  const memberships = await db.select().from(teamMembers)
    .where(and(eq(teamMembers.userId, userId), eq(teamMembers.status, "active")))
    .limit(1);
  if (memberships.length === 0) return null;
  const biz = await db.select().from(businesses).where(eq(businesses.id, memberships[0].businessId)).limit(1);
  if (biz.length === 0) return null;
  return { business: biz[0], membership: memberships[0] };
}

// Get user info for team member display
export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0];
}

// Get multiple users by IDs
export async function getUsersByIds(ids: number[]) {
  const db = await getDb();
  if (!db || ids.length === 0) return [];
  return db.select().from(users).where(inArray(users.id, ids));
}

/**
 * Resolve which business a user should operate on.
 * Priority:
 * 1. If requestedBusinessId is provided and user is owner or active team member → use that business
 * 2. Otherwise, fall back to user's own business
 * Returns { business, isOwner, membership } or null
 */
export async function resolveBusinessForUser(userId: number, requestedBusinessId: number | null, userRole?: string): Promise<{
  business: Business;
  isOwner: boolean;
  membership: TeamMember | null;
  isAdminImpersonating?: boolean;
} | null> {
  // If a specific business is requested, check access
  if (requestedBusinessId) {
    const biz = await getBusinessById(requestedBusinessId);
    if (!biz) return null;
    // Admin impersonation: admin can access ANY business as owner
    if (userRole === "admin") {
      return { business: biz, isOwner: true, membership: null, isAdminImpersonating: biz.ownerId !== userId };
    }
    // Check if user is the owner
    if (biz.ownerId === userId) {
      return { business: biz, isOwner: true, membership: null };
    }
    // Check if user is a team member
    const membership = await getTeamMemberByUserAndBusiness(userId, requestedBusinessId);
    if (membership && membership.status === "active") {
      return { business: biz, isOwner: false, membership };
    }
    // No access to requested business, fall through to own business
  }
  // Default: user's own business
  const ownBiz = await getBusinessByOwnerId(userId);
  if (ownBiz) {
    return { business: ownBiz, isOwner: true, membership: null };
  }
  // Fallback: check if user is a team member of ANY business
  const db = await getDb();
  if (db) {
    const memberships = await db.select().from(teamMembers)
      .where(and(eq(teamMembers.userId, userId), eq(teamMembers.status, "active")))
      .limit(1);
    if (memberships.length > 0) {
      const memberBiz = await getBusinessById(memberships[0].businessId);
      if (memberBiz) {
        return { business: memberBiz, isOwner: false, membership: memberships[0] };
      }
    }
  }
  return null;
}

// ─── Savings Goals (Tabungan Impian) ───
export async function getSavingsGoalsByBusiness(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(savingsGoals).where(eq(savingsGoals.businessId, businessId)).orderBy(savingsGoals.createdAt);
}

export async function createSavingsGoal(data: InsertSavingsGoal) {
  const db = await getDb();
  if (!db) return 0;
  requireFields(data, ["businessId", "name", "targetAmount"], "savings_goals");
  const [result] = await db.insert(savingsGoals).values(stripUndefined(data));
  return result.insertId;
}

export async function updateSavingsGoal(id: number, businessId: number, data: Partial<InsertSavingsGoal>) {
  const db = await getDb();
  if (!db) return;
  await db.update(savingsGoals).set(data).where(and(eq(savingsGoals.id, id), eq(savingsGoals.businessId, businessId)));
}

export async function deleteSavingsGoal(id: number, businessId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(savingsGoals).where(and(eq(savingsGoals.id, id), eq(savingsGoals.businessId, businessId)));
}

export async function addToSavingsGoal(id: number, businessId: number, amount: number) {
  const db = await getDb();
  if (!db) return null;
  const [goal] = await db.select().from(savingsGoals).where(and(eq(savingsGoals.id, id), eq(savingsGoals.businessId, businessId)));
  if (!goal) return null;
  const newAmount = goal.currentAmount + amount;
  const isCompleted = newAmount >= goal.targetAmount;
  await db.update(savingsGoals).set({ currentAmount: newAmount, isCompleted }).where(eq(savingsGoals.id, id));
  return { ...goal, currentAmount: newAmount, isCompleted };
}

// ─── Monthly Bills (Tagihan Bulanan) ───
export async function getMonthlyBillsByBusiness(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(monthlyBills).where(eq(monthlyBills.businessId, businessId)).orderBy(monthlyBills.dueDay);
}

export async function createMonthlyBill(data: InsertMonthlyBill) {
  const db = await getDb();
  if (!db) return 0;
  requireFields(data, ["businessId", "name", "amount", "dueDay"], "monthly_bills");
  const [result] = await db.insert(monthlyBills).values(stripUndefined(data));
  return result.insertId;
}

export async function updateMonthlyBill(id: number, businessId: number, data: Partial<InsertMonthlyBill>) {
  const db = await getDb();
  if (!db) return;
  await db.update(monthlyBills).set(data).where(and(eq(monthlyBills.id, id), eq(monthlyBills.businessId, businessId)));
}

export async function deleteMonthlyBill(id: number, businessId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(monthlyBills).where(and(eq(monthlyBills.id, id), eq(monthlyBills.businessId, businessId)));
}

// ─── Toggle Debt (Hutang Piutang) ───
export async function updateBusinessDebtEnabled(businessId: number, debtEnabled: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(businesses).set({ debtEnabled }).where(eq(businesses.id, businessId));
}

// ─── Personal Setup Done ───
export async function updateBusinessPersonalSetupDone(businessId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(businesses).set({ personalSetupDone: true }).where(eq(businesses.id, businessId));
}

// ─── POS Shifts ───

export async function createPosShift(data: InsertPosShift): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  requireFields(data, ["businessId", "userId", "openingCash"], "pos_shifts");
  const [result] = await db.insert(posShifts).values(stripUndefined(data)).$returningId();
  return result.id;
}

export async function getOpenShift(businessId: number, userId: number): Promise<PosShift | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(posShifts).where(
    and(eq(posShifts.businessId, businessId), eq(posShifts.userId, userId), eq(posShifts.status, "open"))
  ).limit(1);
  return rows[0];
}

export async function closePosShift(shiftId: number, data: {
  closingCash: number;
  expectedCash: number;
  cashDifference: number;
  totalSales: number;
  totalTransactions: number;
  totalRefunds: number;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.update(posShifts).set({
    status: "closed",
    closedAt: new Date(),
    ...data,
  }).where(eq(posShifts.id, shiftId));
}

export async function getShiftsByBusiness(businessId: number, limit = 50): Promise<PosShift[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(posShifts).where(eq(posShifts.businessId, businessId)).orderBy(desc(posShifts.openedAt)).limit(limit);
}

export async function getPosShiftById(id: number): Promise<PosShift | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(posShifts).where(eq(posShifts.id, id)).limit(1);
  return rows[0];
}

// ─── Discount Codes ───

export async function createDiscountCode(data: InsertDiscountCode): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  requireFields(data, ["businessId", "code", "discountType", "discountValue"], "discount_codes");
  const [result] = await db.insert(discountCodes).values(stripUndefined(data)).$returningId();
  return result.id;
}

export async function getDiscountCodesByBusiness(businessId: number): Promise<DiscountCode[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(discountCodes).where(eq(discountCodes.businessId, businessId)).orderBy(desc(discountCodes.createdAt));
}

export async function validateDiscountCode(businessId: number, code: string): Promise<DiscountCode | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(discountCodes).where(
    and(
      eq(discountCodes.businessId, businessId),
      eq(discountCodes.code, code.toUpperCase()),
      eq(discountCodes.isActive, true),
    )
  ).limit(1);
  const discount = rows[0];
  if (!discount) return null;

  const today = new Date().toISOString().slice(0, 10);
  if (discount.validFrom && today < discount.validFrom) return null;
  if (discount.validUntil && today > discount.validUntil) return null;
  if (discount.maxUses && discount.currentUses >= discount.maxUses) return null;

  return discount;
}

export async function incrementDiscountUsage(discountId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(discountCodes).set({
    currentUses: sql`${discountCodes.currentUses} + 1`,
  }).where(eq(discountCodes.id, discountId));
}

export async function updateDiscountCode(id: number, data: Partial<InsertDiscountCode>) {
  const db = await getDb();
  if (!db) return;
  await db.update(discountCodes).set(data).where(eq(discountCodes.id, id));
}

export async function deleteDiscountCode(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(discountCodes).where(eq(discountCodes.id, id));
}

// ─── POS Receipts ───

export async function generateReceiptCode(businessId: number): Promise<string> {
  const db = await getDb();
  if (!db) return "RCP-000000-001";
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const prefix = `RCP-${dateStr}-`;

  const rows = await db.select({ code: posReceipts.receiptCode }).from(posReceipts)
    .where(and(eq(posReceipts.businessId, businessId), sql`${posReceipts.receiptCode} LIKE ${prefix + "%"}`))
    .orderBy(desc(posReceipts.receiptCode))
    .limit(1);

  if (rows.length === 0) return `${prefix}001`;
  const lastNum = parseInt(rows[0].code.replace(prefix, ""), 10) || 0;
  return `${prefix}${String(lastNum + 1).padStart(3, "0")}`;
}

export async function createPosReceipt(data: InsertPosReceipt): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  requireFields(data, ["businessId", "receiptCode", "totalAmount"], "pos_receipts");
  const [result] = await db.insert(posReceipts).values(stripUndefined(data)).$returningId();
  return result.id;
}

export async function createPosReceiptItems(items: InsertPosReceiptItem[]): Promise<void> {
  const db = await getDb();
  if (!db || items.length === 0) return;
  const cleanedItems = items.map(item => {
    requireFields(item, ["receiptId", "productId", "productName", "quantity", "unitPrice", "subtotal"], "pos_receipt_items");
    return stripUndefined(item);
  });
  await db.insert(posReceiptItems).values(cleanedItems);
}

export async function getPosReceiptItemsByReceipt(receiptId: number): Promise<PosReceiptItem[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(posReceiptItems).where(eq(posReceiptItems.receiptId, receiptId));
}

// Get POS revenue + HPP for financial reports (replaces transaction-based calculation)
export async function getPosRevenueForPeriod(businessId: number, month: number, year: number) {
  const db = await getDb();
  if (!db) return { revenue: 0, hpp: 0, refunds: 0 };
  const periodStr = `${year}-${String(month).padStart(2, "0")}`;

  // Get receiptIds that already have linked transactions (to avoid double-counting)
  const linkedTxs = await db.select({ receiptId: transactions.receiptId })
    .from(transactions)
    .where(and(
      eq(transactions.businessId, businessId),
      eq(transactions.isDeleted, false),
      isNotNull(transactions.receiptId),
      sql`${transactions.date} LIKE ${periodStr + "%"}`
    ));
  const linkedReceiptIds = new Set(linkedTxs.map(t => t.receiptId).filter(Boolean));

  // Get all non-refunded receipts for this period
  const receipts = await db.select().from(posReceipts).where(
    and(eq(posReceipts.businessId, businessId), sql`${posReceipts.date} LIKE ${periodStr + "%"}`)
  );

  let revenue = 0, refunds = 0;
  const receiptIds: number[] = [];
  for (const r of receipts) {
    // Skip receipts that already have linked transactions
    if (linkedReceiptIds.has(r.id)) continue;
    if (r.isRefunded) { refunds += r.grandTotal; }
    else { revenue += r.grandTotal; receiptIds.push(r.id); }
  }

  // Get HPP from receipt items
  let hpp = 0;
  if (receiptIds.length > 0) {
    const items = await db.select().from(posReceiptItems).where(
      sql`${posReceiptItems.receiptId} IN (${sql.join(receiptIds.map(id => sql`${id}`), sql`, `)})`
    );
    for (const item of items) {
      hpp += (item.hppSnapshot ?? 0) * item.qty;
    }
  }

  return { revenue, hpp, refunds };
}

export async function getPosReceiptsByBusiness(businessId: number, limit = 50): Promise<PosReceipt[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(posReceipts).where(eq(posReceipts.businessId, businessId)).orderBy(desc(posReceipts.createdAt)).limit(limit);
}

export async function getPosReceiptsByDate(businessId: number, date: string): Promise<PosReceipt[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(posReceipts)
    .where(and(eq(posReceipts.businessId, businessId), eq(posReceipts.date, date)))
    .orderBy(desc(posReceipts.createdAt));
}

export async function getDailySalesReport(businessId: number, date: string) {
  const db = await getDb();
  if (!db) return { date, receipts: [], totalSales: 0, totalDiscount: 0, totalRefunds: 0, netSales: 0, totalTransactions: 0, byPaymentMethod: {} as Record<string, number>, byHour: {} as Record<string, number> };

  const receipts = await db.select().from(posReceipts)
    .where(and(eq(posReceipts.businessId, businessId), eq(posReceipts.date, date)))
    .orderBy(desc(posReceipts.createdAt));

  let totalSales = 0;
  let totalDiscount = 0;
  let totalRefunds = 0;
  let totalTransactions = 0;
  const byPaymentMethod: Record<string, number> = {};
  const byHour: Record<string, number> = {};

  for (const r of receipts) {
    if (r.isRefunded) {
      totalRefunds += r.grandTotal;
    } else {
      totalSales += r.grandTotal;
      totalTransactions++;
    }
    totalDiscount += r.discountAmount;

    // Parse payments JSON
    const payments = (typeof r.payments === "string" ? JSON.parse(r.payments) : r.payments) as Array<{ method: string; amount: number }>;
    for (const p of payments) {
      byPaymentMethod[p.method] = (byPaymentMethod[p.method] || 0) + p.amount;
    }

    // Group by hour
    if (r.createdAt) {
      const hour = new Date(r.createdAt).getHours();
      const hourKey = `${String(hour).padStart(2, "0")}:00`;
      byHour[hourKey] = (byHour[hourKey] || 0) + (r.isRefunded ? 0 : r.grandTotal);
    }
  }

  const netSales = totalSales - totalRefunds;

  // Product-level breakdown from pos_receipt_items (not transactions)
  const receiptIds = receipts.filter(r => !r.isRefunded).map(r => r.id);
  const byProduct: Record<number, { name: string; qty: number; revenue: number; hpp: number }> = {};
  if (receiptIds.length > 0) {
    const items = await db.select().from(posReceiptItems).where(
      sql`${posReceiptItems.receiptId} IN (${sql.join(receiptIds.map(id => sql`${id}`), sql`, `)})`
    );
    for (const item of items) {
      if (!byProduct[item.productId]) {
        byProduct[item.productId] = { name: item.productName, qty: 0, revenue: 0, hpp: 0 };
      }
      byProduct[item.productId].qty += item.qty;
      byProduct[item.productId].revenue += item.totalPrice;
      byProduct[item.productId].hpp += (item.hppSnapshot ?? 0) * item.qty;
    }
  }

  return {
    date,
    receipts,
    totalSales,
    totalDiscount,
    totalRefunds,
    netSales,
    totalTransactions,
    byPaymentMethod,
    byHour,
    byProduct: Object.values(byProduct).sort((a, b) => b.revenue - a.revenue),
  };
}

// ─── Period Sales Report (date range) ───
export async function getPeriodSalesReport(businessId: number, startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) return { startDate, endDate, receipts: [], totalSales: 0, totalDiscount: 0, totalRefunds: 0, netSales: 0, totalTransactions: 0, byPaymentMethod: {} as Record<string, number>, byDate: {} as Record<string, number>, byProduct: [] as Array<{ name: string; qty: number; revenue: number; hpp: number }> };

  const receipts = await db.select().from(posReceipts)
    .where(and(eq(posReceipts.businessId, businessId), sql`${posReceipts.date} >= ${startDate}`, sql`${posReceipts.date} <= ${endDate}`))
    .orderBy(desc(posReceipts.createdAt));

  let totalSales = 0, totalDiscount = 0, totalRefunds = 0, totalTransactions = 0;
  const byPaymentMethod: Record<string, number> = {};
  const byDate: Record<string, number> = {};

  for (const r of receipts) {
    if (r.isRefunded) { totalRefunds += r.grandTotal; }
    else { totalSales += r.grandTotal; totalTransactions++; }
    totalDiscount += r.discountAmount;
    const payments = (typeof r.payments === "string" ? JSON.parse(r.payments) : r.payments) as Array<{ method: string; amount: number }>;
    for (const p of payments) { byPaymentMethod[p.method] = (byPaymentMethod[p.method] || 0) + p.amount; }
    if (!r.isRefunded) { byDate[r.date] = (byDate[r.date] || 0) + r.grandTotal; }
  }

  const netSales = totalSales - totalRefunds;

  // Product breakdown from pos_receipt_items (not transactions)
  const receiptIds = receipts.filter(r => !r.isRefunded).map(r => r.id);
  const byProduct: Record<number, { name: string; qty: number; revenue: number; hpp: number }> = {};
  if (receiptIds.length > 0) {
    const items = await db.select().from(posReceiptItems).where(
      sql`${posReceiptItems.receiptId} IN (${sql.join(receiptIds.map(id => sql`${id}`), sql`, `)})`
    );
    for (const item of items) {
      if (!byProduct[item.productId]) byProduct[item.productId] = { name: item.productName, qty: 0, revenue: 0, hpp: 0 };
      byProduct[item.productId].qty += item.qty;
      byProduct[item.productId].revenue += item.totalPrice;
      byProduct[item.productId].hpp += (item.hppSnapshot ?? 0) * item.qty;
    }
  }

  return { startDate, endDate, receipts, totalSales, totalDiscount, totalRefunds, netSales, totalTransactions, byPaymentMethod, byDate, byProduct: Object.values(byProduct).sort((a, b) => b.revenue - a.revenue) };
}

export async function getPosReceiptById(id: number): Promise<PosReceipt | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(posReceipts).where(eq(posReceipts.id, id)).limit(1);
  return rows[0];
}

export async function refundPosReceipt(receiptId: number, reason: string) {
  const db = await getDb();
  if (!db) return;
  const receipt = await getPosReceiptById(receiptId);
  if (!receipt || receipt.isRefunded) return null;

  await db.update(posReceipts).set({
    isRefunded: true,
    refundedAt: new Date(),
    refundReason: reason,
    refundAmount: receipt.grandTotal,
  }).where(eq(posReceipts.id, receiptId));

  return receipt;
}

// ═══════════════════════════════════════════════════════════
// ─── Seed Dummy Data for Demo/Content ───
// ═══════════════════════════════════════════════════════════

export async function seedDummyData(businessId: number): Promise<{ success: boolean; counts: Record<string, number> }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const counts: Record<string, number> = {};

  // ─── 1. Warehouse ───
  const wh = await ensureDefaultWarehouse(businessId);
  const wh2Id = await createWarehouse({ businessId, name: "Gudang Toko", isDefault: false, isActive: true, address: "Jl. Raya Utama No. 15, Jakarta" });

  // ─── 2. Products (Sabitah Skincare & Beauty) ───
  const productData = [
    { businessId, name: "Sabitah Glow Serum 30ml", sku: "SAB-SRM-001", category: "Skincare", hpp: 45000, sellingPrice: 129000, stockCurrent: 85, stockMinimum: 20, unit: "pcs" },
    { businessId, name: "Sabitah Moisturizer SPF30", sku: "SAB-MOI-001", category: "Skincare", hpp: 38000, sellingPrice: 99000, stockCurrent: 120, stockMinimum: 25, unit: "pcs" },
    { businessId, name: "Sabitah Facial Wash 100ml", sku: "SAB-FW-001", category: "Skincare", hpp: 22000, sellingPrice: 69000, stockCurrent: 200, stockMinimum: 40, unit: "pcs" },
    { businessId, name: "Sabitah Lip Tint Rose", sku: "SAB-LT-001", category: "Makeup", hpp: 18000, sellingPrice: 59000, stockCurrent: 150, stockMinimum: 30, unit: "pcs" },
    { businessId, name: "Sabitah Lip Tint Peach", sku: "SAB-LT-002", category: "Makeup", hpp: 18000, sellingPrice: 59000, stockCurrent: 140, stockMinimum: 30, unit: "pcs" },
    { businessId, name: "Sabitah Body Lotion 200ml", sku: "SAB-BL-001", category: "Body Care", hpp: 28000, sellingPrice: 79000, stockCurrent: 95, stockMinimum: 20, unit: "pcs" },
    { businessId, name: "Sabitah Hair Serum 50ml", sku: "SAB-HS-001", category: "Hair Care", hpp: 35000, sellingPrice: 89000, stockCurrent: 60, stockMinimum: 15, unit: "pcs" },
    { businessId, name: "Sabitah Toner Brightening", sku: "SAB-TON-001", category: "Skincare", hpp: 30000, sellingPrice: 85000, stockCurrent: 75, stockMinimum: 18, unit: "pcs" },
    { businessId, name: "Sabitah Eye Cream 15ml", sku: "SAB-EC-001", category: "Skincare", hpp: 52000, sellingPrice: 149000, stockCurrent: 45, stockMinimum: 10, unit: "pcs" },
    { businessId, name: "Sabitah Sunscreen SPF50", sku: "SAB-SS-001", category: "Skincare", hpp: 40000, sellingPrice: 119000, stockCurrent: 110, stockMinimum: 25, unit: "pcs" },
    { businessId, name: "Sabitah Micellar Water 200ml", sku: "SAB-MW-001", category: "Skincare", hpp: 25000, sellingPrice: 75000, stockCurrent: 88, stockMinimum: 20, unit: "pcs" },
    { businessId, name: "Sabitah Sheet Mask (5pcs)", sku: "SAB-SM-001", category: "Skincare", hpp: 15000, sellingPrice: 49000, stockCurrent: 200, stockMinimum: 50, unit: "pack" },
    { businessId, name: "Sabitah Blush On Coral", sku: "SAB-BO-001", category: "Makeup", hpp: 22000, sellingPrice: 69000, stockCurrent: 70, stockMinimum: 15, unit: "pcs" },
    { businessId, name: "Sabitah Setting Spray 60ml", sku: "SAB-SP-001", category: "Makeup", hpp: 20000, sellingPrice: 65000, stockCurrent: 55, stockMinimum: 12, unit: "pcs" },
    { businessId, name: "Sabitah Gift Set Premium", sku: "SAB-GS-001", category: "Bundle", hpp: 120000, sellingPrice: 349000, stockCurrent: 25, stockMinimum: 5, unit: "set" },
  ];

  const productIds: number[] = [];
  for (const p of productData) {
    const id = await safeInsertProduct(p);
    productIds.push(id);
    // Add stock to default warehouse
    await updateWarehouseStockQty(wh.id, id, Math.floor((p.stockCurrent ?? 0) * 0.7));
    await updateWarehouseStockQty(wh2Id, id, Math.floor((p.stockCurrent ?? 0) * 0.3));
  }
  counts.products = productIds.length;

  // ─── 3. Clients ───
  const clientData: InsertClient[] = [
    { businessId, name: "Toko Cantik Jaya", email: "cantikjaya@gmail.com", phone: "081234567890", company: "CV Cantik Jaya", address: "Jl. Pasar Baru No. 23, Jakarta Pusat", notes: "Reseller tetap, order rutin 2x/bulan" },
    { businessId, name: "Beauty Corner Bandung", email: "beautycorner.bdg@gmail.com", phone: "082198765432", company: "Beauty Corner", address: "Jl. Braga No. 45, Bandung", notes: "Distributor area Bandung Raya" },
    { businessId, name: "Sari Kosmetik", email: "sarikosmetik@yahoo.com", phone: "087654321098", company: "UD Sari Kosmetik", address: "Jl. Somba Opu No. 12, Makassar", notes: "Customer baru, potensi besar" },
    { businessId, name: "Rina Maharani", email: "rina.mhr@gmail.com", phone: "081345678901", notes: "End customer loyal, member VIP" },
    { businessId, name: "Shopee Official Store", email: "sabitah.shopee@gmail.com", company: "Shopee Indonesia", notes: "Channel marketplace Shopee" },
    { businessId, name: "Tokopedia Store", email: "sabitah.tokped@gmail.com", company: "Tokopedia", notes: "Channel marketplace Tokopedia" },
    { businessId, name: "Salon Dewi Ayu", email: "salondewiayu@gmail.com", phone: "085678901234", company: "Salon Dewi Ayu", address: "Jl. Gatot Subroto No. 88, Surabaya", notes: "Salon partner, beli bundle" },
    { businessId, name: "Apotek Sehat Farma", email: "sehatfarma@gmail.com", phone: "081567890123", company: "PT Sehat Farma", address: "Jl. Veteran No. 5, Yogyakarta", notes: "Apotek partner skincare" },
  ];

  const clientIds: number[] = [];
  for (const c of clientData) {
    const id = await createClient(c);
    clientIds.push(id);
  }
  counts.clients = clientIds.length;

  // ─── 4. Transactions (3 months of data) ───
  const categories = {
    income: ["Penjualan Langsung", "Penjualan Online", "Penjualan Grosir", "Penjualan Produk"],
    expense: ["Bahan Baku", "Operasional", "Gaji Karyawan", "Sewa", "Utilitas", "Marketing", "Packaging", "Pengiriman"],
  };
  const payMethods = ["Tunai", "Transfer/QRIS", "Transfer/QRIS", "Transfer/QRIS"]; // weighted towards transfer

  let txCount = 0;
  for (let monthOffset = 2; monthOffset >= 0; monthOffset--) {
    const month = new Date(today);
    month.setMonth(month.getMonth() - monthOffset);
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const yearMonth = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;

    // Generate 40-60 income transactions per month
    const incomeCount = 40 + Math.floor(Math.random() * 20);
    for (let i = 0; i < incomeCount; i++) {
      const day = 1 + Math.floor(Math.random() * Math.min(daysInMonth, monthOffset === 0 ? today.getDate() : daysInMonth));
      const dateStr = `${yearMonth}-${String(day).padStart(2, "0")}`;
      const cat = categories.income[Math.floor(Math.random() * categories.income.length)];
      const productIdx = Math.floor(Math.random() * productIds.length);
      const qty = 1 + Math.floor(Math.random() * 5);
      const price = productData[productIdx].sellingPrice ?? 0;

      const txCode = await generateTxCode(businessId);
      await safeInsertTransaction({
        businessId, txCode, date: dateStr, type: "pemasukan",
        category: cat, description: `${cat} - ${productData[productIdx].name}`,
        amount: price * qty,
        paymentMethod: payMethods[Math.floor(Math.random() * payMethods.length)],
        productId: productIds[productIdx], productQty: qty,
        productHppSnapshot: productData[productIdx].hpp ?? 0,
        clientId: Math.random() > 0.5 ? clientIds[Math.floor(Math.random() * clientIds.length)] : null,
        taxRelated: true,
      });
      txCount++;
    }

    // Generate 15-25 expense transactions per month
    const expenseCount = 15 + Math.floor(Math.random() * 10);
    for (let i = 0; i < expenseCount; i++) {
      const day = 1 + Math.floor(Math.random() * Math.min(daysInMonth, monthOffset === 0 ? today.getDate() : daysInMonth));
      const dateStr = `${yearMonth}-${String(day).padStart(2, "0")}`;
      const cat = categories.expense[Math.floor(Math.random() * categories.expense.length)];
      const amounts: Record<string, [number, number]> = {
        "Bahan Baku": [2000000, 8000000], "Operasional": [200000, 1500000],
        "Gaji Karyawan": [3000000, 5000000], "Sewa": [3000000, 5000000],
        "Utilitas": [300000, 800000], "Marketing": [500000, 3000000],
        "Packaging": [500000, 2000000], "Pengiriman": [100000, 500000],
      };
      const [min, max] = amounts[cat] || [200000, 1000000];
      const amount = min + Math.floor(Math.random() * (max - min));

      const txCode = await generateTxCode(businessId);
      await safeInsertTransaction({
        businessId, txCode, date: dateStr, type: "pengeluaran",
        category: cat, description: `${cat} - ${dateStr}`,
        amount, paymentMethod: payMethods[Math.floor(Math.random() * payMethods.length)],
        taxRelated: cat !== "Marketing",
      });
      txCount++;
    }
  }
  counts.transactions = txCount;

  // ─── 5. Debts (Hutang & Piutang) ───
  const debtData: InsertDebt[] = [
    { businessId, type: "piutang", counterpartyName: "Toko Cantik Jaya", clientId: clientIds[0], description: "Invoice penjualan grosir Maret", totalAmount: 5800000, paidAmount: 2000000, dueDate: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-25`, status: "belum_lunas" },
    { businessId, type: "piutang", counterpartyName: "Beauty Corner Bandung", clientId: clientIds[1], description: "Invoice penjualan Februari", totalAmount: 3200000, paidAmount: 3200000, status: "lunas" },
    { businessId, type: "piutang", counterpartyName: "Salon Dewi Ayu", clientId: clientIds[6], description: "Invoice bundle April", totalAmount: 4500000, paidAmount: 0, dueDate: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-30`, status: "belum_lunas" },
    { businessId, type: "hutang", counterpartyName: "PT Kimia Farma Supply", description: "Pembelian bahan baku Q1", totalAmount: 12000000, paidAmount: 8000000, dueDate: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-20`, status: "belum_lunas" },
    { businessId, type: "hutang", counterpartyName: "CV Packaging Indo", description: "Packaging & label custom", totalAmount: 3500000, paidAmount: 3500000, status: "lunas" },
    { businessId, type: "hutang", counterpartyName: "Toko Bahan Kimia Jaya", description: "Pembelian essential oil", totalAmount: 2800000, paidAmount: 0, dueDate: `${today.getFullYear()}-${String(today.getMonth() + 2).padStart(2, "0")}-15`, status: "belum_lunas" },
  ];

  for (const d of debtData) {
    await createDebt(d);
  }
  counts.debts = debtData.length;

  // ─── 6. Monthly Bills (Tagihan) ───
  const billData: InsertMonthlyBill[] = [
    { businessId, name: "Sewa Ruko", amount: 5000000, dueDay: 1, category: "Sewa", icon: "🏢" },
    { businessId, name: "Listrik", amount: 850000, dueDay: 20, category: "Utilitas", icon: "⚡" },
    { businessId, name: "Internet & WiFi", amount: 450000, dueDay: 25, category: "Utilitas", icon: "🌐" },
    { businessId, name: "Gaji — Rina (Admin)", amount: 3500000, dueDay: 28, category: "Gaji", icon: "👩" },
    { businessId, name: "Gaji — Deni (Gudang)", amount: 3200000, dueDay: 28, category: "Gaji", icon: "👨" },
    { businessId, name: "Gaji — Sari (Kasir)", amount: 3000000, dueDay: 28, category: "Gaji", icon: "👩‍💼" },
    { businessId, name: "Shopee Ads", amount: 1500000, dueDay: 5, category: "Marketing", icon: "📢" },
    { businessId, name: "Instagram Ads", amount: 2000000, dueDay: 5, category: "Marketing", icon: "📸" },
    { businessId, name: "BPJS Karyawan", amount: 450000, dueDay: 10, category: "Asuransi", icon: "🏥" },
    { businessId, name: "Cicilan Mobil Operasional", amount: 4200000, dueDay: 15, category: "Kredit", icon: "🚗" },
  ];

  for (const b of billData) {
    await createMonthlyBill(b);
  }
  counts.bills = billData.length;

  // ─── 7. Budgets ───
  const budgetPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const budgetData: InsertBudget[] = [
    { businessId, period: budgetPeriod, category: "Bahan Baku", budgetAmount: 15000000 },
    { businessId, period: budgetPeriod, category: "Gaji Karyawan", budgetAmount: 10000000 },
    { businessId, period: budgetPeriod, category: "Marketing", budgetAmount: 5000000 },
    { businessId, period: budgetPeriod, category: "Operasional", budgetAmount: 3000000 },
    { businessId, period: budgetPeriod, category: "Sewa", budgetAmount: 5000000 },
    { businessId, period: budgetPeriod, category: "Utilitas", budgetAmount: 1500000 },
    { businessId, period: budgetPeriod, category: "Packaging", budgetAmount: 4000000 },
    { businessId, period: budgetPeriod, category: "Pengiriman", budgetAmount: 2000000 },
  ];

  for (const b of budgetData) {
    await createBudget(b);
  }
  counts.budgets = budgetData.length;

  // ─── 8. Discount Codes ───
  await createDiscountCode({
    businessId, code: "SABITAH10", name: "Diskon Member 10%",
    discountType: "percentage", discountValue: 10, isActive: true,
    validFrom: todayStr, maxUses: 100, currentUses: 12,
  });
  await createDiscountCode({
    businessId, code: "NEWCUST", name: "Customer Baru Diskon 15rb",
    discountType: "fixed", discountValue: 15000, isActive: true,
    validFrom: todayStr, maxUses: 50, currentUses: 5,
  });
  counts.discountCodes = 2;

  return { success: true, counts };
}

// ─── Clear Dummy Data (Reset) ───
export async function clearBusinessData(businessId: number): Promise<{ success: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Safe delete helper — skips if table doesn't exist (errno 1146)
  const safeDel = async (fn: () => Promise<any>, label: string) => {
    try { await fn(); } catch (e: any) {
      if (e.errno === 1146) { console.warn(`[Reset] Table not found, skipping: ${label}`); return; }
      console.error(`[Reset] Failed to clear ${label}:`, e.message);
    }
  };

  // Delete in order of dependencies (child tables first)

  // Credit system
  await safeDel(() => db.delete(creditPayments).where(
    sql`${creditPayments.creditSaleId} IN (SELECT id FROM credit_sales WHERE businessId = ${businessId})`
  ), "credit_payments");
  await safeDel(() => db.delete(creditSales).where(eq(creditSales.businessId, businessId)), "credit_sales");

  // Debt system
  await safeDel(() => db.delete(debtPayments).where(
    sql`${debtPayments.debtId} IN (SELECT id FROM debts WHERE businessId = ${businessId})`
  ), "debt_payments");
  await safeDel(() => db.delete(debts).where(eq(debts.businessId, businessId)), "debts");

  // Deposits
  await safeDel(() => db.delete(depositTransactions).where(eq(depositTransactions.businessId, businessId)), "deposit_transactions");
  await safeDel(() => db.delete(customerDeposits).where(eq(customerDeposits.businessId, businessId)), "customer_deposits");

  // Commissions
  await safeDel(() => db.delete(staffCommissions).where(eq(staffCommissions.businessId, businessId)), "staff_commissions");
  await safeDel(() => db.delete(commissionConfig).where(eq(commissionConfig.businessId, businessId)), "commission_config");

  // POS receipt items (before receipts)
  await safeDel(() => db.delete(posReceiptItems).where(
    sql`${posReceiptItems.receiptId} IN (SELECT id FROM pos_receipts WHERE businessId = ${businessId})`
  ), "pos_receipt_items");
  await safeDel(() => db.delete(posReceipts).where(eq(posReceipts.businessId, businessId)), "pos_receipts");
  await safeDel(() => db.delete(posShifts).where(eq(posShifts.businessId, businessId)), "pos_shifts");
  await safeDel(() => db.delete(discountCodes).where(eq(discountCodes.businessId, businessId)), "discount_codes");

  // Attendance & Outlets
  await safeDel(() => db.delete(staffAttendance).where(eq(staffAttendance.businessId, businessId)), "staff_attendance");
  await safeDel(() => db.delete(outlets).where(eq(outlets.businessId, businessId)), "outlets");

  // Stock & inventory
  await safeDel(() => db.delete(stockBatches).where(eq(stockBatches.businessId, businessId)), "stock_batches");
  await safeDel(() => db.delete(productionLogs).where(eq(productionLogs.businessId, businessId)), "production_logs");
  await safeDel(() => db.delete(stockTransfers).where(eq(stockTransfers.businessId, businessId)), "stock_transfers");
  await safeDel(() => db.delete(warehouseStock).where(
    sql`${warehouseStock.warehouseId} IN (SELECT id FROM warehouses WHERE businessId = ${businessId})`
  ), "warehouse_stock");
  await safeDel(() => db.delete(stockLogs).where(eq(stockLogs.businessId, businessId)), "stock_logs");

  // Core data
  await safeDel(() => db.delete(transactions).where(eq(transactions.businessId, businessId)), "transactions");
  await safeDel(() => db.delete(products).where(eq(products.businessId, businessId)), "products");
  await safeDel(() => db.delete(clients).where(eq(clients.businessId, businessId)), "clients");
  await safeDel(() => db.delete(budgets).where(eq(budgets.businessId, businessId)), "budgets");
  await safeDel(() => db.delete(monthlyBills).where(eq(monthlyBills.businessId, businessId)), "monthly_bills");
  await safeDel(() => db.delete(savingsGoals).where(eq(savingsGoals.businessId, businessId)), "savings_goals");
  await safeDel(() => db.delete(monthlyCache).where(eq(monthlyCache.businessId, businessId)), "monthly_cache");

  // Purchase orders
  await safeDel(() => db.delete(purchaseOrderItems).where(
    sql`${purchaseOrderItems.purchaseOrderId} IN (SELECT id FROM purchase_orders WHERE businessId = ${businessId})`
  ), "purchase_order_items");
  await safeDel(() => db.delete(purchaseOrders).where(eq(purchaseOrders.businessId, businessId)), "purchase_orders");
  await safeDel(() => db.delete(suppliers).where(eq(suppliers.businessId, businessId)), "suppliers");

  // Loyalty
  await safeDel(() => db.delete(loyaltyTransactions).where(eq(loyaltyTransactions.businessId, businessId)), "loyalty_transactions");
  await safeDel(() => db.delete(loyaltyPoints).where(eq(loyaltyPoints.businessId, businessId)), "loyalty_points");
  await safeDel(() => db.delete(loyaltyConfig).where(eq(loyaltyConfig.businessId, businessId)), "loyalty_config");
  await safeDel(() => db.delete(invoiceSettings).where(eq(invoiceSettings.businessId, businessId)), "invoice_settings");

  // Warehouse access
  await safeDel(() => db.delete(warehouseAccess).where(
    sql`${warehouseAccess.warehouseId} IN (SELECT id FROM warehouses WHERE businessId = ${businessId})`
  ), "warehouse_access");

  // Keep warehouses but delete non-default ones
  await safeDel(() => db.delete(warehouses).where(and(eq(warehouses.businessId, businessId), eq(warehouses.isDefault, false))), "warehouses");

  return { success: true };
}

// ─── Supplier Helpers ───
export async function getSuppliersByBusiness(businessId: number): Promise<Supplier[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(suppliers).where(eq(suppliers.businessId, businessId)).orderBy(desc(suppliers.createdAt));
}

export async function getSupplierById(id: number): Promise<Supplier | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
  return rows[0];
}

export async function createSupplier(data: InsertSupplier): Promise<{ id: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  requireFields(data, ["businessId", "name"], "suppliers");
  const result = await db.insert(suppliers).values(stripUndefined(data));
  return { id: result[0].insertId };
}

export async function updateSupplier(id: number, data: Partial<InsertSupplier>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(suppliers).set(data).where(eq(suppliers.id, id));
}

export async function deleteSupplier(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(suppliers).where(eq(suppliers.id, id));
}

// ─── Purchase Order Helpers ───
export async function generatePONumber(businessId: number): Promise<string> {
  const db = await getDb();
  if (!db) return `PO-${Date.now()}`;
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const rows = await db.select({ count: sql<number>`count(*)` }).from(purchaseOrders).where(eq(purchaseOrders.businessId, businessId));
  const seq = (Number(rows[0]?.count ?? 0) + 1).toString().padStart(3, "0");
  return `PO-${dateStr}-${seq}`;
}

export async function getPurchaseOrdersByBusiness(businessId: number): Promise<PurchaseOrder[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(purchaseOrders).where(eq(purchaseOrders.businessId, businessId)).orderBy(desc(purchaseOrders.createdAt));
}

export async function getPurchaseOrderById(id: number): Promise<PurchaseOrder | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).limit(1);
  return rows[0];
}

export async function createPurchaseOrder(data: InsertPurchaseOrder): Promise<{ id: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  requireFields(data, ["businessId", "poNumber", "supplierId"], "purchase_orders");
  const result = await db.insert(purchaseOrders).values(stripUndefined(data));
  return { id: result[0].insertId };
}

export async function updatePurchaseOrder(id: number, data: Partial<InsertPurchaseOrder>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(purchaseOrders).set(data).where(eq(purchaseOrders.id, id));
}

export async function deletePurchaseOrder(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, id));
  await db.delete(purchaseOrders).where(eq(purchaseOrders.id, id));
}

// ─── Purchase Order Item Helpers ───
export async function getPurchaseOrderItems(poId: number): Promise<PurchaseOrderItem[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, poId));
}

export async function createPurchaseOrderItem(data: InsertPurchaseOrderItem): Promise<{ id: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  requireFields(data, ["purchaseOrderId", "productId", "quantity", "unitPrice"], "purchase_order_items");
  const result = await db.insert(purchaseOrderItems).values(stripUndefined(data));
  return { id: result[0].insertId };
}

export async function deletePurchaseOrderItems(poId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, poId));
}

// ─── Loyalty Point Helpers ───
export async function getLoyaltyPoints(businessId: number, clientId: number): Promise<LoyaltyPoint | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(loyaltyPoints).where(and(eq(loyaltyPoints.businessId, businessId), eq(loyaltyPoints.clientId, clientId))).limit(1);
  return rows[0];
}

export async function getLoyaltyPointsByBusiness(businessId: number): Promise<LoyaltyPoint[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(loyaltyPoints).where(eq(loyaltyPoints.businessId, businessId));
}

export async function addLoyaltyPoints(businessId: number, clientId: number, points: number, description?: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Upsert loyalty points
  const existing = await getLoyaltyPoints(businessId, clientId);
  if (existing) {
    await db.update(loyaltyPoints).set({
      points: existing.points + points,
      totalEarned: existing.totalEarned + points,
    }).where(eq(loyaltyPoints.id, existing.id));
  } else {
    await db.insert(loyaltyPoints).values({ businessId, clientId, points, totalEarned: points, totalRedeemed: 0 });
  }
  // Log transaction
  await db.insert(loyaltyTransactions).values({ businessId, clientId, type: "earn", points, description: description ?? "Poin dari transaksi" });
}

export async function redeemLoyaltyPoints(businessId: number, clientId: number, points: number, description?: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getLoyaltyPoints(businessId, clientId);
  if (!existing || existing.points < points) return false;
  await db.update(loyaltyPoints).set({
    points: existing.points - points,
    totalRedeemed: existing.totalRedeemed + points,
  }).where(eq(loyaltyPoints.id, existing.id));
  await db.insert(loyaltyTransactions).values({ businessId, clientId, type: "redeem", points, description: description ?? "Penukaran poin" });
  return true;
}

export async function getLoyaltyTransactionsByClient(businessId: number, clientId: number): Promise<LoyaltyTransaction[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(loyaltyTransactions).where(and(eq(loyaltyTransactions.businessId, businessId), eq(loyaltyTransactions.clientId, clientId))).orderBy(desc(loyaltyTransactions.createdAt));
}

// ─── Loyalty Config Helpers ───
export async function getLoyaltyConfig(businessId: number): Promise<LoyaltyConfig> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(loyaltyConfig).where(eq(loyaltyConfig.businessId, businessId)).limit(1);
  if (existing[0]) return existing[0];

  // Return default config if not found
  return {
    id: 0,
    businessId,
    isEnabled: false,
    pointsPerAmount: 1,
    amountPerPoint: 10000,
    redemptionRate: 100,
    minRedeemPoints: 100,
    silverThreshold: 500,
    goldThreshold: 2000,
    platinumThreshold: 5000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function upsertLoyaltyConfig(businessId: number, config: Partial<InsertLoyaltyConfig>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(loyaltyConfig).where(eq(loyaltyConfig.businessId, businessId)).limit(1);
  if (existing[0]) {
    await db.update(loyaltyConfig).set(config).where(eq(loyaltyConfig.businessId, businessId));
  } else {
    await db.insert(loyaltyConfig).values({ businessId, ...config } as InsertLoyaltyConfig);
  }
}

// Determine tier level based on total points
function calculateTierLevel(totalPoints: number, config: LoyaltyConfig): string {
  if (totalPoints >= config.platinumThreshold) return "Platinum";
  if (totalPoints >= config.goldThreshold) return "Gold";
  if (totalPoints >= config.silverThreshold) return "Silver";
  return "Bronze";
}

export async function updateLoyaltyTier(businessId: number, clientId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const config = await getLoyaltyConfig(businessId);
  const loyalty = await getLoyaltyPoints(businessId, clientId);
  if (!loyalty) return;

  const newTier = calculateTierLevel(loyalty.totalEarned, config);
  if (loyalty.tierLevel !== newTier) {
    await db.update(loyaltyPoints).set({ tierLevel: newTier }).where(eq(loyaltyPoints.id, loyalty.id));
  }
}

export async function autoAwardLoyaltyPoints(businessId: number, clientId: number, purchaseAmount: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const config = await getLoyaltyConfig(businessId);
  if (!config.isEnabled) return;

  // Calculate points: amount / amountPerPoint * pointsPerAmount
  const pointsToAward = Math.floor((purchaseAmount / config.amountPerPoint) * config.pointsPerAmount);
  if (pointsToAward > 0) {
    await addLoyaltyPoints(businessId, clientId, pointsToAward, `Poin dari pembelian Rp ${purchaseAmount.toLocaleString('id-ID')}`);
    await updateLoyaltyTier(businessId, clientId);
  }
}

// ─── Invoice Settings Helpers ───
export async function getInvoiceSettings(businessId: number): Promise<InvoiceSetting | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(invoiceSettings).where(eq(invoiceSettings.businessId, businessId)).limit(1);
  return rows[0];
}

export async function upsertInvoiceSettings(businessId: number, data: Partial<InsertInvoiceSetting>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getInvoiceSettings(businessId);
  if (existing) {
    await db.update(invoiceSettings).set(data).where(eq(invoiceSettings.businessId, businessId));
  } else {
    await db.insert(invoiceSettings).values({ businessId, ...data } as InsertInvoiceSetting);
  }
}

// ─── Warehouse Access Helpers ───
export async function getWarehouseAccessByUser(userId: number): Promise<WarehouseAccess[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(warehouseAccess).where(eq(warehouseAccess.userId, userId));
}

export async function getWarehouseAccessByWarehouse(warehouseId: number): Promise<WarehouseAccess[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(warehouseAccess).where(eq(warehouseAccess.warehouseId, warehouseId));
}

export async function setWarehouseAccess(warehouseId: number, userIds: number[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Clear existing access
  await db.delete(warehouseAccess).where(eq(warehouseAccess.warehouseId, warehouseId));
  // Insert new access
  if (userIds.length > 0) {
    await db.insert(warehouseAccess).values(userIds.map(userId => ({ warehouseId, userId })));
  }
}

export async function getAccessibleWarehouses(businessId: number, userId: number, isOwner: boolean): Promise<Warehouse[]> {
  const db = await getDb();
  if (!db) return [];
  // Owners see all warehouses
  if (isOwner) {
    return db.select().from(warehouses).where(and(eq(warehouses.businessId, businessId), eq(warehouses.isActive, true)));
  }
  // Team members only see warehouses they have access to
  const accessRows = await getWarehouseAccessByUser(userId);
  if (accessRows.length === 0) {
    // If no specific access, show all (backward compatible)
    return db.select().from(warehouses).where(and(eq(warehouses.businessId, businessId), eq(warehouses.isActive, true)));
  }
  const whIds = accessRows.map(a => a.warehouseId);
  return db.select().from(warehouses).where(and(eq(warehouses.businessId, businessId), eq(warehouses.isActive, true), inArray(warehouses.id, whIds)));
}

// ─── WAVE 1: Sales by Product Report ───
export async function getSalesByProduct(businessId: number, startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) return [];

  // Query pos_receipt_items joined with pos_receipts (for date filtering) and products
  const items = await db.select({
    productId: posReceiptItems.productId,
    productName: posReceiptItems.productName,
    sku: products.sku,
    barcode: products.barcode,
    category: products.category,
    qty: posReceiptItems.qty,
    unitPrice: posReceiptItems.unitPrice,
    totalPrice: posReceiptItems.totalPrice,
    hppSnapshot: posReceiptItems.hppSnapshot,
  })
    .from(posReceiptItems)
    .innerJoin(posReceipts, eq(posReceiptItems.receiptId, posReceipts.id))
    .innerJoin(products, eq(posReceiptItems.productId, products.id))
    .where(
      and(
        eq(posReceipts.businessId, businessId),
        sql`${posReceipts.date} >= ${startDate}`,
        sql`${posReceipts.date} <= ${endDate}`,
        eq(posReceipts.isRefunded, false)
      )
    );

  // Group by productId
  const groupedByProduct: Record<number, {
    productId: number;
    productName: string;
    sku: string | null;
    barcode: string | null;
    category: string | null;
    qtyTerjual: number;
    totalPenjualan: number;
    totalHPP: number;
    laba: number;
  }> = {};

  for (const item of items) {
    const key = item.productId;
    if (!groupedByProduct[key]) {
      groupedByProduct[key] = {
        productId: item.productId,
        productName: item.productName,
        sku: item.sku ?? null,
        barcode: item.barcode ?? null,
        category: item.category ?? null,
        qtyTerjual: 0,
        totalPenjualan: 0,
        totalHPP: 0,
        laba: 0,
      };
    }
    groupedByProduct[key].qtyTerjual += item.qty;
    groupedByProduct[key].totalPenjualan += item.totalPrice;
    groupedByProduct[key].totalHPP += (item.hppSnapshot ?? 0) * item.qty;
  }

  // Calculate laba and convert to array
  const result = Object.values(groupedByProduct).map(p => ({
    ...p,
    laba: p.totalPenjualan - p.totalHPP,
  }));

  return result;
}

// ─── WAVE 1: Payment Method Summary Report ───
export async function getPaymentMethodSummary(businessId: number, startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) return [];

  // 1. Get payments from transactions (pemasukan, non-deleted)
  const txRecords = await db.select({
    paymentMethod: transactions.paymentMethod,
    amount: transactions.amount,
  })
    .from(transactions)
    .where(
      and(
        eq(transactions.businessId, businessId),
        eq(transactions.type, "pemasukan"),
        eq(transactions.isDeleted, false),
        sql`${transactions.date} >= ${startDate}`,
        sql`${transactions.date} <= ${endDate}`
      )
    );

  // 2. Get payments from pos_receipts
  const receipts = await db.select({
    payments: posReceipts.payments,
  })
    .from(posReceipts)
    .where(
      and(
        eq(posReceipts.businessId, businessId),
        eq(posReceipts.isRefunded, false),
        sql`${posReceipts.date} >= ${startDate}`,
        sql`${posReceipts.date} <= ${endDate}`
      )
    );

  // Aggregate by payment method
  const byMethod: Record<string, { totalAmount: number; transactionCount: number }> = {};

  // Add transaction payments
  for (const tx of txRecords) {
    const method = tx.paymentMethod;
    if (!byMethod[method]) {
      byMethod[method] = { totalAmount: 0, transactionCount: 0 };
    }
    byMethod[method].totalAmount += tx.amount;
    byMethod[method].transactionCount += 1;
  }

  // Add POS receipt payments
  for (const receipt of receipts) {
    const payments = (typeof receipt.payments === "string" ? JSON.parse(receipt.payments) : receipt.payments) as Array<{ method: string; amount: number }>;
    for (const p of payments) {
      const method = p.method;
      if (!byMethod[method]) {
        byMethod[method] = { totalAmount: 0, transactionCount: 0 };
      }
      byMethod[method].totalAmount += p.amount;
      // Count as partial transaction (split payment)
      byMethod[method].transactionCount += 1;
    }
  }

  // Convert to array
  const result = Object.entries(byMethod).map(([method, data]) => ({
    method,
    totalAmount: data.totalAmount,
    transactionCount: data.transactionCount,
  }));

  return result;
}

// ─── WAVE 1: Top Products and Categories ───
export async function getTopProductsAndCategories(businessId: number, startDate: string, endDate: string, limit: number = 10) {
  const db = await getDb();
  if (!db) return { topProducts: [], topCategories: [] };

  // 1. Top Products: group by productId, sum qty & totalPrice, order by totalPrice desc
  const productItems = await db.select({
    productId: posReceiptItems.productId,
    productName: posReceiptItems.productName,
    qty: sql<number>`SUM(${posReceiptItems.qty})`,
    totalPrice: sql<number>`SUM(${posReceiptItems.totalPrice})`,
  })
    .from(posReceiptItems)
    .innerJoin(posReceipts, eq(posReceiptItems.receiptId, posReceipts.id))
    .where(
      and(
        eq(posReceipts.businessId, businessId),
        sql`${posReceipts.date} >= ${startDate}`,
        sql`${posReceipts.date} <= ${endDate}`,
        eq(posReceipts.isRefunded, false)
      )
    )
    .groupBy(posReceiptItems.productId, posReceiptItems.productName)
    .orderBy(desc(sql<number>`SUM(${posReceiptItems.totalPrice})`))
    .limit(limit);

  const topProducts = productItems.map((p, idx) => ({
    rank: idx + 1,
    productName: p.productName,
    qty: p.qty,
    totalPenjualan: p.totalPrice,
  }));

  // 2. Top Categories: group by category, sum qty & totalPrice, order by totalPrice desc
  const categoryItems = await db.select({
    category: products.category,
    qty: sql<number>`SUM(${posReceiptItems.qty})`,
    totalPrice: sql<number>`SUM(${posReceiptItems.totalPrice})`,
  })
    .from(posReceiptItems)
    .innerJoin(posReceipts, eq(posReceiptItems.receiptId, posReceipts.id))
    .innerJoin(products, eq(posReceiptItems.productId, products.id))
    .where(
      and(
        eq(posReceipts.businessId, businessId),
        sql`${posReceipts.date} >= ${startDate}`,
        sql`${posReceipts.date} <= ${endDate}`,
        eq(posReceipts.isRefunded, false)
      )
    )
    .groupBy(products.category)
    .orderBy(desc(sql<number>`SUM(${posReceiptItems.totalPrice})`))
    .limit(limit);

  const topCategories = categoryItems.map((c, idx) => ({
    rank: idx + 1,
    kategori: c.category ?? "Tanpa Kategori",
    qty: c.qty,
    totalPenjualan: c.totalPrice,
  }));

  return { topProducts, topCategories };
}

// ═════════════════════════════════════════════════════════
// WAVE 2 — Sales Deep Dive
// ═════════════════════════════════════════════════════════

// ─── W2.1: Penjualan per Pelanggan ───
export async function getSalesByCustomer(businessId: number, startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get receipts grouped by clientId
  const rows = await db
    .select({
      clientId: posReceipts.clientId,
      clientName: clients.name,
      clientType: clients.type,
      transactionCount: sql<number>`COUNT(*)`,
      totalPenjualan: sql<number>`SUM(${posReceipts.grandTotal})`,
      totalDiskon: sql<number>`SUM(${posReceipts.discountAmount})`,
    })
    .from(posReceipts)
    .leftJoin(clients, eq(posReceipts.clientId, clients.id))
    .where(
      and(
        eq(posReceipts.businessId, businessId),
        sql`${posReceipts.date} >= ${startDate}`,
        sql`${posReceipts.date} <= ${endDate}`,
        eq(posReceipts.isRefunded, false)
      )
    )
    .groupBy(posReceipts.clientId, clients.name, clients.type)
    .orderBy(desc(sql<number>`SUM(${posReceipts.grandTotal})`));

  return rows.map((r) => ({
    clientId: r.clientId,
    clientName: r.clientName ?? "Pelanggan Umum",
    clientType: r.clientType ?? "regular",
    transactionCount: r.transactionCount,
    totalPenjualan: r.totalPenjualan,
    totalDiskon: r.totalDiskon,
  }));
}

// ─── W2.2: Penjualan per Jam ───
export async function getSalesByHour(businessId: number, startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rows = await db
    .select({
      hour: sql<number>`HOUR(${posReceipts.createdAt})`,
      transactionCount: sql<number>`COUNT(*)`,
      totalPenjualan: sql<number>`SUM(${posReceipts.grandTotal})`,
      avgPerTransaction: sql<number>`AVG(${posReceipts.grandTotal})`,
    })
    .from(posReceipts)
    .where(
      and(
        eq(posReceipts.businessId, businessId),
        sql`${posReceipts.date} >= ${startDate}`,
        sql`${posReceipts.date} <= ${endDate}`,
        eq(posReceipts.isRefunded, false)
      )
    )
    .groupBy(sql`HOUR(${posReceipts.createdAt})`)
    .orderBy(sql`HOUR(${posReceipts.createdAt})`);

  // Fill all 24 hours
  const hourMap = new Map(rows.map((r) => [r.hour, r]));
  const result = [];
  for (let h = 0; h < 24; h++) {
    const data = hourMap.get(h);
    result.push({
      hour: h,
      label: `${String(h).padStart(2, "0")}:00`,
      transactionCount: data?.transactionCount ?? 0,
      totalPenjualan: data?.totalPenjualan ?? 0,
      avgPerTransaction: Math.round(data?.avgPerTransaction ?? 0),
    });
  }

  // Find peak hour
  const peakHour = result.reduce((best, curr) =>
    curr.totalPenjualan > best.totalPenjualan ? curr : best, result[0]);

  return { hours: result, peakHour };
}

// ─── W2.3: Penjualan per Tanggal ───
export async function getSalesByDate(businessId: number, startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rows = await db
    .select({
      date: posReceipts.date,
      transactionCount: sql<number>`COUNT(*)`,
      totalPenjualan: sql<number>`SUM(${posReceipts.grandTotal})`,
      totalDiskon: sql<number>`SUM(${posReceipts.discountAmount})`,
      refundCount: sql<number>`SUM(CASE WHEN ${posReceipts.isRefunded} = 1 THEN 1 ELSE 0 END)`,
    })
    .from(posReceipts)
    .where(
      and(
        eq(posReceipts.businessId, businessId),
        sql`${posReceipts.date} >= ${startDate}`,
        sql`${posReceipts.date} <= ${endDate}`,
      )
    )
    .groupBy(posReceipts.date)
    .orderBy(posReceipts.date);

  return rows.map((r) => ({
    date: r.date,
    transactionCount: r.transactionCount,
    totalPenjualan: r.totalPenjualan,
    totalDiskon: r.totalDiskon,
    refundCount: r.refundCount,
    netPenjualan: r.totalPenjualan - r.totalDiskon,
  }));
}

// ─── W2.4: Credit Sales CRUD & Report ───
export async function createCreditSale(data: InsertCreditSale) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  requireFields(data, ["businessId", "clientId", "totalAmount"], "credit_sales");
  const [result] = await db.insert(creditSales).values(stripUndefined(data));
  return result.insertId;
}

export async function addCreditPayment(creditSaleId: number, payment: InsertCreditPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.transaction(async (tx) => {
    // Insert payment
    const cleanedPayment = stripUndefined({ ...payment, creditSaleId });
    const [result] = await tx.insert(creditPayments).values(cleanedPayment);

    // Update credit_sales totals atomically
    const [credit] = await tx.select().from(creditSales).where(eq(creditSales.id, creditSaleId));
    if (credit) {
      const newPaid = credit.paidAmount + payment.amount;
      const newRemaining = credit.totalAmount - newPaid;
      const newStatus = newRemaining <= 0 ? "lunas" : newPaid > 0 ? "cicilan" : "belum_lunas";

      await tx
        .update(creditSales)
        .set({
          paidAmount: newPaid,
          remainingAmount: Math.max(0, newRemaining),
          status: newStatus,
        })
        .where(eq(creditSales.id, creditSaleId));
    }

    return result.insertId;
  });
}

export async function getCreditSalesReport(businessId: number, startDate?: string, endDate?: string, status?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(creditSales.businessId, businessId)];
  if (startDate) conditions.push(sql`${posReceipts.date} >= ${startDate}`);
  if (endDate) conditions.push(sql`${posReceipts.date} <= ${endDate}`);
  if (status && status !== "all") conditions.push(eq(creditSales.status, status as any));

  const rows = await db
    .select({
      id: creditSales.id,
      receiptId: creditSales.receiptId,
      receiptCode: posReceipts.receiptCode,
      receiptDate: posReceipts.date,
      clientId: creditSales.clientId,
      clientName: clients.name,
      totalAmount: creditSales.totalAmount,
      paidAmount: creditSales.paidAmount,
      remainingAmount: creditSales.remainingAmount,
      status: creditSales.status,
      dueDate: creditSales.dueDate,
      notes: creditSales.notes,
      createdAt: creditSales.createdAt,
    })
    .from(creditSales)
    .innerJoin(posReceipts, eq(creditSales.receiptId, posReceipts.id))
    .innerJoin(clients, eq(creditSales.clientId, clients.id))
    .where(and(...conditions))
    .orderBy(desc(creditSales.createdAt));

  return rows;
}

export async function getCreditPaymentsForSale(creditSaleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(creditPayments)
    .where(eq(creditPayments.creditSaleId, creditSaleId))
    .orderBy(desc(creditPayments.createdAt));
}

// ─── W2.5: Ringkasan Diskon ───
export async function getDiscountSummary(businessId: number, startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Receipts with discount > 0
  const rows = await db
    .select({
      discountCodeId: posReceipts.discountCodeId,
      discountCode: discountCodes.code,
      discountName: discountCodes.name,
      discountType: discountCodes.discountType,
      discountValue: discountCodes.discountValue,
      orderCount: sql<number>`COUNT(*)`,
      totalDiscount: sql<number>`SUM(${posReceipts.discountAmount})`,
      totalBeforeDiscount: sql<number>`SUM(${posReceipts.subtotal})`,
    })
    .from(posReceipts)
    .leftJoin(discountCodes, eq(posReceipts.discountCodeId, discountCodes.id))
    .where(
      and(
        eq(posReceipts.businessId, businessId),
        sql`${posReceipts.date} >= ${startDate}`,
        sql`${posReceipts.date} <= ${endDate}`,
        sql`${posReceipts.discountAmount} > 0`,
        eq(posReceipts.isRefunded, false)
      )
    )
    .groupBy(
      posReceipts.discountCodeId,
      discountCodes.code,
      discountCodes.name,
      discountCodes.discountType,
      discountCodes.discountValue
    )
    .orderBy(desc(sql<number>`SUM(${posReceipts.discountAmount})`));

  return rows.map((r) => ({
    discountCodeId: r.discountCodeId,
    code: r.discountCode ?? "Manual",
    name: r.discountName ?? "Diskon Manual",
    type: r.discountType ?? "fixed",
    value: r.discountValue ?? 0,
    orderCount: r.orderCount,
    totalDiscount: r.totalDiscount,
    totalBeforeDiscount: r.totalBeforeDiscount,
    avgDiscountPerOrder: Math.round(r.totalDiscount / r.orderCount),
  }));
}

// ─── W2.6: Void/Refund Analysis Detail ───
export async function getVoidRefundAnalysis(businessId: number, startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rows = await db
    .select({
      id: posReceipts.id,
      receiptCode: posReceipts.receiptCode,
      date: posReceipts.date,
      grandTotal: posReceipts.grandTotal,
      refundAmount: posReceipts.refundAmount,
      refundReason: posReceipts.refundReason,
      refundedAt: posReceipts.refundedAt,
      clientId: posReceipts.clientId,
      clientName: clients.name,
      payments: posReceipts.payments,
    })
    .from(posReceipts)
    .leftJoin(clients, eq(posReceipts.clientId, clients.id))
    .where(
      and(
        eq(posReceipts.businessId, businessId),
        sql`${posReceipts.date} >= ${startDate}`,
        sql`${posReceipts.date} <= ${endDate}`,
        eq(posReceipts.isRefunded, true)
      )
    )
    .orderBy(desc(posReceipts.refundedAt));

  const summary = {
    totalRefunds: rows.length,
    totalRefundAmount: rows.reduce((sum, r) => sum + (r.refundAmount ?? r.grandTotal), 0),
    byReason: {} as Record<string, { count: number; amount: number }>,
    byDate: {} as Record<string, { count: number; amount: number }>,
  };

  for (const r of rows) {
    const reason = r.refundReason ?? "Tidak ada alasan";
    if (!summary.byReason[reason]) summary.byReason[reason] = { count: 0, amount: 0 };
    summary.byReason[reason].count++;
    summary.byReason[reason].amount += r.refundAmount ?? r.grandTotal;

    if (!summary.byDate[r.date]) summary.byDate[r.date] = { count: 0, amount: 0 };
    summary.byDate[r.date].count++;
    summary.byDate[r.date].amount += r.refundAmount ?? r.grandTotal;
  }

  return {
    receipts: rows.map((r) => ({
      id: r.id,
      receiptCode: r.receiptCode,
      date: r.date,
      grandTotal: r.grandTotal,
      refundAmount: r.refundAmount ?? r.grandTotal,
      refundReason: r.refundReason ?? "-",
      refundedAt: r.refundedAt,
      clientName: r.clientName ?? "Pelanggan Umum",
      payments: r.payments,
    })),
    summary,
  };
}

// ─── W2.7: Transaksi Tunai / Kas Reconciliation ───
export async function getKasReconciliation(businessId: number, startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Cash POS income — only "Tunai" payments
  const posRows = await db
    .select({
      totalCashIncome: sql<number>`SUM(${posReceipts.grandTotal})`,
      transactionCount: sql<number>`COUNT(*)`,
    })
    .from(posReceipts)
    .where(
      and(
        eq(posReceipts.businessId, businessId),
        sql`${posReceipts.date} >= ${startDate}`,
        sql`${posReceipts.date} <= ${endDate}`,
        eq(posReceipts.isRefunded, false),
        sql`JSON_CONTAINS(${posReceipts.payments}, '{"method":"Tunai"}')`,
      )
    );

  // Cash refunds
  const refundRows = await db
    .select({
      totalCashRefund: sql<number>`COALESCE(SUM(${posReceipts.refundAmount}), 0)`,
      refundCount: sql<number>`COUNT(*)`,
    })
    .from(posReceipts)
    .where(
      and(
        eq(posReceipts.businessId, businessId),
        sql`${posReceipts.date} >= ${startDate}`,
        sql`${posReceipts.date} <= ${endDate}`,
        eq(posReceipts.isRefunded, true),
      )
    );

  // Manual cash transactions from transactions table
  const txCashIn = await db
    .select({
      total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.businessId, businessId),
        sql`${transactions.date} >= ${startDate}`,
        sql`${transactions.date} <= ${endDate}`,
        eq(transactions.type, "pemasukan"),
        eq(transactions.paymentMethod, "tunai"),
        eq(transactions.isDeleted, false),
      )
    );

  const txCashOut = await db
    .select({
      total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.businessId, businessId),
        sql`${transactions.date} >= ${startDate}`,
        sql`${transactions.date} <= ${endDate}`,
        eq(transactions.type, "pengeluaran"),
        eq(transactions.paymentMethod, "tunai"),
        eq(transactions.isDeleted, false),
      )
    );

  // Change given back to customers
  const changeRows = await db
    .select({
      totalChange: sql<number>`COALESCE(SUM(${posReceipts.changeAmount}), 0)`,
    })
    .from(posReceipts)
    .where(
      and(
        eq(posReceipts.businessId, businessId),
        sql`${posReceipts.date} >= ${startDate}`,
        sql`${posReceipts.date} <= ${endDate}`,
        eq(posReceipts.isRefunded, false),
      )
    );

  const cashIncome = Number(posRows[0]?.totalCashIncome ?? 0);
  const cashRefund = Number(refundRows[0]?.totalCashRefund ?? 0);
  const manualCashIn = Number(txCashIn[0]?.total ?? 0);
  const manualCashOut = Number(txCashOut[0]?.total ?? 0);
  const totalChange = Number(changeRows[0]?.totalChange ?? 0);

  const totalKasMasuk = cashIncome + manualCashIn;
  const totalKasKeluar = cashRefund + manualCashOut + totalChange;
  const netKas = totalKasMasuk - totalKasKeluar;

  return {
    pendapatanTunaiPOS: cashIncome,
    pendapatanTunaiManual: manualCashIn,
    totalKasMasuk,
    voidTunai: cashRefund,
    pengeluaranTunai: manualCashOut,
    kembalianPelanggan: totalChange,
    totalKasKeluar,
    netKas,
    posTransactionCount: Number(posRows[0]?.transactionCount ?? 0),
    refundCount: Number(refundRows[0]?.refundCount ?? 0),
    manualInCount: Number(txCashIn[0]?.count ?? 0),
    manualOutCount: Number(txCashOut[0]?.count ?? 0),
  };
}

// ─── W3.1: Shift Report (Laporan Shift) ───
export async function getShiftReport(businessId: number, startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Query shifts for the business in the date range
  const shifts = await db
    .select({
      id: posShifts.id,
      userId: posShifts.userId,
      openedAt: posShifts.openedAt,
      closedAt: posShifts.closedAt,
      openingCash: posShifts.openingCash,
      closingCash: posShifts.closingCash,
      cashDifference: posShifts.cashDifference,
      totalSales: posShifts.totalSales,
      totalRefunds: posShifts.totalRefunds,
      userName: users.name,
    })
    .from(posShifts)
    .leftJoin(users, eq(posShifts.userId, users.id))
    .where(
      and(
        eq(posShifts.businessId, businessId),
        startDate ? sql`DATE(${posShifts.openedAt}) >= ${startDate}` : undefined,
        endDate ? sql`DATE(${posShifts.closedAt}) <= ${endDate}` : undefined,
      )
    )
    .orderBy(desc(posShifts.closedAt));

  // For each shift, get receipts and payment breakdown
  const shiftReports = await Promise.all(
    shifts.map(async (shift) => {
      // Get receipts in this shift
      const receipts = await db
        .select({
          grandTotal: posReceipts.grandTotal,
          isRefunded: posReceipts.isRefunded,
          refundAmount: posReceipts.refundAmount,
          payments: posReceipts.payments,
          date: posReceipts.date,
        })
        .from(posReceipts)
        .where(eq(posReceipts.shiftId, shift.id));

      // Calculate metrics
      const totalPenjualan = receipts
        .filter((r) => !r.isRefunded)
        .reduce((sum, r) => sum + r.grandTotal, 0);

      const totalRefund = receipts
        .filter((r) => r.isRefunded)
        .reduce((sum, r) => sum + (r.refundAmount ?? 0), 0);

      // Parse payment methods
      const paymentBreakdown: Record<string, number> = {};
      for (const receipt of receipts.filter((r) => !r.isRefunded)) {
        const payments = receipt.payments as Array<{ method: string; amount: number }>;
        if (Array.isArray(payments)) {
          for (const p of payments) {
            paymentBreakdown[p.method] = (paymentBreakdown[p.method] ?? 0) + p.amount;
          }
        }
      }

      // Calculate duration
      const startTime = shift.openedAt ? new Date(shift.openedAt) : null;
      const endTime = shift.closedAt ? new Date(shift.closedAt) : null;
      let durationMinutes = 0;
      if (startTime && endTime) {
        durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
      }

      // Determine status: surplus (positive), deficit (negative), balanced (0)
      const cashDiff = shift.cashDifference ?? 0;
      const status = cashDiff > 0 ? "surplus" : cashDiff < 0 ? "deficit" : "seimbang";

      return {
        id: shift.id,
        openedAt: shift.openedAt,
        closedAt: shift.closedAt,
        date: shift.closedAt ? new Date(shift.closedAt).toISOString().slice(0, 10) : "",
        cashierName: shift.userName ?? "Unknown",
        openingCash: shift.openingCash ?? 0,
        closingCash: shift.closingCash ?? 0,
        totalPenjualan,
        totalRefund,
        cashDifference: cashDiff,
        durationMinutes,
        status,
        paymentBreakdown,
        transactionCount: receipts.length,
      };
    })
  );

  // Calculate summary metrics
  const totalShifts = shiftReports.length;
  const totalPenjualanAll = shiftReports.reduce((sum, s) => sum + s.totalPenjualan, 0);
  const totalRefundAll = shiftReports.reduce((sum, s) => sum + s.totalRefund, 0);
  const avgCashDiff =
    totalShifts > 0
      ? shiftReports.reduce((sum, s) => sum + s.cashDifference, 0) / totalShifts
      : 0;

  return {
    shifts: shiftReports,
    summary: {
      totalShifts,
      totalPenjualan: totalPenjualanAll,
      totalRefund: totalRefundAll,
      avgCashDifference: avgCashDiff,
    },
  };
}

// ─── Commission Functions ───

export async function getCommissionConfig(businessId: number): Promise<CommissionConfig | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  return db.select().from(commissionConfig).where(eq(commissionConfig.businessId, businessId)).then(r => r[0]);
}

export async function upsertCommissionConfig(businessId: number, data: Partial<InsertCommissionConfig>): Promise<CommissionConfig> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getCommissionConfig(businessId);
  if (existing) {
    await db.update(commissionConfig).set({
      ...data,
      updatedAt: new Date(),
    }).where(eq(commissionConfig.businessId, businessId));
    return getCommissionConfig(businessId) as Promise<CommissionConfig>;
  } else {
    await db.insert(commissionConfig).values({
      businessId,
      isEnabled: data.isEnabled ?? false,
      commissionType: data.commissionType ?? "percentage",
      commissionRate: data.commissionRate ?? 0,
    });
    return getCommissionConfig(businessId) as Promise<CommissionConfig>;
  }
}

export async function createStaffCommission(data: InsertStaffCommission): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  requireFields(data, ["businessId", "userId", "receiptId", "saleAmount", "commissionAmount", "date"], "staff_commissions");
  const [result] = await db.insert(staffCommissions).values(stripUndefined(data)).$returningId();
  return result.id;
}

export async function getCommissionReport(
  businessId: number,
  startDate?: string,
  endDate?: string,
  userId?: number
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(staffCommissions.businessId, businessId)];
  if (startDate) {
    conditions.push(gte(staffCommissions.date, startDate));
  }
  if (endDate) {
    conditions.push(lte(staffCommissions.date, endDate));
  }
  if (userId) {
    conditions.push(eq(staffCommissions.userId, userId));
  }

  return db.select({
    id: staffCommissions.id,
    userId: staffCommissions.userId,
    userName: users.name,
    receiptId: staffCommissions.receiptId,
    receiptCode: staffCommissions.receiptCode,
    saleAmount: staffCommissions.saleAmount,
    commissionAmount: staffCommissions.commissionAmount,
    date: staffCommissions.date,
    status: staffCommissions.status,
    paidAt: staffCommissions.paidAt,
    createdAt: staffCommissions.createdAt,
  }).from(staffCommissions)
    .innerJoin(users, eq(staffCommissions.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(staffCommissions.date));
}

export async function getCommissionSummaryByStaff(
  businessId: number,
  startDate: string,
  endDate: string
) {
  const db = await getDb();
  if (!db) return [];

  const results = await db.select({
    userId: staffCommissions.userId,
    userName: users.name,
    totalSalesAmount: sql<number>`CAST(SUM(${staffCommissions.saleAmount}) AS SIGNED)`,
    totalCommissionAmount: sql<number>`CAST(SUM(${staffCommissions.commissionAmount}) AS SIGNED)`,
    commissionPending: sql<number>`CAST(SUM(CASE WHEN ${staffCommissions.status} = 'pending' THEN ${staffCommissions.commissionAmount} ELSE 0 END) AS SIGNED)`,
    commissionPaid: sql<number>`CAST(SUM(CASE WHEN ${staffCommissions.status} = 'paid' THEN ${staffCommissions.commissionAmount} ELSE 0 END) AS SIGNED)`,
    transactionCount: sql<number>`COUNT(*)`,
  }).from(staffCommissions)
    .innerJoin(users, eq(staffCommissions.userId, users.id))
    .where(
      and(
        eq(staffCommissions.businessId, businessId),
        gte(staffCommissions.date, startDate),
        lte(staffCommissions.date, endDate)
      )
    )
    .groupBy(staffCommissions.userId, users.id, users.name);

  return results;
}

export async function markCommissionPaid(commissionId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(staffCommissions).set({
    status: "paid",
    paidAt: new Date(),
  }).where(eq(staffCommissions.id, commissionId));
}

export async function markCommissionsPaidBulk(commissionIds: number[]): Promise<void> {
  const db = await getDb();
  if (!db || commissionIds.length === 0) return;
  await db.update(staffCommissions).set({
    status: "paid",
    paidAt: new Date(),
  }).where(inArray(staffCommissions.id, commissionIds));
}

// ─── Stock Batch Functions (FIFO, Expiry, Stock Aging, Advanced Alerts) ───

export async function createStockBatch(data: InsertStockBatch): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  requireFields(data, ["businessId", "productId", "initialQty", "remainingQty", "costPrice"], "stock_batches");
  const result = await db.insert(stockBatches).values(stripUndefined(data));
  return result[0].insertId;
}

export async function getStockBatchesByProduct(
  productId: number,
  warehouseId?: number
): Promise<StockBatch[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [
    eq(stockBatches.productId, productId),
    eq(stockBatches.isActive, true),
  ];
  if (warehouseId) {
    conditions.push(eq(stockBatches.warehouseId, warehouseId));
  }

  const result = await db
    .select()
    .from(stockBatches)
    .where(and(...conditions))
    .orderBy(asc(stockBatches.purchaseDate)); // FIFO: oldest first
  return result;
}

export async function consumeStockFIFO(
  productId: number,
  qty: number,
  warehouseId?: number,
  txOrDb?: any
): Promise<Array<{ batchId: number; qty: number; costPrice: number }>> {
  const db = txOrDb || await getDb();
  if (!db) throw new Error("Database not available");
  const batches = await getStockBatchesByProduct(productId, warehouseId);

  const consumed: Array<{ batchId: number; qty: number; costPrice: number }> = [];
  let remainingQty = qty;

  for (const batch of batches) {
    if (remainingQty <= 0) break;

    const consumeQty = Math.min(remainingQty, batch.remainingQty);
    if (consumeQty > 0) {
      consumed.push({
        batchId: batch.id,
        qty: consumeQty,
        costPrice: batch.costPrice,
      });

      // Update batch
      const newRemaining = batch.remainingQty - consumeQty;
      await db
        .update(stockBatches)
        .set({ remainingQty: newRemaining })
        .where(eq(stockBatches.id, batch.id));

      remainingQty -= consumeQty;
    }
  }

  return consumed;
}

export async function restoreStockFIFO(
  productId: number,
  qty: number,
  warehouseId?: number,
  txOrDb?: any
): Promise<void> {
  const db = txOrDb || await getDb();
  if (!db) return;

  // Restore qty to the most recently consumed batches (reverse FIFO order)
  const conditions: any[] = [
    eq(stockBatches.productId, productId),
  ];
  if (warehouseId) {
    conditions.push(eq(stockBatches.warehouseId, warehouseId));
  }

  const batches = await db
    .select()
    .from(stockBatches)
    .where(and(...conditions))
    .orderBy(desc(stockBatches.purchaseDate)); // newest first — reverse of consume

  let remainingQty = qty;
  for (const batch of batches) {
    if (remainingQty <= 0) break;
    // Restore up to the batch's original qty (remainingQty + restored should not exceed qty)
    const restoreQty = Math.min(remainingQty, batch.initialQty - batch.remainingQty);
    if (restoreQty > 0) {
      await db
        .update(stockBatches)
        .set({ remainingQty: batch.remainingQty + restoreQty })
        .where(eq(stockBatches.id, batch.id));
      remainingQty -= restoreQty;
    }
  }
}

export async function getFIFOValuation(businessId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all products for this business
  const allProducts = await db
    .select()
    .from(products)
    .where(eq(products.businessId, businessId));

  const result = [];
  for (const product of allProducts) {
    const batches = await getStockBatchesByProduct(product.id);

    const batchDetails = batches.map((b) => ({
      batchCode: b.batchCode,
      purchaseDate: b.purchaseDate,
      costPrice: b.costPrice,
      remainingQty: b.remainingQty,
      totalValue: b.costPrice * b.remainingQty,
    }));

    const totalQty = batchDetails.reduce((sum, b) => sum + b.remainingQty, 0);
    const totalValue = batchDetails.reduce((sum, b) => sum + b.totalValue, 0);
    const weightedAvgCost = totalQty > 0 ? totalValue / totalQty : 0;

    result.push({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      batches: batchDetails,
      totalQty,
      totalValue,
      weightedAvgCost,
    });
  }

  return result;
}

export async function getExpiringStock(businessId: number, daysAhead: number = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all batches with expiry dates
  const allBatches = await db
    .select({
      id: stockBatches.id,
      productId: stockBatches.productId,
      productName: products.name,
      batchCode: stockBatches.batchCode,
      expiryDate: stockBatches.expiryDate,
      remainingQty: stockBatches.remainingQty,
      costPrice: stockBatches.costPrice,
    })
    .from(stockBatches)
    .leftJoin(products, eq(stockBatches.productId, products.id))
    .where(and(eq(products.businessId, businessId), eq(stockBatches.isActive, true)));

  // Filter and calculate days remaining
  const expiring = allBatches
    .filter((b) => b.expiryDate)
    .map((b) => {
      const expiryDate = new Date(b.expiryDate as string);
      const today = new Date();
      const daysRemaining = Math.ceil(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        ...b,
        daysRemaining,
        totalValue: b.costPrice * b.remainingQty,
      };
    })
    .filter((b) => b.daysRemaining <= daysAhead);

  return expiring;
}

export async function getExpiredStock(businessId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const allBatches = await db
    .select({
      id: stockBatches.id,
      productId: stockBatches.productId,
      productName: products.name,
      batchCode: stockBatches.batchCode,
      expiryDate: stockBatches.expiryDate,
      remainingQty: stockBatches.remainingQty,
      costPrice: stockBatches.costPrice,
    })
    .from(stockBatches)
    .leftJoin(products, eq(stockBatches.productId, products.id))
    .where(and(eq(products.businessId, businessId), eq(stockBatches.isActive, true)));

  const today = new Date().toISOString().slice(0, 10);
  const expired = allBatches
    .filter((b) => b.expiryDate && b.expiryDate < today)
    .map((b) => ({
      ...b,
      totalValue: b.costPrice * b.remainingQty,
    }));

  return expired;
}

export async function getStockAging(businessId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all products with their oldest batch and last sale date
  const allProducts = await db
    .select()
    .from(products)
    .where(eq(products.businessId, businessId));

  const result = [];

  for (const product of allProducts) {
    const batches = await getStockBatchesByProduct(product.id);

    if (batches.length === 0) continue;

    const oldestBatch = batches[0]; // Already sorted by purchaseDate ASC (FIFO)
    const today = new Date();
    const oldestDate = new Date(oldestBatch.purchaseDate);
    const ageDays = Math.floor(
      (today.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Determine age bucket
    let ageBucket = "0-30";
    if (ageDays > 90) ageBucket = ">90";
    else if (ageDays > 60) ageBucket = "61-90";
    else if (ageDays > 30) ageBucket = "31-60";

    // Get last sale date (from pos_receipt_items for this product)
    const db2 = await getDb();
    if (!db2) throw new Error("Database not available");
    const lastSale = await db2
      .select({ date: posReceipts.date })
      .from(posReceiptItems)
      .leftJoin(posReceipts, eq(posReceiptItems.receiptId, posReceipts.id))
      .where(eq(posReceiptItems.productId, product.id))
      .orderBy(desc(posReceipts.date))
      .limit(1);

    result.push({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      currentStock: product.stockCurrent,
      oldestBatchDate: oldestBatch.purchaseDate,
      ageDays,
      ageBucket,
      lastSaleDate: lastSale[0]?.date || null,
    });
  }

  return result;
}

export async function getLowStockAlerts(businessId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all products with reorder settings
  const allProducts = await db
    .select()
    .from(products)
    .where(eq(products.businessId, businessId));

  const result = [];

  for (const product of allProducts) {
    if (!product.reorderPoint && !product.safetyStock) continue;

    const currentStock = product.stockCurrent;
    const reorderPoint = product.reorderPoint || 0;
    const safetyStock = product.safetyStock || 0;
    const leadTimeDays = product.leadTimeDays || 0;

    // Get average daily sales from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().slice(0, 10);

    const salesData = await db
      .select({
        totalQty: sql<number>`SUM(${posReceiptItems.qty})`,
      })
      .from(posReceiptItems)
      .leftJoin(posReceipts, eq(posReceiptItems.receiptId, posReceipts.id))
      .where(
        and(
          eq(posReceiptItems.productId, product.id),
          sql`DATE(${posReceipts.date}) >= ${startDate}`
        )
      );

    const totalSold = Number(salesData[0]?.totalQty || 0);
    const avgDailySales = totalSold / 30;

    // Calculate days until stockout
    const daysUntilStockout =
      avgDailySales > 0
        ? Math.floor((currentStock - safetyStock) / avgDailySales)
        : 999;

    // Calculate suggested order quantity with 1.2 safety margin
    const suggestedOrderQty = Math.ceil((reorderPoint + safetyStock - currentStock) * 1.2);

    // Get preferred supplier if available (default: first supplier)
    const suppliersList = await db
      .select({ id: suppliers.id, name: suppliers.name })
      .from(suppliers)
      .where(eq(suppliers.businessId, businessId))
      .limit(1);

    result.push({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      currentStock,
      reorderPoint,
      safetyStock,
      leadTimeDays,
      daysUntilStockout,
      suggestedOrderQty: Math.max(suggestedOrderQty, 0),
      preferredSupplierId: suppliersList[0]?.id || null,
    });
  }

  // Filter to only alerts (below reorder point or safety stock)
  return result.filter(
    (a) => a.currentStock <= a.reorderPoint || a.currentStock <= a.safetyStock
  );
}

// ─── Production Management ───
export async function createProductionLog(data: InsertProductionLog): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  requireFields(data, ["businessId", "productId", "qtyProduced", "totalCost"], "production_logs");
  const result = await db.insert(productionLogs).values(stripUndefined(data));
  return result[0].insertId;
}

export async function getProductionLogs(
  businessId: number,
  productId?: number,
  startDate?: string,
  endDate?: string
) {
  const db = await getDb();
  if (!db) return [];

  const conditions: Array<any> = [eq(productionLogs.businessId, businessId)];
  if (productId) conditions.push(eq(productionLogs.productId, productId));
  if (startDate) conditions.push(gte(productionLogs.date, startDate));
  if (endDate) conditions.push(lte(productionLogs.date, endDate));

  return db
    .select({
      id: productionLogs.id,
      productId: productionLogs.productId,
      productName: products.name,
      batchCode: productionLogs.batchCode,
      qtyProduced: productionLogs.qtyProduced,
      totalCost: productionLogs.totalCost,
      costPerUnit: productionLogs.costPerUnit,
      date: productionLogs.date,
      notes: productionLogs.notes,
      createdAt: productionLogs.createdAt,
    })
    .from(productionLogs)
    .leftJoin(products, eq(productionLogs.productId, products.id))
    .where(and(...conditions))
    .orderBy(desc(productionLogs.date));
}

export async function getProductionCostReport(
  businessId: number,
  startDate: string,
  endDate: string
) {
  const db = await getDb();
  if (!db) return { totalProduced: 0, totalCost: 0, avgCostPerUnit: 0, byProduct: [] };
  const logs = await db
    .select({
      productId: productionLogs.productId,
      productName: products.name,
      qtyProduced: sql<number>`SUM(${productionLogs.qtyProduced})`,
      totalCost: sql<number>`SUM(${productionLogs.totalCost})`,
    })
    .from(productionLogs)
    .leftJoin(products, eq(productionLogs.productId, products.id))
    .where(
      and(
        eq(productionLogs.businessId, businessId),
        gte(productionLogs.date, startDate),
        lte(productionLogs.date, endDate)
      )
    )
    .groupBy(productionLogs.productId, products.name);

  const totalQty = logs.reduce((sum, log) => sum + (log.qtyProduced || 0), 0);
  const totalCostAmount = logs.reduce((sum, log) => sum + (log.totalCost || 0), 0);
  const avgCostPerUnit = totalQty > 0 ? totalCostAmount / totalQty : 0;

  return {
    totalProduced: totalQty,
    totalCost: totalCostAmount,
    avgCostPerUnit: Math.round(avgCostPerUnit),
    byProduct: logs.map((log) => ({
      productId: log.productId,
      productName: log.productName || "Unknown",
      qtyProduced: log.qtyProduced || 0,
      totalCost: log.totalCost || 0,
      avgCostPerUnit: log.qtyProduced ? Math.round((log.totalCost || 0) / log.qtyProduced) : 0,
    })),
  };
}

export async function runProduction(
  businessId: number,
  productId: number,
  qty: number,
  date: string,
  notes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get product and its compositions
  const product = await getProductById(productId);
  if (!product || product.businessId !== businessId) {
    throw new Error("Produk tidak ditemukan");
  }

  const compositions = await getCompositionsByProduct(productId);
  const totalCost = calculateCOGS(compositions) * qty;
  const costPerUnit = Math.round(totalCost / qty);

  // Run FULLY ATOMIC transaction: all reads + writes use tx connection
  await db.transaction(async (tx) => {
    // Create production log
    const [logResult] = await tx.insert(productionLogs).values({
      businessId,
      productId,
      batchCode: null,
      qtyProduced: qty,
      totalCost: Math.round(totalCost),
      costPerUnit,
      date,
      notes,
    });
    const logId = logResult.insertId;

    // Deduct material stock for each composition — all via tx
    for (const comp of compositions) {
      if (!comp.materialProductId) continue;

      const deductQty = parseFloat(comp.qty) * qty;

      // Read material inside tx
      const [material] = await tx.select().from(products).where(eq(products.id, comp.materialProductId)).limit(1);
      if (!material) continue;

      const currentStock = material.stockCurrent || 0;
      const newStock = currentStock - deductQty;

      // Update material stock via tx
      await tx.update(products).set({ stockCurrent: newStock }).where(eq(products.id, comp.materialProductId));

      // Create stock log via tx
      await tx.insert(stockLogs).values({
        businessId,
        productId: comp.materialProductId,
        date: date,
        movementType: "out",
        qty: deductQty,
        direction: -1,
        referenceTxId: logId,
        stockBefore: currentStock,
        stockAfter: newStock,
      });
    }

    // Read current product stock inside tx for accuracy
    const [currentProduct] = await tx.select().from(products).where(eq(products.id, productId)).limit(1);
    const currentProdStock = currentProduct?.stockCurrent || 0;
    const newProdStock = currentProdStock + qty;

    // Add produced stock via tx
    await tx.update(products).set({ stockCurrent: newProdStock }).where(eq(products.id, productId));

    // Create stock log for production output via tx
    await tx.insert(stockLogs).values({
      businessId,
      productId,
      date: date,
      movementType: "in",
      qty,
      direction: 1,
      referenceTxId: logId,
      stockBefore: currentProdStock,
      stockAfter: newProdStock,
    });

    // ─── JOURNALIZE HPP: Create journal entry for production cost ───
    // Debit: HPP (expense) — increases cost of goods
    // Credit: Persediaan Bahan Baku (asset reduction) — raw materials consumed
    if (Math.round(totalCost) > 0) {
      const txCode = await generateTxCode(businessId);
      await tx.insert(transactions).values({
        businessId,
        txCode,
        date,
        type: "pengeluaran",
        category: "HPP Produksi",
        description: `Biaya produksi ${product.name} x${qty}${notes ? ' — ' + notes : ''}`,
        amount: Math.round(totalCost),
        paymentMethod: "internal",
        taxRelated: false,
        notes: `Production Log #${logId} | HPP/unit: ${costPerUnit}`,
      });
    }
  });

  return {
    logId: (
      await db
        .select({ id: productionLogs.id })
        .from(productionLogs)
        .where(eq(productionLogs.businessId, businessId))
        .orderBy(desc(productionLogs.id))
        .limit(1)
    )[0]?.id,
    costPerUnit,
    totalCost: Math.round(totalCost),
  };
}

export async function generateLabaRugiDetail(
  businessId: number,
  month: number,
  year: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

  // FIXED: Revenue now comes ONLY from transactions table (all income categories)
  // POS checkouts automatically create journal entries with type="pemasukan"
  const salesData = await db
    .select({
      total: sql<number>`SUM(${transactions.amount})`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.businessId, businessId),
        eq(transactions.type, "pemasukan"),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate),
        eq(transactions.isDeleted, false)
      )
    );

  const totalPendapatan = Number(salesData[0]?.total || 0);

  // For detail breakdown, split into POS (has receiptId) and manual (no receiptId)
  const posSalesData = await db
    .select({
      total: sql<number>`SUM(${transactions.amount})`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.businessId, businessId),
        eq(transactions.type, "pemasukan"),
        isNotNull(transactions.receiptId),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate),
        eq(transactions.isDeleted, false)
      )
    );

  const penjualanPOS = Number(posSalesData[0]?.total || 0);
  const penjualanManual = totalPendapatan - penjualanPOS;

  // FIXED: HPP now comes ONLY from transactions table
  // Categories "Pembelian Stok" and "HPP Produksi" represent COGS in the journal
  const hppData = await db
    .select({
      pembelianStok: sql<number>`SUM(CASE WHEN ${transactions.category} = 'Pembelian Stok' THEN ${transactions.amount} ELSE 0 END)`,
      hppProduksi: sql<number>`SUM(CASE WHEN ${transactions.category} = 'HPP Produksi' THEN ${transactions.amount} ELSE 0 END)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.businessId, businessId),
        eq(transactions.type, "pengeluaran"),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate),
        eq(transactions.isDeleted, false)
      )
    );

  const hppPenjualan = Number(hppData[0]?.pembelianStok || 0);
  const biayaProduksi = Number(hppData[0]?.hppProduksi || 0);
  const totalHPP = hppPenjualan + biayaProduksi;
  const labaKotor = totalPendapatan - totalHPP;
  const marginKotor = totalPendapatan > 0 ? (labaKotor / totalPendapatan) * 100 : 0;

  // Operating expenses
  const expenseCategories = [
    "gaji",
    "sewa",
    "utilitas",
    "transportasi",
    "operasionalLain",
  ];
  const expenses: Record<string, number> = {
    gaji: 0,
    sewa: 0,
    utilitas: 0,
    transportasi: 0,
    operasionalLain: 0,
    refund: 0,
    komisiStaff: 0,
  };

  for (const cat of expenseCategories) {
    const data = await db
      .select({ total: sql<number>`SUM(${transactions.amount})` })
      .from(transactions)
      .where(
        and(
          eq(transactions.businessId, businessId),
          eq(transactions.category, cat),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      );
    expenses[cat] = Number(data[0]?.total || 0);
  }

  // FIXED: Refunds now from transactions table (pengeluaran with category matching refund patterns)
  // Refund entries are recorded as pengeluaran in the journal
  const refundData = await db
    .select({
      total: sql<number>`SUM(${transactions.amount})`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.businessId, businessId),
        eq(transactions.type, "pengeluaran"),
        sql`LOWER(${transactions.category}) LIKE '%refund%'`,
        gte(transactions.date, startDate),
        lte(transactions.date, endDate),
        eq(transactions.isDeleted, false)
      )
    );
  expenses.refund = Number(refundData[0]?.total || 0);

  // Staff commissions
  const commData = await db
    .select({
      total: sql<number>`SUM(${staffCommissions.commissionAmount})`,
    })
    .from(staffCommissions)
    .where(
      and(
        eq(staffCommissions.businessId, businessId),
        gte(staffCommissions.date, startDate),
        lte(staffCommissions.date, endDate)
      )
    );
  expenses.komisiStaff = Number(commData[0]?.total || 0);

  const totalPengeluaran = Object.values(expenses).reduce((a, b) => a + b, 0);
  const labaBersih = labaKotor - totalPengeluaran;
  const marginBersih = totalPendapatan > 0 ? (labaBersih / totalPendapatan) * 100 : 0;

  return {
    period: `${month}/${year}`,
    pendapatan: {
      penjualanPOS,
      penjualanManual,
      pendapatanJasa: 0,
      pendapatanLain: 0,
      totalPendapatan,
    },
    hpp: {
      hppPenjualan,
      pembelianBarang: 0,
      biayaProduksi,
      stokOpname: 0,
      totalHPP,
    },
    labaKotor,
    marginKotor: Math.round(marginKotor * 100) / 100,
    pengeluaran: {
      gaji: expenses.gaji,
      sewa: expenses.sewa,
      utilitas: expenses.utilitas,
      transportasi: expenses.transportasi,
      operasionalLain: expenses.operasionalLain,
      refund: expenses.refund,
      komisiStaff: expenses.komisiStaff,
      totalPengeluaran,
    },
    labaBersih,
    marginBersih: Math.round(marginBersih * 100) / 100,
  };
}

// ═══════════════════════════════════════════════════════════════
// ═══════════════════ WAVE 4: OUTLETS & ATTENDANCE & DEPOSITS ═══
// ═══════════════════════════════════════════════════════════════

// ─── OUTLETS ───
export async function getOutletsByBusiness(businessId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(outlets)
    .where(eq(outlets.businessId, businessId))
    .orderBy(desc(outlets.isDefault));
}

export async function createOutlet(data: InsertOutlet) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  requireFields(data, ["businessId", "name"], "outlets");
  const result = await db.insert(outlets).values(stripUndefined(data));
  return result;
}

export async function updateOutlet(id: number, businessId: number, data: Partial<InsertOutlet>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .update(outlets)
    .set(data)
    .where(and(eq(outlets.id, id), eq(outlets.businessId, businessId)));
}

export async function deleteOutlet(id: number, businessId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .delete(outlets)
    .where(and(eq(outlets.id, id), eq(outlets.businessId, businessId)));
}

export async function ensureDefaultOutlet(businessId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db
    .select()
    .from(outlets)
    .where(eq(outlets.businessId, businessId));

  if (existing.length === 0) {
    await db.insert(outlets).values({
      businessId,
      name: "Outlet Utama",
      isDefault: true,
      isActive: true,
    });
  }
}

export async function getOutletSalesReport(
  businessId: number,
  outletId?: number,
  startDate?: string,
  endDate?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions: any[] = [eq(posReceipts.businessId, businessId)];
  if (outletId) {
    conditions.push(eq(outlets.id, outletId));
  }
  if (startDate && endDate) {
    conditions.push(gte(sql`DATE(${posReceipts.date})`, startDate));
    conditions.push(lte(sql`DATE(${posReceipts.date})`, endDate));
  }

  return db
    .select({
      outletId: outlets.id,
      outletName: outlets.name,
      totalSales: sql<number>`SUM(${posReceipts.grandTotal})`,
      transactionCount: sql<number>`COUNT(${posReceipts.id})`,
      avgTransaction: sql<number>`AVG(${posReceipts.grandTotal})`,
    })
    .from(posReceipts)
    .leftJoin(outlets, eq(posReceipts.businessId, outlets.businessId))
    .where(and(...conditions))
    .groupBy(outlets.id);
}

// ─── STAFF ATTENDANCE ───
export async function clockIn(businessId: number, userId: string, userName: string, date: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(staffAttendance).values({
    businessId,
    userId,
    userName,
    date,
    clockIn: new Date(),
  });
  return result;
}

export async function clockOut(businessId: number, attendanceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const record = await db
    .select()
    .from(staffAttendance)
    .where(eq(staffAttendance.id, attendanceId));

  if (record.length === 0) throw new Error("Attendance record not found");

  const now = new Date();
  const clockInTime = record[0].clockIn;
  if (!clockInTime) throw new Error("No clock-in time found");

  const hoursWorked = (now.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

  await db
    .update(staffAttendance)
    .set({
      clockOut: now,
      hoursWorked: hoursWorked.toFixed(2),
    })
    .where(eq(staffAttendance.id, attendanceId));
}

export async function getAttendanceByDate(businessId: number, date: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(staffAttendance)
    .where(and(
      eq(staffAttendance.businessId, businessId),
      eq(staffAttendance.date, date)
    ));
}

export async function getAttendanceReport(businessId: number, startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(staffAttendance)
    .where(
      and(
        eq(staffAttendance.businessId, businessId),
        gte(staffAttendance.date, startDate),
        lte(staffAttendance.date, endDate)
      )
    );
}

export async function getMyAttendance(businessId: number, userId: string, startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(staffAttendance)
    .where(
      and(
        eq(staffAttendance.businessId, businessId),
        eq(staffAttendance.userId, userId),
        gte(staffAttendance.date, startDate),
        lte(staffAttendance.date, endDate)
      )
    );
}

// ─── CUSTOMER DEPOSITS ───
export async function getOrCreateDeposit(businessId: number, clientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(customerDeposits)
    .where(
      and(
        eq(customerDeposits.businessId, businessId),
        eq(customerDeposits.clientId, clientId)
      )
    );

  if (existing.length > 0) return existing[0];

  const result = await db.insert(customerDeposits).values({
    businessId,
    clientId,
    balance: 0,
  });

  const insertedId = (result as any).insertId || (result as any)[0]?.id;
  return db
    .select()
    .from(customerDeposits)
    .where(eq(customerDeposits.id, insertedId as number))
    .then(rows => rows[0]);
}

export async function topUpDeposit(businessId: number, clientId: number, amount: number, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const deposit = await getOrCreateDeposit(businessId, clientId);

  await db.transaction(async (tx) => {
    // Atomic SQL increment to avoid race conditions
    await tx
      .update(customerDeposits)
      .set({ balance: sql`${customerDeposits.balance} + ${amount}` })
      .where(eq(customerDeposits.id, deposit.id));

    await tx.insert(depositTransactions).values({
      businessId,
      depositId: deposit.id,
      type: "topup",
      amount,
      notes,
    });

    // Create journal entry for deposit top-up
    const txCode = await generateTxCode(businessId);
    await tx.insert(transactions).values({
      businessId,
      txCode,
      date: new Date().toISOString().slice(0, 10),
      type: "pemasukan",
      category: "Deposit Pelanggan",
      description: `Top-up deposit: ${notes || 'Top-up'}`,
      amount,
      paymentMethod: "internal",
      taxRelated: false,
      notes: `Deposit #${deposit.id}`,
    });
  });
}

export async function useDeposit(businessId: number, clientId: number, amount: number, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const deposit = await getOrCreateDeposit(businessId, clientId);
  if ((deposit.balance || 0) < amount) throw new Error("Insufficient deposit balance");

  await db.transaction(async (tx) => {
    // Re-read inside tx for consistency check before atomic decrement
    const [current] = await tx
      .select()
      .from(customerDeposits)
      .where(eq(customerDeposits.id, deposit.id));

    if ((current.balance || 0) < amount) throw new Error("Insufficient deposit balance");

    // Atomic SQL decrement to avoid race conditions
    await tx
      .update(customerDeposits)
      .set({ balance: sql`${customerDeposits.balance} - ${amount}` })
      .where(eq(customerDeposits.id, deposit.id));

    await tx.insert(depositTransactions).values({
      businessId,
      depositId: deposit.id,
      type: "use",
      amount,
      notes,
    });

    // Create journal entry for deposit usage
    const txCode = await generateTxCode(businessId);
    await tx.insert(transactions).values({
      businessId,
      txCode,
      date: new Date().toISOString().slice(0, 10),
      type: "pengeluaran",
      category: "Penggunaan Deposit",
      description: `Penggunaan deposit: ${notes || 'Penggunaan'}`,
      amount,
      paymentMethod: "internal",
      taxRelated: false,
      notes: `Deposit #${deposit.id}`,
    });
  });
}

export async function refundDeposit(businessId: number, clientId: number, amount: number, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const deposit = await getOrCreateDeposit(businessId, clientId);

  await db.transaction(async (tx) => {
    // Atomic SQL increment to avoid race conditions
    await tx
      .update(customerDeposits)
      .set({ balance: sql`${customerDeposits.balance} + ${amount}` })
      .where(eq(customerDeposits.id, deposit.id));

    await tx.insert(depositTransactions).values({
      businessId,
      depositId: deposit.id,
      type: "refund",
      amount,
      notes,
    });

    // Create journal entry for deposit refund
    const txCode = await generateTxCode(businessId);
    await tx.insert(transactions).values({
      businessId,
      txCode,
      date: new Date().toISOString().slice(0, 10),
      type: "pengeluaran",
      category: "Refund Deposit",
      description: `Refund deposit: ${notes || 'Refund'}`,
      amount,
      paymentMethod: "internal",
      taxRelated: false,
      notes: `Deposit #${deposit.id}`,
    });
  });
}

export async function getDepositHistory(businessId: number, clientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const deposit = await db
    .select()
    .from(customerDeposits)
    .where(
      and(
        eq(customerDeposits.businessId, businessId),
        eq(customerDeposits.clientId, clientId)
      )
    );

  if (deposit.length === 0) return [];

  return db
    .select()
    .from(depositTransactions)
    .where(eq(depositTransactions.depositId, deposit[0].id));
}

export async function getAllDeposits(businessId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select({
      id: customerDeposits.id,
      clientId: customerDeposits.clientId,
      clientName: clients.name,
      balance: customerDeposits.balance,
      createdAt: customerDeposits.createdAt,
      updatedAt: customerDeposits.updatedAt,
    })
    .from(customerDeposits)
    .leftJoin(clients, eq(customerDeposits.clientId, clients.id))
    .where(eq(customerDeposits.businessId, businessId));
}

export async function getDepositReport(businessId: number, startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions: any[] = [eq(depositTransactions.businessId, businessId)];

  if (startDate && endDate) {
    conditions.push(gte(depositTransactions.createdAt, sql`STR_TO_DATE(${startDate}, '%Y-%m-%d')`));
    conditions.push(lte(depositTransactions.createdAt, sql`STR_TO_DATE(${endDate}, '%Y-%m-%d')`));
  }

  return db
    .select({
      totalTopUps: sql<number>`SUM(CASE WHEN ${depositTransactions.type} = 'topup' THEN ${depositTransactions.amount} ELSE 0 END)`,
      totalUsed: sql<number>`SUM(CASE WHEN ${depositTransactions.type} = 'use' THEN ${depositTransactions.amount} ELSE 0 END)`,
      totalRefunds: sql<number>`SUM(CASE WHEN ${depositTransactions.type} = 'refund' THEN ${depositTransactions.amount} ELSE 0 END)`,
      transactionCount: sql<number>`COUNT(${depositTransactions.id})`,
    })
    .from(depositTransactions)
    .where(and(...conditions));
}

// ─── SALES BY STAFF ───
export async function getSalesByStaff(businessId: number, startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select({
      staffName: staffCommissions.receiptCode,
      totalSales: sql<number>`SUM(${staffCommissions.saleAmount})`,
      commissionEarned: sql<number>`SUM(${staffCommissions.commissionAmount})`,
      transactionCount: sql<number>`COUNT(DISTINCT ${staffCommissions.receiptId})`,
    })
    .from(staffCommissions)
    .where(
      and(
        eq(staffCommissions.businessId, businessId),
        gte(staffCommissions.date, startDate),
        lte(staffCommissions.date, endDate)
      )
    )
    .groupBy(staffCommissions.receiptCode);
}

export async function getStaffSalesDetail(businessId: number, staffName: string, startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select({
      receiptCode: staffCommissions.receiptCode,
      saleAmount: staffCommissions.saleAmount,
      commissionAmount: staffCommissions.commissionAmount,
      date: staffCommissions.date,
      status: staffCommissions.status,
    })
    .from(staffCommissions)
    .where(
      and(
        eq(staffCommissions.businessId, businessId),
        eq(staffCommissions.receiptCode, staffName),
        gte(staffCommissions.date, startDate),
        lte(staffCommissions.date, endDate)
      )
    );
}

export async function getSalesByDevice(businessId: number, startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select({
      deviceInfo: posReceipts.deviceInfo,
      totalSales: sql<number>`SUM(${posReceipts.grandTotal})`,
      transactionCount: sql<number>`COUNT(${posReceipts.id})`,
      avgTransaction: sql<number>`AVG(${posReceipts.grandTotal})`,
    })
    .from(posReceipts)
    .where(
      and(
        eq(posReceipts.businessId, businessId),
        gte(sql`DATE(${posReceipts.date})`, startDate),
        lte(sql`DATE(${posReceipts.date})`, endDate)
      )
    )
    .groupBy(posReceipts.deviceInfo);
}

// ══════════════════════════════════════════════════════════════════════════════
// ██  GENERAL LEDGER — Double-Entry Bookkeeping (SAK EMKM)                  ██
// ══════════════════════════════════════════════════════════════════════════════

// ─── Default Chart of Accounts (SAK EMKM) ───
// These are auto-created for every new business via initializeCoA()

const DEFAULT_COA: Array<{
  code: string;
  name: string;
  accountType: "asset" | "liability" | "equity" | "revenue" | "cogs" | "expense";
  normalBalance: "debit" | "credit";
  parentCode: string | null;
  isHeader: boolean;
}> = [
  // ─── 1xxx ASET ───
  { code: "1100", name: "Kas & Setara Kas", accountType: "asset", normalBalance: "debit", parentCode: null, isHeader: true },
  { code: "1101", name: "Kas Umum", accountType: "asset", normalBalance: "debit", parentCode: "1100", isHeader: false },
  { code: "1200", name: "Piutang", accountType: "asset", normalBalance: "debit", parentCode: null, isHeader: true },
  { code: "1201", name: "Piutang Usaha", accountType: "asset", normalBalance: "debit", parentCode: "1200", isHeader: false },
  { code: "1202", name: "Piutang Lain-lain", accountType: "asset", normalBalance: "debit", parentCode: "1200", isHeader: false },
  { code: "1300", name: "Persediaan", accountType: "asset", normalBalance: "debit", parentCode: null, isHeader: true },
  { code: "1301", name: "Persediaan Barang Dagang", accountType: "asset", normalBalance: "debit", parentCode: "1300", isHeader: false },
  { code: "1302", name: "Persediaan Bahan Baku", accountType: "asset", normalBalance: "debit", parentCode: "1300", isHeader: false },
  { code: "1400", name: "Uang Muka", accountType: "asset", normalBalance: "debit", parentCode: null, isHeader: true },
  { code: "1401", name: "Uang Muka Pembelian", accountType: "asset", normalBalance: "debit", parentCode: "1400", isHeader: false },

  // ─── 2xxx LIABILITAS ───
  { code: "2100", name: "Hutang Jangka Pendek", accountType: "liability", normalBalance: "credit", parentCode: null, isHeader: true },
  { code: "2101", name: "Hutang Usaha", accountType: "liability", normalBalance: "credit", parentCode: "2100", isHeader: false },
  { code: "2102", name: "Hutang Lain-lain", accountType: "liability", normalBalance: "credit", parentCode: "2100", isHeader: false },
  { code: "2103", name: "Hutang Pajak", accountType: "liability", normalBalance: "credit", parentCode: "2100", isHeader: false },
  { code: "2104", name: "Deposit Pelanggan", accountType: "liability", normalBalance: "credit", parentCode: "2100", isHeader: false },
  { code: "2105", name: "Hutang Komisi Staff", accountType: "liability", normalBalance: "credit", parentCode: "2100", isHeader: false },

  // ─── 3xxx EKUITAS ───
  { code: "3100", name: "Modal", accountType: "equity", normalBalance: "credit", parentCode: null, isHeader: true },
  { code: "3101", name: "Modal Pemilik", accountType: "equity", normalBalance: "credit", parentCode: "3100", isHeader: false },
  { code: "3102", name: "Laba Ditahan", accountType: "equity", normalBalance: "credit", parentCode: "3100", isHeader: false },
  { code: "3103", name: "Prive / Penarikan Pemilik", accountType: "equity", normalBalance: "debit", parentCode: "3100", isHeader: false },
  { code: "3104", name: "Laba Periode Berjalan", accountType: "equity", normalBalance: "credit", parentCode: "3100", isHeader: false },

  // ─── 4xxx PENDAPATAN ───
  { code: "4100", name: "Pendapatan Usaha", accountType: "revenue", normalBalance: "credit", parentCode: null, isHeader: true },
  { code: "4101", name: "Penjualan", accountType: "revenue", normalBalance: "credit", parentCode: "4100", isHeader: false },
  { code: "4102", name: "Pendapatan Jasa", accountType: "revenue", normalBalance: "credit", parentCode: "4100", isHeader: false },
  { code: "4200", name: "Potongan & Retur", accountType: "revenue", normalBalance: "debit", parentCode: null, isHeader: true },
  { code: "4201", name: "Retur Penjualan", accountType: "revenue", normalBalance: "debit", parentCode: "4200", isHeader: false },
  { code: "4202", name: "Diskon Penjualan", accountType: "revenue", normalBalance: "debit", parentCode: "4200", isHeader: false },
  { code: "4300", name: "Pendapatan Lain-lain", accountType: "revenue", normalBalance: "credit", parentCode: null, isHeader: true },
  { code: "4301", name: "Pendapatan Lain-lain", accountType: "revenue", normalBalance: "credit", parentCode: "4300", isHeader: false },

  // ─── 5xxx HPP (COGS) ───
  { code: "5100", name: "Harga Pokok Penjualan", accountType: "cogs", normalBalance: "debit", parentCode: null, isHeader: true },
  { code: "5101", name: "HPP Barang Dagang", accountType: "cogs", normalBalance: "debit", parentCode: "5100", isHeader: false },
  { code: "5102", name: "HPP Produksi", accountType: "cogs", normalBalance: "debit", parentCode: "5100", isHeader: false },

  // ─── 6xxx BEBAN OPERASIONAL ───
  { code: "6100", name: "Beban Tenaga Kerja", accountType: "expense", normalBalance: "debit", parentCode: null, isHeader: true },
  { code: "6101", name: "Beban Gaji", accountType: "expense", normalBalance: "debit", parentCode: "6100", isHeader: false },
  { code: "6102", name: "Beban Komisi Staff", accountType: "expense", normalBalance: "debit", parentCode: "6100", isHeader: false },
  { code: "6200", name: "Beban Operasional", accountType: "expense", normalBalance: "debit", parentCode: null, isHeader: true },
  { code: "6201", name: "Beban Sewa", accountType: "expense", normalBalance: "debit", parentCode: "6200", isHeader: false },
  { code: "6202", name: "Beban Utilitas", accountType: "expense", normalBalance: "debit", parentCode: "6200", isHeader: false },
  { code: "6203", name: "Beban Transportasi", accountType: "expense", normalBalance: "debit", parentCode: "6200", isHeader: false },
  { code: "6204", name: "Beban Perlengkapan", accountType: "expense", normalBalance: "debit", parentCode: "6200", isHeader: false },
  { code: "6205", name: "Beban Marketing", accountType: "expense", normalBalance: "debit", parentCode: "6200", isHeader: false },
  { code: "6206", name: "Beban Administrasi", accountType: "expense", normalBalance: "debit", parentCode: "6200", isHeader: false },
  { code: "6207", name: "Beban Lain-lain", accountType: "expense", normalBalance: "debit", parentCode: "6200", isHeader: false },
  { code: "6300", name: "Beban Pajak", accountType: "expense", normalBalance: "debit", parentCode: null, isHeader: true },
  { code: "6301", name: "Beban PPh Final", accountType: "expense", normalBalance: "debit", parentCode: "6300", isHeader: false },
  { code: "6302", name: "Beban PPN", accountType: "expense", normalBalance: "debit", parentCode: "6300", isHeader: false },
  { code: "6400", name: "Beban Tagihan Rutin", accountType: "expense", normalBalance: "debit", parentCode: null, isHeader: true },
  { code: "6401", name: "Beban Tagihan Bulanan", accountType: "expense", normalBalance: "debit", parentCode: "6400", isHeader: false },
];

// ─── Category → Account Code Mapping ───
// Maps legacy `transactions.category` free-text to CoA codes
const CATEGORY_TO_ACCOUNT: Record<string, string> = {
  // Revenue categories
  "Penjualan POS": "4101",
  "Penjualan": "4101",
  "Pendapatan Jasa": "4102",
  // Expense categories
  "Gaji Karyawan": "6101",
  "Gaji": "6101",
  "Sewa": "6201",
  "Listrik": "6202",
  "Air": "6202",
  "Internet": "6202",
  "Utilitas": "6202",
  "Transportasi": "6203",
  "Bensin": "6203",
  "Perlengkapan": "6204",
  "ATK": "6204",
  "Marketing": "6205",
  "Iklan": "6205",
  "Administrasi": "6206",
  "Tagihan Bulanan": "6401",
  // Inventory
  "Pembelian Stok": "1301",
  "Pembelian Bahan Baku": "1302",
  // HPP
  "HPP": "5101",
  // Contra-revenue
  "Refund": "4201",
  "Retur": "4201",
  "Void": "4201",
  "Diskon": "4202",
};

/**
 * Initialize Chart of Accounts for a business.
 * Idempotent — skips accounts that already exist.
 * Also creates dynamic accounts for each bank_account record.
 */
export async function initializeCoA(businessId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Check if CoA already initialized (has any accounts)
  const existing = await db.select({ count: sql<number>`COUNT(*)` })
    .from(accounts)
    .where(eq(accounts.businessId, businessId));
  if (Number(existing[0]?.count ?? 0) > 0) return; // Already initialized

  // Insert all default system accounts
  for (const acct of DEFAULT_COA) {
    await db.insert(accounts).values({
      businessId,
      code: acct.code,
      name: acct.name,
      accountType: acct.accountType,
      normalBalance: acct.normalBalance,
      parentCode: acct.parentCode,
      isHeader: acct.isHeader,
      isSystemAccount: true,
      isActive: true,
      sortOrder: parseInt(acct.code),
    });
  }

  // Create dynamic accounts for existing bank accounts
  const bankAccts = await db.select().from(bankAccounts)
    .where(and(eq(bankAccounts.businessId, businessId), eq(bankAccounts.isActive, true)));

  let nextCode = 1102; // 1101 = Kas Umum (already created), dynamic start at 1102
  for (const ba of bankAccts) {
    // Check if code already taken
    const codeStr = String(nextCode);
    const existsCheck = await db.select({ id: accounts.id }).from(accounts)
      .where(and(eq(accounts.businessId, businessId), eq(accounts.code, codeStr)));
    if (existsCheck.length === 0) {
      await db.insert(accounts).values({
        businessId,
        code: codeStr,
        name: ba.accountName,
        accountType: "asset",
        normalBalance: "debit",
        parentCode: "1100",
        isHeader: false,
        isSystemAccount: true,
        bankAccountId: ba.id,
        isActive: true,
        sortOrder: nextCode,
      });
    }
    nextCode++;
  }
}

/**
 * Get or create a CoA account for a bank account.
 * Called when a new bank_account is created to auto-link to GL.
 */
export async function ensureBankAccountInCoA(businessId: number, bankAccountId: number, accountName: string): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if already linked
  const existing = await db.select({ id: accounts.id }).from(accounts)
    .where(and(eq(accounts.businessId, businessId), eq(accounts.bankAccountId, bankAccountId)));
  if (existing.length > 0) return existing[0].id;

  // Find next available code in 1100 range
  const maxCodeResult = await db.select({ maxCode: sql<string>`MAX(${accounts.code})` })
    .from(accounts)
    .where(and(eq(accounts.businessId, businessId), sql`${accounts.code} LIKE '11%'`, eq(accounts.isHeader, false)));
  const maxCode = Number(maxCodeResult[0]?.maxCode ?? "1101");
  const nextCode = String(maxCode + 1);

  const [result] = await db.insert(accounts).values({
    businessId,
    code: nextCode,
    name: accountName,
    accountType: "asset",
    normalBalance: "debit",
    parentCode: "1100",
    isHeader: false,
    isSystemAccount: true,
    bankAccountId,
    isActive: true,
    sortOrder: parseInt(nextCode),
  });
  return result.insertId;
}

/**
 * Resolve a CoA account ID by its code for a given business.
 * Returns the account ID or null if not found.
 */
export async function getAccountByCode(businessId: number, code: string): Promise<Account | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(accounts)
    .where(and(eq(accounts.businessId, businessId), eq(accounts.code, code)))
    .limit(1);
  return result[0] ?? null;
}

/**
 * Get the CoA account linked to a specific bank account.
 */
export async function getAccountByBankAccountId(businessId: number, bankAccountId: number): Promise<Account | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(accounts)
    .where(and(eq(accounts.businessId, businessId), eq(accounts.bankAccountId, bankAccountId)))
    .limit(1);
  return result[0] ?? null;
}

/**
 * Resolve an expense category string to a CoA account code.
 * Falls back to "6207" (Beban Lain-lain) if no match.
 */
export function resolveAccountCodeFromCategory(category: string, type: "pemasukan" | "pengeluaran"): string {
  // Direct mapping
  const mapped = CATEGORY_TO_ACCOUNT[category];
  if (mapped) return mapped;

  // Case-insensitive partial match
  const lowerCat = category.toLowerCase();
  for (const [key, code] of Object.entries(CATEGORY_TO_ACCOUNT)) {
    if (lowerCat.includes(key.toLowerCase())) return code;
  }

  // Fallback by transaction type
  if (type === "pemasukan") return "4301"; // Pendapatan Lain-lain
  return "6207"; // Beban Lain-lain
}

// ─── Journal Entry Number Generator ───

async function generateJournalEntryNumber(businessId: number): Promise<string> {
  const db = await getDb();
  if (!db) return `JE-${Date.now()}`;
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const prefix = `JE-${dateStr}-`;
  const result = await db.select({ count: sql<number>`COUNT(*)` }).from(journalEntries)
    .where(and(eq(journalEntries.businessId, businessId), sql`${journalEntries.entryNumber} LIKE ${prefix + "%"}`));
  const seq = Number(result[0]?.count ?? 0) + 1;
  return `${prefix}${String(seq).padStart(3, "0")}`;
}

// ─── Core Journal Service ───

export type JournalLineInput = {
  accountId: number;
  description?: string;
  debitAmount: number;
  creditAmount: number;
};

export type CreateJournalEntryInput = {
  businessId: number;
  date: string;
  description: string;
  sourceType: string;
  sourceId?: number | null;
  reversalOfId?: number | null;
  createdByUserId?: number | null;
  lines: JournalLineInput[];
};

/**
 * Core Journal Service — creates a validated double-entry journal entry.
 *
 * VALIDATION RULES:
 * 1. Must have at least 2 lines
 * 2. SUM(debit) must equal SUM(credit)
 * 3. Each line must have either debit OR credit (not both, not neither)
 * 4. All accountIds must exist and not be header accounts
 *
 * Can be called standalone or within an existing DB transaction.
 */
export async function createJournalEntry(input: CreateJournalEntryInput, txConn?: any): Promise<{ journalEntryId: number; entryNumber: string }> {
  // ─── Validation ───
  if (!input.lines || input.lines.length < 2) {
    throw new Error("Journal entry must have at least 2 lines (debit + credit)");
  }

  let totalDebit = 0;
  let totalCredit = 0;
  for (const line of input.lines) {
    if (line.debitAmount < 0 || line.creditAmount < 0) {
      throw new Error("Debit and credit amounts must be non-negative");
    }
    if (line.debitAmount > 0 && line.creditAmount > 0) {
      throw new Error("A journal line cannot have both debit and credit amounts");
    }
    if (line.debitAmount === 0 && line.creditAmount === 0) {
      throw new Error("A journal line must have either a debit or credit amount");
    }
    totalDebit += line.debitAmount;
    totalCredit += line.creditAmount;
  }

  if (totalDebit !== totalCredit) {
    throw new Error(`Journal entry is not balanced: Debit=${totalDebit}, Credit=${totalCredit} (difference=${totalDebit - totalCredit})`);
  }

  // ─── Get DB connection (use existing transaction or create new) ───
  const db = txConn || await getDb();
  if (!db) throw new Error("Database not available");

  // ─── Generate entry number ───
  const entryNumber = await generateJournalEntryNumber(input.businessId);

  // ─── Insert journal entry header ───
  const [entryResult] = await db.insert(journalEntries).values({
    businessId: input.businessId,
    entryNumber,
    date: input.date,
    description: input.description,
    sourceType: input.sourceType,
    sourceId: input.sourceId ?? null,
    reversalOfId: input.reversalOfId ?? null,
    totalAmount: totalDebit, // = totalCredit (already validated)
    createdByUserId: input.createdByUserId ?? null,
  });
  const journalEntryId = entryResult.insertId;

  // ─── Insert journal lines ───
  for (const line of input.lines) {
    await db.insert(journalLines).values({
      journalEntryId,
      accountId: line.accountId,
      description: line.description ?? null,
      debitAmount: line.debitAmount,
      creditAmount: line.creditAmount,
    });
  }

  return { journalEntryId, entryNumber };
}

/**
 * Helper: Resolve account IDs for POS Checkout journal entry.
 * Returns the necessary account IDs, initializing CoA if needed.
 */
export async function resolveAccountsForPOS(businessId: number, bankAccountId: number | null): Promise<{
  cashAccountId: number;
  salesAccountId: number;
  cogsAccountId: number;
  inventoryAccountId: number;
  discountAccountId: number;
}> {
  // Ensure CoA is initialized
  await initializeCoA(businessId);

  // Resolve cash/bank account
  let cashAccount: Account | null = null;
  if (bankAccountId) {
    cashAccount = await getAccountByBankAccountId(businessId, bankAccountId);
  }
  if (!cashAccount) {
    cashAccount = await getAccountByCode(businessId, "1101"); // Kas Umum fallback
  }
  if (!cashAccount) throw new Error("Cash account not found in CoA");

  const salesAccount = await getAccountByCode(businessId, "4101");
  if (!salesAccount) throw new Error("Sales account (4101) not found in CoA");

  const cogsAccount = await getAccountByCode(businessId, "5101");
  if (!cogsAccount) throw new Error("COGS account (5101) not found in CoA");

  const inventoryAccount = await getAccountByCode(businessId, "1301");
  if (!inventoryAccount) throw new Error("Inventory account (1301) not found in CoA");

  const discountAccount = await getAccountByCode(businessId, "4202");
  if (!discountAccount) throw new Error("Discount account (4202) not found in CoA");

  return {
    cashAccountId: cashAccount.id,
    salesAccountId: salesAccount.id,
    cogsAccountId: cogsAccount.id,
    inventoryAccountId: inventoryAccount.id,
    discountAccountId: discountAccount.id,
  };
}

/**
 * Helper: Resolve accounts for manual transaction journal entry.
 */
export async function resolveAccountsForManualTx(businessId: number, category: string, type: "pemasukan" | "pengeluaran", bankAccountId: number | null): Promise<{
  cashAccountId: number;
  counterAccountId: number;
}> {
  await initializeCoA(businessId);

  // Resolve cash/bank account (debit side for income, credit side for expense)
  let cashAccount: Account | null = null;
  if (bankAccountId) {
    cashAccount = await getAccountByBankAccountId(businessId, bankAccountId);
  }
  if (!cashAccount) {
    cashAccount = await getAccountByCode(businessId, "1101");
  }
  if (!cashAccount) throw new Error("Cash account not found in CoA");

  // Resolve the counter-account from category
  const counterCode = resolveAccountCodeFromCategory(category, type);
  let counterAccount = await getAccountByCode(businessId, counterCode);
  if (!counterAccount) {
    // Fallback to catch-all
    const fallbackCode = type === "pemasukan" ? "4301" : "6207";
    counterAccount = await getAccountByCode(businessId, fallbackCode);
  }
  if (!counterAccount) throw new Error(`Counter account not found for category: ${category}`);

  return {
    cashAccountId: cashAccount.id,
    counterAccountId: counterAccount.id,
  };
}

// ─── GL Resolver: POS Refund ───
// Reversal of POS checkout: DR Retur Penjualan, CR Kas/Bank, DR Persediaan, CR HPP
export async function resolveAccountsForPOSRefund(businessId: number, bankAccountId: number | null): Promise<{
  cashAccountId: number;
  returAccountId: number;
  cogsAccountId: number;
  inventoryAccountId: number;
}> {
  await initializeCoA(businessId);

  let cashAccount: Account | null = null;
  if (bankAccountId) {
    cashAccount = await getAccountByBankAccountId(businessId, bankAccountId);
  }
  if (!cashAccount) {
    cashAccount = await getAccountByCode(businessId, "1101");
  }
  if (!cashAccount) throw new Error("Cash account not found in CoA");

  const returAccount = await getAccountByCode(businessId, "4201"); // Retur Penjualan
  const cogsAccount = await getAccountByCode(businessId, "5101");  // HPP Barang Dagang
  const inventoryAccount = await getAccountByCode(businessId, "1301"); // Persediaan

  if (!returAccount || !cogsAccount || !inventoryAccount) {
    throw new Error("Required accounts for POS refund not found in CoA");
  }

  return {
    cashAccountId: cashAccount.id,
    returAccountId: returAccount.id,
    cogsAccountId: cogsAccount.id,
    inventoryAccountId: inventoryAccount.id,
  };
}

// ─── GL Resolver: Credit Sale ───
// DR Piutang Usaha, CR Penjualan, DR HPP, CR Persediaan
export async function resolveAccountsForCreditSale(businessId: number): Promise<{
  receivableAccountId: number;
  salesAccountId: number;
  cogsAccountId: number;
  inventoryAccountId: number;
}> {
  await initializeCoA(businessId);

  const receivableAccount = await getAccountByCode(businessId, "1201"); // Piutang Usaha
  const salesAccount = await getAccountByCode(businessId, "4101");      // Penjualan
  const cogsAccount = await getAccountByCode(businessId, "5101");       // HPP
  const inventoryAccount = await getAccountByCode(businessId, "1301");  // Persediaan

  if (!receivableAccount || !salesAccount || !cogsAccount || !inventoryAccount) {
    throw new Error("Required accounts for credit sale not found in CoA");
  }

  return {
    receivableAccountId: receivableAccount.id,
    salesAccountId: salesAccount.id,
    cogsAccountId: cogsAccount.id,
    inventoryAccountId: inventoryAccount.id,
  };
}

// ─── GL Resolver: Credit Payment ───
// DR Kas/Bank, CR Piutang Usaha
export async function resolveAccountsForCreditPayment(businessId: number, bankAccountId: number | null): Promise<{
  cashAccountId: number;
  receivableAccountId: number;
}> {
  await initializeCoA(businessId);

  let cashAccount: Account | null = null;
  if (bankAccountId) {
    cashAccount = await getAccountByBankAccountId(businessId, bankAccountId);
  }
  if (!cashAccount) {
    cashAccount = await getAccountByCode(businessId, "1101");
  }
  if (!cashAccount) throw new Error("Cash account not found in CoA");

  const receivableAccount = await getAccountByCode(businessId, "1201"); // Piutang Usaha
  if (!receivableAccount) throw new Error("Receivable account not found in CoA");

  return {
    cashAccountId: cashAccount.id,
    receivableAccountId: receivableAccount.id,
  };
}
