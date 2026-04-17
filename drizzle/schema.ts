import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal,
  bigint,
  json,
} from "drizzle-orm/mysql-core";

// ─── Users ───
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  clerkUserId: varchar("clerkUserId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Businesses (Tenants) ───
export const businesses = mysqlTable("businesses", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(), // references users.id
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  businessName: varchar("businessName", { length: 255 }).notNull(),
  businessType: varchar("businessType", { length: 50 }).notNull().default("retail"), // retail/jasa/fnb/produksi
  address: text("address"),
  phone: varchar("phone", { length: 30 }),
  npwp: varchar("npwp", { length: 30 }),
  isPkp: boolean("isPkp").notNull().default(false),
  hasEmployees: boolean("hasEmployees").notNull().default(false),
  employeeCount: int("employeeCount").notNull().default(0),
  annualOmzetEstimate: bigint("annualOmzetEstimate", { mode: "number" }).notNull().default(0),
  brandColor: varchar("brandColor", { length: 10 }).notNull().default("#2d9a5a"),
  plan: mysqlEnum("plan", ["free", "pro", "pro_plus"]).default("free").notNull(),
  stripePaymentId: varchar("stripePaymentId", { length: 255 }),
  scalevOrderId: varchar("scalevOrderId", { length: 255 }),
  planActivatedAt: timestamp("planActivatedAt"),
  planExpiry: timestamp("planExpiry"),
  waNumber: varchar("waNumber", { length: 20 }),
  bankName: varchar("bankName", { length: 100 }),
  bankAccount: varchar("bankAccount", { length: 50 }),
  bankHolder: varchar("bankHolder", { length: 255 }),
  qrisImageUrl: text("qrisImageUrl"),
  logoUrl: text("logoUrl"),
  appMode: mysqlEnum("appMode", ["personal", "umkm"]).notNull().default("umkm"), // personal = jurnal pribadi, umkm = full business
  posEnabled: boolean("posEnabled").notNull().default(false), // toggle POS system on/off
  calculatorEnabled: boolean("calculatorEnabled").notNull().default(false), // mini calculator widget
  signatureUrl: text("signatureUrl"), // digital signature image for invoice footer
  invoiceFooter: text("invoiceFooter"), // custom footer text for invoices
  onboardingCompleted: boolean("onboardingCompleted").notNull().default(false),
  debtEnabled: boolean("debtEnabled").notNull().default(true), // toggle hutang piutang on/off
  personalSetupDone: boolean("personalSetupDone").notNull().default(false), // personal mode first-time setup wizard completed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = typeof businesses.$inferInsert;

// ─── Tax Rules (Configurable Engine) ───
export const taxRules = mysqlTable("tax_rules", {
  id: int("id").autoincrement().primaryKey(),
  taxCode: varchar("taxCode", { length: 30 }).notNull(), // PPH_FINAL, PPN, PPH21_TER, PPH_FINAL_0
  taxName: varchar("taxName", { length: 100 }).notNull(),
  rate: decimal("rate", { precision: 10, scale: 6 }).notNull(), // 0.005000 = 0.5%
  basis: varchar("basis", { length: 20 }).notNull(), // omzet, dpp, gaji
  validFrom: varchar("validFrom", { length: 10 }).notNull(), // yyyy-mm-dd
  validUntil: varchar("validUntil", { length: 10 }).notNull().default("9999-12-31"),
  conditionField: varchar("conditionField", { length: 50 }),
  conditionOperator: varchar("conditionOperator", { length: 10 }), // lt, gt, eq, lte, gte
  conditionValue: varchar("conditionValue", { length: 100 }),
  notes: text("notes"),
  referenceLaw: varchar("referenceLaw", { length: 255 }),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TaxRule = typeof taxRules.$inferSelect;
export type InsertTaxRule = typeof taxRules.$inferInsert;

// ─── Products ───
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 50 }),
  category: varchar("category", { length: 100 }),
  hpp: bigint("hpp", { mode: "number" }).notNull(), // harga pokok
  sellingPrice: bigint("sellingPrice", { mode: "number" }).notNull(),
  stockCurrent: int("stockCurrent").notNull().default(0),
  stockMinimum: int("stockMinimum").notNull().default(5),
  unit: varchar("unit", { length: 20 }).notNull().default("pcs"),
  imageUrl: text("imageUrl"),
  barcode: varchar("barcode", { length: 100 }),
  imei: varchar("imei", { length: 50 }),
  motorCode: varchar("motorCode", { length: 50 }),
  productCode: varchar("productCode", { length: 50 }),
  priceType: mysqlEnum("priceType", ["fixed", "dynamic"]).notNull().default("fixed"),
  discountPercent: decimal("discountPercent", { precision: 5, scale: 2 }).notNull().default("0"), // 0-100
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ─── Transactions ───
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  txCode: varchar("txCode", { length: 30 }).notNull(), // TX-20260309-001
  date: varchar("date", { length: 10 }).notNull(), // yyyy-mm-dd
  type: mysqlEnum("type", ["pemasukan", "pengeluaran"]).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description"),
  amount: bigint("amount", { mode: "number" }).notNull(), // always positive
  paymentMethod: varchar("paymentMethod", { length: 30 }).notNull().default("tunai"),
  clientId: int("clientId"), // optional link to clients table
  productId: int("productId"), // optional link
  productQty: int("productQty"),
  productHppSnapshot: bigint("productHppSnapshot", { mode: "number" }),
  taxRelated: boolean("taxRelated").notNull().default(true),
  isDeleted: boolean("isDeleted").notNull().default(false),
  notes: text("notes"),
  shiftId: int("shiftId"), // link to pos_shifts (for POS transactions)
  receiptId: int("receiptId"), // link to pos_receipts (for grouped POS checkout)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

// ─── Stock Log ───
export const stockLogs = mysqlTable("stock_logs", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  productId: int("productId").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  movementType: mysqlEnum("movementType", ["in", "out", "adjustment", "opening"]).notNull(),
  qty: int("qty").notNull(),
  direction: int("direction").notNull(), // +1 or -1
  referenceTxId: int("referenceTxId"),
  notes: text("notes"),
  stockBefore: int("stockBefore").notNull(),
  stockAfter: int("stockAfter").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StockLog = typeof stockLogs.$inferSelect;
export type InsertStockLog = typeof stockLogs.$inferInsert;

// ─── Tax Payments ───
export const taxPayments = mysqlTable("tax_payments", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  periodMonth: varchar("periodMonth", { length: 7 }).notNull(), // yyyy-mm
  taxCode: varchar("taxCode", { length: 30 }).notNull(),
  omzetAmount: bigint("omzetAmount", { mode: "number" }).notNull().default(0),
  taxAmount: bigint("taxAmount", { mode: "number" }).notNull(),
  paymentDate: varchar("paymentDate", { length: 10 }),
  ntpn: varchar("ntpn", { length: 50 }),
  status: mysqlEnum("status", ["LUNAS", "BELUM", "TERLAMBAT"]).default("BELUM").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaxPayment = typeof taxPayments.$inferSelect;
export type InsertTaxPayment = typeof taxPayments.$inferInsert;

// ─── Monthly Cache ───
export const monthlyCache = mysqlTable("monthly_cache", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  period: varchar("period", { length: 7 }).notNull(), // yyyy-mm
  totalPemasukan: bigint("totalPemasukan", { mode: "number" }).notNull().default(0),
  totalPengeluaran: bigint("totalPengeluaran", { mode: "number" }).notNull().default(0),
  labaBersih: bigint("labaBersih", { mode: "number" }).notNull().default(0),
  hppTotal: bigint("hppTotal", { mode: "number" }).notNull().default(0),
  grossMarginPct: decimal("grossMarginPct", { precision: 5, scale: 2 }).default("0"),
  txCount: int("txCount").notNull().default(0),
  taxEstimate: bigint("taxEstimate", { mode: "number" }).notNull().default(0),
  lastCalculated: timestamp("lastCalculated").defaultNow().notNull(),
});

export type MonthlyCache = typeof monthlyCache.$inferSelect;
export type InsertMonthlyCache = typeof monthlyCache.$inferInsert;

// ─── Product Categories ───
export const productCategories = mysqlTable("product_categories", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  parentId: int("parentId"), // null = top-level category, non-null = subcategory
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = typeof productCategories.$inferInsert;

// ─── Product Compositions (COGS / HPP Calculator) ───
export const productCompositions = mysqlTable("product_compositions", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(), // the finished product
  materialName: varchar("materialName", { length: 255 }).notNull(), // e.g. "Beras", "Telur"
  materialProductId: int("materialProductId"), // optional link to products table if material is also a product
  qty: decimal("qty", { precision: 10, scale: 3 }).notNull(), // e.g. 0.200 (200g)
  unit: varchar("unit", { length: 20 }).notNull().default("pcs"),
  costPerUnit: bigint("costPerUnit", { mode: "number" }).notNull(), // cost per unit in Rupiah
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductComposition = typeof productCompositions.$inferSelect;
export type InsertProductComposition = typeof productCompositions.$inferInsert;

// ─── Pro Links (One-Time-Use Activation Links) ───
export const proLinks = mysqlTable("pro_links", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 64 }).notNull().unique(), // unique random token
  email: varchar("email", { length: 320 }).notNull(), // buyer email (from admin input)
  buyerName: varchar("buyerName", { length: 255 }), // buyer name (optional)
  notes: text("notes"), // admin notes
  isUsed: boolean("isUsed").notNull().default(false), // true after user activates
  usedByUserId: int("usedByUserId"), // user who used the link
  usedAt: timestamp("usedAt"), // when it was used
  expiresAt: timestamp("expiresAt"), // optional expiry
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProLink = typeof proLinks.$inferSelect;
export type InsertProLink = typeof proLinks.$inferInsert;

// ─── Bank Accounts (Multi-Account for Jurnal Pribadi) ───
export const bankAccounts = mysqlTable("bank_accounts", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  accountName: varchar("accountName", { length: 100 }).notNull(), // e.g. "BCA", "GoPay", "Cash"
  accountType: mysqlEnum("accountType", ["bank", "ewallet", "cash"]).notNull().default("bank"), // bank, e-wallet, cash
  icon: varchar("icon", { length: 10 }).notNull().default("🏦"), // emoji icon
  color: varchar("color", { length: 10 }).notNull().default("#3b82f6"), // hex color for UI
  initialBalance: bigint("initialBalance", { mode: "number" }).notNull().default(0),
  isActive: boolean("isActive").notNull().default(true),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertBankAccount = typeof bankAccounts.$inferInsert;

// ─── Clients (Manajemen Client) ───
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 30 }),
  company: varchar("company", { length: 255 }),
  address: text("address"),
  type: mysqlEnum("customerType", ["regular", "vip", "wholesale"]).default("regular"),
  depositAmount: bigint("depositAmount", { mode: "number" }).notNull().default(0),
  lastTransactionDate: varchar("lastTransactionDate", { length: 10 }),
  activeDate: varchar("activeDate", { length: 10 }),
  expiryDate: varchar("expiryDate", { length: 10 }),
  notes: text("notes"),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

// ─── Debts / Receivables (Hutang & Piutang) ───
export const debts = mysqlTable("debts", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  type: mysqlEnum("type", ["hutang", "piutang"]).notNull(), // hutang = kita berhutang, piutang = orang berhutang ke kita
  counterpartyName: varchar("counterpartyName", { length: 255 }).notNull(), // nama orang/perusahaan
  clientId: int("clientId"), // optional link to clients table
  description: text("description"),
  totalAmount: bigint("totalAmount", { mode: "number" }).notNull(), // total hutang/piutang
  paidAmount: bigint("paidAmount", { mode: "number" }).notNull().default(0), // sudah dibayar
  dueDate: varchar("dueDate", { length: 10 }), // yyyy-mm-dd
  status: mysqlEnum("status", ["belum_lunas", "lunas", "terlambat"]).notNull().default("belum_lunas"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Debt = typeof debts.$inferSelect;
export type InsertDebt = typeof debts.$inferInsert;

// ─── Debt Payments (Pembayaran Hutang/Piutang) ───
export const debtPayments = mysqlTable("debt_payments", {
  id: int("id").autoincrement().primaryKey(),
  debtId: int("debtId").notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  paymentDate: varchar("paymentDate", { length: 10 }).notNull(), // yyyy-mm-dd
  paymentMethod: varchar("paymentMethod", { length: 30 }).notNull().default("tunai"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DebtPayment = typeof debtPayments.$inferSelect;
export type InsertDebtPayment = typeof debtPayments.$inferInsert;

// ─── Budgets (Anggaran Bulanan) ───
export const budgets = mysqlTable("budgets", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  period: varchar("period", { length: 7 }).notNull(), // yyyy-mm
  category: varchar("category", { length: 100 }).notNull(), // e.g. "Operasional", "Gaji", "Marketing"
  budgetAmount: bigint("budgetAmount", { mode: "number" }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = typeof budgets.$inferInsert;

// ─── Affiliates (Referral Links) ───
export const affiliates = mysqlTable("affiliates", {
  id: int("id").autoincrement().primaryKey(),
  refCode: varchar("refCode", { length: 50 }).notNull().unique(), // e.g. "jessica123"
  name: varchar("name", { length: 255 }).notNull(), // affiliate name
  scalevUrl: text("scalevUrl").notNull(), // their Scalev checkout URL
  whatsapp: varchar("whatsapp", { length: 30 }), // optional WA number
  isActive: boolean("isActive").notNull().default(true),
  clickCount: int("clickCount").notNull().default(0), // track clicks
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Affiliate = typeof affiliates.$inferSelect;
export type InsertAffiliate = typeof affiliates.$inferInsert;

// ─── Warehouses (Gudang) ───
export const warehouses = mysqlTable("warehouses", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // e.g. "Gudang Utama", "Gudang Toko A"
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  waCode: varchar("waCode", { length: 20 }),
  code: varchar("code", { length: 20 }),
  notes: text("notes"),
  isDefault: boolean("isDefault").notNull().default(false), // one default per business
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Warehouse = typeof warehouses.$inferSelect;
export type InsertWarehouse = typeof warehouses.$inferInsert;

// ─── Warehouse Stock (Stok per Gudang per Produk) ───
export const warehouseStock = mysqlTable("warehouse_stock", {
  id: int("id").autoincrement().primaryKey(),
  warehouseId: int("warehouseId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WarehouseStock = typeof warehouseStock.$inferSelect;
export type InsertWarehouseStock = typeof warehouseStock.$inferInsert;

// ─── Stock Transfers (Transfer Antar Gudang) ───
export const stockTransfers = mysqlTable("stock_transfers", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  fromWarehouseId: int("fromWarehouseId").notNull(),
  toWarehouseId: int("toWarehouseId").notNull(),
  productId: int("productId").notNull(),
  qty: int("qty").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // yyyy-mm-dd
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StockTransfer = typeof stockTransfers.$inferSelect;
export type InsertStockTransfer = typeof stockTransfers.$inferInsert;

// ─── Team Members (Multi-Account / Role System) ───
export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  userId: int("userId").notNull(), // references users.id
  role: mysqlEnum("role", ["owner", "manager", "kasir", "gudang", "viewer"]).notNull().default("viewer"),
  // Granular permissions as JSON: { dashboard, transaksi, stok, gudang, pos, client, hutang, anggaran, analitik, laporan, pajak, pengaturan }
  permissions: json("permissions").$type<Record<string, boolean>>().notNull(),
  invitedBy: int("invitedBy"), // userId who invited
  status: mysqlEnum("status", ["active", "suspended"]).notNull().default("active"),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

// ─── Team Invites ───
export const teamInvites = mysqlTable("team_invites", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  role: mysqlEnum("role", ["manager", "kasir", "gudang", "viewer"]).notNull().default("viewer"),
  permissions: json("permissions").$type<Record<string, boolean>>().notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  invitedBy: int("invitedBy").notNull(), // userId of owner
  status: mysqlEnum("status", ["pending", "accepted", "expired"]).notNull().default("pending"),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TeamInvite = typeof teamInvites.$inferSelect;
export type InsertTeamInvite = typeof teamInvites.$inferInsert;

// ─── Savings Goals (Tabungan Impian) ───
export const savingsGoals = mysqlTable("savings_goals", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // e.g. "Traveling ke Jepang", "iPhone baru"
  targetAmount: bigint("targetAmount", { mode: "number" }).notNull(), // target total
  currentAmount: bigint("currentAmount", { mode: "number" }).notNull().default(0), // sudah terkumpul
  icon: varchar("icon", { length: 10 }).notNull().default("✈️"),
  color: varchar("color", { length: 10 }).notNull().default("#3b82f6"),
  targetDate: varchar("targetDate", { length: 10 }), // yyyy-mm-dd optional deadline
  isCompleted: boolean("isCompleted").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type InsertSavingsGoal = typeof savingsGoals.$inferInsert;

// ─── Monthly Bills (Tagihan Bulanan / Pengeluaran Rutin) ───
export const monthlyBills = mysqlTable("monthly_bills", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // e.g. "Kredit Motor", "Listrik", "Internet"
  amount: bigint("amount", { mode: "number" }).notNull(),
  dueDay: int("dueDay").notNull().default(1), // tanggal jatuh tempo tiap bulan (1-31)
  category: varchar("category", { length: 100 }).notNull().default("Tagihan"), // Kredit, Utilitas, Langganan, dll
  icon: varchar("icon", { length: 10 }).notNull().default("📋"),
  isActive: boolean("isActive").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MonthlyBill = typeof monthlyBills.$inferSelect;
export type InsertMonthlyBill = typeof monthlyBills.$inferInsert;

// ─── POS Shifts (Shift Kasir) ───
export const posShifts = mysqlTable("pos_shifts", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  userId: int("userId").notNull(), // kasir operating the shift
  warehouseId: int("warehouseId"), // optional — which outlet/gudang
  status: mysqlEnum("status", ["open", "closed"]).notNull().default("open"),
  openedAt: timestamp("openedAt").defaultNow().notNull(),
  closedAt: timestamp("closedAt"),
  openingCash: bigint("openingCash", { mode: "number" }).notNull().default(0),
  closingCash: bigint("closingCash", { mode: "number" }),
  expectedCash: bigint("expectedCash", { mode: "number" }), // calculated when closing
  cashDifference: bigint("cashDifference", { mode: "number" }), // closingCash - expectedCash
  totalSales: bigint("totalSales", { mode: "number" }).notNull().default(0),
  totalTransactions: int("totalTransactions").notNull().default(0),
  totalRefunds: bigint("totalRefunds", { mode: "number" }).notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PosShift = typeof posShifts.$inferSelect;
export type InsertPosShift = typeof posShifts.$inferInsert;

// ─── Discount Codes (Diskon / Voucher) ───
export const discountCodes = mysqlTable("discount_codes", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  code: varchar("code", { length: 50 }).notNull(), // e.g. "PROMO10"
  name: varchar("name", { length: 255 }).notNull(), // display name
  discountType: mysqlEnum("discountType", ["percentage", "fixed"]).notNull(),
  discountValue: bigint("discountValue", { mode: "number" }).notNull(), // percentage: 0-100, fixed: amount in rupiah
  minPurchase: bigint("minPurchase", { mode: "number" }).notNull().default(0),
  maxDiscount: bigint("maxDiscount", { mode: "number" }), // cap for percentage discounts
  maxUses: int("maxUses"), // null = unlimited
  currentUses: int("currentUses").notNull().default(0),
  validFrom: varchar("validFrom", { length: 10 }), // yyyy-mm-dd
  validUntil: varchar("validUntil", { length: 10 }), // yyyy-mm-dd
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DiscountCode = typeof discountCodes.$inferSelect;
export type InsertDiscountCode = typeof discountCodes.$inferInsert;

// ─── POS Sale Receipts (Groups items in a single POS checkout) ───
export const posReceipts = mysqlTable("pos_receipts", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  receiptCode: varchar("receiptCode", { length: 30 }).notNull(), // RCP-YYYYMMDD-###
  shiftId: int("shiftId"), // link to pos_shifts
  subtotal: bigint("subtotal", { mode: "number" }).notNull(),
  discountAmount: bigint("discountAmount", { mode: "number" }).notNull().default(0),
  discountCodeId: int("discountCodeId"), // link to discount_codes (if applied)
  grandTotal: bigint("grandTotal", { mode: "number" }).notNull(),
  // Split payment: JSON array of { method, amount }
  payments: json("payments").$type<Array<{ method: string; amount: number }>>().notNull(),
  customerPaid: bigint("customerPaid", { mode: "number" }).notNull().default(0),
  changeAmount: bigint("changeAmount", { mode: "number" }).notNull().default(0),
  // Refund info
  isRefunded: boolean("isRefunded").notNull().default(false),
  refundedAt: timestamp("refundedAt"),
  refundReason: text("refundReason"),
  refundAmount: bigint("refundAmount", { mode: "number" }),
  clientId: int("clientId"),
  notes: text("notes"),
  date: varchar("date", { length: 10 }).notNull(), // yyyy-mm-dd
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PosReceipt = typeof posReceipts.$inferSelect;
export type InsertPosReceipt = typeof posReceipts.$inferInsert;

// ─── POS Receipt Items (Item-level detail for each receipt) ───
export const posReceiptItems = mysqlTable("pos_receipt_items", {
  id: int("id").autoincrement().primaryKey(),
  receiptId: int("receiptId").notNull(), // FK → pos_receipts.id
  productId: int("productId").notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  qty: int("qty").notNull(),
  unitPrice: bigint("unitPrice", { mode: "number" }).notNull(), // selling price per unit
  totalPrice: bigint("totalPrice", { mode: "number" }).notNull(), // qty × unitPrice
  hppSnapshot: bigint("hppSnapshot", { mode: "number" }).notNull().default(0), // HPP per unit at time of sale
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PosReceiptItem = typeof posReceiptItems.$inferSelect;
export type InsertPosReceiptItem = typeof posReceiptItems.$inferInsert;

// ─── Suppliers (Vendor Tracking) ───
export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  contactPerson: varchar("contactPerson", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 30 }),
  address: text("address"),
  notes: text("notes"),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

// ─── Purchase Orders ───
export const purchaseOrders = mysqlTable("purchase_orders", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  poNumber: varchar("poNumber", { length: 30 }).notNull(),
  supplierId: int("supplierId").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  description: text("description"),
  totalAmount: bigint("totalAmount", { mode: "number" }).notNull().default(0),
  paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "partial", "paid"]).notNull().default("unpaid"),
  receiptStatus: mysqlEnum("receiptStatus", ["pending", "partial", "received"]).notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = typeof purchaseOrders.$inferInsert;

// ─── Purchase Order Items ───
export const purchaseOrderItems = mysqlTable("purchase_order_items", {
  id: int("id").autoincrement().primaryKey(),
  purchaseOrderId: int("purchaseOrderId").notNull(),
  productId: int("productId"),
  productName: varchar("productName", { length: 255 }).notNull(),
  qty: int("qty").notNull(),
  unitPrice: bigint("unitPrice", { mode: "number" }).notNull(),
  totalPrice: bigint("totalPrice", { mode: "number" }).notNull(),
  receivedQty: int("receivedQty").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type InsertPurchaseOrderItem = typeof purchaseOrderItems.$inferInsert;

// ─── Loyalty Points ───
export const loyaltyPoints = mysqlTable("loyalty_points", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  clientId: int("clientId").notNull(),
  points: int("points").notNull().default(0),
  totalEarned: int("totalEarned").notNull().default(0),
  totalRedeemed: int("totalRedeemed").notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LoyaltyPoint = typeof loyaltyPoints.$inferSelect;
export type InsertLoyaltyPoint = typeof loyaltyPoints.$inferInsert;

// ─── Loyalty Transactions ───
export const loyaltyTransactions = mysqlTable("loyalty_transactions", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  clientId: int("clientId").notNull(),
  type: mysqlEnum("type", ["earn", "redeem"]).notNull(),
  points: int("points").notNull(),
  referenceId: int("referenceId"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LoyaltyTransaction = typeof loyaltyTransactions.$inferSelect;
export type InsertLoyaltyTransaction = typeof loyaltyTransactions.$inferInsert;

// ─── Invoice Settings ───
export const invoiceSettings = mysqlTable("invoice_settings", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull().unique(),
  showCustomerName: boolean("showCustomerName").notNull().default(true),
  showCustomerAddress: boolean("showCustomerAddress").notNull().default(true),
  showCustomerPhone: boolean("showCustomerPhone").notNull().default(true),
  showInvoiceNumber: boolean("showInvoiceNumber").notNull().default(true),
  showPurchaseDate: boolean("showPurchaseDate").notNull().default(true),
  showDueDate: boolean("showDueDate").notNull().default(false),
  showPaymentMethod: boolean("showPaymentMethod").notNull().default(true),
  showTotal: boolean("showTotal").notNull().default(true),
  showSignature: boolean("showSignature").notNull().default(false),
  showLogo: boolean("showLogo").notNull().default(true),
  footerText: text("footerText"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InvoiceSetting = typeof invoiceSettings.$inferSelect;
export type InsertInvoiceSetting = typeof invoiceSettings.$inferInsert;

// ─── Warehouse Access ───
export const warehouseAccess = mysqlTable("warehouse_access", {
  id: int("id").autoincrement().primaryKey(),
  warehouseId: int("warehouseId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WarehouseAccess = typeof warehouseAccess.$inferSelect;
export type InsertWarehouseAccess = typeof warehouseAccess.$inferInsert;
