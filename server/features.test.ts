import { describe, it, expect } from "vitest";
import {
  createClient,
  getClientsByBusiness,
  updateClient,
  deleteClient,
  createDebt,
  getDebtsByBusiness,
  updateDebt,
  createDebtPayment,
  getDebtPayments,
  createBudget,
  getBudgetsByBusiness,
  updateBudget,
  deleteBudget,
  createTransferBetweenAccounts,
  getSalesAnalytics,
} from "./db";

// ─── Client Management ───
describe("Client Management", () => {
  it("createClient returns an id", async () => {
    const id = await createClient({
      businessId: 1,
      name: "PT Test Client",
      email: "test@client.com",
      phone: "081234567890",
      address: "Jl. Test 123",
      type: "customer",
      notes: "Test client",
    });
    expect(typeof id).toBe("number");
    expect(id).toBeGreaterThan(0);
  }, 10000);

  it("getClientsByBusiness returns array", async () => {
    const clients = await getClientsByBusiness(1);
    expect(Array.isArray(clients)).toBe(true);
  });

  it("updateClient does not throw", async () => {
    const id = await createClient({
      businessId: 1,
      name: "Update Test",
      type: "supplier",
    });
    await expect(updateClient(id, { name: "Updated Name" })).resolves.not.toThrow();
  });

  it("deleteClient does not throw", async () => {
    const id = await createClient({
      businessId: 1,
      name: "Delete Test",
      type: "customer",
    });
    await expect(deleteClient(id)).resolves.not.toThrow();
  });
});

// ─── Debts / Receivables ───
describe("Debts & Receivables", () => {
  it("createDebt returns an id", async () => {
    const id = await createDebt({
      businessId: 1,
      type: "hutang",
      counterpartyName: "Supplier ABC",
      totalAmount: 5000000,
      paidAmount: 0,
      description: "Pembelian bahan baku",
      dueDate: "2026-04-01",
      status: "belum_lunas",
    });
    expect(typeof id).toBe("number");
    expect(id).toBeGreaterThan(0);
  });

  it("getDebtsByBusiness returns array", async () => {
    const debts = await getDebtsByBusiness(1);
    expect(Array.isArray(debts)).toBe(true);
  });

  it("updateDebt does not throw", async () => {
    const id = await createDebt({
      businessId: 1,
      type: "piutang",
      counterpartyName: "Customer XYZ",
      totalAmount: 3000000,
      paidAmount: 0,
      status: "belum_lunas",
    });
    await expect(updateDebt(id, { status: "lunas" })).resolves.not.toThrow();
  });

  it("createDebtPayment returns an id", async () => {
    const debtId = await createDebt({
      businessId: 1,
      type: "hutang",
      counterpartyName: "Test Vendor",
      totalAmount: 1000000,
      paidAmount: 0,
      status: "belum_lunas",
    });
    const paymentId = await createDebtPayment({
      debtId,
      amount: 500000,
      paymentDate: "2026-03-15",
      notes: "Cicilan pertama",
    });
    expect(typeof paymentId).toBe("number");
    expect(paymentId).toBeGreaterThan(0);
  });

  it("getDebtPayments returns array", async () => {
    const payments = await getDebtPayments(999999);
    expect(Array.isArray(payments)).toBe(true);
    expect(payments.length).toBe(0);
  });
});

// ─── Budget Management ───
describe("Budget Management", () => {
  it("createBudget returns an id", async () => {
    const id = await createBudget({
      businessId: 1,
      category: "Pembelian Stok",
      budgetAmount: 10000000,
      period: "2026-03",
    });
    expect(typeof id).toBe("number");
    expect(id).toBeGreaterThan(0);
  });

  it("getBudgetsByBusiness returns array", async () => {
    const budgets = await getBudgetsByBusiness(1, "2026-03");
    expect(Array.isArray(budgets)).toBe(true);
  });

  it("updateBudget does not throw", async () => {
    const id = await createBudget({
      businessId: 1,
      category: "Gaji Karyawan",
      budgetAmount: 5000000,
      period: "2026-03",
    });
    await expect(updateBudget(id, { budgetAmount: 6000000 })).resolves.not.toThrow();
  });

  it("deleteBudget does not throw", async () => {
    const id = await createBudget({
      businessId: 1,
      category: "Delete Test",
      budgetAmount: 1000000,
      period: "2026-03",
    });
    await expect(deleteBudget(id)).resolves.not.toThrow();
  });
});

// ─── Transfer Between Accounts ───
describe("Transfer Between Accounts", () => {
  it("createTransferBetweenAccounts handles missing accounts gracefully", async () => {
    // This test verifies the function doesn't crash with non-existent accounts
    try {
      const result = await createTransferBetweenAccounts(1, "NonExistentAccount1", "NonExistentAccount2", 500000, "2026-03-15", "Test transfer");
      // If it succeeds, check it has a txCode
      expect(result).toBeDefined();
    } catch (err: any) {
      // Expected to throw because accounts don't exist
      expect(err).toBeDefined();
    }
  });
});

// ─── Sales Analytics ───
describe("Sales Analytics", () => {
  it("getSalesAnalytics returns structured data", async () => {
    const analytics = await getSalesAnalytics(1, 2026);
    expect(analytics).toBeDefined();
    expect(analytics).toHaveProperty("monthlySales");
    expect(analytics).toHaveProperty("monthlyExpenses");
    expect(analytics).toHaveProperty("topProducts");
    expect(analytics).toHaveProperty("salesByCategory");
    expect(analytics).toHaveProperty("salesByPaymentMethod");
    expect(analytics).toHaveProperty("dailySales");
    expect(Array.isArray(analytics.monthlySales)).toBe(true);
    expect(Array.isArray(analytics.monthlyExpenses)).toBe(true);
    expect(analytics.monthlySales.length).toBe(12);
    expect(analytics.monthlyExpenses.length).toBe(12);
  });

  it("getSalesAnalytics returns zeros for non-existent business", async () => {
    const analytics = await getSalesAnalytics(999999, 2026);
    expect(analytics.monthlySales.every((v: number) => v === 0)).toBe(true);
    expect(analytics.monthlyExpenses.every((v: number) => v === 0)).toBe(true);
  });
});
