import { eq, and, sql, desc, gte, lte, ne, inArray } from "drizzle-orm";
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
} from "../drizzle/schema";
import { ENV } from './_core/env';
import type { TaxCalcResult, DashboardKPIs, LabaRugiReport, ArusKasReport, NeracaReport, PerubahanModalReport, CALKReport } from "../shared/finance";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
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

  // Find the user's business first
  const biz = await getBusinessByOwnerId(userId);
  let deletedBusiness = false;

  if (biz) {
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
  const result = await db.insert(businesses).values(data);
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
  const result = await db.insert(products).values(data);
  return result[0].insertId;
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
  const result = await db.insert(transactions).values(data);
  return result[0].insertId;
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
  const result = await db.insert(stockLogs).values(data);
  return result[0].insertId;
}

export async function getStockLogsByProduct(productId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(stockLogs).where(eq(stockLogs.productId, productId)).orderBy(desc(stockLogs.createdAt)).limit(limit);
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
  const result = await db.insert(taxPayments).values(data);
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
  const txs = await db.select().from(transactions).where(
    and(eq(transactions.businessId, businessId), eq(transactions.isDeleted, false), eq(transactions.type, "pemasukan"), sql`${transactions.date} LIKE ${year + "%"}`)
  );
  for (const tx of txs) {
    const m = parseInt(tx.date.substring(5, 7), 10) - 1;
    if (m >= 0 && m < 12) monthly[m] += tx.amount;
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
  const penjualan = summary.byCategory["Penjualan Produk"] || 0;
  const jasa = summary.byCategory["Penjualan Jasa"] || 0;
  const pendapatanLain = summary.byCategory["Pendapatan Lain-lain"] || 0;
  const totalPendapatan = penjualan + jasa + pendapatanLain;
  const hpp = summary.byCategory["Pembelian Stok"] || 0;
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
  const summary = await getTransactionSummary(businessId, month, year);
  const bulanNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const period = `${bulanNames[month - 1]} ${year}`;
  // Split by payment method for kas masuk
  const db = await getDb();
  const periodStr = `${year}-${String(month).padStart(2, "0")}`;
  const txs = db ? await db.select().from(transactions).where(
    and(eq(transactions.businessId, businessId), eq(transactions.isDeleted, false), sql`${transactions.date} LIKE ${periodStr + "%"}`)
  ) : [];
  const kasMasuk: Record<string, number> & { total: number } = { total: 0 } as any;
  const kasKeluar: Record<string, number> & { total: number } = { total: 0 } as any;
  for (const tx of txs) {
    if (tx.type === "pemasukan") {
      kasMasuk[tx.paymentMethod] = (kasMasuk[tx.paymentMethod] || 0) + tx.amount;
      kasMasuk.total += tx.amount;
    } else {
      kasKeluar[tx.category] = (kasKeluar[tx.category] || 0) + tx.amount;
      kasKeluar.total += tx.amount;
    }
  }
  return { period, kasMasuk, kasKeluar, netKas: kasMasuk.total - kasKeluar.total };
}

// ─── Laporan Neraca (Posisi Keuangan) ───
export async function generateNeraca(businessId: number, month: number, year: number): Promise<NeracaReport> {
  const db = await getDb();
  const bulanNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const period = `${bulanNames[month - 1]} ${year}`;
  const periodStr = `${year}-${String(month).padStart(2, "0")}`;

  // Kas: total pemasukan - total pengeluaran s/d periode ini
  const allTxs = db ? await db.select().from(transactions).where(
    and(eq(transactions.businessId, businessId), eq(transactions.isDeleted, false), sql`${transactions.date} <= ${periodStr}-31`)
  ) : [];
  let totalPemasukan = 0, totalPengeluaran = 0;
  for (const tx of allTxs) {
    if (tx.type === "pemasukan") totalPemasukan += tx.amount;
    else totalPengeluaran += tx.amount;
  }
  const kas = totalPemasukan - totalPengeluaran;

  // Piutang: semua piutang aktif (belum lunas)
  const allDebts = db ? await db.select().from(debts).where(
    and(eq(debts.businessId, businessId), eq(debts.type, "piutang"), sql`${debts.status} != 'lunas'`)
  ) : [];
  const piutang = allDebts.reduce((s, d) => s + d.remainingAmount, 0);

  // Hutang usaha
  const allHutang = db ? await db.select().from(debts).where(
    and(eq(debts.businessId, businessId), eq(debts.type, "hutang"), sql`${debts.status} != 'lunas'`)
  ) : [];
  const hutangUsaha = allHutang.reduce((s, d) => s + d.remainingAmount, 0);

  // Persediaan: total stok * HPP
  const allProducts = db ? await db.select().from(products).where(
    and(eq(products.businessId, businessId), eq(products.isActive, true))
  ) : [];
  const persediaan = allProducts.reduce((s, p) => s + ((p.stockCurrent ?? 0) * (p.hpp ?? 0)), 0);

  const totalAsetLancar = Math.max(0, kas) + piutang + persediaan;
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
    aset: { kas: Math.max(0, kas), piutang, persediaan, totalAsetLancar, asetTetap, totalAset },
    kewajiban: { hutangUsaha, hutangLain: 0, totalKewajiban },
    ekuitas: { modalAwal, labaPeriode, prive: 0, totalEkuitas },
    balance: Math.abs(totalAset - (totalKewajiban + totalEkuitas)) < 1,
  };
}

// ─── Laporan Perubahan Modal ───
export async function generatePerubahanModal(businessId: number, month: number, year: number): Promise<PerubahanModalReport> {
  const bulanNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const period = `${bulanNames[month - 1]} ${year}`;

  // Calculate laba bersih this period
  const labaRugi = await generateLabaRugi(businessId, month, year);
  const labaBersih = labaRugi.labaBersih;

  // Calculate cumulative kas up to last month
  const db = await getDb();
  const lastMonth = month === 1 ? 12 : month - 1;
  const lastYear = month === 1 ? year - 1 : year;
  const lastPeriodStr = `${lastYear}-${String(lastMonth).padStart(2, "0")}`;

  const prevTxs = db ? await db.select().from(transactions).where(
    and(eq(transactions.businessId, businessId), eq(transactions.isDeleted, false), sql`${transactions.date} <= ${lastPeriodStr}-31`)
  ) : [];
  let prevIn = 0, prevOut = 0;
  for (const tx of prevTxs) {
    if (tx.type === "pemasukan") prevIn += tx.amount;
    else prevOut += tx.amount;
  }
  const modalAwal = prevIn - prevOut;

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
        ? piutangActive.map(d => ({ label: d.contactName, value: `${formatRupiah(d.remainingAmount)} (jatuh tempo: ${d.dueDate ?? "-"})` }))
        : [{ label: "Tidak ada piutang aktif", value: "-" }],
    },
    {
      title: "6. Hutang Usaha",
      items: hutangActive.length > 0
        ? hutangActive.map(d => ({ label: d.contactName, value: `${formatRupiah(d.remainingAmount)} (jatuh tempo: ${d.dueDate ?? "-"})` }))
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
  const taxes = await calcTaxForMonth(businessId, month, year);
  const estimasiPajak = taxes.reduce((sum, t) => sum + t.amount, 0);
  const lowStock = await getLowStockProducts(businessId);
  return {
    omzetBulanIni: current.totalPemasukan,
    totalPengeluaran: current.totalPengeluaran,
    labaBersih: current.labaBersih,
    estimasiPajak,
    omzetLastMonth: prev.totalPemasukan,
    pengeluaranLastMonth: prev.totalPengeluaran,
    labaLastMonth: prev.labaBersih,
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
  const seq = (result[0]?.count ?? 0) + 1;
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
  const result = await db.insert(productCompositions).values(data);
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
  const result = await db.insert(productCategories).values(data);
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
  if (!db) return 0;
  const result = await db.insert(bankAccounts).values(data);
  return result[0].insertId;
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

// Get transaction totals grouped by bank account (via paymentMethod matching accountName)
export async function getBalancesByAccounts(businessId: number, accountNames: string[]): Promise<Record<string, { income: number; expense: number }>> {
  const db = await getDb();
  if (!db) return {};
  const result: Record<string, { income: number; expense: number }> = {};
  for (const name of accountNames) {
    const txs = await db.select().from(transactions).where(
      and(
        eq(transactions.businessId, businessId),
        eq(transactions.paymentMethod, name),
        eq(transactions.isDeleted, false)
      )
    );
    let income = 0, expense = 0;
    for (const tx of txs) {
      if (tx.type === "pemasukan") income += tx.amount;
      else expense += tx.amount;
    }
    result[name] = { income, expense };
  }
  return result;
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
  const result = await db.insert(clients).values(data);
  return result[0].insertId;
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
  const result = await db.insert(debts).values(data);
  return result[0].insertId;
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
  const result = await db.insert(debtPayments).values(data);
  // Update the parent debt's paidAmount
  const debt = await getDebtById(data.debtId);
  if (debt) {
    const newPaid = debt.paidAmount + data.amount;
    const newStatus = newPaid >= debt.totalAmount ? "lunas" : "belum_lunas";
    await updateDebt(data.debtId, { paidAmount: newPaid, status: newStatus });
  }
  return result[0].insertId;
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
  const result = await db.insert(budgets).values(data);
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
  fromAccountName: string,
  toAccountName: string,
  amount: number,
  date: string,
  notes?: string
): Promise<{ outTxId: number; inTxId: number }> {
  const txCodeOut = await generateTxCode(businessId);
  const txCodeIn = `${txCodeOut}-IN`;
  const description = `Transfer ${fromAccountName} → ${toAccountName}`;

  // Create outgoing transaction (pengeluaran from source account)
  const outTxId = await createTransaction({
    businessId,
    txCode: txCodeOut,
    date,
    type: "pengeluaran",
    category: "Transfer Antar Akun",
    description,
    amount,
    paymentMethod: fromAccountName,
    taxRelated: false,
    notes: notes || `Transfer ke ${toAccountName}`,
  });

  // Create incoming transaction (pemasukan to destination account)
  const inTxId = await createTransaction({
    businessId,
    txCode: txCodeIn,
    date,
    type: "pemasukan",
    category: "Transfer Antar Akun",
    description,
    amount,
    paymentMethod: toAccountName,
    taxRelated: false,
    notes: notes || `Transfer dari ${fromAccountName}`,
  });

  return { outTxId, inTxId };
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
  const result = await db.insert(warehouses).values(data);
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

export async function getWarehouseStockByProduct(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: warehouseStock.id,
    warehouseId: warehouseStock.warehouseId,
    productId: warehouseStock.productId,
    quantity: warehouseStock.quantity,
    warehouseName: warehouses.name,
    warehouseIsDefault: warehouses.isDefault,
  }).from(warehouseStock)
    .innerJoin(warehouses, eq(warehouseStock.warehouseId, warehouses.id))
    .where(and(eq(warehouseStock.productId, productId), eq(warehouses.isActive, true)))
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
  const result = await db.insert(stockTransfers).values(data);
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
  
  // Get source warehouse stock
  const fromWs = await getOrCreateWarehouseStock(fromWarehouseId, productId);
  if (fromWs.quantity < qty) {
    throw new Error(`Stok di gudang asal tidak cukup. Tersedia: ${fromWs.quantity}`);
  }
  
  // Get destination warehouse stock
  const toWs = await getOrCreateWarehouseStock(toWarehouseId, productId);
  
  // Update source: decrease
  const newFromQty = fromWs.quantity - qty;
  await updateWarehouseStockQty(fromWarehouseId, productId, newFromQty);
  
  // Update destination: increase
  const newToQty = toWs.quantity + qty;
  await updateWarehouseStockQty(toWarehouseId, productId, newToQty);
  
  // Create stock logs for both warehouses
  const product = await getProductById(productId);
  const productStock = product?.stockCurrent ?? 0;
  
  await createStockLog({
    businessId,
    productId,
    date,
    movementType: "out",
    qty,
    direction: -1,
    stockBefore: productStock,
    stockAfter: productStock, // total doesn't change for transfers
    notes: `Transfer keluar ke gudang lain${notes ? ': ' + notes : ''}`,
  });
  
  await createStockLog({
    businessId,
    productId,
    date,
    movementType: "in",
    qty,
    direction: 1,
    stockBefore: productStock,
    stockAfter: productStock,
    notes: `Transfer masuk dari gudang lain${notes ? ': ' + notes : ''}`,
  });
  
  // Create transfer record
  const transferId = await createStockTransfer({
    businessId,
    fromWarehouseId,
    toWarehouseId,
    productId,
    qty,
    date,
    notes,
  });
  
  // Recalc product aggregate (should stay same for transfers)
  await recalcProductStockFromWarehouses(productId);
  
  return { transferId, fromQty: newFromQty, toQty: newToQty };
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
  const result = await db.insert(teamMembers).values(data);
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
  const result = await db.insert(teamInvites).values(data);
  return Number(result[0].insertId);
}

export async function getTeamInviteByToken(token: string): Promise<TeamInvite | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(teamInvites).where(eq(teamInvites.token, token)).limit(1);
  return rows[0];
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
export async function resolveBusinessForUser(userId: number, requestedBusinessId: number | null): Promise<{
  business: Business;
  isOwner: boolean;
  membership: TeamMember | null;
} | null> {
  // If a specific business is requested, check access
  if (requestedBusinessId) {
    const biz = await getBusinessById(requestedBusinessId);
    if (!biz) return null;
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
  const [result] = await db.insert(savingsGoals).values(data);
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
  const [result] = await db.insert(monthlyBills).values(data);
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
  const [result] = await db.insert(posShifts).values(data).$returningId();
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
  const [result] = await db.insert(discountCodes).values(data).$returningId();
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
  const [result] = await db.insert(posReceipts).values(data).$returningId();
  return result.id;
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

  // Also get individual transactions for product-level breakdown
  const txs = await db.select().from(transactions)
    .where(and(
      eq(transactions.businessId, businessId),
      eq(transactions.date, date),
      eq(transactions.isDeleted, false),
      eq(transactions.category, "Penjualan POS"),
    ))
    .orderBy(desc(transactions.createdAt));

  // Product-level aggregation
  const byProduct: Record<number, { name: string; qty: number; revenue: number; hpp: number }> = {};
  for (const tx of txs) {
    if (tx.productId) {
      if (!byProduct[tx.productId]) {
        byProduct[tx.productId] = { name: tx.description?.replace(/^POS .+? /, "") || `Produk #${tx.productId}`, qty: 0, revenue: 0, hpp: 0 };
      }
      byProduct[tx.productId].qty += tx.productQty ?? 0;
      byProduct[tx.productId].revenue += tx.amount;
      byProduct[tx.productId].hpp += (tx.productHppSnapshot ?? 0) * (tx.productQty ?? 0);
    }
  }

  // Get product names
  const productIds = Object.keys(byProduct).map(Number);
  if (productIds.length > 0) {
    const prods = await db.select({ id: products.id, name: products.name }).from(products)
      .where(sql`${products.id} IN (${sql.join(productIds.map(id => sql`${id}`), sql`, `)})`);
    for (const p of prods) {
      if (byProduct[p.id]) byProduct[p.id].name = p.name;
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
  const productData: InsertProduct[] = [
    { businessId, name: "Sabitah Glow Serum 30ml", sku: "SAB-SRM-001", category: "Skincare", hpp: 45000, sellingPrice: 129000, stockCurrent: 85, stockMinimum: 20, unit: "pcs", priceType: "fixed", discountPercent: "0", isActive: true },
    { businessId, name: "Sabitah Moisturizer SPF30", sku: "SAB-MOI-001", category: "Skincare", hpp: 38000, sellingPrice: 99000, stockCurrent: 120, stockMinimum: 25, unit: "pcs", priceType: "fixed", discountPercent: "0", isActive: true },
    { businessId, name: "Sabitah Facial Wash 100ml", sku: "SAB-FW-001", category: "Skincare", hpp: 22000, sellingPrice: 69000, stockCurrent: 200, stockMinimum: 40, unit: "pcs", priceType: "fixed", discountPercent: "0", isActive: true },
    { businessId, name: "Sabitah Lip Tint Rose", sku: "SAB-LT-001", category: "Makeup", hpp: 18000, sellingPrice: 59000, stockCurrent: 150, stockMinimum: 30, unit: "pcs", priceType: "fixed", discountPercent: "0", isActive: true },
    { businessId, name: "Sabitah Lip Tint Peach", sku: "SAB-LT-002", category: "Makeup", hpp: 18000, sellingPrice: 59000, stockCurrent: 140, stockMinimum: 30, unit: "pcs", priceType: "fixed", discountPercent: "0", isActive: true },
    { businessId, name: "Sabitah Body Lotion 200ml", sku: "SAB-BL-001", category: "Body Care", hpp: 28000, sellingPrice: 79000, stockCurrent: 95, stockMinimum: 20, unit: "pcs", priceType: "fixed", discountPercent: "0", isActive: true },
    { businessId, name: "Sabitah Hair Serum 50ml", sku: "SAB-HS-001", category: "Hair Care", hpp: 35000, sellingPrice: 89000, stockCurrent: 60, stockMinimum: 15, unit: "pcs", priceType: "fixed", discountPercent: "0", isActive: true },
    { businessId, name: "Sabitah Toner Brightening", sku: "SAB-TON-001", category: "Skincare", hpp: 30000, sellingPrice: 85000, stockCurrent: 75, stockMinimum: 18, unit: "pcs", priceType: "fixed", discountPercent: "0", isActive: true },
    { businessId, name: "Sabitah Eye Cream 15ml", sku: "SAB-EC-001", category: "Skincare", hpp: 52000, sellingPrice: 149000, stockCurrent: 45, stockMinimum: 10, unit: "pcs", priceType: "fixed", discountPercent: "0", isActive: true },
    { businessId, name: "Sabitah Sunscreen SPF50", sku: "SAB-SS-001", category: "Skincare", hpp: 40000, sellingPrice: 119000, stockCurrent: 110, stockMinimum: 25, unit: "pcs", priceType: "fixed", discountPercent: "0", isActive: true },
    { businessId, name: "Sabitah Micellar Water 200ml", sku: "SAB-MW-001", category: "Skincare", hpp: 25000, sellingPrice: 75000, stockCurrent: 88, stockMinimum: 20, unit: "pcs", priceType: "fixed", discountPercent: "0", isActive: true },
    { businessId, name: "Sabitah Sheet Mask (5pcs)", sku: "SAB-SM-001", category: "Skincare", hpp: 15000, sellingPrice: 49000, stockCurrent: 200, stockMinimum: 50, unit: "pack", priceType: "fixed", discountPercent: "0", isActive: true },
    { businessId, name: "Sabitah Blush On Coral", sku: "SAB-BO-001", category: "Makeup", hpp: 22000, sellingPrice: 69000, stockCurrent: 70, stockMinimum: 15, unit: "pcs", priceType: "fixed", discountPercent: "0", isActive: true },
    { businessId, name: "Sabitah Setting Spray 60ml", sku: "SAB-SP-001", category: "Makeup", hpp: 20000, sellingPrice: 65000, stockCurrent: 55, stockMinimum: 12, unit: "pcs", priceType: "fixed", discountPercent: "0", isActive: true },
    { businessId, name: "Sabitah Gift Set Premium", sku: "SAB-GS-001", category: "Bundle", hpp: 120000, sellingPrice: 349000, stockCurrent: 25, stockMinimum: 5, unit: "set", priceType: "fixed", discountPercent: "0", isActive: true },
  ];

  const productIds: number[] = [];
  for (const p of productData) {
    const id = await createProduct(p);
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
    income: ["Penjualan Langsung", "Penjualan Online", "Penjualan Grosir", "Penjualan POS"],
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
      await createTransaction({
        businessId, txCode, date: dateStr, type: "pemasukan",
        category: cat, description: `${cat} - ${productData[productIdx].name}`,
        amount: price * qty,
        paymentMethod: payMethods[Math.floor(Math.random() * payMethods.length)],
        productId: productIds[productIdx], productQty: qty,
        productHppSnapshot: productData[productIdx].hpp ?? 0,
        clientId: Math.random() > 0.5 ? clientIds[Math.floor(Math.random() * clientIds.length)] : undefined,
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
      await createTransaction({
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

  // Delete in order of dependencies
  await db.delete(debtPayments).where(
    sql`${debtPayments.debtId} IN (SELECT id FROM debts WHERE business_id = ${businessId})`
  );
  await db.delete(debts).where(eq(debts.businessId, businessId));
  await db.delete(posReceipts).where(eq(posReceipts.businessId, businessId));
  await db.delete(posShifts).where(eq(posShifts.businessId, businessId));
  await db.delete(discountCodes).where(eq(discountCodes.businessId, businessId));
  await db.delete(stockTransfers).where(eq(stockTransfers.businessId, businessId));
  await db.delete(warehouseStock).where(
    sql`${warehouseStock.warehouseId} IN (SELECT id FROM warehouses WHERE business_id = ${businessId})`
  );
  await db.delete(stockLogs).where(eq(stockLogs.businessId, businessId));
  await db.delete(transactions).where(eq(transactions.businessId, businessId));
  await db.delete(products).where(eq(products.businessId, businessId));
  await db.delete(clients).where(eq(clients.businessId, businessId));
  await db.delete(budgets).where(eq(budgets.businessId, businessId));
  await db.delete(monthlyBills).where(eq(monthlyBills.businessId, businessId));
  // Keep warehouses but delete non-default ones
  await db.delete(warehouses).where(and(eq(warehouses.businessId, businessId), eq(warehouses.isDefault, false)));

  return { success: true };
}
