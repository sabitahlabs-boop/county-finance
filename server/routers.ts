import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, sql } from "drizzle-orm";
import { transactions, posReceipts, posReceiptItems, discountCodes, debtPayments, debts, creditPayments, creditSales, purchaseOrderItems, journalEntries, products } from "../drizzle/schema";
import {
  getBusinessByOwnerId, getBusinessesByOwnerId, getBusinessByOwnerAndMode, getBusinessById, getBusinessBySlug, createBusiness, updateBusiness, getAllBusinesses,
  getActiveTaxRules, seedDefaultTaxRules, updateTaxRule,
  getProductsByBusiness, getProductById, createProduct, safeInsertProduct, updateProduct, countProductsByBusiness, getLowStockProducts,
  createTransaction, safeInsertTransaction, updateTransaction, getTransactionsByBusiness, countTransactionsForMonth, softDeleteTransaction, voidTransaction, getVoidedTransactions, getTransactionById, generateTxCode,
  createStockLog, getStockLogsByBusiness,
  createTaxPayment, getTaxPaymentsByBusiness,
  getTransactionSummary, getYearlyOmzet, calcTaxForMonth,
  generateLabaRugi, generateArusKas, getDashboardKPIs,
  getAllUsers, deleteUserWithAllData,
  getCompositionsByProduct, createComposition, updateComposition, deleteComposition, getCompositionById, calculateCOGS,
  searchProductsByName,
  getProductCategories, createProductCategory, updateProductCategory, deleteProductCategory,
  upgradeBusinessToProByEmail, getBusinessPlan,
  createProLink, getProLinkByToken, markProLinkUsed, listProLinks, deleteProLink, upgradeBusinessToPro,
  updateBusinessMode, updateBusinessPosEnabled,
  getBankAccountsByBusiness, getBankAccountById, createBankAccount, safeInsertBankAccount, updateBankAccount, deleteBankAccount, getBalancesByAccounts,
  getRekeningKoranReport, getMutasiPersediaanReport,
  getClientsByBusiness, getClientById, createClient, updateClient, deleteClient,
  getDebtsByBusiness, getDebtById, createDebt, updateDebt, deleteDebt,
  getDebtPayments, createDebtPayment, deleteDebtPayment,
  getBudgetsByBusiness, getBudgetById, createBudget, updateBudget, deleteBudget, getSpendingByCategory,
  createTransferBetweenAccounts,
  updateBusinessCalculator, updateBusinessSignature,
  getSalesAnalytics,
  getAffiliates, getAffiliateByRefCode, createAffiliate, updateAffiliate, deleteAffiliate, incrementAffiliateClick,
  getUpcomingDueDates,
  getTransactionsByClient,
  getWarehousesByBusiness, getWarehouseById, getDefaultWarehouse, createWarehouse, updateWarehouse, deleteWarehouse, ensureDefaultWarehouse,
  getWarehouseStockByWarehouse, getWarehouseStockByProduct, adjustWarehouseStock,
  getOrCreateWarehouseStock, updateWarehouseStockQty, recalcProductStockFromWarehouses,
  performStockTransfer, getStockTransfersByBusiness, migrateStockToDefaultWarehouse,
  getTeamMembersByBusiness, getTeamMemberByUserAndBusiness, getTeamMembershipsByUser,
  createTeamMember, updateTeamMember, deleteTeamMember, getTeamMemberById,
  createTeamInvite, getTeamInviteByToken, getTeamInvitesByBusiness, getPendingInvitesByEmail, updateTeamInviteStatus, deleteTeamInvite,
  getBusinessForTeamMember, getUserById, getUsersByIds,
  ROLE_PERMISSIONS, PERMISSION_LABELS,
  resolveBusinessForUser,
  getSavingsGoalsByBusiness, createSavingsGoal, updateSavingsGoal, deleteSavingsGoal, addToSavingsGoal,
  getMonthlyBillsByBusiness, createMonthlyBill, updateMonthlyBill, deleteMonthlyBill,
  updateBusinessDebtEnabled, updateBusinessPersonalSetupDone,
  createPosShift, getOpenShift, closePosShift, getShiftsByBusiness, getPosShiftById,
  createDiscountCode, getDiscountCodesByBusiness, validateDiscountCode, incrementDiscountUsage, updateDiscountCode, deleteDiscountCode,
  generateReceiptCode, createPosReceipt, createPosReceiptItems, getPosReceiptsByBusiness, getPosReceiptById, refundPosReceipt, getPosReceiptItemsByReceipt,
  getDailySalesReport, getPeriodSalesReport,
  getSalesByProduct, getPaymentMethodSummary, getTopProductsAndCategories,
  seedDummyData, clearBusinessData,
  generateNeraca, generatePerubahanModal, generateCALK, validateFinancialConsistency,
  getSuppliersByBusiness, getSupplierById, createSupplier, updateSupplier, deleteSupplier,
  generatePONumber, getPurchaseOrdersByBusiness, getPurchaseOrderById, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder,
  getPurchaseOrderItems, createPurchaseOrderItem, deletePurchaseOrderItems,
  getLoyaltyPoints, getLoyaltyPointsByBusiness, addLoyaltyPoints, redeemLoyaltyPoints, getLoyaltyTransactionsByClient,
  getLoyaltyConfig, upsertLoyaltyConfig, updateLoyaltyTier, autoAwardLoyaltyPoints,
  getInvoiceSettings, upsertInvoiceSettings,
  getWarehouseAccessByUser, getWarehouseAccessByWarehouse, setWarehouseAccess, getAccessibleWarehouses,
  getSalesByCustomer, getSalesByHour, getSalesByDate,
  getSalesByStaff, getStaffSalesDetail, getSalesByDevice,
  getOutletsByBusiness, createOutlet, updateOutlet, deleteOutlet, ensureDefaultOutlet, getOutletSalesReport,
  clockIn, clockOut, getAttendanceByDate, getAttendanceReport, getMyAttendance,
  getOrCreateDeposit, topUpDeposit, useDeposit, refundDeposit, getDepositHistory, getAllDeposits, getDepositReport,
  createCreditSale, addCreditPayment, getCreditSalesReport, getCreditPaymentsForSale,
  getDiscountSummary, getVoidRefundAnalysis, getKasReconciliation, getShiftReport,
  getCommissionConfig, createStaffCommission, upsertCommissionConfig,
  createProductionLog, getProductionLogs, getProductionCostReport, runProduction, generateLabaRugiDetail,
  consumeStockFIFO, restoreStockFIFO,
  getDb, createAuditLog,
  // GL Double-Entry
  createJournalEntry, resolveAccountsForPOS, resolveAccountsForManualTx, initializeCoA,
  resolveAccountsForPOSRefund, resolveAccountsForCreditSale, resolveAccountsForCreditPayment,
  resolveAccountsForDebt, resolveAccountsForDeposit,
  resolveAccountsForProduction, resolveAccountsForPurchaseOrder, resolveAccountsForBankTransfer, resolveAccountsForTaxPayment,
  resolveAccountsForCommission, resolveAccountsForBillPayment,
  getTrialBalanceGL, getLabaRugiGL, getNeracaGL, getBukuBesarGL,
  reverseJournalEntriesBySource, createManualJournalAdjustment, getAccountsByBusiness,
  getJournalEntriesByBusiness, getJournalLinesByEntry,
  // Personal Finance (pf_)
  getPfProfile, upsertPfProfile,
  getPfIncomeSources, upsertPfIncomeSource, deletePfIncomeSource,
  getPfExpenseCategories, upsertPfExpenseCategory, deletePfExpenseCategory,
  getPfAssets, upsertPfAsset, deletePfAsset,
  getPfLiabilities, upsertPfLiability, deletePfLiability,
  getPfInsurances, upsertPfInsurance, deletePfInsurance,
  getPfHeritage, upsertPfHeritage,
  getPfGoals, upsertPfGoal, deletePfGoal,
  getPfDashboardSummary,
} from "./db";
import { PLAN_LIMITS, BULAN_INDONESIA, formatRupiah } from "../shared/finance";
import { notifyOwner } from "./_core/notification";

// ─── Helper: Resolve bankAccountId from payment method name ───
// Case-insensitive + trimmed matching to prevent fragile exact-string issues
function resolveBankAccountId(
  accounts: Array<{ id: number; accountName: string }>,
  paymentMethod: string
): number | undefined {
  const normalized = paymentMethod.trim().toLowerCase();
  const match = accounts.find(a => a.accountName.trim().toLowerCase() === normalized);
  return match?.id;
}

// ─── Helper: Check role permissions for sensitive operations ───
async function checkRolePermission(
  userId: number,
  businessId: number,
  requiredRoles: string[]
): Promise<void> {
  // Owner always has full access
  if (userId && businessId) {
    const business = await getBusinessById(businessId);
    if (business?.ownerId === userId) return;
  }

  // Check team member role
  const teamMember = await getTeamMemberByUserAndBusiness(userId, businessId);
  if (!teamMember || !requiredRoles.includes(teamMember.role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Anda tidak memiliki izin untuk melakukan aksi ini. Dibutuhkan role: ${requiredRoles.join(", ")}`,
    });
  }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Business / Tenant ───
  business: router({
    mine: protectedProcedure.query(async ({ ctx }) => {
      await seedDefaultTaxRules();
      // Auto-accept pending invites for this user's email
      if (ctx.user.email) {
        try {
          const pendingInvites = await getPendingInvitesByEmail(ctx.user.email);
          for (const invite of pendingInvites) {
            if (new Date() > invite.expiresAt) {
              await updateTeamInviteStatus(invite.id, "expired");
              continue;
            }
            const existing = await getTeamMemberByUserAndBusiness(ctx.user.id, invite.businessId);
            if (!existing) {
              await createTeamMember({
                businessId: invite.businessId,
                userId: ctx.user.id,
                role: invite.role as any,
                permissions: invite.permissions as Record<string, boolean>,
                invitedBy: invite.invitedBy,
                status: "active",
              });
            }
            await updateTeamInviteStatus(invite.id, "accepted");
          }
        } catch (e) {
          console.warn("[Team] Auto-accept invite failed:", e);
        }
      }
      // Use resolveBusinessForUser to support multi-business switching
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      return resolved?.business ?? null;
    }),
    getPlan: protectedProcedure.query(async ({ ctx }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) return { plan: "free", isPro: false, isProPlus: false, planActivatedAt: null, planExpiry: null };
      const planInfo = await getBusinessPlan(resolved.business.id);
      const plan = planInfo?.plan ?? "free";
      return {
        plan,
        isPro: plan === "pro" || plan === "pro_plus",
        isProPlus: plan === "pro_plus",
        planActivatedAt: planInfo?.planActivatedAt ?? null,
        planExpiry: planInfo?.planExpiry ?? null,
      };
    }),
    getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(({ input }) => getBusinessBySlug(input.slug)),
    create: protectedProcedure.input(z.object({
      slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/),
      businessName: z.string().min(1).max(255),
      businessType: z.string().default("retail"),
      address: z.string().optional(),
      phone: z.string().optional(),
      npwp: z.string().optional(),
      isPkp: z.boolean().default(false),
      hasEmployees: z.boolean().default(false),
      employeeCount: z.number().default(0),
      annualOmzetEstimate: z.number().default(0),
      brandColor: z.string().default("#2d9a5a"),
      waNumber: z.string().optional(),
      bankName: z.string().optional(),
      bankAccount: z.string().optional(),
      bankHolder: z.string().optional(),
      appMode: z.enum(["personal", "umkm"]).default("umkm"),
    })).mutation(async ({ ctx, input }) => {
      // Check if user already has a business with this mode — idempotent per mode
      const existingForMode = await getBusinessByOwnerAndMode(ctx.user.id, input.appMode);
      if (existingForMode) return { id: existingForMode.id };
      // Ensure slug is unique — append a short random suffix if taken
      let slug = input.slug || input.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").substring(0, 80);
      let slugExists = await getBusinessBySlug(slug);
      if (slugExists) {
        const suffix = Math.random().toString(36).substring(2, 7);
        slug = `${slug.substring(0, 90)}-${suffix}`;
      }
      const id = await createBusiness({ ...input, slug, ownerId: ctx.user.id, onboardingCompleted: true });
      // Notify admin of new user registration
      await notifyOwner({
        title: "🎉 User Baru Daftar di County!",
        content: `Nama: ${ctx.user.name ?? "-"}\nEmail: ${ctx.user.email ?? "-"}\nBisnis: ${input.businessName}\nMode: ${input.appMode === "personal" ? "Jurnal Pribadi" : "UMKM"}\nWaktu: ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}`
      }).catch(() => {}); // non-blocking
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      businessName: z.string().optional(),
      businessType: z.string().optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      npwp: z.string().optional(),
      isPkp: z.boolean().optional(),
      hasEmployees: z.boolean().optional(),
      employeeCount: z.number().optional(),
      annualOmzetEstimate: z.number().optional(),
      brandColor: z.string().optional(),
      waNumber: z.string().optional(),
      bankName: z.string().optional(),
      bankAccount: z.string().optional(),
      bankHolder: z.string().optional(),
      qrisImageUrl: z.string().optional(),
      logoUrl: z.string().optional(),
      signatureUrl: z.string().nullable().optional(),
      invoiceFooter: z.string().nullable().optional(),
      calculatorEnabled: z.boolean().optional(),
      businessScale: z.string().optional(),
      enabledFeatures: z.array(z.string()).optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND", message: "Bisnis tidak ditemukan" });
      await updateBusiness(biz.id, input);
      return { success: true };
    }),
    /** List all businesses owned by the current user (for mode switching) */
    listOwn: protectedProcedure.query(async ({ ctx }) => {
      return getBusinessesByOwnerId(ctx.user.id);
    }),
    setMode: protectedProcedure.input(z.object({
      appMode: z.enum(["personal", "umkm"]),
    })).mutation(async ({ ctx, input }) => {
      // Find existing business for the target mode
      let targetBiz = await getBusinessByOwnerAndMode(ctx.user.id, input.appMode);
      if (!targetBiz) {
        // Create a new business for the target mode, copying basic info from current business
        const currentBiz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
        const baseName = input.appMode === "personal"
          ? `Jurnal Pribadi${currentBiz ? ` - ${ctx.user.name ?? "User"}` : ""}`
          : `UMKM${currentBiz ? ` - ${currentBiz.businessName}` : ""}`;
        const baseSlug = `${(currentBiz?.slug ?? "biz")}-${input.appMode}`;
        let slug = baseSlug;
        const slugExists = await getBusinessBySlug(slug);
        if (slugExists) {
          slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;
        }
        const newId = await createBusiness({
          slug,
          businessName: baseName,
          businessType: input.appMode === "personal" ? "lainnya" : (currentBiz?.businessType ?? "retail"),
          ownerId: ctx.user.id,
          appMode: input.appMode,
          onboardingCompleted: true,
          brandColor: currentBiz?.brandColor ?? "#2d9a5a",
          plan: currentBiz?.plan ?? "free",
          planActivatedAt: currentBiz?.planActivatedAt ?? null,
          planExpiry: currentBiz?.planExpiry ?? null,
        });
        targetBiz = await getBusinessById(newId);
      }
      if (!targetBiz) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Gagal membuat bisnis baru" });
      return { success: true, businessId: targetBiz.id, appMode: input.appMode };
    }),
    togglePos: protectedProcedure.input(z.object({
      posEnabled: z.boolean(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND", message: "Bisnis tidak ditemukan" });
      await updateBusinessPosEnabled(biz.id, input.posEnabled);
      return { success: true };
    }),
    toggleDebt: protectedProcedure.input(z.object({
      debtEnabled: z.boolean(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND", message: "Bisnis tidak ditemukan" });
      await updateBusinessDebtEnabled(biz.id, input.debtEnabled);
      return { success: true };
    }),
    completePersonalSetup: protectedProcedure.mutation(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      await updateBusinessPersonalSetupDone(biz.id);
      return { success: true };
    }),

    // ─── Progressive UX: Business Profile & Feature Preferences ───
    saveBusinessProfile: protectedProcedure.input(z.object({
      businessType: z.string(), // retail, fnb, jasa, online, produksi, lainnya
      businessScale: z.string(), // pemula, toko_aktif, bisnis_scale
      enabledFeatures: z.array(z.string()),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND", message: "Bisnis tidak ditemukan" });
      await updateBusiness(biz.id, {
        businessType: input.businessType,
        businessScale: input.businessScale,
        enabledFeatures: input.enabledFeatures,
        onboardingCompleted: true,
      });
      return { success: true };
    }),
    updateEnabledFeatures: protectedProcedure.input(z.object({
      enabledFeatures: z.array(z.string()),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND", message: "Bisnis tidak ditemukan" });
      await updateBusiness(biz.id, { enabledFeatures: input.enabledFeatures });
      return { success: true };
    }),

    // ─── Bulk Setup (Client Onboarding from Excel Template) ───
    bulkSetup: protectedProcedure.input(z.object({
      gudang: z.array(z.object({ name: z.string().min(1), address: z.string().optional() })).default([]),
      produk: z.array(z.object({
        name: z.string().min(1), sku: z.string().optional(), category: z.string().optional(), subcategory: z.string().optional(),
        productType: z.enum(["barang", "jasa"]).default("barang"),
        hpp: z.number().min(0).default(0), sellingPrice: z.number().min(0).default(0),
        priceType: z.enum(["fixed", "dynamic"]).default("fixed"),
        discountPercent: z.number().min(0).max(100).default(0),
        unit: z.string().default("pcs"), stockMinimum: z.number().min(0).default(0),
      })).default([]),
      stokGudang: z.array(z.object({ productName: z.string(), warehouseName: z.string(), qty: z.number().min(0) })).default([]),
      rekening: z.array(z.object({
        accountName: z.string().min(1), accountType: z.enum(["bank", "ewallet", "cash"]),
        bankName: z.string().optional(), accountNumber: z.string().optional(),
        initialBalance: z.number().default(0),
      })).default([]),
      supplier: z.array(z.object({
        name: z.string().min(1), phone: z.string().optional(), email: z.string().optional(), address: z.string().optional(),
      })).default([]),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND", message: "Bisnis tidak ditemukan" });
      // Only admin (superadmin) can do bulk setup; regular users go through normal UI
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Hanya admin yang bisa bulk setup" });

      const today = new Date().toISOString().substring(0, 10);
      const result = { gudang: 0, produk: 0, stokGudang: 0, rekening: 0, supplier: 0, errors: [] as string[] };

      // 1. Create warehouses — track name→id mapping
      const warehouseMap: Record<string, number> = {};
      for (const g of input.gudang) {
        try {
          const id = await createWarehouse({ businessId: biz.id, name: g.name, address: g.address, isDefault: result.gudang === 0, isActive: true });
          warehouseMap[g.name] = id;
          result.gudang++;
        } catch (e: any) { result.errors.push(`Gudang "${g.name}": ${e.message}`); }
      }

      // 2. Create products — track name→id mapping
      const productMap: Record<string, number> = {};
      for (const p of input.produk) {
        try {
          const categoryStr = p.subcategory ? `${p.category} / ${p.subcategory}` : (p.category || undefined);
          const id = await safeInsertProduct({
            businessId: biz.id, name: p.name, sku: p.sku || undefined, category: categoryStr,
            productType: p.productType, hpp: p.hpp, sellingPrice: p.sellingPrice,
            priceType: p.priceType, discountPercent: p.discountPercent,
            unit: p.unit, stockMinimum: p.productType === "jasa" ? 0 : p.stockMinimum,
            stockCurrent: 0,
          });
          productMap[p.name] = id;
          result.produk++;
        } catch (e: any) { result.errors.push(`Produk "${p.name}": ${e.message}`); }
      }

      // 3. Set warehouse stock + create stock logs
      for (const s of input.stokGudang) {
        const productId = productMap[s.productName];
        const warehouseId = warehouseMap[s.warehouseName];
        if (!productId) { result.errors.push(`Stok: produk "${s.productName}" tidak ditemukan`); continue; }
        if (!warehouseId) { result.errors.push(`Stok: gudang "${s.warehouseName}" tidak ditemukan`); continue; }
        if (s.qty <= 0) continue;
        try {
          await updateWarehouseStockQty(warehouseId, productId, s.qty);
          await createStockLog({ businessId: biz.id, productId, date: today, movementType: "opening", qty: s.qty, direction: 1, stockBefore: 0, stockAfter: s.qty, notes: `Stok awal (bulk setup) — Gudang: ${s.warehouseName}` });
          await recalcProductStockFromWarehouses(productId);
          result.stokGudang++;
        } catch (e: any) { result.errors.push(`Stok "${s.productName}" @ "${s.warehouseName}": ${e.message}`); }
      }

      // 4. Create bank accounts
      for (const r of input.rekening) {
        try {
          await safeInsertBankAccount({
            businessId: biz.id, accountName: r.accountName, accountType: r.accountType,
            description: [r.bankName, r.accountNumber].filter(Boolean).join(" — ") || undefined,
            initialBalance: r.initialBalance,
          });
          result.rekening++;
        } catch (e: any) { result.errors.push(`Rekening "${r.accountName}": ${e.message}`); }
      }

      // 5. Create suppliers
      for (const s of input.supplier) {
        try {
          await createSupplier({ businessId: biz.id, name: s.name, phone: s.phone, email: s.email, address: s.address });
          result.supplier++;
        } catch (e: any) { result.errors.push(`Supplier "${s.name}": ${e.message}`); }
      }

      return result;
    }),
  }),

  // ─── Savings Goals (Tabungan Impian) ───
  savings: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) return [];
      return getSavingsGoalsByBusiness(biz.id);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      targetAmount: z.number().min(1),
      icon: z.string().optional(),
      color: z.string().optional(),
      targetDate: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const id = await createSavingsGoal({ ...input, businessId: biz.id });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      targetAmount: z.number().optional(),
      icon: z.string().optional(),
      color: z.string().optional(),
      targetDate: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const { id, ...data } = input;
      await updateSavingsGoal(id, biz.id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      await deleteSavingsGoal(input.id, biz.id);
      return { success: true };
    }),
    addFunds: protectedProcedure.input(z.object({
      id: z.number(),
      amount: z.number().min(1),
      bankAccountName: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const result = await addToSavingsGoal(input.id, biz.id, input.amount);
      if (!result) throw new TRPCError({ code: "NOT_FOUND" });
      // Auto-create journal transaction
      const txCode = await generateTxCode(biz.id);
      const paymentMethod = input.bankAccountName || "tunai";

      // Resolve bankAccountId from paymentMethod name
      let bankAccountId: number | undefined;
      const accounts = await getBankAccountsByBusiness(biz.id);
      const matchedAccount = accounts.find(a => a.accountName === paymentMethod);
      if (matchedAccount) {
        bankAccountId = matchedAccount.id;
      }

      await safeInsertTransaction({
        businessId: biz.id,
        txCode,
        date: new Date().toISOString().slice(0, 10),
        type: "pengeluaran",
        category: "Tabungan Impian",
        description: `Setor tabungan: ${result.name}`,
        amount: input.amount,
        paymentMethod,
        taxRelated: false,
        bankAccountId,
        notes: `Tabungan impian "${result.name}" — progress ${formatRupiah(result.currentAmount)} / ${formatRupiah(result.targetAmount)}`,
      });
      return result;
    }),
  }),

  // ─── Monthly Bills (Tagihan Bulanan) ───
  monthlyBills: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) return [];
      return getMonthlyBillsByBusiness(biz.id);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      amount: z.number().min(1),
      dueDay: z.number().min(1).max(31),
      category: z.string().optional(),
      icon: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const id = await createMonthlyBill({ ...input, businessId: biz.id });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      amount: z.number().optional(),
      dueDay: z.number().min(1).max(31).optional(),
      category: z.string().optional(),
      icon: z.string().optional(),
      isActive: z.boolean().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const { id, ...data } = input;
      await updateMonthlyBill(id, biz.id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      await deleteMonthlyBill(input.id, biz.id);
      return { success: true };
    }),
    pay: protectedProcedure.input(z.object({
      id: z.number(),
      amount: z.number().min(1),
      bankAccountName: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const bills = await getMonthlyBillsByBusiness(biz.id);
      const bill = bills.find((b: any) => b.id === input.id);
      if (!bill) throw new TRPCError({ code: "NOT_FOUND", message: "Tagihan tidak ditemukan" });
      // Create journal transaction for the bill payment
      const txCode = await generateTxCode(biz.id);
      const paymentMethod = input.bankAccountName || "tunai";

      // Resolve bankAccountId from paymentMethod name
      let bankAccountId: number | undefined;
      const accounts = await getBankAccountsByBusiness(biz.id);
      const matchedAccount = accounts.find(a => a.accountName === paymentMethod);
      if (matchedAccount) {
        bankAccountId = matchedAccount.id;
      }

      const billPayDate = new Date().toISOString().slice(0, 10);
      const txId = await safeInsertTransaction({
        businessId: biz.id,
        txCode,
        date: billPayDate,
        type: "pengeluaran",
        category: "Tagihan Bulanan",
        description: `Bayar tagihan: ${bill.name}`,
        amount: input.amount,
        paymentMethod,
        taxRelated: false,
        bankAccountId,
        notes: `Tagihan rutin "${bill.name}" (${bill.category}) — jatuh tempo tgl ${bill.dueDay}${input.notes ? " | " + input.notes : ""}`,
      });

      // ─── GL: Bill Payment — DR Beban Tagihan, CR Kas/Bank ───
      try {
        const billAccounts = await resolveAccountsForBillPayment(biz.id, bankAccountId || null);
        await createJournalEntry({
          businessId: biz.id,
          date: billPayDate,
          description: `Bayar tagihan: ${bill.name}`,
          sourceType: "bill_payment",
          sourceId: txId,
          lines: [
            { accountId: billAccounts.billExpenseAccountId, debitAmount: input.amount, creditAmount: 0, description: `Beban tagihan ${bill.name}` },
            { accountId: billAccounts.cashAccountId, debitAmount: 0, creditAmount: input.amount, description: `Pembayaran via ${paymentMethod}` },
          ],
        });
      } catch (e) { console.error("GL Bill Payment error:", e); }

      return { txId, success: true };
    }),
  }),

  // ─── Products / Stock ───
  product: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) return [];
      return getProductsByBusiness(biz.id);
    }),
    lowStock: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) return [];
      return getLowStockProducts(biz.id);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      sku: z.string().optional(),
      category: z.string().optional(),
      hpp: z.number().min(0),
      sellingPrice: z.number().min(0),
      stockCurrent: z.number().min(0).default(0),
      stockMinimum: z.number().min(0).default(5),
      unit: z.string().default("pcs"),
      imageUrl: z.string().optional(),
      productType: z.enum(["barang", "jasa"]).default("barang"),
      priceType: z.enum(["fixed", "dynamic"]).default("fixed"),
      discountPercent: z.number().min(0).max(100).default(0),
      warehouseId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND", message: "Bisnis tidak ditemukan" });
      // No plan limits — all users are Pro
      const { warehouseId, ...restInput } = input;
      const id = await safeInsertProduct({ ...restInput, businessId: biz.id });
      if (input.stockCurrent > 0) {
        const today = new Date().toISOString().substring(0, 10);
        await createStockLog({ businessId: biz.id, productId: id, date: today, movementType: "opening", qty: input.stockCurrent, direction: 1, stockBefore: 0, stockAfter: input.stockCurrent, notes: "Stok awal" });
      }
      // Sync initial stock to selected warehouse (or default)
      try {
        let targetWh = warehouseId ? await getWarehouseById(warehouseId) : null;
        if (!targetWh) targetWh = await getDefaultWarehouse(biz.id);
        if (targetWh && input.stockCurrent > 0) {
          await adjustWarehouseStock({ warehouseId: targetWh.id, productId: id, qty: input.stockCurrent, direction: 1 });
        }
      } catch { /* best-effort */ }
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      sku: z.string().optional(),
      category: z.string().optional(),
      hpp: z.number().optional(),
      sellingPrice: z.number().optional(),
      stockMinimum: z.number().optional(),
      unit: z.string().optional(),
      imageUrl: z.string().optional(),
      productType: z.enum(["barang", "jasa"]).optional(),
      priceType: z.enum(["fixed", "dynamic"]).optional(),
      discountPercent: z.number().min(0).max(100).optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const product = await getProductById(input.id);
      if (!product || product.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      const { id, discountPercent, ...rest } = input;
      const data = { ...rest, ...(discountPercent !== undefined ? { discountPercent: String(discountPercent) } : {}) };
      await updateProduct(id, data);
      return { success: true };
    }),
    adjustStock: protectedProcedure.input(z.object({
      productId: z.number(),
      qty: z.number(),
      type: z.enum(["in", "out", "adjustment"]),
      notes: z.string().optional(),
      warehouseId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const product = await getProductById(input.productId);
      if (!product || product.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      const direction = input.type === "out" ? -1 : 1;
      const stockBefore = product.stockCurrent;

      // Resolve warehouse — use provided or default
      let whId = input.warehouseId;
      if (!whId) {
        const defWh = await getDefaultWarehouse(biz.id);
        if (defWh) whId = defWh.id;
      }

      let stockAfter: number;
      if (whId) {
        // Update warehouse stock first → recalculates products.stockCurrent automatically
        try {
          stockAfter = await adjustWarehouseStock({ warehouseId: whId, productId: product.id, qty: input.qty, direction: direction as 1 | -1 });
        } catch (err: any) {
          throw new TRPCError({ code: "BAD_REQUEST", message: err?.message || `Stok tidak cukup. Stok saat ini: ${stockBefore}` });
        }
      } else {
        // Fallback: no warehouse found, update product directly (edge case)
        stockAfter = stockBefore + (input.qty * direction);
        if (stockAfter < 0) throw new TRPCError({ code: "BAD_REQUEST", message: `Stok tidak cukup. Stok saat ini: ${stockBefore}` });
        await updateProduct(product.id, { stockCurrent: stockAfter });
      }

      const today = new Date().toISOString().substring(0, 10);
      await createStockLog({ businessId: biz.id, productId: product.id, date: today, movementType: input.type, qty: input.qty, direction, stockBefore, stockAfter, notes: input.notes || "" });
      return { stockBefore, stockAfter };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const product = await getProductById(input.id);
      if (!product || product.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      await updateProduct(input.id, { isActive: false });
      return { success: true };
    }),
    stockLogs: protectedProcedure.input(z.object({ productId: z.number() })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) return [];
      const product = await getProductById(input.productId);
      if (!product || product.businessId !== biz.id) return [];
      const { getStockLogsByProduct } = await import("./db");
      return getStockLogsByProduct(input.productId);
    }),
    allStockHistory: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) return [];
      return getStockLogsByBusiness(biz.id);
    }),
    bulkCreate: protectedProcedure.input(z.object({
      products: z.array(z.object({
        name: z.string().min(1),
        sku: z.string().optional(),
        category: z.string().optional(),
        hpp: z.number().min(0),
        sellingPrice: z.number().min(0),
        stockCurrent: z.number().min(0).default(0),
        stockMinimum: z.number().min(0).default(5),
        unit: z.string().default("pcs"),
      })),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND", message: "Bisnis tidak ditemukan" });
      // No plan limits — all users are Pro
      const results: { name: string; id: number }[] = [];
      const today = new Date().toISOString().substring(0, 10);
      for (const p of input.products) {
        const id = await safeInsertProduct({ ...p, businessId: biz.id });
        if (p.stockCurrent > 0) {
          await createStockLog({ businessId: biz.id, productId: id, date: today, movementType: "opening", qty: p.stockCurrent, direction: 1, stockBefore: 0, stockAfter: p.stockCurrent, notes: "Stok awal (bulk import)" });
        }
        results.push({ name: p.name, id });
      }
      return { imported: results.length, products: results };
    }),
    addBatch: protectedProcedure.input(z.object({
      productId: z.number(),
      warehouseId: z.number().optional(),
      batchCode: z.string().optional(),
      purchaseDate: z.string(), // yyyy-mm-dd
      expiryDate: z.string().optional(),
      costPrice: z.number(),
      initialQty: z.number().min(1),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const product = await getProductById(input.productId);
      if (!product || product.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      const { createStockBatch } = await import("./db");
      const batchId = await createStockBatch({
        businessId: biz.id,
        productId: input.productId,
        warehouseId: input.warehouseId,
        batchCode: input.batchCode || `BATCH-${Date.now()}`,
        purchaseDate: input.purchaseDate,
        expiryDate: input.expiryDate || null,
        costPrice: input.costPrice,
        initialQty: input.initialQty,
        remainingQty: input.initialQty,
        isActive: true,
      });
      return { batchId };
    }),
    batches: protectedProcedure.input(z.object({
      productId: z.number(),
      warehouseId: z.number().optional(),
    })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) return [];
      const product = await getProductById(input.productId);
      if (!product || product.businessId !== biz.id) return [];
      const { getStockBatchesByProduct } = await import("./db");
      return getStockBatchesByProduct(input.productId, input.warehouseId);
    }),
    updateReorderSettings: protectedProcedure.input(z.object({
      id: z.number(),
      reorderPoint: z.number().optional(),
      safetyStock: z.number().optional(),
      leadTimeDays: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const product = await getProductById(input.id);
      if (!product || product.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      const { id, ...data } = input;
      await updateProduct(id, data);
      return { success: true };
    }),
  }),

  // ─── Export Data ───
  export: router({
    transactions: protectedProcedure.input(z.object({
      month: z.number().optional(),
      year: z.number().optional(),
    }).optional()).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const txs = await getTransactionsByBusiness(biz.id, input ?? {});
      // Return CSV string
      const header = "Kode,Tanggal,Tipe,Kategori,Deskripsi,Jumlah,Metode Bayar,Catatan";
      const rows = txs.map((t: any) => [
        t.txCode, t.date, t.type, t.category,
        `"${(t.description || "").replace(/"/g, "'")}"`  ,
        t.amount, t.paymentMethod, `"${(t.notes || "").replace(/"/g, "'")}"`
      ].join(","));
      return { csv: [header, ...rows].join("\n"), filename: `transaksi-${biz.slug}-${input?.year || "all"}.csv` };
    }),
    products: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const prods = await getProductsByBusiness(biz.id);
      const header = "Nama,SKU,Kategori,HPP,Harga Jual,Stok,Min Stok,Satuan";
      const rows = prods.map((p: any) => [
        `"${p.name}"`, p.sku || "", p.category || "",
        p.hpp, p.sellingPrice, p.stockCurrent, p.stockMinimum, p.unit
      ].join(","));
      return { csv: [header, ...rows].join("\n"), filename: `produk-${biz.slug}.csv` };
    }),
    allData: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      // All users have Pro access — no plan restriction
      const txs = await getTransactionsByBusiness(biz.id, {});
      const prods = await getProductsByBusiness(biz.id);
      const taxPays = await getTaxPaymentsByBusiness(biz.id);
      return {
        business: { name: biz.businessName, type: biz.businessType, npwp: biz.npwp, plan: biz.plan },
        transactionCount: txs.length,
        productCount: prods.length,
        taxPaymentCount: taxPays.length,
        transactions: txs,
        products: prods,
        taxPayments: taxPays,
      };
    }),
  }),

  // ─── Transactions ───
  transaction: router({
    list: protectedProcedure.input(z.object({
      month: z.number().optional(),
      year: z.number().optional(),
      type: z.string().optional(),
      category: z.string().optional(),
      limit: z.number().optional(),
    }).optional()).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) return [];
      return getTransactionsByBusiness(biz.id, input ?? {});
    }),
    create: protectedProcedure.input(z.object({
      date: z.string(),
      type: z.enum(["pemasukan", "pengeluaran"]),
      category: z.string(),
      description: z.string().optional(),
      amount: z.number().min(1),
      paymentMethod: z.string().default("Tunai"),
      productId: z.number().optional(),
      productQty: z.number().optional(),
      notes: z.string().optional(),
      warehouseId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND", message: "Bisnis tidak ditemukan" });
      // No plan limits — all users are Pro
      const txCode = await generateTxCode(biz.id);
      let productHppSnapshot: number | undefined;
      // Handle stock movement if product linked
      if (input.productId && input.productQty) {
        const product = await getProductById(input.productId);
        if (product && product.businessId === biz.id) {
          productHppSnapshot = product.hpp;
          const direction = input.category === "Pembelian Stok" ? 1 : -1;
          const movementType = direction === 1 ? "in" : "out";
          const newStock = product.stockCurrent + (input.productQty * direction);
          if (newStock < 0) throw new TRPCError({ code: "BAD_REQUEST", message: `Stok tidak cukup. Stok saat ini: ${product.stockCurrent}` });
          await createStockLog({ businessId: biz.id, productId: product.id, date: input.date, movementType, qty: input.productQty, direction, stockBefore: product.stockCurrent, stockAfter: newStock, notes: `Transaksi ${txCode}` });
          await updateProduct(product.id, { stockCurrent: newStock });
          // Sync warehouse stock
          let whId = input.warehouseId;
          if (!whId) {
            const defWh = await getDefaultWarehouse(biz.id);
            if (defWh) whId = defWh.id;
          }
          if (whId) {
            try {
              await adjustWarehouseStock({ warehouseId: whId, productId: product.id, qty: input.productQty, direction: direction as 1 | -1 });
            } catch { /* warehouse stock sync best-effort */ }
          }
        }
      }

      // Resolve bankAccountId from paymentMethod name
      let bankAccountId: number | undefined;
      const accounts = await getBankAccountsByBusiness(biz.id);
      const matchedAccount = accounts.find(a => a.accountName === input.paymentMethod);
      if (matchedAccount) {
        bankAccountId = matchedAccount.id;
      }

      const id = await safeInsertTransaction({ ...input, businessId: biz.id, txCode, productHppSnapshot, taxRelated: true, bankAccountId });

      // ─── GL Double-Entry Journal (best-effort) ───
      try {
        const glAccounts = await resolveAccountsForManualTx(biz.id, input.category, input.type, bankAccountId ?? null);
        const lines: Array<{ accountId: number; description?: string; debitAmount: number; creditAmount: number }> = [];

        if (input.type === "pemasukan") {
          // DR: Kas/Bank, CR: Pendapatan/counter-account
          lines.push({ accountId: glAccounts.cashAccountId, description: `Terima ${input.category}`, debitAmount: input.amount, creditAmount: 0 });
          lines.push({ accountId: glAccounts.counterAccountId, description: input.description || input.category, debitAmount: 0, creditAmount: input.amount });
        } else {
          // DR: Beban/counter-account, CR: Kas/Bank
          lines.push({ accountId: glAccounts.counterAccountId, description: input.description || input.category, debitAmount: input.amount, creditAmount: 0 });
          lines.push({ accountId: glAccounts.cashAccountId, description: `Bayar ${input.category}`, debitAmount: 0, creditAmount: input.amount });
        }

        await createJournalEntry({
          businessId: biz.id,
          date: input.date,
          description: `${input.type === "pemasukan" ? "Pemasukan" : "Pengeluaran"}: ${input.category} — ${txCode}`,
          sourceType: input.type === "pemasukan" ? "manual_income" : "manual_expense",
          sourceId: id,
          createdByUserId: ctx.user.id,
          lines,
        });
      } catch (glError) {
        console.error(`[GL] Manual Tx journal failed — bizId=${biz.id} txId=${id} type=${input.type} amount=${input.amount} category=${input.category}:`, glError);
      }

      return { id, txCode };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      date: z.string().optional(),
      type: z.enum(["pemasukan", "pengeluaran"]).optional(),
      category: z.string().optional(),
      description: z.string().optional(),
      amount: z.number().min(1).optional(),
      paymentMethod: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const tx = await getTransactionById(input.id);
      if (!tx || tx.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      const { id, ...data } = input;
      await updateTransaction(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      // Check role permission: only owner, admin, or manager can delete transactions
      await checkRolePermission(ctx.user.id, biz.id, ["owner", "manager"]);

      const tx = await getTransactionById(input.id);
      if (!tx || tx.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      // Reverse stock if product linked
      if (tx.productId && tx.productQty) {
        const product = await getProductById(tx.productId);
        if (product) {
          const wasOut = tx.category !== "Pembelian Stok";
          const reverseDir = wasOut ? 1 : -1;
          const newStock = product.stockCurrent + (tx.productQty * reverseDir);
          await createStockLog({ businessId: biz.id, productId: product.id, date: new Date().toISOString().substring(0, 10), movementType: "adjustment", qty: tx.productQty, direction: reverseDir, stockBefore: product.stockCurrent, stockAfter: newStock, notes: `Pembatalan ${tx.txCode}` });
          await updateProduct(product.id, { stockCurrent: newStock });
        }
      }
      await softDeleteTransaction(input.id);
      return { success: true };
    }),
    void: protectedProcedure.input(z.object({
      id: z.number(),
      reason: z.string().min(1, "Alasan void wajib diisi"),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      // Only owner, admin, or manager can void
      await checkRolePermission(ctx.user.id, biz.id, ["owner", "manager"]);

      const tx = await getTransactionById(input.id);
      if (!tx || tx.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      if (tx.status === "voided") throw new TRPCError({ code: "BAD_REQUEST", message: "Transaksi sudah di-void" });

      // 1. Mark original transaction as voided
      await voidTransaction(input.id, input.reason, ctx.user.id);

      // 2. Create reversal journal entry (opposite type)
      const reversalType = tx.type === "pemasukan" ? "pengeluaran" : "pemasukan";
      const reversalCode = await generateTxCode(biz.id);
      await safeInsertTransaction({
        businessId: biz.id,
        txCode: reversalCode,
        date: new Date().toISOString().substring(0, 10),
        type: reversalType,
        category: `Void: ${tx.category}`,
        description: `Void ${tx.txCode} — ${input.reason}`,
        amount: tx.amount,
        paymentMethod: tx.paymentMethod,
        bankAccountId: tx.bankAccountId,
        taxRelated: false,
        notes: `Reversal dari ${tx.txCode}. Alasan: ${input.reason}`,
        reversalOfId: tx.id,
      });

      // 3. Reverse stock if product linked
      if (tx.productId && tx.productQty) {
        const product = await getProductById(tx.productId);
        if (product) {
          const wasOut = tx.category !== "Pembelian Stok";
          const reverseDir = wasOut ? 1 : -1;
          const newStock = product.stockCurrent + (tx.productQty * reverseDir);
          await createStockLog({
            businessId: biz.id,
            productId: product.id,
            date: new Date().toISOString().substring(0, 10),
            movementType: "adjustment",
            qty: tx.productQty,
            direction: reverseDir,
            stockBefore: product.stockCurrent,
            stockAfter: newStock,
            notes: `Void ${tx.txCode}: ${input.reason}`,
          });
          await updateProduct(product.id, { stockCurrent: newStock });
        }
      }

      // 4. GL Journal: Void Transaction (best-effort, non-blocking)
      try {
        const voidAccounts = await resolveAccountsForManualTx(biz.id, tx.category, tx.type as "pemasukan" | "pengeluaran", tx.bankAccountId);

        const journalLines: Array<{ accountId: number; description: string; debitAmount: number; creditAmount: number }> = [];

        if (tx.type === "pemasukan") {
          // Original was: DR Kas, CR Counter → Void reverses: DR Counter, CR Kas
          journalLines.push({
            accountId: voidAccounts.counterAccountId,
            description: `Void: ${tx.category}`,
            debitAmount: Number(tx.amount),
            creditAmount: 0,
          });
          journalLines.push({
            accountId: voidAccounts.cashAccountId,
            description: `Void ${tx.txCode}`,
            debitAmount: 0,
            creditAmount: Number(tx.amount),
          });
        } else {
          // Original was: DR Counter, CR Kas → Void reverses: DR Kas, CR Counter
          journalLines.push({
            accountId: voidAccounts.cashAccountId,
            description: `Void ${tx.txCode}`,
            debitAmount: Number(tx.amount),
            creditAmount: 0,
          });
          journalLines.push({
            accountId: voidAccounts.counterAccountId,
            description: `Void: ${tx.category}`,
            debitAmount: 0,
            creditAmount: Number(tx.amount),
          });
        }

        await createJournalEntry({
          businessId: biz.id,
          date: new Date().toISOString().substring(0, 10),
          description: `Void ${tx.txCode} — ${input.reason}`,
          sourceType: "void",
          sourceId: tx.id,
          lines: journalLines,
        });
      } catch (glErr) {
        console.error(`[GL] Void journal failed — txId=${input.id}:`, glErr);
      }

      // 5. Audit log
      await createAuditLog({
        businessId: biz.id,
        userId: ctx.user.id,
        action: "void_transaction",
        entityType: "transaction",
        entityId: tx.id,
        details: { txCode: tx.txCode, reason: input.reason, amount: tx.amount, reversalCode },
      });

      return { success: true, reversalCode };
    }),
    voided: protectedProcedure.input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional()).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) return [];
      return getVoidedTransactions(biz.id, input?.startDate, input?.endDate);
    }),
  }),

  // ─── Tax ───
  tax: router({
    rules: publicProcedure.query(async () => {
      await seedDefaultTaxRules();
      return getActiveTaxRules();
    }),
    calculate: protectedProcedure.input(z.object({
      month: z.number().min(1).max(12),
      year: z.number(),
    })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) return [];
      return calcTaxForMonth(biz.id, input.month, input.year);
    }),
    payments: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) return [];
      return getTaxPaymentsByBusiness(biz.id);
    }),
    recordPayment: protectedProcedure.input(z.object({
      periodMonth: z.string(),
      taxCode: z.string(),
      omzetAmount: z.number().default(0),
      taxAmount: z.number(),
      paymentDate: z.string(),
      ntpn: z.string().optional(),
      status: z.enum(["LUNAS", "BELUM", "TERLAMBAT"]).default("LUNAS"),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const id = await createTaxPayment({ ...input, businessId: biz.id });

      // ─── GL: Tax Payment — DR Beban Pajak, CR Kas ───
      if (input.taxAmount > 0 && input.status === "LUNAS") {
        try {
          const taxAccounts = await resolveAccountsForTaxPayment(biz.id, input.taxCode, null);
          await createJournalEntry({
            businessId: biz.id,
            date: input.paymentDate,
            description: `Pembayaran pajak ${input.taxCode} periode ${input.periodMonth}`,
            sourceType: "tax_payment",
            sourceId: id,
            lines: [
              { accountId: taxAccounts.taxExpenseAccountId, debitAmount: input.taxAmount, creditAmount: 0, description: `Beban ${input.taxCode}` },
              { accountId: taxAccounts.cashAccountId, debitAmount: 0, creditAmount: input.taxAmount, description: "Pembayaran dari kas" },
            ],
          });
        } catch (e) { console.error("GL Tax Payment error:", e); }
      }

      return { id };
    }),
    updateRule: adminProcedure.input(z.object({
      id: z.number(),
      rate: z.string().optional(),
      validUntil: z.string().optional(),
      isActive: z.boolean().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateTaxRule(id, data);
      return { success: true };
    }),
  }),

  // ─── Reports ───
  report: router({
    labaRugi: protectedProcedure.input(z.object({ month: z.number(), year: z.number() })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return generateLabaRugi(biz.id, input.month, input.year);
    }),
    arusKas: protectedProcedure.input(z.object({ month: z.number(), year: z.number() })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return generateArusKas(biz.id, input.month, input.year);
    }),
    neraca: protectedProcedure.input(z.object({ month: z.number(), year: z.number() })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return generateNeraca(biz.id, input.month, input.year);
    }),
    perubahanModal: protectedProcedure.input(z.object({ month: z.number(), year: z.number() })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return generatePerubahanModal(biz.id, input.month, input.year);
    }),
    calk: protectedProcedure.input(z.object({ month: z.number(), year: z.number() })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return generateCALK(biz.id, input.month, input.year);
    }),
    // Financial consistency check: verifies Neraca Kas == Arus Kas saldoAkhir
    consistencyCheck: protectedProcedure.input(z.object({ month: z.number(), year: z.number() })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return validateFinancialConsistency(biz.id, input.month, input.year);
    }),
    dashboard: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getDashboardKPIs(biz.id);
    }),
    yearlyOmzet: protectedProcedure.input(z.object({ year: z.number() })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) return new Array(12).fill(0);
      return getYearlyOmzet(biz.id, input.year);
    }),
    summary: protectedProcedure.input(z.object({ month: z.number(), year: z.number() })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getTransactionSummary(biz.id, input.month, input.year);
    }),
    dailySales: protectedProcedure.input(z.object({ date: z.string() })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getDailySalesReport(biz.id, input.date);
    }),
    periodSales: protectedProcedure.input(z.object({ startDate: z.string(), endDate: z.string() })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getPeriodSalesReport(biz.id, input.startDate, input.endDate);
    }),
    rekeningKoran: protectedProcedure.input(z.object({
      bankAccountName: z.string(),
      startDate: z.string(),
      endDate: z.string(),
    })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getRekeningKoranReport(biz.id, input.bankAccountName, input.startDate, input.endDate);
    }),
    mutasiPersediaan: protectedProcedure.input(z.object({
      productId: z.number().optional(),
      startDate: z.string(),
      endDate: z.string(),
    })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getMutasiPersediaanReport(biz.id, input.productId, input.startDate, input.endDate);
    }),
    // ─── Wave 1: Sales by Product ───
    salesByProduct: protectedProcedure.input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getSalesByProduct(biz.id, input.startDate, input.endDate);
    }),
    // ─── Wave 1: Payment Method Summary ───
    paymentSummary: protectedProcedure.input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getPaymentMethodSummary(biz.id, input.startDate, input.endDate);
    }),
    // ─── Wave 1: Top Products and Categories ───
    topProducts: protectedProcedure.input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      limit: z.number().optional().default(10),
    })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getTopProductsAndCategories(biz.id, input.startDate, input.endDate, input.limit);
    }),

    // ═══ Wave 2: Sales Deep Dive ═══

    // ─── W2.1: Sales by Customer ───
    salesByCustomer: protectedProcedure.input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getSalesByCustomer(biz.id, input.startDate, input.endDate);
    }),

    // ─── W2.2: Sales by Hour ───
    salesByHour: protectedProcedure.input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getSalesByHour(biz.id, input.startDate, input.endDate);
    }),

    // ─── W2.3: Sales by Date ───
    salesByDate: protectedProcedure.input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getSalesByDate(biz.id, input.startDate, input.endDate);
    }),

    // ─── W2.5: Discount Summary ───
    discountSummary: protectedProcedure.input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getDiscountSummary(biz.id, input.startDate, input.endDate);
    }),

    // ─── W2.6: Void/Refund Analysis ───
    voidRefundAnalysis: protectedProcedure.input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getVoidRefundAnalysis(biz.id, input.startDate, input.endDate);
    }),

    // ─── W2.7: Kas Reconciliation ───
    kasReconciliation: protectedProcedure.input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getKasReconciliation(biz.id, input.startDate, input.endDate);
    }),

    // ─── W3.1: Shift Report ───
    shiftReport: protectedProcedure.input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })).query(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) return { shifts: [], summary: { totalShifts: 0, totalPenjualan: 0, totalRefund: 0, avgCashDifference: 0 } };
      return getShiftReport(resolved.business.id, input.startDate, input.endDate);
    }),

    // ─── Inventory: FIFO Valuation ───
    fifoValuation: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const { getFIFOValuation } = await import("./db");
      return getFIFOValuation(biz.id);
    }),

    // ─── Inventory: Expiring Stock ───
    expiringStock: protectedProcedure.input(z.object({
      daysAhead: z.number().default(30),
    })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const { getExpiringStock } = await import("./db");
      return getExpiringStock(biz.id, input.daysAhead);
    }),

    // ─── Inventory: Expired Stock ───
    expiredStock: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const { getExpiredStock } = await import("./db");
      return getExpiredStock(biz.id);
    }),

    // ─── Inventory: Stock Aging ───
    stockAging: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const { getStockAging } = await import("./db");
      return getStockAging(biz.id);
    }),

    // ─── Inventory: Low Stock Alerts ───
    lowStockAlerts: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const { getLowStockAlerts } = await import("./db");
      return getLowStockAlerts(biz.id);
    }),

    // ─── Laba Rugi Detail (Olsera Format) ───
    labaRugiDetail: protectedProcedure.input(z.object({
      month: z.number().min(1).max(12),
      year: z.number().min(2000),
    })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return generateLabaRugiDetail(biz.id, input.month, input.year);
    }),
    // ─── Wave 4: Sales by Staff ───
    salesByStaff: protectedProcedure.input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getSalesByStaff(biz.id, input.startDate, input.endDate);
    }),
    // ─── Wave 4: Staff Sales Detail ───
    staffSalesDetail: protectedProcedure.input(z.object({
      staffName: z.string(),
      startDate: z.string(),
      endDate: z.string(),
    })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getStaffSalesDetail(biz.id, input.staffName, input.startDate, input.endDate);
    }),
    // ─── Wave 4: Sales by Device ───
    salesByDevice: protectedProcedure.input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getSalesByDevice(biz.id, input.startDate, input.endDate);
    }),

    // ═══ Fase 4: GL Double-Entry Reports ═══

    // ─── Trial Balance from GL ───
    trialBalanceGL: protectedProcedure.input(z.object({
      month: z.number().min(1).max(12).optional(),
      year: z.number().min(2000).optional(),
    })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      let startDate: string | undefined;
      let endDate: string | undefined;
      if (input.month && input.year) {
        startDate = `${input.year}-${String(input.month).padStart(2, "0")}-01`;
        const lastDay = new Date(input.year, input.month, 0).getDate();
        endDate = `${input.year}-${String(input.month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      }
      return getTrialBalanceGL(biz.id, startDate, endDate);
    }),

    // ─── Laba Rugi (Income Statement) from GL ───
    labaRugiGL: protectedProcedure.input(z.object({
      month: z.number().min(1).max(12),
      year: z.number().min(2000),
    })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const startDate = `${input.year}-${String(input.month).padStart(2, "0")}-01`;
      const lastDay = new Date(input.year, input.month, 0).getDate();
      const endDate = `${input.year}-${String(input.month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      return getLabaRugiGL(biz.id, startDate, endDate);
    }),

    // ─── Neraca (Balance Sheet) from GL ───
    neracaGL: protectedProcedure.input(z.object({
      month: z.number().min(1).max(12),
      year: z.number().min(2000),
    })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const lastDay = new Date(input.year, input.month, 0).getDate();
      const endDate = `${input.year}-${String(input.month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      return getNeracaGL(biz.id, endDate);
    }),

    // ─── Buku Besar (General Ledger Detail) from GL ───
    bukuBesarGL: protectedProcedure.input(z.object({
      accountCode: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getBukuBesarGL(biz.id, input.accountCode, input.startDate, input.endDate);
    }),
  }),

  // ═══ Journal Management (Manual Adjustment — master/owner only) ═══
  journal: router({
    // List all accounts for the adjustment form dropdown
    accounts: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getAccountsByBusiness(biz.id);
    }),

    // List journal entries with optional status filter
    list: protectedProcedure.input(z.object({
      limit: z.number().min(1).max(200).default(50),
      offset: z.number().min(0).default(0),
      status: z.string().optional(),
    }).optional()).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getJournalEntriesByBusiness(biz.id, {
        limit: input?.limit ?? 50,
        offset: input?.offset ?? 0,
        status: input?.status,
      });
    }),

    // Get lines for a specific journal entry
    lines: protectedProcedure.input(z.object({ journalEntryId: z.number() })).query(async ({ input }) => {
      return getJournalLinesByEntry(input.journalEntryId);
    }),

    // Create manual journal adjustment — OWNER ONLY
    adjust: protectedProcedure.input(z.object({
      date: z.string(),
      description: z.string().min(1),
      lines: z.array(z.object({
        accountId: z.number(),
        debitAmount: z.number().min(0),
        creditAmount: z.number().min(0),
        description: z.string().optional(),
      })).min(2),
    })).mutation(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND" });

      // ─── OWNER-ONLY CHECK ───
      if (!resolved.isOwner) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Hanya akun master/owner yang bisa membuat jurnal penyesuaian",
        });
      }

      const result = await createManualJournalAdjustment({
        businessId: resolved.business.id,
        date: input.date,
        description: input.description,
        createdByUserId: ctx.user.id,
        lines: input.lines,
      });

      return result;
    }),

    // Reverse a specific journal entry — OWNER ONLY
    reverse: protectedProcedure.input(z.object({
      journalEntryId: z.number(),
      reason: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND" });

      // ─── OWNER-ONLY CHECK ───
      if (!resolved.isOwner) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Hanya akun master/owner yang bisa me-reverse jurnal",
        });
      }

      const biz = resolved.business;

      // Get the entry to reverse
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [entry] = await db.select().from(journalEntries)
        .where(and(eq(journalEntries.id, input.journalEntryId), eq(journalEntries.businessId, biz.id)))
        .limit(1);

      if (!entry) throw new TRPCError({ code: "NOT_FOUND", message: "Jurnal tidak ditemukan" });
      if (entry.status === "reversed") throw new TRPCError({ code: "BAD_REQUEST", message: "Jurnal sudah di-reverse" });

      // Get lines and create reversal
      const lines = await getJournalLinesByEntry(entry.id);
      const reversalLines = lines.map((line) => ({
        accountId: line.accountId,
        debitAmount: line.creditAmount,
        creditAmount: line.debitAmount,
        description: `[REVERSAL] ${line.description || ""}`,
      }));

      const result = await createJournalEntry({
        businessId: biz.id,
        date: new Date().toISOString().substring(0, 10),
        description: input.reason || `[REVERSAL] ${entry.description}`,
        sourceType: `${entry.sourceType}_reversal`,
        sourceId: entry.sourceId ?? undefined,
        reversalOfId: entry.id,
        lines: reversalLines,
      });

      // Mark original as reversed
      await db.update(journalEntries)
        .set({ status: "reversed" })
        .where(eq(journalEntries.id, entry.id));

      return result;
    }),
  }),

  // ═══ Wave 4: Outlets ═══
  outlet: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getOutletsByBusiness(biz.id);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      code: z.string().optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return createOutlet({ ...input, businessId: biz.id, isActive: true });
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      code: z.string().optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const { id, ...rest } = input;
      await updateOutlet(id, biz.id, rest);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({
      id: z.number(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      await deleteOutlet(input.id, biz.id);
      return { success: true };
    }),
    salesReport: protectedProcedure.input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      outletId: z.number().optional(),
    })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getOutletSalesReport(biz.id, input.outletId, input.startDate, input.endDate);
    }),
  }),

  // ═══ Wave 4: Staff Attendance ═══
  attendance: router({
    clockIn: protectedProcedure.mutation(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const today = new Date().toISOString().split('T')[0];
      const userName = ctx.user.name || "User";
      return clockIn(biz.id, ctx.user.id.toString(), userName, today);
    }),
    clockOut: protectedProcedure.input(z.object({
      id: z.number(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      await clockOut(biz.id, input.id);
      return { success: true };
    }),
    today: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const today = new Date().toISOString().split('T')[0];
      return getAttendanceByDate(biz.id, today);
    }),
    list: protectedProcedure.input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getAttendanceReport(biz.id, input.startDate, input.endDate);
    }),
    report: protectedProcedure.input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getAttendanceReport(biz.id, input.startDate, input.endDate);
    }),
    myReport: protectedProcedure.input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getMyAttendance(biz.id, ctx.user.id.toString(), input.startDate, input.endDate);
    }),
  }),

  // ═══ Wave 4: Customer Deposits ═══
  deposit: router({
    balance: protectedProcedure.input(z.object({
      clientId: z.number(),
    })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getOrCreateDeposit(biz.id, input.clientId);
    }),
    topUp: protectedProcedure.input(z.object({
      clientId: z.number(),
      amount: z.number().positive(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      await topUpDeposit(biz.id, input.clientId, input.amount, input.notes);

      // ─── GL JOURNAL: Deposit TopUp (best-effort) ───
      try {
        const depAccounts = await resolveAccountsForDeposit(biz.id);
        await createJournalEntry({
          businessId: biz.id,
          date: new Date().toISOString().substring(0, 10),
          description: `Deposit TopUp — Client #${input.clientId} — Rp ${input.amount.toLocaleString("id-ID")}`,
          sourceType: "deposit_topup",
          sourceId: input.clientId,
          lines: [
            { accountId: depAccounts.cashAccountId, description: "Terima deposit pelanggan", debitAmount: Number(input.amount), creditAmount: 0 },
            { accountId: depAccounts.depositAccountId, description: "Deposit pelanggan (liability)", debitAmount: 0, creditAmount: Number(input.amount) },
          ],
        });
      } catch (glErr) {
        console.error(`[GL] Deposit TopUp journal failed — bizId=${biz.id} clientId=${input.clientId} amount=${input.amount}:`, glErr);
      }

      return { success: true };
    }),
    use: protectedProcedure.input(z.object({
      clientId: z.number(),
      amount: z.number().positive(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      await useDeposit(biz.id, input.clientId, input.amount, input.notes);

      // ─── GL JOURNAL: Deposit Use (best-effort) ───
      try {
        const depAccounts = await resolveAccountsForDeposit(biz.id);
        await createJournalEntry({
          businessId: biz.id,
          date: new Date().toISOString().substring(0, 10),
          description: `Deposit Use — Client #${input.clientId} — Rp ${input.amount.toLocaleString("id-ID")}`,
          sourceType: "deposit_use",
          sourceId: input.clientId,
          lines: [
            { accountId: depAccounts.depositAccountId, description: "Penggunaan deposit pelanggan", debitAmount: Number(input.amount), creditAmount: 0 },
            { accountId: depAccounts.salesAccountId, description: "Penjualan via deposit", debitAmount: 0, creditAmount: Number(input.amount) },
          ],
        });
      } catch (glErr) {
        console.error(`[GL] Deposit Use journal failed — bizId=${biz.id} clientId=${input.clientId} amount=${input.amount}:`, glErr);
      }

      return { success: true };
    }),
    refund: protectedProcedure.input(z.object({
      clientId: z.number(),
      amount: z.number().positive(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      await refundDeposit(biz.id, input.clientId, input.amount, input.notes);

      // ─── GL JOURNAL: Deposit Refund (best-effort) ───
      try {
        const depAccounts = await resolveAccountsForDeposit(biz.id);
        await createJournalEntry({
          businessId: biz.id,
          date: new Date().toISOString().substring(0, 10),
          description: `Deposit Refund — Client #${input.clientId} — Rp ${input.amount.toLocaleString("id-ID")}`,
          sourceType: "deposit_refund",
          sourceId: input.clientId,
          lines: [
            { accountId: depAccounts.depositAccountId, description: "Refund deposit pelanggan", debitAmount: Number(input.amount), creditAmount: 0 },
            { accountId: depAccounts.cashAccountId, description: "Pengembalian deposit", debitAmount: 0, creditAmount: Number(input.amount) },
          ],
        });
      } catch (glErr) {
        console.error(`[GL] Deposit Refund journal failed — bizId=${biz.id} clientId=${input.clientId} amount=${input.amount}:`, glErr);
      }

      return { success: true };
    }),
    history: protectedProcedure.input(z.object({
      clientId: z.number(),
    })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getDepositHistory(biz.id, input.clientId);
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getAllDeposits(biz.id);
    }),
    report: protectedProcedure.input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getDepositReport(biz.id, input.startDate, input.endDate);
    }),
  }),

  // ─── Credit Sales (Penjualan Kredit) ───
  credit: router({
    list: protectedProcedure.input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      status: z.string().optional(),
    })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getCreditSalesReport(biz.id, input.startDate, input.endDate, input.status);
    }),

    create: protectedProcedure.input(z.object({
      receiptId: z.number(),
      clientId: z.number(),
      totalAmount: z.number().positive(),
      dueDate: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const id = await createCreditSale({
        businessId: biz.id,
        receiptId: input.receiptId,
        clientId: input.clientId,
        totalAmount: input.totalAmount,
        paidAmount: 0,
        remainingAmount: input.totalAmount,
        dueDate: input.dueDate,
        notes: input.notes,
      });

      // ─── GL JOURNAL: Credit Sale (best-effort, non-blocking) ───
      try {
        const creditAccounts = await resolveAccountsForCreditSale(biz.id);

        // Calculate HPP from receipt items
        const receiptItems = await getPosReceiptItemsByReceipt(input.receiptId);
        const totalHPP = receiptItems.reduce((sum, item) => sum + (Number(item.hppSnapshot) * Number(item.qty)), 0);

        const journalLines: Array<{ accountId: number; description: string; debitAmount: number; creditAmount: number }> = [];

        // DR Piutang Usaha
        journalLines.push({
          accountId: creditAccounts.receivableAccountId,
          description: `Piutang kredit #${id}`,
          debitAmount: Number(input.totalAmount),
          creditAmount: 0,
        });

        // CR Penjualan
        journalLines.push({
          accountId: creditAccounts.salesAccountId,
          description: `Penjualan kredit #${id}`,
          debitAmount: 0,
          creditAmount: Number(input.totalAmount),
        });

        // HPP + Persediaan (if any)
        if (totalHPP > 0) {
          journalLines.push({
            accountId: creditAccounts.cogsAccountId,
            description: "Harga Pokok Penjualan",
            debitAmount: totalHPP,
            creditAmount: 0,
          });
          journalLines.push({
            accountId: creditAccounts.inventoryAccountId,
            description: "Pengurangan persediaan",
            debitAmount: 0,
            creditAmount: totalHPP,
          });
        }

        await createJournalEntry({
          businessId: biz.id,
          date: new Date().toISOString().substring(0, 10),
          description: `Penjualan Kredit #${id} — Rp ${input.totalAmount.toLocaleString("id-ID")}`,
          sourceType: "credit_sale",
          sourceId: id,
          lines: journalLines,
        });
      } catch (glErr) {
        console.error(`[GL] Credit Sale journal failed — bizId=${biz.id} clientId=${input.clientId} amount=${input.totalAmount}:`, glErr);
      }

      return { success: true, id };
    }),

    addPayment: protectedProcedure.input(z.object({
      creditSaleId: z.number(),
      amount: z.number().positive(),
      paymentMethod: z.string().optional(),
      date: z.string(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND" });
      const bizId = resolved.business.id;

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const id = await db.transaction(async (tx) => {
        // Insert payment inside transaction
        const [result] = await tx.insert(creditPayments).values({
          creditSaleId: input.creditSaleId,
          amount: input.amount,
          paymentMethod: input.paymentMethod ?? "tunai",
          date: input.date,
          notes: input.notes,
        });

        // Update credit_sales totals atomically
        const [credit] = await tx.select().from(creditSales).where(eq(creditSales.id, input.creditSaleId));
        if (credit) {
          const newPaid = credit.paidAmount + input.amount;
          const newRemaining = credit.totalAmount - newPaid;
          const newStatus = newRemaining <= 0 ? "lunas" : newPaid > 0 ? "cicilan" : "belum_lunas";

          await tx
            .update(creditSales)
            .set({
              paidAmount: newPaid,
              remainingAmount: Math.max(0, newRemaining),
              status: newStatus,
            })
            .where(eq(creditSales.id, input.creditSaleId));
        }

        // Create journal entry for credit payment (pemasukan) inside same tx
        const paymentMethod = input.paymentMethod ?? "tunai";
        const txCode = await generateTxCode(bizId);

        // Resolve bankAccountId from payment method
        const posAccounts = await getBankAccountsByBusiness(bizId);
        const bankAccountId = resolveBankAccountId(posAccounts, paymentMethod);

        const txData: any = {
          businessId: bizId,
          txCode: String(txCode).trim(),
          date: String(input.date).trim(),
          type: "pemasukan",
          category: "Pelunasan Kredit",
          description: `Pelunasan kredit #${input.creditSaleId}${input.notes ? ` — ${input.notes}` : ""}`,
          amount: input.amount,
          paymentMethod,
        };
        if (bankAccountId) txData.bankAccountId = bankAccountId;
        await tx.insert(transactions).values(txData);

        return result.insertId;
      });

      // ─── GL JOURNAL: Credit Payment (best-effort, non-blocking) ───
      try {
        const posAccounts = await getBankAccountsByBusiness(bizId);
        const bankAccountId = resolveBankAccountId(posAccounts, input.paymentMethod ?? "tunai");
        const cpAccounts = await resolveAccountsForCreditPayment(bizId, bankAccountId ?? null);

        await createJournalEntry({
          businessId: bizId,
          date: input.date,
          description: `Pelunasan Kredit #${input.creditSaleId} — Rp ${input.amount.toLocaleString("id-ID")}`,
          sourceType: "credit_payment",
          sourceId: id,
          lines: [
            {
              accountId: cpAccounts.cashAccountId,
              description: `Terima pelunasan kredit #${input.creditSaleId}`,
              debitAmount: Number(input.amount),
              creditAmount: 0,
            },
            {
              accountId: cpAccounts.receivableAccountId,
              description: `Pelunasan piutang kredit #${input.creditSaleId}`,
              debitAmount: 0,
              creditAmount: Number(input.amount),
            },
          ],
        });
      } catch (glErr) {
        console.error(`[GL] Credit Payment journal failed — bizId=${bizId} saleId=${input.creditSaleId} amount=${input.amount}:`, glErr);
      }

      // ─── AUDIT LOG: Log successful credit payment ───
      await createAuditLog({
        businessId: bizId,
        userId: ctx.user.id,
        action: "create",
        entityType: "credit_payment",
        entityId: id,
        details: { creditSaleId: input.creditSaleId, amount: input.amount },
      });

      return { success: true, id };
    }),

    payments: protectedProcedure.input(z.object({
      creditSaleId: z.number(),
    })).query(async ({ ctx, input }) => {
      return getCreditPaymentsForSale(input.creditSaleId);
    }),
  }),

  // ─── Notifications ───
  notification: router({
    sendTaxReminder: protectedProcedure.mutation(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const taxes = await calcTaxForMonth(biz.id, month, year);
      const totalTax = taxes.reduce((sum, t) => sum + t.amount, 0);
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const dueDate = `15 ${BULAN_INDONESIA[nextMonth - 1]} ${nextYear}`;
      const title = `Pengingat Pajak - ${biz.businessName}`;
      const content = [
        `Halo ${biz.businessName}!`,
        ``,
        `Estimasi pajak Anda untuk periode ${BULAN_INDONESIA[month - 1]} ${year}:`,
        `Total: ${formatRupiah(totalTax)}`,
        ``,
        ...taxes.filter(t => t.amount > 0).map(t => `- ${t.taxName}: ${formatRupiah(t.amount)}`),
        ``,
        `Batas pembayaran: ${dueDate}`,
        ``,
        `Segera lakukan pembayaran untuk menghindari denda.`,
        ``,
        `— County`,
      ].join("\n");
      const sent = await notifyOwner({ title, content });
      return { sent, totalTax, dueDate };
    }),
    sendMonthlyDigest: adminProcedure.mutation(async () => {
      const allBiz = await getAllBusinesses();
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      let sentCount = 0;
      for (const biz of allBiz) {
        try {
          const taxes = await calcTaxForMonth(biz.id, month, year);
          const totalTax = taxes.reduce((sum, t) => sum + t.amount, 0);
          if (totalTax <= 0) continue;
          const nextMonth = month === 12 ? 1 : month + 1;
          const nextYear = month === 12 ? year + 1 : year;
          const dueDate = `15 ${BULAN_INDONESIA[nextMonth - 1]} ${nextYear}`;
          const title = `Pengingat Pajak Bulanan - ${biz.businessName}`;
          const content = `Estimasi pajak ${BULAN_INDONESIA[month - 1]} ${year}: ${formatRupiah(totalTax)}. Batas setor: ${dueDate}.`;
          await notifyOwner({ title, content });
          sentCount++;
        } catch (e) { /* skip failed */ }
      }
      return { sentCount, total: allBiz.length };
    }),
  }),

  // ─── AI Receipt Scanner (tRPC) ───
  ai: router({
    scanReceipt: protectedProcedure.input(z.object({
      imageBase64: z.string(), // base64 encoded image WITHOUT data: prefix
      mimeType: z.string().default("image/jpeg"),
    })).mutation(async ({ input }) => {
      const { imageBase64, mimeType } = input;
      try {
        const response = await fetch(`${process.env.BUILT_IN_FORGE_API_URL}/v1/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.BUILT_IN_FORGE_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gemini-2.0-flash",
            messages: [{
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: `data:${mimeType};base64,${imageBase64}` },
                },
                {
                  type: "text",
                  text: `Kamu adalah asisten pencatatan keuangan UMKM Indonesia. Analisis struk/nota/kwitansi ini dan ekstrak informasi berikut dalam format JSON. Jika tidak ada informasi, gunakan null.

Format JSON yang WAJIB dikembalikan (hanya JSON, tanpa teks lain):
{
  "type": "income" atau "expense",
  "amount": angka total dalam rupiah (tanpa titik/koma),
  "description": "deskripsi singkat transaksi",
  "category": "kategori (contoh: Pembelian Bahan Baku, Penjualan, Biaya Operasional, dll)",
  "date": "YYYY-MM-DD atau null jika tidak ada",
  "items": [{"name": "nama item", "qty": jumlah, "price": harga satuan, "subtotal": subtotal}],
  "vendor": "nama toko/vendor atau null",
  "notes": "catatan tambahan atau null"
}

Penting: Kembalikan HANYA JSON valid, tidak ada teks penjelasan.`,
                },
              ],
            }],
            max_tokens: 1000,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `AI API error: ${errText}` });
        }

        const data = await response.json() as any;
        const content = data?.choices?.[0]?.message?.content ?? "";

        // Parse JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI tidak dapat membaca struk ini. Coba foto yang lebih jelas." });
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          type: parsed.type ?? "expense",
          amount: typeof parsed.amount === "number" ? parsed.amount : parseInt(String(parsed.amount ?? "0").replace(/\D/g, "")) || 0,
          description: parsed.description ?? "",
          category: parsed.category ?? "",
          date: parsed.date ?? new Date().toISOString().substring(0, 10),
          items: parsed.items ?? [],
          vendor: parsed.vendor ?? null,
          notes: parsed.notes ?? null,
        };
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err?.message ?? "Gagal memproses struk" });
      }
    }),
  }),

  // ─── Product Compositions (COGS) ───
  composition: router({
    list: protectedProcedure.input(z.object({ productId: z.number() })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) return { compositions: [], totalCogs: 0 };
      const product = await getProductById(input.productId);
      if (!product || product.businessId !== biz.id) return { compositions: [], totalCogs: 0 };
      const compositions = await getCompositionsByProduct(input.productId);
      const totalCogs = calculateCOGS(compositions);
      return { compositions, totalCogs };
    }),
    create: protectedProcedure.input(z.object({
      productId: z.number(),
      materialName: z.string().min(1),
      materialProductId: z.number().optional(),
      qty: z.number().min(0.001),
      unit: z.string().default("pcs"),
      costPerUnit: z.number().min(0),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND", message: "Bisnis tidak ditemukan" });
      const product = await getProductById(input.productId);
      if (!product || product.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      const id = await createComposition({ ...input, qty: String(input.qty) });
      // Recalculate and update product HPP
      const compositions = await getCompositionsByProduct(input.productId);
      const totalCogs = calculateCOGS(compositions);
      await updateProduct(input.productId, { hpp: Math.round(totalCogs) });
      return { id, totalCogs: Math.round(totalCogs) };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      materialName: z.string().optional(),
      materialProductId: z.number().nullable().optional(),
      qty: z.number().min(0.001).optional(),
      unit: z.string().optional(),
      costPerUnit: z.number().min(0).optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const comp = await getCompositionById(input.id);
      if (!comp) throw new TRPCError({ code: "NOT_FOUND" });
      const product = await getProductById(comp.productId);
      if (!product || product.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      const { id, ...data } = input;
      const updateData: any = { ...data };
      if (data.qty !== undefined) updateData.qty = String(data.qty);
      await updateComposition(id, updateData);
      // Recalculate HPP
      const compositions = await getCompositionsByProduct(comp.productId);
      const totalCogs = calculateCOGS(compositions);
      await updateProduct(comp.productId, { hpp: Math.round(totalCogs) });
      return { success: true, totalCogs: Math.round(totalCogs) };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const comp = await getCompositionById(input.id);
      if (!comp) throw new TRPCError({ code: "NOT_FOUND" });
      const product = await getProductById(comp.productId);
      if (!product || product.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      await deleteComposition(input.id);
      // Recalculate HPP
      const compositions = await getCompositionsByProduct(comp.productId);
      const totalCogs = calculateCOGS(compositions);
      await updateProduct(comp.productId, { hpp: Math.round(totalCogs) });
      return { success: true, totalCogs: Math.round(totalCogs) };
    }),
  }),

  // ─── Production Management ───
  production: router({
    run: protectedProcedure.input(z.object({
      productId: z.number(),
      qty: z.number().min(1),
      date: z.string(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const result = await runProduction(biz.id, input.productId, input.qty, input.date, input.notes);

      // ─── GL: Production — DR Persediaan Barang Jadi, CR Bahan Baku ───
      if (result.totalCost > 0) {
        try {
          const prodAccounts = await resolveAccountsForProduction(biz.id);
          await createJournalEntry({
            businessId: biz.id,
            date: input.date,
            description: `Produksi: ${input.notes || `Produk #${input.productId}`} x${input.qty}`,
            sourceType: "production",
            sourceId: result.logId || 0,
            lines: [
              { accountId: prodAccounts.finishedGoodsAccountId, debitAmount: result.totalCost, creditAmount: 0, description: "Persediaan barang jadi bertambah" },
              { accountId: prodAccounts.rawMaterialAccountId, debitAmount: 0, creditAmount: result.totalCost, description: "Bahan baku berkurang" },
            ],
          });
        } catch (e) { console.error("GL Production error:", e); }
      }

      return result;
    }),

    logs: protectedProcedure.input(z.object({
      productId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) return [];
      return getProductionLogs(biz.id, input.productId, input.startDate, input.endDate);
    }),

    costReport: protectedProcedure.input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getProductionCostReport(biz.id, input.startDate, input.endDate);
    }),
  }),

  // ─── Search Products (for scan-to-stock matching) ───
  searchProducts: protectedProcedure.input(z.object({ name: z.string() })).query(async ({ ctx, input }) => {
    const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
    if (!biz) return [];
    return searchProductsByName(biz.id, input.name);
  }),

  // ─── Product Categories (user-defined) ───
  category: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) return [];
      return getProductCategories(biz.id);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1).max(100),
      parentId: z.number().nullable().optional(),
      sortOrder: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const cat = await createProductCategory({ businessId: biz.id, name: input.name, parentId: input.parentId ?? null, sortOrder: input.sortOrder ?? 0 });
      return cat;
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().min(1).max(100).optional(),
      parentId: z.number().nullable().optional(),
      sortOrder: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const { id, ...data } = input;
      await updateProductCategory(id, biz.id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      await deleteProductCategory(input.id, biz.id);
      return { success: true };
    }),
  }),

  // ─── Super Admin ───
  admin: router({
    businesses: adminProcedure.query(() => getAllBusinesses()),
    users: adminProcedure.query(() => getAllUsers()),
    updateBusiness: adminProcedure.input(z.object({
      id: z.number(),
      plan: z.enum(["free", "pro", "pro_plus"]).optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateBusiness(id, data);
      return { success: true };
    }),
    deleteUser: adminProcedure.input(z.object({
      userId: z.number(),
    })).mutation(async ({ input }) => {
      const result = await deleteUserWithAllData(input.userId);
      return result;
    }),
    // Pro Link management
    createProLink: adminProcedure.input(z.object({
      email: z.string().email("Email tidak valid"),
      buyerName: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { id, token } = await createProLink(input);
      return { success: true, id, token };
    }),
    listProLinks: adminProcedure.query(() => listProLinks()),
    deleteProLink: adminProcedure.input(z.object({
      id: z.number(),
    })).mutation(async ({ input }) => {
      await deleteProLink(input.id);
      return { success: true };
    }),
    // Dummy data management
    seedDummyData: adminProcedure.input(z.object({
      businessId: z.number(),
    })).mutation(async ({ input }) => {
      const result = await seedDummyData(input.businessId);
      return result;
    }),
    clearBusinessData: adminProcedure.input(z.object({
      businessId: z.number(),
    })).mutation(async ({ input }) => {
      const result = await clearBusinessData(input.businessId);
      return result;
    }),
    // Reconcile stock: recalculate products.stockCurrent from SUM(warehouse_stock)
    reconcileStock: adminProcedure.input(z.object({
      businessId: z.number().optional(), // if omitted, reconcile ALL businesses
    })).mutation(async ({ input }) => {
      const businesses = input.businessId
        ? [await getBusinessById(input.businessId)].filter(Boolean)
        : await getAllBusinesses();
      let totalFixed = 0;
      const details: { businessId: number; businessName: string; productId: number; productName: string; oldStock: number; newStock: number }[] = [];
      for (const biz of businesses) {
        if (!biz) continue;
        const products = await getProductsByBusiness(biz.id);
        for (const p of products) {
          const oldStock = p.stockCurrent;
          const newStock = await recalcProductStockFromWarehouses(p.id);
          if (oldStock !== newStock) {
            totalFixed++;
            details.push({ businessId: biz.id, businessName: biz.name, productId: p.id, productName: p.name, oldStock, newStock });
          }
        }
      }
      return { totalFixed, details };
    }),
  }),

  // ─── Pro Link Activation (Public) ───
  proLink: router({
    validate: publicProcedure.input(z.object({
      token: z.string().min(1),
    })).query(async ({ input }) => {
      const link = await getProLinkByToken(input.token);
      if (!link) return { valid: false, error: "Link tidak ditemukan" };
      if (link.isUsed) return { valid: false, error: "Link sudah digunakan" };
      if (link.expiresAt && link.expiresAt < new Date()) return { valid: false, error: "Link sudah kadaluarsa" };
      return { valid: true, email: link.email, buyerName: link.buyerName };
    }),
    activate: protectedProcedure.input(z.object({
      token: z.string().min(1),
    })).mutation(async ({ ctx, input }) => {
      const link = await getProLinkByToken(input.token);
      if (!link) throw new TRPCError({ code: "NOT_FOUND", message: "Link tidak ditemukan" });
      if (link.isUsed) {
        // Link already used — check if it was used by this same user (idempotent)
        if (link.usedByUserId === ctx.user.id) {
          return { success: true, message: "Akun Pro Anda sudah aktif!" };
        }
        throw new TRPCError({ code: "BAD_REQUEST", message: "Link sudah digunakan" });
      }
      if (link.expiresAt && link.expiresAt < new Date()) throw new TRPCError({ code: "BAD_REQUEST", message: "Link sudah kadaluarsa" });

      // Get business for user
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Silakan selesaikan setup bisnis terlebih dahulu, lalu klik link Pro lagi." });
      }

      // If already Pro, just mark the link as used and return success
      if (biz.plan === "pro") {
        await markProLinkUsed(link.id, ctx.user.id);
        return { success: true, message: "Akun Pro Anda sudah aktif!" };
      }

      // Upgrade to Pro — mark link used FIRST to prevent race conditions
      try {
        await markProLinkUsed(link.id, ctx.user.id);
        await upgradeBusinessToPro(biz.id, `pro-link-${link.token.substring(0, 8)}`);
      } catch (err) {
        console.error("[ProLink] Activation error:", err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Gagal mengaktifkan Pro. Silakan coba lagi atau hubungi admin." });
      }

      // Notify owner (non-blocking — don't let notification failure break activation)
      try {
        await notifyOwner({ title: "\ud83c\udf89 Pro Activation!", content: `${ctx.user.name ?? ctx.user.email ?? "User"} (${link.email}) berhasil aktivasi Pro via link.` });
      } catch (e) {
        console.error("[ProLink] Notification failed (non-critical):", e);
      }

      return { success: true, message: "Selamat! Akun Anda berhasil di-upgrade ke Pro!" };
    }),
   }),
  bankAccount: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) return [];
      return getBankAccountsByBusiness(biz.id);
    }),
    balances: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) return [] as any[];
      const accounts = await getBankAccountsByBusiness(biz.id);
      if (accounts.length === 0) return [] as any[];
      const names = accounts.map(a => a.accountName);
      const balances = await getBalancesByAccounts(biz.id, names);
      return accounts.map(a => {
        const b = balances[a.accountName] || { income: 0, expense: 0 };
        return {
          ...a,
          totalIncome: b.income,
          totalExpense: b.expense,
          currentBalance: a.initialBalance + b.income - b.expense,
        };
      });
    }),
    create: protectedProcedure.input(z.object({
      accountName: z.string().min(1),
      accountType: z.enum(["bank", "ewallet", "cash"]),
      icon: z.string().default("\ud83c\udfe6"),
      color: z.string().default("#3b82f6"),
      description: z.string().optional(),
      initialBalance: z.number().default(0),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND", message: "Bisnis tidak ditemukan" });
      const id = await safeInsertBankAccount({ ...input, businessId: biz.id });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      accountName: z.string().optional(),
      accountType: z.enum(["bank", "ewallet", "cash"]).optional(),
      icon: z.string().optional(),
      color: z.string().optional(),
      description: z.string().nullable().optional(),
      initialBalance: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const account = await getBankAccountById(input.id);
      if (!account || account.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      const { id, ...data } = input;
      await updateBankAccount(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const account = await getBankAccountById(input.id);
      if (!account || account.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      await deleteBankAccount(input.id);
      return { success: true };
    }),
    transfer: protectedProcedure.input(z.object({
      fromAccount: z.string(),
      toAccount: z.string(),
      amount: z.number().positive(),
      date: z.string(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      if (input.fromAccount === input.toAccount) throw new TRPCError({ code: "BAD_REQUEST", message: "Akun asal dan tujuan harus berbeda" });
      const result = await createTransferBetweenAccounts(biz.id, input.fromAccount, input.toAccount, input.amount, input.date, input.notes);

      // ─── GL: Bank Transfer — DR Bank-target, CR Bank-source ───
      try {
        // Resolve bank account IDs from names
        const bankAccounts = await getBankAccountsByBusiness(biz.id);
        const fromBA = bankAccounts.find((a: any) => a.accountName === input.fromAccount || a.id === Number(input.fromAccount));
        const toBA = bankAccounts.find((a: any) => a.accountName === input.toAccount || a.id === Number(input.toAccount));
        const transferAccounts = await resolveAccountsForBankTransfer(biz.id, fromBA?.id || null, toBA?.id || null);
        await createJournalEntry({
          businessId: biz.id,
          date: input.date,
          description: `Transfer: ${input.fromAccount} → ${input.toAccount}`,
          sourceType: "bank_transfer",
          sourceId: result.outTxId,
          lines: [
            { accountId: transferAccounts.toCoAId, debitAmount: input.amount, creditAmount: 0, description: `Masuk ke ${input.toAccount}` },
            { accountId: transferAccounts.fromCoAId, debitAmount: 0, creditAmount: input.amount, description: `Keluar dari ${input.fromAccount}` },
          ],
        });
      } catch (e) { console.error("GL Bank Transfer error:", e); }

      return result;
    }),
  }),

  // ─── Client Management ───
  clientMgmt: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) return [];
      return getClientsByBusiness(biz.id);
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const client = await getClientById(input.id);
      if (!client || client.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      return client;
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      email: z.string().optional(),
      phone: z.string().optional(),
      company: z.string().optional(),
      address: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const id = await createClient({ ...input, businessId: biz.id });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      company: z.string().optional(),
      address: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const client = await getClientById(input.id);
      if (!client || client.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      const { id, ...data } = input;
      await updateClient(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const client = await getClientById(input.id);
      if (!client || client.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      await deleteClient(input.id);
      return { success: true };
    }),
    transactions: protectedProcedure.input(z.object({ clientId: z.number() })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) return [];
      return getTransactionsByClient(biz.id, input.clientId);
    }),
  }),

  // ─── Debts / Receivables (Hutang & Piutang) ───
  debt: router({
    list: protectedProcedure.input(z.object({ type: z.enum(["hutang", "piutang"]).optional() }).optional()).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) return [];
      return getDebtsByBusiness(biz.id, input?.type);
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const debt = await getDebtById(input.id);
      if (!debt || debt.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      return debt;
    }),
    create: protectedProcedure.input(z.object({
      type: z.enum(["hutang", "piutang"]),
      counterpartyName: z.string().min(1),
      clientId: z.number().optional(),
      description: z.string().optional(),
      totalAmount: z.number().positive(),
      dueDate: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const id = await createDebt({ ...input, businessId: biz.id });

      // ─── GL JOURNAL: Debt Create (best-effort, non-blocking) ───
      try {
        const debtAccounts = await resolveAccountsForDebt(biz.id, input.type, null);

        const journalLines: Array<{ accountId: number; description: string; debitAmount: number; creditAmount: number }> = [];

        if (input.type === "hutang") {
          // Kita berhutang: DR Kas (uang masuk), CR Hutang Lain-lain
          journalLines.push({
            accountId: debtAccounts.cashAccountId,
            description: `Terima pinjaman dari ${input.counterpartyName}`,
            debitAmount: Number(input.totalAmount),
            creditAmount: 0,
          });
          journalLines.push({
            accountId: debtAccounts.debtAccountId,
            description: `Hutang ke ${input.counterpartyName}`,
            debitAmount: 0,
            creditAmount: Number(input.totalAmount),
          });
        } else {
          // Orang berhutang ke kita: DR Piutang Lain-lain, CR Kas (uang keluar)
          journalLines.push({
            accountId: debtAccounts.debtAccountId,
            description: `Piutang dari ${input.counterpartyName}`,
            debitAmount: Number(input.totalAmount),
            creditAmount: 0,
          });
          journalLines.push({
            accountId: debtAccounts.cashAccountId,
            description: `Pinjamkan uang ke ${input.counterpartyName}`,
            debitAmount: 0,
            creditAmount: Number(input.totalAmount),
          });
        }

        await createJournalEntry({
          businessId: biz.id,
          date: new Date().toISOString().substring(0, 10),
          description: `${input.type === "hutang" ? "Hutang" : "Piutang"}: ${input.counterpartyName} — Rp ${input.totalAmount.toLocaleString("id-ID")}`,
          sourceType: "debt_create",
          sourceId: id,
          lines: journalLines,
        });
      } catch (glErr) {
        console.error(`[GL] Debt Create journal failed — bizId=${biz.id} type=${input.type} amount=${input.totalAmount} counterparty=${input.counterpartyName}:`, glErr);
      }

      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      counterpartyName: z.string().optional(),
      description: z.string().optional(),
      totalAmount: z.number().positive().optional(),
      dueDate: z.string().optional(),
      notes: z.string().optional(),
      status: z.enum(["belum_lunas", "lunas", "terlambat"]).optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const debt = await getDebtById(input.id);
      if (!debt || debt.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      const { id, ...data } = input;
      await updateDebt(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const debt = await getDebtById(input.id);
      if (!debt || debt.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      await deleteDebt(input.id);
      return { success: true };
    }),
    payments: protectedProcedure.input(z.object({ debtId: z.number() })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) return [];
      const debt = await getDebtById(input.debtId);
      if (!debt || debt.businessId !== biz.id) return [];
      return getDebtPayments(input.debtId);
    }),
    addPayment: protectedProcedure.input(z.object({
      debtId: z.number(),
      amount: z.number().positive(),
      paymentDate: z.string(),
      paymentMethod: z.string().default("tunai"),
      bankAccountName: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const debt = await getDebtById(input.debtId);
      if (!debt || debt.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      const remaining = debt.totalAmount - debt.paidAmount;
      if (input.amount > remaining) throw new TRPCError({ code: "BAD_REQUEST", message: `Pembayaran melebihi sisa (${remaining})` });

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const id = await db.transaction(async (tx) => {
        // Insert payment inside transaction
        const [result] = await tx.insert(debtPayments).values({
          debtId: input.debtId,
          amount: input.amount,
          paymentDate: input.paymentDate,
          paymentMethod: input.paymentMethod,
          notes: input.notes,
        });

        // Read and update parent debt atomically
        const [debtRecord] = await tx.select().from(debts).where(eq(debts.id, input.debtId));
        if (debtRecord) {
          const newPaid = debtRecord.paidAmount + input.amount;
          const newStatus = newPaid >= debtRecord.totalAmount ? "lunas" : "belum_lunas";
          await tx.update(debts).set({ paidAmount: newPaid, status: newStatus }).where(eq(debts.id, input.debtId));
        }

        // Auto-create journal transaction inside same tx
        const txCode = await generateTxCode(biz.id);
        const paymentAccount = input.bankAccountName || input.paymentMethod;

        // Resolve bankAccountId from paymentMethod name
        let bankAccountId: number | undefined;
        const accounts = await getBankAccountsByBusiness(biz.id);
        const matchedAccount = accounts.find(a => a.accountName === paymentAccount);
        if (matchedAccount) {
          bankAccountId = matchedAccount.id;
        }

        if (debt.type === "hutang") {
          // Hutang: kita bayar hutang → pengeluaran dari rekening kita
          const txData: any = {
            businessId: biz.id,
            txCode: String(txCode).trim(),
            date: String(input.paymentDate).trim(),
            type: "pengeluaran",
            category: "Pembayaran Hutang",
            description: `Bayar hutang ke ${debt.counterpartyName}`,
            amount: input.amount,
            paymentMethod: paymentAccount,
            taxRelated: false,
            notes: `Hutang ke ${debt.counterpartyName} — sisa ${formatRupiah(remaining - input.amount)}${input.notes ? " | " + input.notes : ""}`,
          };
          if (bankAccountId) txData.bankAccountId = bankAccountId;
          await tx.insert(transactions).values(txData);
        } else {
          // Piutang: orang bayar ke kita → pemasukan ke rekening kita
          const txData: any = {
            businessId: biz.id,
            txCode: String(txCode).trim(),
            date: String(input.paymentDate).trim(),
            type: "pemasukan",
            category: "Penerimaan Piutang",
            description: `Terima pembayaran piutang dari ${debt.counterpartyName}`,
            amount: input.amount,
            paymentMethod: paymentAccount,
            taxRelated: false,
            notes: `Piutang dari ${debt.counterpartyName} — sisa ${formatRupiah(remaining - input.amount)}${input.notes ? " | " + input.notes : ""}`,
          };
          if (bankAccountId) txData.bankAccountId = bankAccountId;
          await tx.insert(transactions).values(txData);
        }

        return result.insertId;
      });

      // ─── GL JOURNAL: Debt Payment (best-effort, non-blocking) ───
      try {
        const accounts = await getBankAccountsByBusiness(biz.id);
        const matchedBankId = resolveBankAccountId(accounts, input.bankAccountName || input.paymentMethod);
        const dpAccounts = await resolveAccountsForDebt(biz.id, debt.type as "hutang" | "piutang", matchedBankId ?? null);

        const journalLines: Array<{ accountId: number; description: string; debitAmount: number; creditAmount: number }> = [];

        if (debt.type === "hutang") {
          // Bayar hutang: DR Hutang Lain-lain, CR Kas/Bank
          journalLines.push({
            accountId: dpAccounts.debtAccountId,
            description: `Bayar hutang ke ${debt.counterpartyName}`,
            debitAmount: Number(input.amount),
            creditAmount: 0,
          });
          journalLines.push({
            accountId: dpAccounts.cashAccountId,
            description: `Pembayaran hutang`,
            debitAmount: 0,
            creditAmount: Number(input.amount),
          });
        } else {
          // Terima piutang: DR Kas/Bank, CR Piutang Lain-lain
          journalLines.push({
            accountId: dpAccounts.cashAccountId,
            description: `Terima piutang dari ${debt.counterpartyName}`,
            debitAmount: Number(input.amount),
            creditAmount: 0,
          });
          journalLines.push({
            accountId: dpAccounts.debtAccountId,
            description: `Pelunasan piutang`,
            debitAmount: 0,
            creditAmount: Number(input.amount),
          });
        }

        await createJournalEntry({
          businessId: biz.id,
          date: input.paymentDate,
          description: `${debt.type === "hutang" ? "Bayar Hutang" : "Terima Piutang"}: ${debt.counterpartyName} — Rp ${input.amount.toLocaleString("id-ID")}`,
          sourceType: "debt_payment",
          sourceId: id,
          lines: journalLines,
        });
      } catch (glErr) {
        console.error(`[GL] Debt Payment journal failed — bizId=${biz.id} debtId=${input.debtId} amount=${input.amount}:`, glErr);
      }

      // ─── AUDIT LOG: Log successful debt payment ───
      await createAuditLog({
        businessId: biz.id,
        userId: ctx.user.id,
        action: "create",
        entityType: "debt_payment",
        entityId: id,
        details: { debtId: input.debtId, amount: input.amount, debtType: debt.type },
      });

      return { id };
    }),
    deletePayment: protectedProcedure.input(z.object({ id: z.number(), debtId: z.number() })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const debt = await getDebtById(input.debtId);
      if (!debt || debt.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      await deleteDebtPayment(input.id, input.debtId);
      return { success: true };
    }),
  }),

  // ─── Budget Management ───
  budget: router({
    list: protectedProcedure.input(z.object({ period: z.string().optional() }).optional()).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) return [];
      return getBudgetsByBusiness(biz.id, input?.period);
    }),
    create: protectedProcedure.input(z.object({
      period: z.string(),
      category: z.string().min(1),
      budgetAmount: z.number().min(1),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const id = await createBudget({ ...input, businessId: biz.id });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      category: z.string().optional(),
      budgetAmount: z.number().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const budget = await getBudgetById(input.id);
      if (!budget || budget.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      const { id, ...data } = input;
      await updateBudget(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const budget = await getBudgetById(input.id);
      if (!budget || budget.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      await deleteBudget(input.id);
      return { success: true };
    }),
    spending: protectedProcedure.input(z.object({ period: z.string() })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) return {};
      return getSpendingByCategory(biz.id, input.period);
    }),
  }),

  // ─── Settings (Calculator, Signature) ───
  settings: router({
    toggleCalculator: protectedProcedure.input(z.object({ enabled: z.boolean() })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      await updateBusinessCalculator(biz.id, input.enabled);
      return { success: true };
    }),
    updateSignature: protectedProcedure.input(z.object({ signatureUrl: z.string().nullable() })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      await updateBusinessSignature(biz.id, input.signatureUrl);
      return { success: true };
    }),
  }),

  // ─── Sales Analytics ───
  analytics: router({
    sales: protectedProcedure.input(z.object({ year: z.number() })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) return null;
      return getSalesAnalytics(biz.id, input.year);
    }),
  }),

  // ─── Due Date Notifications ───
  notifications: router({
    dueDates: protectedProcedure.input(z.object({ daysAhead: z.number().default(7) }).optional()).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) return { debts: [], invoices: [] };
      return getUpcomingDueDates(biz.id, input?.daysAhead ?? 7);
    }),
  }),

  // ─── Affiliate Management ───
  affiliate: router({
    // Public: resolve ref code to Scalev URL (used by landing page)
    resolve: publicProcedure
      .input(z.object({ refCode: z.string() }))
      .query(async ({ input }) => {
        const aff = await getAffiliateByRefCode(input.refCode.toLowerCase().trim());
        if (!aff || !aff.isActive) return null;
        // Track click
        await incrementAffiliateClick(input.refCode.toLowerCase().trim());
        return { name: aff.name, scalevUrl: aff.scalevUrl };
      }),

    // Admin: list all affiliates
    list: adminProcedure.query(async () => {
      return getAffiliates();
    }),

    // Admin: create affiliate
    create: adminProcedure
      .input(z.object({
        refCode: z.string().min(2).max(50),
        name: z.string().min(1),
        scalevUrl: z.string().url(),
        whatsapp: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Check if refCode already exists
        const existing = await getAffiliateByRefCode(input.refCode.toLowerCase().trim());
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Kode referral sudah digunakan" });
        return createAffiliate(input);
      }),

    // Admin: update affiliate
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        scalevUrl: z.string().url().optional(),
        whatsapp: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateAffiliate(id, data);
        return { success: true };
      }),

    // Admin: delete affiliate
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteAffiliate(input.id);
        return { success: true };
      }),
  }),

  // ═══════════════════════════════════════════════════════════
  // ─── Warehouse (Gudang) ───
  // ═══════════════════════════════════════════════════════════
  warehouse: router({
    // List all warehouses for the user's business
    list: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) return [];
      return getWarehousesByBusiness(biz.id);
    }),

    // Get a single warehouse
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getWarehouseById(input.id);
      }),

    // Get or create default warehouse
    ensureDefault: protectedProcedure.mutation(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND", message: "Bisnis tidak ditemukan" });
      return ensureDefaultWarehouse(biz.id);
    }),

    // Create a new warehouse
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        address: z.string().optional(),
        phone: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
        if (!biz) throw new TRPCError({ code: "NOT_FOUND", message: "Bisnis tidak ditemukan" });
        const id = await createWarehouse({
          businessId: biz.id,
          name: input.name,
          address: input.address,
          phone: input.phone,
          notes: input.notes,
          isDefault: false,
          isActive: true,
        });
        return { id };
      }),

    // Update warehouse
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateWarehouse(id, data);
        return { success: true };
      }),

    // Set a warehouse as default
    setDefault: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
        if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
        // Unset all defaults first
        const allWh = await getWarehousesByBusiness(biz.id);
        for (const wh of allWh) {
          if (wh.isDefault) await updateWarehouse(wh.id, { isDefault: false });
        }
        // Set new default
        await updateWarehouse(input.id, { isDefault: true });
        return { success: true };
      }),

    // Soft-delete warehouse
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const wh = await getWarehouseById(input.id);
        if (wh?.isDefault) throw new TRPCError({ code: "BAD_REQUEST", message: "Tidak bisa menghapus gudang utama" });
        await deleteWarehouse(input.id);
        return { success: true };
      }),

    // Get stock for a specific warehouse
    stock: protectedProcedure
      .input(z.object({ warehouseId: z.number() }))
      .query(async ({ input }) => {
        return getWarehouseStockByWarehouse(input.warehouseId);
      }),

    // Get warehouse distribution for a product
    productDistribution: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ ctx, input }) => {
        const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
        if (!biz) return [];
        const product = await getProductById(input.productId);
        if (!product || product.businessId !== biz.id) return [];
        return getWarehouseStockByProduct(input.productId, biz.id);
      }),

    // Transfer stock between warehouses
    transfer: protectedProcedure
      .input(z.object({
        fromWarehouseId: z.number(),
        toWarehouseId: z.number(),
        productId: z.number(),
        qty: z.number().positive(),
        date: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
        if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
        if (input.fromWarehouseId === input.toWarehouseId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Gudang asal dan tujuan harus berbeda" });
        }
        try {
          const result = await performStockTransfer({ businessId: biz.id, ...input });

          // ─── AUDIT LOG: Log successful stock transfer ───
          await createAuditLog({
            businessId: biz.id,
            userId: ctx.user.id,
            action: "create",
            entityType: "stock_transfer",
            entityId: result.transferId,
            details: { fromWarehouse: input.fromWarehouseId, toWarehouse: input.toWarehouseId, productId: input.productId, qty: input.qty },
          });

          return result;
        } catch (e: any) {
          throw new TRPCError({ code: "BAD_REQUEST", message: e.message });
        }
      }),

    // Get transfer history
    transfers: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
        if (!biz) return [];
        return getStockTransfersByBusiness(biz.id, input?.limit ?? 100);
      }),

    // Migrate existing stock to default warehouse (one-time)
    migrateStock: protectedProcedure.mutation(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      await migrateStockToDefaultWarehouse(biz.id);
      return { success: true };
    }),
  }),

  // ─── Team (Multi-Account + Role) ───
  team: router({
    // Get current user's team context: are they an owner or employee?
    myContext: protectedProcedure.query(async ({ ctx }) => {
      // First check if user owns a business
      const ownBiz = await getBusinessByOwnerId(ctx.user.id);
      // Then check if user is a team member of another business
      const memberships = await getTeamMembershipsByUser(ctx.user.id);
      return {
        isOwner: !!ownBiz,
        ownBusinessId: ownBiz?.id ?? null,
        ownBusinessName: ownBiz?.businessName ?? null,
        memberships: memberships.map(m => ({
          id: m.id,
          businessId: m.businessId,
          businessName: (m as any).businessName ?? "Bisnis",
          role: m.role,
          permissions: m.permissions,
          status: m.status,
          defaultCashAccountId: m.defaultCashAccountId ?? null,
        })),
      };
    }),

    // Admin: get all businesses for impersonation switcher
    adminAllBusinesses: adminProcedure.query(async () => {
      const allBiz = await getAllBusinesses();
      return allBiz.map((b: any) => ({
        id: b.id,
        name: b.businessName,
        plan: b.plan ?? "free",
      }));
    }),

    // Get role permissions map
    rolePermissions: protectedProcedure.query(() => {
      return { roles: ROLE_PERMISSIONS, labels: PERMISSION_LABELS };
    }),

    // List team members (owner only, Pro+ only)
    list: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) return [];
      if (biz.plan !== "pro_plus") return [];
      const members = await getTeamMembersByBusiness(biz.id);
      // Enrich with user info
      const userIds = members.map(m => m.userId);
      const usersData = await getUsersByIds(userIds);
      const userMap = new Map(usersData.map(u => [u.id, u]));
      return members.map(m => {
        const u = userMap.get(m.userId);
        return {
          ...m,
          userName: u?.name ?? "Unknown",
          userEmail: u?.email ?? "",
          userAvatar: (u as any)?.avatarUrl ?? null,
        };
      });
    }),

    // Create invite link (owner only, Pro+ only, max 5 members)
    invite: protectedProcedure.input(z.object({
      email: z.string().email(),
      role: z.enum(["manager", "kasir", "gudang", "viewer"]),
      permissions: z.record(z.string(), z.boolean()).optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND", message: "Bisnis tidak ditemukan" });
      if (biz.plan !== "pro_plus") throw new TRPCError({ code: "FORBIDDEN", message: "Fitur Multi Akun hanya tersedia untuk paket Pro+. Hubungi admin untuk upgrade." });
      // Enforce max 5 team members
      const existingMembers = await getTeamMembersByBusiness(biz.id);
      if (existingMembers.length >= 5) throw new TRPCError({ code: "FORBIDDEN", message: "Maksimal 5 karyawan per bisnis. Hapus anggota yang tidak aktif untuk menambah baru." });
      // Generate random token
      const token = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, "0")).join("");
      const permissions = input.permissions ?? ROLE_PERMISSIONS[input.role] ?? ROLE_PERMISSIONS.viewer;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const id = await createTeamInvite({
        businessId: biz.id,
        email: input.email,
        role: input.role as any,
        permissions,
        token,
        invitedBy: ctx.user.id,
        status: "pending",
        expiresAt,
      });
      return { id, token, expiresAt };
    }),

    // List pending invites (owner only, Pro+ only)
    invites: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) return [];
      if (biz.plan !== "pro_plus") return [];
      return getTeamInvitesByBusiness(biz.id);
    }),

    // Delete/cancel invite (owner only)
    cancelInvite: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      await deleteTeamInvite(input.id);
      return { success: true };
    }),

    // Accept invite (employee side)
    acceptInvite: protectedProcedure.input(z.object({ token: z.string() })).mutation(async ({ ctx, input }) => {
      const invite = await getTeamInviteByToken(input.token);
      if (!invite) throw new TRPCError({ code: "NOT_FOUND", message: "Undangan tidak ditemukan" });
      if (invite.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Undangan sudah digunakan atau expired" });
      if (new Date() > invite.expiresAt) {
        await updateTeamInviteStatus(invite.id, "expired");
        throw new TRPCError({ code: "BAD_REQUEST", message: "Undangan sudah expired" });
      }
      // Check if already a member
      const existing = await getTeamMemberByUserAndBusiness(ctx.user.id, invite.businessId);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Anda sudah menjadi anggota tim ini" });
      // Create team member
      await createTeamMember({
        businessId: invite.businessId,
        userId: ctx.user.id,
        role: invite.role as any,
        permissions: invite.permissions as Record<string, boolean>,
        invitedBy: invite.invitedBy,
        status: "active",
      });
      // Mark invite as accepted
      await updateTeamInviteStatus(invite.id, "accepted");
      return { success: true, businessId: invite.businessId };
    }),

    // Update member role/permissions (owner only)
    updateMember: protectedProcedure.input(z.object({
      memberId: z.number(),
      role: z.enum(["manager", "kasir", "gudang", "viewer"]).optional(),
      permissions: z.record(z.string(), z.boolean()).optional(),
      status: z.enum(["active", "suspended"]).optional(),
      defaultCashAccountId: z.number().nullable().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const member = await getTeamMemberById(input.memberId);
      if (!member || member.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      const updates: any = {};
      if (input.role) updates.role = input.role;
      if (input.permissions) updates.permissions = input.permissions;
      if (input.status) updates.status = input.status;
      if (input.defaultCashAccountId !== undefined) updates.defaultCashAccountId = input.defaultCashAccountId;
      await updateTeamMember(input.memberId, updates);
      return { success: true };
    }),

    // Remove member (owner only)
    removeMember: protectedProcedure.input(z.object({ memberId: z.number() })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const member = await getTeamMemberById(input.memberId);
      if (!member || member.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      await deleteTeamMember(input.memberId);
      return { success: true };
    }),

    // Employee: leave team
    leave: protectedProcedure.input(z.object({ membershipId: z.number() })).mutation(async ({ ctx, input }) => {
      const member = await getTeamMemberById(input.membershipId);
      if (!member || member.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
      await deleteTeamMember(input.membershipId);
      return { success: true };
    }),
  }),

  // ─── POS Shifts ───
  posShift: router({
    // Get open shift for current user
    current: protectedProcedure.query(async ({ ctx }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) return null;
      return getOpenShift(resolved.business.id, ctx.user.id);
    }),

    // Open a new shift
    open: protectedProcedure.input(z.object({
      openingCash: z.number().min(0),
      warehouseId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND" });
      const bizId = resolved.business.id;

      // Check if already has an open shift
      const existing = await getOpenShift(bizId, ctx.user.id);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Shift sudah terbuka. Tutup shift terlebih dahulu." });

      const id = await createPosShift({
        businessId: bizId,
        userId: ctx.user.id,
        openingCash: input.openingCash,
        warehouseId: input.warehouseId ?? null,
      });
      return { id };
    }),

    // Close current shift
    close: protectedProcedure.input(z.object({
      shiftId: z.number(),
      closingCash: z.number().min(0),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const shift = await getPosShiftById(input.shiftId);
      if (!shift || shift.userId !== ctx.user.id || shift.status !== "open")
        throw new TRPCError({ code: "NOT_FOUND", message: "Shift tidak ditemukan atau sudah ditutup." });

      const expectedCash = shift.openingCash + shift.totalSales - shift.totalRefunds;
      await closePosShift(input.shiftId, {
        closingCash: input.closingCash,
        expectedCash,
        cashDifference: input.closingCash - expectedCash,
        totalSales: shift.totalSales,
        totalTransactions: shift.totalTransactions,
        totalRefunds: shift.totalRefunds,
        notes: input.notes,
      });
      return { success: true, expectedCash, difference: input.closingCash - expectedCash };
    }),

    // List shifts
    list: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) return [];
      return getShiftsByBusiness(resolved.business.id, input?.limit ?? 50);
    }),
  }),

  // ─── Discount Codes ───
  discount: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) return [];
      return getDiscountCodesByBusiness(resolved.business.id);
    }),

    create: protectedProcedure.input(z.object({
      code: z.string().min(1).max(50),
      name: z.string().min(1).max(255),
      discountType: z.enum(["percentage", "fixed"]),
      discountValue: z.number().min(0),
      minPurchase: z.number().min(0).default(0),
      maxDiscount: z.number().optional(),
      maxUses: z.number().optional(),
      validFrom: z.string().optional(),
      validUntil: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND" });
      const id = await createDiscountCode({
        ...input,
        code: input.code.toUpperCase(),
        businessId: resolved.business.id,
        maxDiscount: input.maxDiscount ?? null,
        maxUses: input.maxUses ?? null,
        validFrom: input.validFrom ?? null,
        validUntil: input.validUntil ?? null,
      });
      return { id };
    }),

    validate: protectedProcedure.input(z.object({
      code: z.string(),
      subtotal: z.number().min(0),
    })).query(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) return { valid: false as const, message: "Bisnis tidak ditemukan" };

      const discount = await validateDiscountCode(resolved.business.id, input.code);
      if (!discount) return { valid: false as const, message: "Kode diskon tidak valid atau sudah kedaluwarsa" };
      if (input.subtotal < discount.minPurchase)
        return { valid: false as const, message: `Minimal pembelian ${formatRupiah(discount.minPurchase)}` };

      let amount = 0;
      if (discount.discountType === "percentage") {
        amount = Math.round(input.subtotal * discount.discountValue / 100);
        if (discount.maxDiscount && amount > discount.maxDiscount) amount = discount.maxDiscount;
      } else {
        amount = discount.discountValue;
      }

      return {
        valid: true as const,
        discount: {
          id: discount.id,
          code: discount.code,
          name: discount.name,
          type: discount.discountType,
          value: discount.discountValue,
          amount,
        },
      };
    }),

    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      isActive: z.boolean().optional(),
      maxUses: z.number().optional(),
      validUntil: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateDiscountCode(id, data);
      return { success: true };
    }),

    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteDiscountCode(input.id);
      return { success: true };
    }),
  }),

  // ─── POS Receipts (checkout with split payment, discount, refund) ───
  posReceipt: router({
    list: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) return [];
      return getPosReceiptsByBusiness(resolved.business.id, input?.limit ?? 50);
    }),

    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND" });
      const bizId = resolved.business.id;

      const receipt = await getPosReceiptById(input.id);
      // Multi-tenant fix: verify receipt belongs to this business
      if (!receipt || receipt.businessId !== bizId) throw new TRPCError({ code: "NOT_FOUND" });
      return receipt;
    }),

    // Create receipt (checkout with split payment support)
    create: protectedProcedure.input(z.object({
      subtotal: z.number().min(0),
      discountAmount: z.number().default(0),
      discountCodeId: z.number().optional(),
      grandTotal: z.number().min(1, "Total harus lebih dari 0"),
      payments: z.array(z.object({
        method: z.string(),
        amount: z.number().min(1, "Jumlah pembayaran harus lebih dari 0"),
      })),
      customerPaid: z.number(),
      changeAmount: z.number().default(0),
      shiftId: z.number().optional(),
      clientId: z.number().optional(),
      notes: z.string().optional(),
      date: z.string().optional(), // Allow past dates for makeup entries
      // Cart items for receipt + stock reduction
      items: z.array(z.object({
        productId: z.number(),
        productName: z.string().default(""),
        productQty: z.number(),
        unitPrice: z.number().default(0),
        amount: z.number(),
        hppSnapshot: z.number().optional(),
        warehouseId: z.number().optional(),
      })),
    })).mutation(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND" });
      const bizId = resolved.business.id;
      const saleDate = input.date || new Date().toISOString().slice(0, 10);

      // Pre-fetch data needed inside transaction
      const receiptCode = await generateReceiptCode(bizId);
      const posAccounts = await getBankAccountsByBusiness(bizId);

      // Resolve kasir's default cash account for "Tunai" payments
      const teamMemberInfo = await getTeamMemberByUserAndBusiness(ctx.user.id, bizId);
      let kasirCashAccountId: number | null = teamMemberInfo?.defaultCashAccountId ?? null;
      let kasirCashAccountName: string | null = null;
      if (kasirCashAccountId) {
        const cashAcct = posAccounts.find(a => a.id === kasirCashAccountId);
        if (cashAcct) {
          kasirCashAccountName = cashAcct.accountName;
        } else {
          kasirCashAccountId = null; // account was deleted/deactivated
        }
      }
      // Fallback: if no default set, find any active cash account
      if (!kasirCashAccountId) {
        const anyCash = posAccounts.find(a => a.accountType === "cash");
        if (anyCash) {
          kasirCashAccountId = anyCash.id;
          kasirCashAccountName = anyCash.accountName;
        }
      }

      // Pre-generate tx codes for each payment (avoid sequential generation inside tx)
      const txCodes: string[] = [];
      for (let i = 0; i < input.payments.length; i++) {
        txCodes.push(await generateTxCode(bizId));
      }

      // ─── CRITICAL BUG FIX 4: Stock validation BEFORE transaction to prevent oversell ───
      for (const item of input.items) {
        const product = await getProductById(item.productId);
        if (!product) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Produk tidak ditemukan (ID: ${item.productId})`,
          });
        }

        // Check warehouse stock if specified
        if (item.warehouseId) {
          const ws = await getOrCreateWarehouseStock(item.warehouseId, item.productId);
          if (ws.quantity < item.productQty) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Stok ${product.name} tidak cukup (tersedia: ${ws.quantity}, diminta: ${item.productQty})`,
            });
          }
        } else {
          // Check overall product stock
          if ((product.stockCurrent ?? 0) < item.productQty) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Stok ${product.name} tidak cukup (tersedia: ${product.stockCurrent ?? 0}, diminta: ${item.productQty})`,
            });
          }
        }
      }

      // ─── ATOMIC: Receipt + Items + Journal entries + Stock operations in single transaction ───
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { receiptId } = await db.transaction(async (tx) => {
        // Create the receipt
        const [receiptResult] = await tx.insert(posReceipts).values({
          businessId: bizId,
          receiptCode,
          shiftId: input.shiftId ?? null,
          subtotal: input.subtotal,
          discountAmount: input.discountAmount,
          discountCodeId: input.discountCodeId ?? null,
          grandTotal: input.grandTotal,
          payments: input.payments,
          customerPaid: input.customerPaid,
          changeAmount: input.changeAmount,
          clientId: input.clientId ?? null,
          notes: input.notes ?? null,
          date: saleDate,
        });
        const txReceiptId = receiptResult.insertId;

        // Save receipt items
        for (const item of input.items) {
          await tx.insert(posReceiptItems).values({
            receiptId: txReceiptId,
            productId: item.productId,
            productName: item.productName || `Produk #${item.productId}`,
            qty: item.productQty,
            unitPrice: item.unitPrice || Math.round(item.amount / Math.max(1, item.productQty)),
            totalPrice: item.amount,
            hppSnapshot: item.hppSnapshot ?? 0,
          });
        }

        // Increment discount usage
        if (input.discountCodeId) {
          await tx.update(discountCodes)
            .set({ currentUses: sql`${discountCodes.currentUses} + 1` })
            .where(eq(discountCodes.id, input.discountCodeId));
        }

        // Create journal transaction per payment method
        for (let i = 0; i < input.payments.length; i++) {
          const payment = input.payments[i];
          const isTunai = payment.method.toLowerCase() === "tunai";

          // Resolve bankAccountId: Tunai → kasir's cash account, others → by name match
          let resolvedBankAccountId: number | undefined;
          let resolvedPaymentMethod = payment.method;

          if (isTunai && kasirCashAccountId) {
            resolvedBankAccountId = kasirCashAccountId;
            resolvedPaymentMethod = kasirCashAccountName || payment.method;
          } else {
            resolvedBankAccountId = resolveBankAccountId(posAccounts, payment.method);
          }

          await tx.insert(transactions).values({
            businessId: bizId,
            txCode: txCodes[i],
            date: saleDate,
            type: "pemasukan",
            category: "Penjualan POS",
            description: `Penjualan POS ${receiptCode}`,
            amount: payment.amount,
            paymentMethod: resolvedPaymentMethod,
            clientId: input.clientId ?? null,
            shiftId: input.shiftId ?? null,
            receiptId: txReceiptId,
            bankAccountId: resolvedBankAccountId ?? null,
            notes: input.notes ?? null,
          });
        }

        // ─── CRITICAL BUG FIX 1: Stock operations INSIDE transaction ───
        // Reduce stock for each cart item (skip for productType "jasa" — no stock deduction)
        for (const item of input.items) {
          // Check if product is "jasa" type — skip stock deduction entirely
          const productForStock = await getProductById(item.productId);
          if (productForStock?.productType === "jasa") {
            // Jasa products: no stock deduction, no FIFO, no warehouse changes
            continue;
          }

          // ─── Consume FIFO batches if available ───
          try {
            await consumeStockFIFO(item.productId, item.productQty, item.warehouseId, tx);
          } catch (e) {
            // FIFO batches may not exist for all products — continue with regular stock reduction
          }

          // ─── Reduce stock from warehouse ───
          if (item.warehouseId && item.productQty > 0) {
            const ws = await getOrCreateWarehouseStock(item.warehouseId, item.productId);
            const newQty = ws.quantity - item.productQty;
            await updateWarehouseStockQty(item.warehouseId, item.productId, newQty);
            await recalcProductStockFromWarehouses(item.productId);

            // Create stock log
            await createStockLog({
              businessId: bizId,
              productId: item.productId,
              date: saleDate,
              movementType: "out",
              qty: item.productQty,
              direction: -1,
              stockBefore: ws.quantity,
              stockAfter: newQty,
              notes: `Penjualan POS ${receiptCode}`,
            });
          } else {
            // Fallback: directly reduce products.stockCurrent
            if (productForStock) {
              const newStock = (productForStock.stockCurrent ?? 0) - item.productQty;
              await updateProduct(item.productId, { stockCurrent: newStock });
            }
          }
        }

        return { receiptId: txReceiptId };
      });

      // ─── BEST-EFFORT: GL Double-Entry Journal (outside atomic tx — non-critical) ───
      try {
        // Calculate total HPP from items
        const totalHPP = input.items.reduce((sum, item) => {
          const hpp = item.hppSnapshot ?? 0;
          return sum + (hpp * item.productQty);
        }, 0);

        // Resolve the primary bank account for the first payment method
        const primaryBankAccountId = (() => {
          const firstPayment = input.payments[0];
          if (!firstPayment) return null;
          const isTunai = firstPayment.method.toLowerCase() === "tunai";
          if (isTunai && kasirCashAccountId) return kasirCashAccountId;
          return resolveBankAccountId(posAccounts, firstPayment.method) ?? null;
        })();

        const glAccounts = await resolveAccountsForPOS(bizId, primaryBankAccountId);

        // Build journal lines
        const journalLinesList: Array<{ accountId: number; description?: string; debitAmount: number; creditAmount: number }> = [];

        // DR: Kas/Bank for each payment method
        for (const payment of input.payments) {
          const isTunai = payment.method.toLowerCase() === "tunai";
          let paymentAccountId = glAccounts.cashAccountId; // default
          if (isTunai && kasirCashAccountId) {
            const bankCoAAccount = await import("./db").then(m => m.getAccountByBankAccountId(bizId, kasirCashAccountId!));
            if (bankCoAAccount) paymentAccountId = bankCoAAccount.id;
          } else {
            const resolved = resolveBankAccountId(posAccounts, payment.method);
            if (resolved) {
              const bankCoAAccount = await import("./db").then(m => m.getAccountByBankAccountId(bizId, resolved));
              if (bankCoAAccount) paymentAccountId = bankCoAAccount.id;
            }
          }
          journalLinesList.push({
            accountId: paymentAccountId,
            description: `Pembayaran ${payment.method}`,
            debitAmount: payment.amount,
            creditAmount: 0,
          });
        }

        // Handle discount as contra-revenue
        if (input.discountAmount > 0) {
          journalLinesList.push({
            accountId: glAccounts.discountAccountId,
            description: "Diskon penjualan",
            debitAmount: input.discountAmount,
            creditAmount: 0,
          });
        }

        // CR: Penjualan (revenue) — subtotal (before discount)
        journalLinesList.push({
          accountId: glAccounts.salesAccountId,
          description: `Penjualan POS ${receiptCode}`,
          debitAmount: 0,
          creditAmount: input.subtotal,
        });

        // HPP entry (if any items have HPP > 0)
        if (totalHPP > 0) {
          // DR: HPP (cost of goods sold)
          journalLinesList.push({
            accountId: glAccounts.cogsAccountId,
            description: "Harga Pokok Penjualan",
            debitAmount: totalHPP,
            creditAmount: 0,
          });
          // CR: Persediaan (inventory decrease)
          journalLinesList.push({
            accountId: glAccounts.inventoryAccountId,
            description: "Pengurangan persediaan",
            debitAmount: 0,
            creditAmount: totalHPP,
          });
        }

        await createJournalEntry({
          businessId: bizId,
          date: saleDate,
          description: `Penjualan POS ${receiptCode} — ${input.items.length} item`,
          sourceType: "pos_checkout",
          sourceId: receiptId,
          createdByUserId: ctx.user.id,
          lines: journalLinesList,
        });
      } catch (glError) {
        // GL journaling is best-effort — don't fail the POS checkout
        console.error(`[GL] POS Checkout journal failed — grandTotal=${input.grandTotal} items=${input.items.length}:`, glError);
      }

      // ─── BEST-EFFORT: Commission, loyalty (outside tx — non-critical) ───

      // ─── Auto-create staff commission ───
      try {
        const commConfig = await getCommissionConfig(bizId);
        if (commConfig?.isEnabled) {
          let commAmount = 0;
          if (commConfig.commissionType === "percentage") {
            commAmount = Math.round(input.grandTotal * commConfig.commissionRate / 10000);
          } else {
            commAmount = commConfig.commissionRate;
          }
          if (commAmount > 0) {
            const commId = await createStaffCommission({
              businessId: bizId,
              userId: ctx.user.id,
              receiptId,
              receiptCode,
              saleAmount: input.grandTotal,
              commissionAmount: commAmount,
              date: saleDate,
            });

            // ─── GL: Commission Accrual — DR Beban Komisi, CR Hutang Komisi ───
            if (commId > 0) {
              try {
                const commAccounts = await resolveAccountsForCommission(bizId);
                await createJournalEntry({
                  businessId: bizId,
                  date: saleDate,
                  description: `Komisi staff dari POS ${receiptCode}`,
                  sourceType: "commission_accrual",
                  sourceId: commId,
                  lines: [
                    { accountId: commAccounts.commissionExpenseAccountId, debitAmount: commAmount, creditAmount: 0, description: "Beban komisi staff" },
                    { accountId: commAccounts.commissionPayableAccountId, debitAmount: 0, creditAmount: commAmount, description: "Hutang komisi" },
                  ],
                });
              } catch (glErr) { console.error("GL Commission accrual error:", glErr); }
            }
          }
        }
      } catch (e) {
        console.error("Commission error:", e);
      }

      // ─── Auto-award loyalty points if client is attached ───
      if (input.clientId) {
        try {
          await autoAwardLoyaltyPoints(bizId, input.clientId, input.grandTotal);
        } catch (e) {
          // Don't fail the checkout if loyalty fails
          console.error("Loyalty points error:", e);
        }
      }

      // ─── AUDIT LOG: Log successful POS checkout ───
      await createAuditLog({
        businessId: bizId,
        userId: ctx.user.id,
        action: "create",
        entityType: "pos_receipt",
        entityId: receiptId,
        details: { grandTotal: input.grandTotal, itemCount: input.items.length, paymentMethods: input.payments.length },
      });

      return { receiptId, receiptCode };
    }),

    // Refund a receipt - atomic with stock restoration and reversal transactions
    refund: protectedProcedure.input(z.object({
      receiptId: z.number(),
      reason: z.string().min(1),
    })).mutation(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND" });

      const bizId = resolved.business.id;
      // Check role permission: only owner, admin, or manager can refund receipts
      await checkRolePermission(ctx.user.id, bizId, ["owner", "manager"]);

      // Pre-fetch data needed for the transaction
      const receipt = await getPosReceiptById(input.receiptId);
      if (!receipt || receipt.isRefunded) throw new TRPCError({ code: "NOT_FOUND", message: "Struk tidak ditemukan atau sudah di-refund" });
      // Multi-tenant fix: verify receipt belongs to this business
      if (receipt.businessId !== bizId) throw new TRPCError({ code: "FORBIDDEN", message: "Anda tidak memiliki akses ke struk ini" });

      const receiptItems = await getPosReceiptItemsByReceipt(input.receiptId);
      const posAccounts = await getBankAccountsByBusiness(bizId);

      // Pre-generate tx codes
      const payments = receipt.payments as Array<{ method: string; amount: number }>;
      const txCodes: string[] = [];
      if (Array.isArray(payments)) {
        for (let i = 0; i < payments.length; i++) {
          txCodes.push(await generateTxCode(bizId));
        }
      }

      // ─── ATOMIC: Reversal journals + refund marking + soft-delete original tx + stock restoration in single transaction ───
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Determine warehouse ID for stock restoration
      let warehouseId: number | undefined;
      if (receipt.shiftId) {
        const shift = await getPosShiftById(receipt.shiftId);
        warehouseId = shift?.warehouseId ?? undefined;
      }
      if (!warehouseId) {
        const defaultWh = await getDefaultWarehouse(bizId);
        warehouseId = defaultWh?.id;
      }

      await db.transaction(async (tx) => {
        // Create reversal journal transactions with bankAccountId
        if (Array.isArray(payments)) {
          for (let i = 0; i < payments.length; i++) {
            const payment = payments[i];
            const bankAccountId = resolveBankAccountId(posAccounts, payment.method);

            await tx.insert(transactions).values({
              businessId: bizId,
              txCode: txCodes[i],
              date: receipt.date,
              type: "pengeluaran",
              category: "Refund POS",
              description: `Refund POS ${receipt.receiptCode} — ${input.reason}`,
              amount: payment.amount,
              paymentMethod: payment.method || "tunai",
              clientId: receipt.clientId || null,
              shiftId: receipt.shiftId || null,
              receiptId: input.receiptId,
              bankAccountId: bankAccountId ?? null,
              taxRelated: false,
            });
          }
        }

        // Soft-delete original POS transactions
        await tx.update(transactions)
          .set({ isDeleted: true })
          .where(and(
            eq(transactions.receiptId, input.receiptId),
            eq(transactions.businessId, bizId),
            eq(transactions.isDeleted, false)
          ));

        // ─── CRITICAL BUG FIX 2: Stock restoration INSIDE transaction ───
        // Skip stock restoration for productType "jasa" (no stock was deducted)
        for (const item of receiptItems) {
          const refundProduct = await getProductById(item.productId);
          if (refundProduct?.productType === "jasa") {
            continue; // Jasa products: no stock to restore
          }

          // Restore FIFO batches
          try {
            await restoreStockFIFO(item.productId, item.qty, warehouseId, tx);
          } catch (e) { /* FIFO batches may not exist */ }

          if (warehouseId) {
            const ws = await getOrCreateWarehouseStock(warehouseId, item.productId);
            const newQty = ws.quantity + item.qty;
            await updateWarehouseStockQty(warehouseId, item.productId, newQty);
            await recalcProductStockFromWarehouses(item.productId);

            await createStockLog({
              businessId: bizId,
              productId: item.productId,
              date: receipt.date,
              movementType: "in",
              qty: item.qty,
              direction: 1,
              stockBefore: ws.quantity,
              stockAfter: newQty,
              notes: `Refund POS ${receipt.receiptCode} — ${input.reason}`,
            });
          } else {
            if (refundProduct) {
              const newStock = (refundProduct.stockCurrent ?? 0) + item.qty;
              await updateProduct(item.productId, { stockCurrent: newStock });
            }
          }
        }

        // Mark receipt as refunded inside transaction (only if everything above succeeds)
        await tx.update(posReceipts)
          .set({
            isRefunded: true,
            refundedAt: new Date(),
            refundReason: input.reason,
            refundAmount: receipt.grandTotal,
          })
          .where(eq(posReceipts.id, input.receiptId));
      });

      // ─── GL JOURNAL: POS Refund (best-effort, non-blocking) ───
      try {
        const totalHPP = receiptItems.reduce((sum, item) => sum + (Number(item.hppSnapshot) * Number(item.qty)), 0);
        const refundAccounts = await resolveAccountsForPOSRefund(bizId, null);

        const journalLines: Array<{ accountId: number; description: string; debitAmount: number; creditAmount: number }> = [];

        // Per-payment reversal: CR Kas/Bank for each payment method
        if (Array.isArray(payments)) {
          for (const payment of payments) {
            const bankAccountId = resolveBankAccountId(posAccounts, payment.method);
            let cashAccountId = refundAccounts.cashAccountId;
            if (bankAccountId) {
              try {
                const { getAccountByBankAccountId } = await import("./db");
                const bankCoA = await getAccountByBankAccountId(bizId, bankAccountId);
                if (bankCoA) cashAccountId = bankCoA.id;
              } catch {}
            }
            journalLines.push({
              accountId: cashAccountId,
              description: `Refund ${payment.method} — ${receipt.receiptCode}`,
              debitAmount: 0,
              creditAmount: Number(payment.amount),
            });
          }
        }

        // DR Retur Penjualan (grandTotal)
        journalLines.push({
          accountId: refundAccounts.returAccountId,
          description: `Retur Penjualan ${receipt.receiptCode}`,
          debitAmount: Number(receipt.grandTotal),
          creditAmount: 0,
        });

        // HPP reversal (if any)
        if (totalHPP > 0) {
          journalLines.push({
            accountId: refundAccounts.inventoryAccountId,
            description: "Pengembalian persediaan",
            debitAmount: totalHPP,
            creditAmount: 0,
          });
          journalLines.push({
            accountId: refundAccounts.cogsAccountId,
            description: "Reversal HPP",
            debitAmount: 0,
            creditAmount: totalHPP,
          });
        }

        await createJournalEntry({
          businessId: bizId,
          date: new Date().toISOString().substring(0, 10),
          description: `Refund POS ${receipt.receiptCode} — ${input.reason} — ${receiptItems.length} item`,
          sourceType: "pos_refund",
          sourceId: input.receiptId,
          lines: journalLines,
        });
      } catch (glErr) {
        console.error(`[GL] POS Refund journal failed — receiptId=${input.receiptId} reason=${input.reason}:`, glErr);
      }

      // ─── AUDIT LOG: Log successful POS refund ───
      await createAuditLog({
        businessId: bizId,
        userId: ctx.user.id,
        action: "refund",
        entityType: "pos_receipt",
        entityId: input.receiptId,
        details: { refundAmount: receipt.grandTotal, reason: input.reason },
      });

      return { success: true, refundAmount: receipt.grandTotal };
    }),
  }),

  // ─── Supplier Management ───
  supplier: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) return [];
      return getSuppliersByBusiness(resolved.business.id);
    }),
    byId: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return getSupplierById(input.id);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      contactPerson: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND" });
      return createSupplier({ businessId: resolved.business.id, ...input });
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      contactPerson: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      notes: z.string().optional(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateSupplier(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteSupplier(input.id);
      return { success: true };
    }),
  }),

  // ─── Purchase Orders ───
  purchaseOrder: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) return [];
      return getPurchaseOrdersByBusiness(resolved.business.id);
    }),
    byId: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return getPurchaseOrderById(input.id);
    }),
    items: protectedProcedure.input(z.object({ poId: z.number() })).query(async ({ input }) => {
      return getPurchaseOrderItems(input.poId);
    }),
    create: protectedProcedure.input(z.object({
      supplierId: z.number(),
      date: z.string(),
      description: z.string().optional(),
      totalAmount: z.number().default(0),
      items: z.array(z.object({
        productId: z.number().optional(),
        productName: z.string(),
        qty: z.number(),
        unitPrice: z.number(),
        totalPrice: z.number(),
      })).optional(),
    })).mutation(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND" });
      const poNumber = await generatePONumber(resolved.business.id);
      const total = input.items?.reduce((s, i) => s + i.totalPrice, 0) ?? input.totalAmount;
      const po = await createPurchaseOrder({
        businessId: resolved.business.id,
        poNumber,
        supplierId: input.supplierId,
        date: input.date,
        description: input.description,
        totalAmount: total,
      });
      if (input.items?.length) {
        for (const item of input.items) {
          await createPurchaseOrderItem({ purchaseOrderId: po.id, ...item });
        }
      }
      return po;
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      paymentStatus: z.enum(["unpaid", "partial", "paid"]).optional(),
      receiptStatus: z.enum(["pending", "partial", "received"]).optional(),
      paidAmount: z.number().optional(),
      bankAccountId: z.number().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND" });
      const businessId = resolved.business.id;

      // Fetch current PO state before update
      const po = await getPurchaseOrderById(input.id);
      if (!po) throw new TRPCError({ code: "NOT_FOUND", message: "PO tidak ditemukan" });

      const prevPayment = po.paymentStatus;
      const prevReceipt = po.receiptStatus;
      const newPayment = input.paymentStatus || prevPayment;
      const newReceipt = input.receiptStatus || prevReceipt;
      const poAmount = Number(po.totalAmount);

      // Update PO record
      const { id, paidAmount, bankAccountId, ...updateData } = input;
      await updatePurchaseOrder(id, updateData);

      // ─── STOCK INTEGRATION: PO received → increase inventory ───
      // When goods are received, add qty to warehouse stock + product stockCurrent + stockLog
      // If item has no productId (manual entry), auto-create product in catalog first
      if (newReceipt === "received" && prevReceipt !== "received") {
        try {
          const poItems = await getPurchaseOrderItems(id);
          const defaultWarehouse = await ensureDefaultWarehouse(businessId);
          const journalDate = new Date().toISOString().substring(0, 10);

          for (const item of poItems) {
            if (item.qty <= 0) continue;

            let productId = item.productId;

            // If no productId — check if product with same name exists first, then create if not
            if (!productId) {
              // Search for existing product with exact name match (case-insensitive)
              const existingProducts = await searchProductsByName(businessId, item.productName);
              const exactMatch = existingProducts.find(
                (p) => p.name.trim().toLowerCase() === item.productName.trim().toLowerCase()
              );

              if (exactMatch) {
                // Product already exists — use it instead of creating duplicate
                productId = exactMatch.id;
                // Update HPP if PO has newer price
                if (Number(item.unitPrice) > 0) {
                  const db = await getDb();
                  if (db) {
                    await db.update(products)
                      .set({ hpp: Number(item.unitPrice) })
                      .where(eq(products.id, exactMatch.id));
                  }
                }
              } else {
                // No existing product — create new one
                productId = await safeInsertProduct({
                  businessId,
                  name: item.productName,
                  sku: "",
                  category: "Pembelian PO",
                  hpp: Number(item.unitPrice) || 0,
                  sellingPrice: 0,
                  stockCurrent: 0,
                  stockMinimum: 0,
                  unit: "pcs",
                });
              }

              // Link PO item back to the product (new or existing)
              const db = await getDb();
              if (db) {
                await db.update(purchaseOrderItems)
                  .set({ productId })
                  .where(eq(purchaseOrderItems.id, item.id));
              }
            }

            const product = await getProductById(productId);
            if (!product) continue;

            // Update warehouse stock
            const ws = await getOrCreateWarehouseStock(defaultWarehouse.id, productId);
            const newQty = ws.quantity + item.qty;
            await updateWarehouseStockQty(defaultWarehouse.id, productId, newQty);
            await recalcProductStockFromWarehouses(productId);

            // Create stock log
            await createStockLog({
              businessId,
              productId,
              date: journalDate,
              movementType: "in",
              qty: item.qty,
              direction: 1,
              stockBefore: ws.quantity,
              stockAfter: newQty,
              notes: `Pembelian PO ${po.poNumber} — ${item.productName}`,
            });
          }
        } catch (stockErr) {
          console.error("[STOCK] PO received stock update failed:", stockErr);
        }
      }

      // ─── GL JOURNAL INTEGRATION (best-effort, non-blocking) ───
      // Accounting rules (SAK EMKM):
      // 1. PO created (unpaid, not received) → No journal (off-balance sheet)
      // 2. Barang diterima + unpaid → DR Persediaan, CR Hutang Usaha
      // 3. Payment (paid) → DR Hutang Usaha, CR Kas/Bank
      // 4. Partial payment → DR Hutang Usaha (partial), CR Kas/Bank (partial)
      // 5. Received + paid sekaligus → DR Persediaan, CR Kas/Bank
      try {
        const poAccounts = await resolveAccountsForPurchaseOrder(businessId, bankAccountId ?? null);
        const supplierName = po.description || `PO ${po.poNumber}`;
        const journalDate = new Date().toISOString().substring(0, 10);

        // ─── Scenario A: Receipt status changed to "received" (goods arrived) ───
        if (newReceipt === "received" && prevReceipt !== "received") {
          if (newPayment === "paid" && prevPayment !== "paid") {
            // Scenario 5: Received + Paid sekaligus
            // DR Persediaan Barang Dagang  (asset +)
            // CR Kas/Bank                   (asset -)
            await createJournalEntry({
              businessId,
              date: journalDate,
              description: `Pembelian tunai — ${supplierName}`,
              sourceType: "po_received_paid",
              sourceId: po.id,
              lines: [
                { accountId: poAccounts.inventoryAccountId, debitAmount: poAmount, creditAmount: 0, description: `Persediaan masuk — ${po.poNumber}` },
                { accountId: poAccounts.cashAccountId, debitAmount: 0, creditAmount: poAmount, description: `Bayar pembelian — ${po.poNumber}` },
              ],
            });
          } else {
            // Scenario 2: Received but unpaid/partial → recognize inventory + liability
            // DR Persediaan Barang Dagang  (asset +)
            // CR Hutang Usaha              (liability +)
            await createJournalEntry({
              businessId,
              date: journalDate,
              description: `Barang diterima (kredit) — ${supplierName}`,
              sourceType: "po_received",
              sourceId: po.id,
              lines: [
                { accountId: poAccounts.inventoryAccountId, debitAmount: poAmount, creditAmount: 0, description: `Persediaan masuk — ${po.poNumber}` },
                { accountId: poAccounts.payableAccountId, debitAmount: 0, creditAmount: poAmount, description: `Hutang usaha — ${po.poNumber}` },
              ],
            });
          }
        }

        // ─── Scenario B: Payment status changed (goods already received previously) ───
        if (prevReceipt === "received" && newReceipt === "received") {
          const payAmount = paidAmount || poAmount;

          if (newPayment === "paid" && prevPayment !== "paid") {
            // Scenario 3: Full payment (hutang was already recognized)
            // DR Hutang Usaha     (liability -)
            // CR Kas/Bank         (asset -)
            await createJournalEntry({
              businessId,
              date: journalDate,
              description: `Pelunasan hutang — ${supplierName}`,
              sourceType: "po_payment",
              sourceId: po.id,
              lines: [
                { accountId: poAccounts.payableAccountId, debitAmount: poAmount, creditAmount: 0, description: `Lunasi hutang — ${po.poNumber}` },
                { accountId: poAccounts.cashAccountId, debitAmount: 0, creditAmount: poAmount, description: `Bayar supplier — ${po.poNumber}` },
              ],
            });
          } else if (newPayment === "partial" && prevPayment === "unpaid" && payAmount > 0) {
            // Scenario 4: Partial payment
            // DR Hutang Usaha     (liability -, partial)
            // CR Kas/Bank         (asset -, partial)
            await createJournalEntry({
              businessId,
              date: journalDate,
              description: `Cicilan hutang Rp ${payAmount.toLocaleString("id-ID")} — ${supplierName}`,
              sourceType: "po_partial_payment",
              sourceId: po.id,
              lines: [
                { accountId: poAccounts.payableAccountId, debitAmount: payAmount, creditAmount: 0, description: `Cicilan hutang — ${po.poNumber}` },
                { accountId: poAccounts.cashAccountId, debitAmount: 0, creditAmount: payAmount, description: `Bayar sebagian — ${po.poNumber}` },
              ],
            });
          }
        }
      } catch (glErr) {
        console.error("[GL] PO update journal failed (non-blocking):", glErr);
      }

      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const { id } = input;
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND" });
      const businessId = resolved.business.id;

      // ─── 1. Get PO data before delete ───
      const po = await getPurchaseOrderById(id);

      // ─── 2. Reverse stock if PO was received ───
      if (po && po.receiptStatus === "received") {
        try {
          const poItems = await getPurchaseOrderItems(id);
          const defaultWarehouse = await ensureDefaultWarehouse(businessId);
          const journalDate = new Date().toISOString().substring(0, 10);

          for (const item of poItems) {
            if (!item.productId || item.qty <= 0) continue;
            const ws = await getOrCreateWarehouseStock(defaultWarehouse.id, item.productId);
            const newQty = Math.max(0, ws.quantity - item.qty);
            await updateWarehouseStockQty(defaultWarehouse.id, item.productId, newQty);
            await recalcProductStockFromWarehouses(item.productId);
            await createStockLog({
              businessId,
              productId: item.productId,
              date: journalDate,
              movementType: "out",
              qty: item.qty,
              direction: -1,
              stockBefore: ws.quantity,
              stockAfter: newQty,
              notes: `[REVERSAL] Hapus PO ${po.poNumber} — ${item.productName}`,
            });
          }
        } catch (stockErr) {
          console.error("[STOCK] PO delete stock reversal failed:", stockErr);
        }
      }

      // ─── 3. Reverse all GL journal entries for this PO ───
      try {
        // Reverse all PO-related journal entries (po_received, po_payment, po_received_paid, po_partial_payment)
        const reversedCount = await reverseJournalEntriesBySource(
          businessId,
          "po_received", // will auto-detect all related po_ source types
          id,
          `[REVERSAL] PO dihapus — ${po?.poNumber || `PO#${id}`}`
        );
        if (reversedCount > 0) {
          console.log(`[GL] Reversed ${reversedCount} journal entries for PO ${id}`);
        }
      } catch (glErr) {
        console.error("[GL] PO delete journal reversal failed:", glErr);
      }

      // ─── 4. Delete PO + items ───
      await deletePurchaseOrder(id);
      return { success: true };
    }),
  }),

  // ─── Loyalty Points ───
  loyalty: router({
    getPoints: protectedProcedure.input(z.object({ clientId: z.number() })).query(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) return null;
      return getLoyaltyPoints(resolved.business.id, input.clientId);
    }),
    allPoints: protectedProcedure.query(async ({ ctx }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) return [];
      return getLoyaltyPointsByBusiness(resolved.business.id);
    }),
    addPoints: protectedProcedure.input(z.object({
      clientId: z.number(),
      points: z.number().min(1),
      description: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND" });
      await addLoyaltyPoints(resolved.business.id, input.clientId, input.points, input.description);
      return { success: true };
    }),
    redeemPoints: protectedProcedure.input(z.object({
      clientId: z.number(),
      points: z.number().min(1),
      description: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND" });
      const success = await redeemLoyaltyPoints(resolved.business.id, input.clientId, input.points, input.description);
      if (!success) throw new TRPCError({ code: "BAD_REQUEST", message: "Poin tidak cukup" });
      return { success: true };
    }),
    transactions: protectedProcedure.input(z.object({ clientId: z.number() })).query(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) return [];
      return getLoyaltyTransactionsByClient(resolved.business.id, input.clientId);
    }),
    getConfig: protectedProcedure.query(async ({ ctx }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND" });
      return getLoyaltyConfig(resolved.business.id);
    }),
    updateConfig: protectedProcedure.input(z.object({
      isEnabled: z.boolean().optional(),
      pointsPerAmount: z.number().min(1).optional(),
      amountPerPoint: z.number().min(1).optional(),
      redemptionRate: z.number().min(1).optional(),
      minRedeemPoints: z.number().min(1).optional(),
      silverThreshold: z.number().min(0).optional(),
      goldThreshold: z.number().min(0).optional(),
      platinumThreshold: z.number().min(0).optional(),
    })).mutation(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND" });
      await upsertLoyaltyConfig(resolved.business.id, input);
      return { success: true };
    }),
    // Redeem points as discount in POS
    redeemAsDiscount: protectedProcedure.input(z.object({
      clientId: z.number(),
      points: z.number().min(1),
    })).mutation(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND" });
      const bizId = resolved.business.id;
      const config = await getLoyaltyConfig(bizId);
      const loyalty = await getLoyaltyPoints(bizId, input.clientId);

      if (!loyalty || loyalty.points < input.points) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Poin tidak cukup" });
      }
      if (input.points < config.minRedeemPoints) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Minimal poin yang dapat ditukar adalah ${config.minRedeemPoints}` });
      }

      const discountAmount = input.points * config.redemptionRate;
      const success = await redeemLoyaltyPoints(bizId, input.clientId, input.points, `Tukar poin menjadi diskon Rp ${discountAmount.toLocaleString('id-ID')}`);

      return { success, discountAmount };
    }),
  }),

  // ─── Invoice Settings ───
  invoiceSettings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) return null;
      return getInvoiceSettings(resolved.business.id);
    }),
    update: protectedProcedure.input(z.object({
      showCustomerName: z.boolean().optional(),
      showCustomerAddress: z.boolean().optional(),
      showCustomerPhone: z.boolean().optional(),
      showInvoiceNumber: z.boolean().optional(),
      showPurchaseDate: z.boolean().optional(),
      showDueDate: z.boolean().optional(),
      showPaymentMethod: z.boolean().optional(),
      showTotal: z.boolean().optional(),
      showSignature: z.boolean().optional(),
      showLogo: z.boolean().optional(),
      footerText: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND" });
      await upsertInvoiceSettings(resolved.business.id, input);
      return { success: true };
    }),
  }),

  // ─── Warehouse Access ───
  warehouseAccess: router({
    byUser: protectedProcedure.input(z.object({ userId: z.number() })).query(async ({ input }) => {
      return getWarehouseAccessByUser(input.userId);
    }),
    byWarehouse: protectedProcedure.input(z.object({ warehouseId: z.number() })).query(async ({ input }) => {
      return getWarehouseAccessByWarehouse(input.warehouseId);
    }),
    setAccess: protectedProcedure.input(z.object({
      warehouseId: z.number(),
      userIds: z.array(z.number()),
    })).mutation(async ({ input }) => {
      await setWarehouseAccess(input.warehouseId, input.userIds);
      return { success: true };
    }),
    accessible: protectedProcedure.query(async ({ ctx }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) return [];
      return getAccessibleWarehouses(resolved.business.id, ctx.user.id, resolved.isOwner);
    }),
  }),

  // ─── Staff Commission ───
  commission: router({
    config: protectedProcedure.query(async ({ ctx }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) return null;
      return getCommissionConfig(resolved.business.id);
    }),

    updateConfig: protectedProcedure.input(z.object({
      isEnabled: z.boolean().optional(),
      commissionType: z.enum(["percentage", "flat"]).optional(),
      commissionRate: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND" });
      return upsertCommissionConfig(resolved.business.id, input);
    }),

    report: protectedProcedure.input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      userId: z.number().optional(),
    })).query(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) return [];
      const { getCommissionReport } = await import("./db");
      return getCommissionReport(resolved.business.id, input.startDate, input.endDate, input.userId);
    }),

    summary: protectedProcedure.input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    })).query(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) return [];
      const { getCommissionSummaryByStaff } = await import("./db");
      return getCommissionSummaryByStaff(resolved.business.id, input.startDate, input.endDate);
    }),

    markPaid: protectedProcedure.input(z.object({
      id: z.number(),
    })).mutation(async ({ ctx, input }) => {
      const { markCommissionPaid, getCommissionReport } = await import("./db");
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      await markCommissionPaid(input.id);

      // ─── GL: Commission Payment — DR Hutang Komisi, CR Kas ───
      if (biz) {
        try {
          // Get commission details for amount
          const allComm = await getCommissionReport(biz.id);
          const comm = allComm.find((c: any) => c.id === input.id);
          if (comm && comm.commissionAmount > 0) {
            const commAccounts = await resolveAccountsForCommission(biz.id);
            const today = new Date().toISOString().slice(0, 10);
            await createJournalEntry({
              businessId: biz.id,
              date: today,
              description: `Pembayaran komisi staff #${input.id}`,
              sourceType: "commission_payment",
              sourceId: input.id,
              lines: [
                { accountId: commAccounts.commissionPayableAccountId, debitAmount: comm.commissionAmount, creditAmount: 0, description: "Pelunasan hutang komisi" },
                { accountId: commAccounts.cashAccountId, debitAmount: 0, creditAmount: comm.commissionAmount, description: "Pembayaran dari kas" },
              ],
            });
          }
        } catch (e) { console.error("GL Commission payment error:", e); }
      }

      return { success: true };
    }),

    markBulkPaid: protectedProcedure.input(z.object({
      ids: z.array(z.number()),
    })).mutation(async ({ ctx, input }) => {
      const { markCommissionsPaidBulk, getCommissionReport } = await import("./db");
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role))?.business;
      await markCommissionsPaidBulk(input.ids);

      // ─── GL: Bulk Commission Payment — one journal per commission ───
      if (biz) {
        try {
          const allComm = await getCommissionReport(biz.id);
          const commAccounts = await resolveAccountsForCommission(biz.id);
          const today = new Date().toISOString().slice(0, 10);
          for (const commId of input.ids) {
            const comm = allComm.find((c: any) => c.id === commId);
            if (comm && comm.commissionAmount > 0) {
              await createJournalEntry({
                businessId: biz.id,
                date: today,
                description: `Pembayaran komisi staff #${commId}`,
                sourceType: "commission_payment",
                sourceId: commId,
                lines: [
                  { accountId: commAccounts.commissionPayableAccountId, debitAmount: comm.commissionAmount, creditAmount: 0, description: "Pelunasan hutang komisi" },
                  { accountId: commAccounts.cashAccountId, debitAmount: 0, creditAmount: comm.commissionAmount, description: "Pembayaran dari kas" },
                ],
              });
            }
          }
        } catch (e) { console.error("GL Bulk commission payment error:", e); }
      }

      return { success: true };
    }),
  }),

  // ══════════════════════════════════════════════════════════════════════════
  // ═══ PERSONAL FINANCE (pf_) ROUTER — 100% ISOLATED FROM UMKM ═══════════
  // ══════════════════════════════════════════════════════════════════════════
  personalFinance: router({
    // ─── Profile ───
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) return null;
      return getPfProfile(resolved.business.id);
    }),
    upsertProfile: protectedProcedure.input(z.object({
      fullName: z.string().optional(),
      age: z.number().min(1).max(120).optional(),
      maritalStatus: z.enum(["single", "married", "divorced", "widowed"]).optional(),
      dependents: z.number().min(0).optional(),
      occupation: z.string().optional(),
      monthlyIncome: z.number().min(0).optional(),
      setupCompleted: z.boolean().optional(),
      setupStep: z.number().min(0).max(9).optional(),
    })).mutation(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND", message: "Personal finance profile not found. Please set up personal mode first." });
      await upsertPfProfile(resolved.business.id, input);
      return { success: true };
    }),

    // ─── Income Sources ───
    getIncomeSources: protectedProcedure.query(async ({ ctx }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) return [];
      return getPfIncomeSources(resolved.business.id);
    }),
    upsertIncomeSource: protectedProcedure.input(z.object({
      id: z.number().optional(),
      name: z.string().min(1),
      category: z.enum(["gaji", "bonus", "freelance", "investasi", "bisnis", "lainnya"]),
      amount: z.number().min(0),
      frequency: z.enum(["bulanan", "tahunan", "sekali"]).optional(),
    })).mutation(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND", message: "Personal finance profile not found." });
      await upsertPfIncomeSource(resolved.business.id, input);
      return { success: true };
    }),
    deleteIncomeSource: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND" });
      await deletePfIncomeSource(resolved.business.id, input.id);
      return { success: true };
    }),

    // ─── Expense Categories ───
    getExpenseCategories: protectedProcedure.query(async ({ ctx }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) return [];
      return getPfExpenseCategories(resolved.business.id);
    }),
    upsertExpenseCategory: protectedProcedure.input(z.object({
      id: z.number().optional(),
      name: z.string().min(1),
      category: z.enum(["kebutuhan", "keinginan", "tabungan", "cicilan", "asuransi", "lainnya"]),
      budgetAmount: z.number().min(0),
      icon: z.string().optional(),
      color: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND" });
      await upsertPfExpenseCategory(resolved.business.id, input);
      return { success: true };
    }),
    deleteExpenseCategory: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND" });
      await deletePfExpenseCategory(resolved.business.id, input.id);
      return { success: true };
    }),

    // ─── Assets ───
    getAssets: protectedProcedure.query(async ({ ctx }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) return [];
      return getPfAssets(resolved.business.id);
    }),
    upsertAsset: protectedProcedure.input(z.object({
      id: z.number().optional(),
      name: z.string().min(1),
      assetType: z.enum(["investasi", "likuid", "guna"]),
      subType: z.string().optional(),
      currentValue: z.number().min(0),
      purchaseValue: z.number().min(0).optional(),
      notes: z.string().optional(),
      icon: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND" });
      await upsertPfAsset(resolved.business.id, input);
      return { success: true };
    }),
    deleteAsset: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND" });
      await deletePfAsset(resolved.business.id, input.id);
      return { success: true };
    }),

    // ─── Liabilities ───
    getLiabilities: protectedProcedure.query(async ({ ctx }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) return [];
      return getPfLiabilities(resolved.business.id);
    }),
    upsertLiability: protectedProcedure.input(z.object({
      id: z.number().optional(),
      name: z.string().min(1),
      liabilityType: z.enum(["kpr", "kpa", "kta", "kartu_kredit", "pinjaman_online", "cicilan", "lainnya"]),
      totalAmount: z.number().min(0),
      remainingAmount: z.number().min(0),
      monthlyPayment: z.number().min(0),
      interestRate: z.number().min(0).optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND" });
      await upsertPfLiability(resolved.business.id, input);
      return { success: true };
    }),
    deleteLiability: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND" });
      await deletePfLiability(resolved.business.id, input.id);
      return { success: true };
    }),

    // ─── Insurances ───
    getInsurances: protectedProcedure.query(async ({ ctx }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) return [];
      return getPfInsurances(resolved.business.id);
    }),
    upsertInsurance: protectedProcedure.input(z.object({
      id: z.number().optional(),
      name: z.string().min(1),
      insuranceType: z.enum(["jiwa", "kesehatan", "kendaraan", "properti", "pendidikan", "lainnya"]),
      provider: z.string().optional(),
      premiumAmount: z.number().min(0),
      premiumFrequency: z.enum(["bulanan", "triwulan", "semesteran", "tahunan"]).optional(),
      coverageAmount: z.number().min(0),
    })).mutation(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND" });
      await upsertPfInsurance(resolved.business.id, input);
      return { success: true };
    }),
    deleteInsurance: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND" });
      await deletePfInsurance(resolved.business.id, input.id);
      return { success: true };
    }),

    // ─── Heritage ───
    getHeritage: protectedProcedure.query(async ({ ctx }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) return null;
      return getPfHeritage(resolved.business.id);
    }),
    upsertHeritage: protectedProcedure.input(z.object({
      hasWill: z.boolean().optional(),
      hasInsuranceBeneficiary: z.boolean().optional(),
      heritageStatus: z.enum(["sudah_siap", "belum_siap", "sedang_proses"]).optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND" });
      await upsertPfHeritage(resolved.business.id, input);
      return { success: true };
    }),

    // ─── Goals ───
    getGoals: protectedProcedure.query(async ({ ctx }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) return [];
      return getPfGoals(resolved.business.id);
    }),
    upsertGoal: protectedProcedure.input(z.object({
      id: z.number().optional(),
      name: z.string().min(1),
      goalType: z.enum(["dana_darurat", "dana_pensiun", "investasi", "rumah", "kendaraan", "pendidikan", "liburan", "lainnya"]),
      targetAmount: z.number().min(0),
      currentAmount: z.number().min(0).optional(),
      targetDate: z.string().optional(),
      priority: z.number().min(1).max(10).optional(),
      icon: z.string().optional(),
      color: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND" });
      await upsertPfGoal(resolved.business.id, input);
      return { success: true };
    }),
    deleteGoal: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND" });
      await deletePfGoal(resolved.business.id, input.id);
      return { success: true };
    }),

    // ─── Dashboard Summary ───
    getDashboard: protectedProcedure.query(async ({ ctx }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId, ctx.user.role);
      if (!resolved) return null;
      return getPfDashboardSummary(resolved.business.id);
    }),
  }),
});
export type AppRouter = typeof appRouter;
