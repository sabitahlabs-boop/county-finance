import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getBusinessByOwnerId, getBusinessById, getBusinessBySlug, createBusiness, updateBusiness, getAllBusinesses,
  getActiveTaxRules, seedDefaultTaxRules, updateTaxRule,
  getProductsByBusiness, getProductById, createProduct, updateProduct, countProductsByBusiness, getLowStockProducts,
  createTransaction, updateTransaction, getTransactionsByBusiness, countTransactionsForMonth, softDeleteTransaction, getTransactionById, generateTxCode,
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
  getBankAccountsByBusiness, getBankAccountById, createBankAccount, updateBankAccount, deleteBankAccount, getBalancesByAccounts,
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
  performStockTransfer, getStockTransfersByBusiness, migrateStockToDefaultWarehouse,
  getTeamMembersByBusiness, getTeamMemberByUserAndBusiness, getTeamMembershipsByUser,
  createTeamMember, updateTeamMember, deleteTeamMember, getTeamMemberById,
  createTeamInvite, getTeamInviteByToken, getTeamInvitesByBusiness, updateTeamInviteStatus, deleteTeamInvite,
  getBusinessForTeamMember, getUserById, getUsersByIds,
  ROLE_PERMISSIONS, PERMISSION_LABELS,
  resolveBusinessForUser,
  getSavingsGoalsByBusiness, createSavingsGoal, updateSavingsGoal, deleteSavingsGoal, addToSavingsGoal,
  getMonthlyBillsByBusiness, createMonthlyBill, updateMonthlyBill, deleteMonthlyBill,
  updateBusinessDebtEnabled, updateBusinessPersonalSetupDone,
  createPosShift, getOpenShift, closePosShift, getShiftsByBusiness, getPosShiftById,
  createDiscountCode, getDiscountCodesByBusiness, validateDiscountCode, incrementDiscountUsage, updateDiscountCode, deleteDiscountCode,
  generateReceiptCode, createPosReceipt, getPosReceiptsByBusiness, getPosReceiptById, refundPosReceipt,
  getDailySalesReport,
  seedDummyData, clearBusinessData,
  generateNeraca, generatePerubahanModal, generateCALK,
} from "./db";
import { PLAN_LIMITS, BULAN_INDONESIA, formatRupiah } from "../shared/finance";
import { notifyOwner } from "./_core/notification";

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
      // Use resolveBusinessForUser to support multi-business switching
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId);
      return resolved?.business ?? null;
    }),
    getPlan: protectedProcedure.query(async ({ ctx }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId);
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
      // If user already has a business, just return it (idempotent)
      const existing = await getBusinessByOwnerId(ctx.user.id);
      if (existing) return { id: existing.id };
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
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND", message: "Bisnis tidak ditemukan" });
      await updateBusiness(biz.id, input);
      return { success: true };
    }),
    setMode: protectedProcedure.input(z.object({
      appMode: z.enum(["personal", "umkm"]),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND", message: "Bisnis tidak ditemukan" });
      await updateBusinessMode(biz.id, input.appMode);
      return { success: true };
    }),
    togglePos: protectedProcedure.input(z.object({
      posEnabled: z.boolean(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND", message: "Bisnis tidak ditemukan" });
      await updateBusinessPosEnabled(biz.id, input.posEnabled);
      return { success: true };
    }),
    toggleDebt: protectedProcedure.input(z.object({
      debtEnabled: z.boolean(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND", message: "Bisnis tidak ditemukan" });
      await updateBusinessDebtEnabled(biz.id, input.debtEnabled);
      return { success: true };
    }),
    completePersonalSetup: protectedProcedure.mutation(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      await updateBusinessPersonalSetupDone(biz.id);
      return { success: true };
    }),
  }),

  // ─── Savings Goals (Tabungan Impian) ───
  savings: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const { id, ...data } = input;
      await updateSavingsGoal(id, biz.id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      await deleteSavingsGoal(input.id, biz.id);
      return { success: true };
    }),
    addFunds: protectedProcedure.input(z.object({
      id: z.number(),
      amount: z.number().min(1),
      bankAccountName: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const result = await addToSavingsGoal(input.id, biz.id, input.amount);
      if (!result) throw new TRPCError({ code: "NOT_FOUND" });
      // Auto-create journal transaction
      const txCode = await generateTxCode(biz.id);
      await createTransaction({
        businessId: biz.id,
        txCode,
        date: new Date().toISOString().slice(0, 10),
        type: "pengeluaran",
        category: "Tabungan Impian",
        description: `Setor tabungan: ${result.name}`,
        amount: input.amount,
        paymentMethod: input.bankAccountName || "tunai",
        taxRelated: false,
        notes: `Tabungan impian "${result.name}" — progress ${formatRupiah(result.currentAmount)} / ${formatRupiah(result.targetAmount)}`,
      });
      return result;
    }),
  }),

  // ─── Monthly Bills (Tagihan Bulanan) ───
  monthlyBills: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const { id, ...data } = input;
      await updateMonthlyBill(id, biz.id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const bills = await getMonthlyBillsByBusiness(biz.id);
      const bill = bills.find((b: any) => b.id === input.id);
      if (!bill) throw new TRPCError({ code: "NOT_FOUND", message: "Tagihan tidak ditemukan" });
      // Create journal transaction for the bill payment
      const txCode = await generateTxCode(biz.id);
      const txId = await createTransaction({
        businessId: biz.id,
        txCode,
        date: new Date().toISOString().slice(0, 10),
        type: "pengeluaran",
        category: "Tagihan Bulanan",
        description: `Bayar tagihan: ${bill.name}`,
        amount: input.amount,
        paymentMethod: input.bankAccountName || "tunai",
        taxRelated: false,
        notes: `Tagihan rutin "${bill.name}" (${bill.category}) — jatuh tempo tgl ${bill.dueDay}${input.notes ? " | " + input.notes : ""}`,
      });
      return { txId, success: true };
    }),
  }),

  // ─── Products / Stock ───
  product: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) return [];
      return getProductsByBusiness(biz.id);
    }),
    lowStock: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
      priceType: z.enum(["fixed", "dynamic"]).default("fixed"),
      discountPercent: z.number().min(0).max(100).default(0),
      warehouseId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND", message: "Bisnis tidak ditemukan" });
      // No plan limits — all users are Pro
      const { discountPercent: discPct, warehouseId, ...restInput } = input;
      const id = await createProduct({ ...restInput, businessId: biz.id, discountPercent: String(discPct ?? 0) });
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
      priceType: z.enum(["fixed", "dynamic"]).optional(),
      discountPercent: z.number().min(0).max(100).optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const product = await getProductById(input.productId);
      if (!product || product.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      const direction = input.type === "out" ? -1 : 1;
      const newStock = product.stockCurrent + (input.qty * direction);
      if (newStock < 0) throw new TRPCError({ code: "BAD_REQUEST", message: `Stok tidak cukup. Stok saat ini: ${product.stockCurrent}` });
      const today = new Date().toISOString().substring(0, 10);
      await createStockLog({ businessId: biz.id, productId: product.id, date: today, movementType: input.type, qty: input.qty, direction, stockBefore: product.stockCurrent, stockAfter: newStock, notes: input.notes || "" });
      await updateProduct(product.id, { stockCurrent: newStock });
      // Also update warehouse stock if warehouseId provided
      let whId = input.warehouseId;
      if (!whId) {
        const defWh = await getDefaultWarehouse(biz.id);
        if (defWh) whId = defWh.id;
      }
      if (whId) {
        try {
              await adjustWarehouseStock({ warehouseId: whId, productId: product.id, qty: input.qty, direction: direction as 1 | -1 });
        } catch { /* warehouse stock sync best-effort */ }
      }
      return { stockBefore: product.stockCurrent, stockAfter: newStock };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const product = await getProductById(input.id);
      if (!product || product.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      await updateProduct(input.id, { isActive: false });
      return { success: true };
    }),
    stockLogs: protectedProcedure.input(z.object({ productId: z.number() })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) return [];
      const product = await getProductById(input.productId);
      if (!product || product.businessId !== biz.id) return [];
      const { getStockLogsByProduct } = await import("./db");
      return getStockLogsByProduct(input.productId);
    }),
    allStockHistory: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND", message: "Bisnis tidak ditemukan" });
      // No plan limits — all users are Pro
      const results: { name: string; id: number }[] = [];
      const today = new Date().toISOString().substring(0, 10);
      for (const p of input.products) {
        const id = await createProduct({ ...p, businessId: biz.id });
        if (p.stockCurrent > 0) {
          await createStockLog({ businessId: biz.id, productId: id, date: today, movementType: "opening", qty: p.stockCurrent, direction: 1, stockBefore: 0, stockAfter: p.stockCurrent, notes: "Stok awal (bulk import)" });
        }
        results.push({ name: p.name, id });
      }
      return { imported: results.length, products: results };
    }),
  }),

  // ─── Export Data ───
  export: router({
    transactions: protectedProcedure.input(z.object({
      month: z.number().optional(),
      year: z.number().optional(),
    }).optional()).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
      const id = await createTransaction({ ...input, businessId: biz.id, txCode, productHppSnapshot, taxRelated: true });
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
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const tx = await getTransactionById(input.id);
      if (!tx || tx.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      const { id, ...data } = input;
      await updateTransaction(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      // All users have Pro access — no plan restriction
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
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) return [];
      return calcTaxForMonth(biz.id, input.month, input.year);
    }),
    payments: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const id = await createTaxPayment({ ...input, businessId: biz.id });
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
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return generateLabaRugi(biz.id, input.month, input.year);
    }),
    arusKas: protectedProcedure.input(z.object({ month: z.number(), year: z.number() })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return generateArusKas(biz.id, input.month, input.year);
    }),
    neraca: protectedProcedure.input(z.object({ month: z.number(), year: z.number() })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return generateNeraca(biz.id, input.month, input.year);
    }),
    perubahanModal: protectedProcedure.input(z.object({ month: z.number(), year: z.number() })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return generatePerubahanModal(biz.id, input.month, input.year);
    }),
    calk: protectedProcedure.input(z.object({ month: z.number(), year: z.number() })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return generateCALK(biz.id, input.month, input.year);
    }),
    dashboard: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getDashboardKPIs(biz.id);
    }),
    yearlyOmzet: protectedProcedure.input(z.object({ year: z.number() })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) return new Array(12).fill(0);
      return getYearlyOmzet(biz.id, input.year);
    }),
    summary: protectedProcedure.input(z.object({ month: z.number(), year: z.number() })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getTransactionSummary(biz.id, input.month, input.year);
    }),
    dailySales: protectedProcedure.input(z.object({ date: z.string() })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      return getDailySalesReport(biz.id, input.date);
    }),
  }),

  // ─── Notifications ───
  notification: router({
    sendTaxReminder: protectedProcedure.mutation(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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

  // ─── Search Products (for scan-to-stock matching) ───
  searchProducts: protectedProcedure.input(z.object({ name: z.string() })).query(async ({ ctx, input }) => {
    const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
    if (!biz) return [];
    return searchProductsByName(biz.id, input.name);
  }),

  // ─── Product Categories (user-defined) ───
  category: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) return [];
      return getProductCategories(biz.id);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1).max(100),
      parentId: z.number().nullable().optional(),
      sortOrder: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const { id, ...data } = input;
      await updateProductCategory(id, biz.id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) return [];
      return getBankAccountsByBusiness(biz.id);
    }),
    balances: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) return {};
      const accounts = await getBankAccountsByBusiness(biz.id);
      if (accounts.length === 0) return {};
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
      initialBalance: z.number().default(0),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND", message: "Bisnis tidak ditemukan" });
      const id = await createBankAccount({ ...input, businessId: biz.id });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      accountName: z.string().optional(),
      accountType: z.enum(["bank", "ewallet", "cash"]).optional(),
      icon: z.string().optional(),
      color: z.string().optional(),
      initialBalance: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const account = await getBankAccountById(input.id);
      if (!account || account.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      const { id, ...data } = input;
      await updateBankAccount(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const account = await getBankAccountById(input.id);
      if (!account || account.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      await deleteBankAccount(input.id);
      return { success: true };
    }),
    transfer: protectedProcedure.input(z.object({
      fromAccount: z.string(),
      toAccount: z.string(),
      amount: z.number().min(1),
      date: z.string(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      if (input.fromAccount === input.toAccount) throw new TRPCError({ code: "BAD_REQUEST", message: "Akun asal dan tujuan harus berbeda" });
      const result = await createTransferBetweenAccounts(biz.id, input.fromAccount, input.toAccount, input.amount, input.date, input.notes);
      return result;
    }),
  }),

  // ─── Client Management ───
  clientMgmt: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) return [];
      return getClientsByBusiness(biz.id);
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const client = await getClientById(input.id);
      if (!client || client.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      const { id, ...data } = input;
      await updateClient(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const client = await getClientById(input.id);
      if (!client || client.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      await deleteClient(input.id);
      return { success: true };
    }),
    transactions: protectedProcedure.input(z.object({ clientId: z.number() })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) return [];
      return getTransactionsByClient(biz.id, input.clientId);
    }),
  }),

  // ─── Debts / Receivables (Hutang & Piutang) ───
  debt: router({
    list: protectedProcedure.input(z.object({ type: z.enum(["hutang", "piutang"]).optional() }).optional()).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) return [];
      return getDebtsByBusiness(biz.id, input?.type);
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
      totalAmount: z.number().min(1),
      dueDate: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const id = await createDebt({ ...input, businessId: biz.id });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      counterpartyName: z.string().optional(),
      description: z.string().optional(),
      totalAmount: z.number().optional(),
      dueDate: z.string().optional(),
      notes: z.string().optional(),
      status: z.enum(["belum_lunas", "lunas", "terlambat"]).optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const debt = await getDebtById(input.id);
      if (!debt || debt.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      const { id, ...data } = input;
      await updateDebt(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const debt = await getDebtById(input.id);
      if (!debt || debt.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      await deleteDebt(input.id);
      return { success: true };
    }),
    payments: protectedProcedure.input(z.object({ debtId: z.number() })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) return [];
      const debt = await getDebtById(input.debtId);
      if (!debt || debt.businessId !== biz.id) return [];
      return getDebtPayments(input.debtId);
    }),
    addPayment: protectedProcedure.input(z.object({
      debtId: z.number(),
      amount: z.number().min(1),
      paymentDate: z.string(),
      paymentMethod: z.string().default("tunai"),
      bankAccountName: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const debt = await getDebtById(input.debtId);
      if (!debt || debt.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      const remaining = debt.totalAmount - debt.paidAmount;
      if (input.amount > remaining) throw new TRPCError({ code: "BAD_REQUEST", message: `Pembayaran melebihi sisa (${remaining})` });
      const id = await createDebtPayment(input);
      // Auto-create journal transaction
      const txCode = await generateTxCode(biz.id);
      const paymentAccount = input.bankAccountName || input.paymentMethod;
      if (debt.type === "hutang") {
        // Hutang: kita bayar hutang → pengeluaran dari rekening kita
        await createTransaction({
          businessId: biz.id,
          txCode,
          date: input.paymentDate,
          type: "pengeluaran",
          category: "Pembayaran Hutang",
          description: `Bayar hutang ke ${debt.counterpartyName}`,
          amount: input.amount,
          paymentMethod: paymentAccount,
          taxRelated: false,
          notes: `Hutang ke ${debt.counterpartyName} — sisa ${formatRupiah(remaining - input.amount)}${input.notes ? " | " + input.notes : ""}`,
        });
      } else {
        // Piutang: orang bayar ke kita → pemasukan ke rekening kita
        await createTransaction({
          businessId: biz.id,
          txCode,
          date: input.paymentDate,
          type: "pemasukan",
          category: "Penerimaan Piutang",
          description: `Terima pembayaran piutang dari ${debt.counterpartyName}`,
          amount: input.amount,
          paymentMethod: paymentAccount,
          taxRelated: false,
          notes: `Piutang dari ${debt.counterpartyName} — sisa ${formatRupiah(remaining - input.amount)}${input.notes ? " | " + input.notes : ""}`,
        });
      }
      return { id };
    }),
    deletePayment: protectedProcedure.input(z.object({ id: z.number(), debtId: z.number() })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) return [];
      return getBudgetsByBusiness(biz.id, input?.period);
    }),
    create: protectedProcedure.input(z.object({
      period: z.string(),
      category: z.string().min(1),
      budgetAmount: z.number().min(1),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const budget = await getBudgetById(input.id);
      if (!budget || budget.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      const { id, ...data } = input;
      await updateBudget(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const budget = await getBudgetById(input.id);
      if (!budget || budget.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      await deleteBudget(input.id);
      return { success: true };
    }),
    spending: protectedProcedure.input(z.object({ period: z.string() })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) return {};
      return getSpendingByCategory(biz.id, input.period);
    }),
  }),

  // ─── Settings (Calculator, Signature) ───
  settings: router({
    toggleCalculator: protectedProcedure.input(z.object({ enabled: z.boolean() })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      await updateBusinessCalculator(biz.id, input.enabled);
      return { success: true };
    }),
    updateSignature: protectedProcedure.input(z.object({ signatureUrl: z.string().nullable() })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      await updateBusinessSignature(biz.id, input.signatureUrl);
      return { success: true };
    }),
  }),

  // ─── Sales Analytics ───
  analytics: router({
    sales: protectedProcedure.input(z.object({ year: z.number() })).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) return null;
      return getSalesAnalytics(biz.id, input.year);
    }),
  }),

  // ─── Due Date Notifications ───
  notifications: router({
    dueDates: protectedProcedure.input(z.object({ daysAhead: z.number().default(7) }).optional()).query(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
        const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
        const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
      .query(async ({ input }) => {
        return getWarehouseStockByProduct(input.productId);
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
        const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
        if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
        if (input.fromWarehouseId === input.toWarehouseId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Gudang asal dan tujuan harus berbeda" });
        }
        try {
          return await performStockTransfer({ businessId: biz.id, ...input });
        } catch (e: any) {
          throw new TRPCError({ code: "BAD_REQUEST", message: e.message });
        }
      }),

    // Get transfer history
    transfers: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
        if (!biz) return [];
        return getStockTransfersByBusiness(biz.id, input?.limit ?? 100);
      }),

    // Migrate existing stock to default warehouse (one-time)
    migrateStock: protectedProcedure.mutation(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
        })),
      };
    }),

    // Get role permissions map
    rolePermissions: protectedProcedure.query(() => {
      return { roles: ROLE_PERMISSIONS, labels: PERMISSION_LABELS };
    }),

    // List team members (owner only, Pro+ only)
    list: protectedProcedure.query(async ({ ctx }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) return [];
      if (biz.plan !== "pro_plus") return [];
      return getTeamInvitesByBusiness(biz.id);
    }),

    // Delete/cancel invite (owner only)
    cancelInvite: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
    })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
      if (!biz) throw new TRPCError({ code: "NOT_FOUND" });
      const member = await getTeamMemberById(input.memberId);
      if (!member || member.businessId !== biz.id) throw new TRPCError({ code: "NOT_FOUND" });
      const updates: any = {};
      if (input.role) updates.role = input.role;
      if (input.permissions) updates.permissions = input.permissions;
      if (input.status) updates.status = input.status;
      await updateTeamMember(input.memberId, updates);
      return { success: true };
    }),

    // Remove member (owner only)
    removeMember: protectedProcedure.input(z.object({ memberId: z.number() })).mutation(async ({ ctx, input }) => {
      const biz = (await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId))?.business;
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
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId);
      if (!resolved) return null;
      return getOpenShift(resolved.business.id, ctx.user.id);
    }),

    // Open a new shift
    open: protectedProcedure.input(z.object({
      openingCash: z.number().min(0),
      warehouseId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId);
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
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId);
      if (!resolved) return [];
      return getShiftsByBusiness(resolved.business.id, input?.limit ?? 50);
    }),
  }),

  // ─── Discount Codes ───
  discount: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId);
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
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId);
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
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId);
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
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId);
      if (!resolved) return [];
      return getPosReceiptsByBusiness(resolved.business.id, input?.limit ?? 50);
    }),

    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return getPosReceiptById(input.id);
    }),

    // Create receipt (checkout with split payment support)
    create: protectedProcedure.input(z.object({
      subtotal: z.number(),
      discountAmount: z.number().default(0),
      discountCodeId: z.number().optional(),
      grandTotal: z.number(),
      payments: z.array(z.object({ method: z.string(), amount: z.number() })),
      customerPaid: z.number(),
      changeAmount: z.number().default(0),
      shiftId: z.number().optional(),
      clientId: z.number().optional(),
      notes: z.string().optional(),
      // Cart items to create individual transactions for
      items: z.array(z.object({
        productId: z.number(),
        productQty: z.number(),
        amount: z.number(),
        hppSnapshot: z.number().optional(),
        warehouseId: z.number().optional(),
      })),
    })).mutation(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND" });
      const bizId = resolved.business.id;
      const today = new Date().toISOString().slice(0, 10);

      // Generate receipt code
      const receiptCode = await generateReceiptCode(bizId);

      // Create the receipt
      const receiptId = await createPosReceipt({
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
        date: today,
      });

      // Increment discount usage if applicable
      if (input.discountCodeId) {
        await incrementDiscountUsage(input.discountCodeId);
      }

      // Create individual transactions for each cart item
      const primaryMethod = input.payments[0]?.method ?? "Tunai";
      for (const item of input.items) {
        const txCode = await generateTxCode(bizId);
        await createTransaction({
          businessId: bizId,
          txCode,
          date: today,
          type: "pemasukan",
          category: "Penjualan POS",
          description: `POS ${receiptCode}`,
          amount: item.amount,
          paymentMethod: primaryMethod,
          productId: item.productId,
          productQty: item.productQty,
          productHppSnapshot: item.hppSnapshot ?? null,
          receiptId,
          shiftId: input.shiftId ?? null,
        });
      }

      return { receiptId, receiptCode };
    }),

    // Refund a receipt
    refund: protectedProcedure.input(z.object({
      receiptId: z.number(),
      reason: z.string().min(1),
    })).mutation(async ({ ctx, input }) => {
      const resolved = await resolveBusinessForUser(ctx.user.id, ctx.requestedBusinessId);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND" });

      const receipt = await refundPosReceipt(input.receiptId, input.reason);
      if (!receipt) throw new TRPCError({ code: "NOT_FOUND", message: "Struk tidak ditemukan atau sudah di-refund" });

      // Create a refund transaction
      const txCode = await generateTxCode(resolved.business.id);
      await createTransaction({
        businessId: resolved.business.id,
        txCode,
        date: new Date().toISOString().slice(0, 10),
        type: "pengeluaran",
        category: "Refund POS",
        description: `Refund ${receipt.receiptCode}: ${input.reason}`,
        amount: receipt.grandTotal,
        paymentMethod: receipt.payments[0]?.method ?? "Tunai",
        receiptId: receipt.id,
        shiftId: receipt.shiftId ?? null,
      });

      return { success: true, refundAmount: receipt.grandTotal };
    }),
  }),
});
export type AppRouter = typeof appRouter;
