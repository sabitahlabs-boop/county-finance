import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db functions
vi.mock("./db", async () => {
  const actual = await vi.importActual("./db") as any;
  return {
    ...actual,
    getBusinessByOwnerId: vi.fn(),
    getBusinessById: vi.fn(),
    getTeamMemberByUserAndBusiness: vi.fn(),
    resolveBusinessForUser: vi.fn(),
    getWarehousesByBusiness: vi.fn(),
    getWarehouseById: vi.fn(),
    getDefaultWarehouse: vi.fn(),
    createWarehouse: vi.fn(),
    updateWarehouse: vi.fn(),
    deleteWarehouse: vi.fn(),
    ensureDefaultWarehouse: vi.fn(),
    getWarehouseStockByWarehouse: vi.fn(),
    getWarehouseStockByProduct: vi.fn(),
    adjustWarehouseStock: vi.fn(),
    performStockTransfer: vi.fn(),
    getStockTransfersByBusiness: vi.fn(),
    migrateStockToDefaultWarehouse: vi.fn(),
  };
});

import {
  resolveBusinessForUser,
  getWarehousesByBusiness,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  ensureDefaultWarehouse,
  getWarehouseStockByWarehouse,
  getWarehouseStockByProduct,
  performStockTransfer,
  getStockTransfersByBusiness,
  migrateStockToDefaultWarehouse,
} from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    clerkUserId: "clerk_test_user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "clerk",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    requestedBusinessId: null,
    req: {
      protocol: "https",
      headers: { origin: "https://test.example.com" },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

const mockBusiness = { id: 100, businessName: "Test Biz", ownerId: 1 };
const mockResolvedBusiness = { business: mockBusiness, isOwner: true, membership: null };

describe("warehouse routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (resolveBusinessForUser as any).mockResolvedValue(mockResolvedBusiness);
  });

  describe("warehouse.list", () => {
    it("returns warehouses for the user's business", async () => {
      const mockWarehouses = [
        { id: 1, name: "Gudang Utama", isDefault: true, isActive: true },
        { id: 2, name: "Gudang Cabang", isDefault: false, isActive: true },
      ];
      (getWarehousesByBusiness as any).mockResolvedValue(mockWarehouses);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.warehouse.list();

      expect(result).toEqual(mockWarehouses);
      expect(getWarehousesByBusiness).toHaveBeenCalledWith(100);
    });

    it("returns empty array if no business found", async () => {
      (resolveBusinessForUser as any).mockResolvedValue(null);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.warehouse.list();

      expect(result).toEqual([]);
    });
  });

  describe("warehouse.create", () => {
    it("creates a new warehouse", async () => {
      (createWarehouse as any).mockResolvedValue(5);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.warehouse.create({
        name: "Gudang Baru",
        address: "Jl. Test 123",
        phone: "08123456789",
        notes: "Test notes",
      });

      expect(result).toEqual({ id: 5 });
      expect(createWarehouse).toHaveBeenCalledWith(
        expect.objectContaining({
          businessId: 100,
          name: "Gudang Baru",
          address: "Jl. Test 123",
          phone: "08123456789",
          notes: "Test notes",
          isDefault: false,
          isActive: true,
        })
      );
    });

    it("throws if business not found", async () => {
      (resolveBusinessForUser as any).mockResolvedValue(null);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.warehouse.create({ name: "Test" })).rejects.toThrow();
    });
  });

  describe("warehouse.update", () => {
    it("updates warehouse details", async () => {
      (updateWarehouse as any).mockResolvedValue(undefined);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.warehouse.update({ id: 1, name: "Updated Name" });

      expect(result).toEqual({ success: true });
      expect(updateWarehouse).toHaveBeenCalledWith(1, { name: "Updated Name" });
    });
  });

  describe("warehouse.delete", () => {
    it("deletes a non-default warehouse", async () => {
      (getWarehouseById as any).mockResolvedValue({ id: 2, isDefault: false });
      (deleteWarehouse as any).mockResolvedValue(undefined);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.warehouse.delete({ id: 2 });

      expect(result).toEqual({ success: true });
    });

    it("rejects deleting the default warehouse", async () => {
      (getWarehouseById as any).mockResolvedValue({ id: 1, isDefault: true });

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.warehouse.delete({ id: 1 })).rejects.toThrow("Tidak bisa menghapus gudang utama");
    });
  });

  describe("warehouse.setDefault", () => {
    it("sets a warehouse as default and unsets others", async () => {
      const warehouses = [
        { id: 1, isDefault: true },
        { id: 2, isDefault: false },
      ];
      (getWarehousesByBusiness as any).mockResolvedValue(warehouses);
      (updateWarehouse as any).mockResolvedValue(undefined);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.warehouse.setDefault({ id: 2 });

      expect(result).toEqual({ success: true });
      expect(updateWarehouse).toHaveBeenCalledWith(1, { isDefault: false });
      expect(updateWarehouse).toHaveBeenCalledWith(2, { isDefault: true });
    });
  });

  describe("warehouse.stock", () => {
    it("returns stock for a specific warehouse", async () => {
      const mockStock = [
        { id: 1, warehouseId: 1, productId: 10, quantity: 50, productName: "Widget" },
      ];
      (getWarehouseStockByWarehouse as any).mockResolvedValue(mockStock);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.warehouse.stock({ warehouseId: 1 });

      expect(result).toEqual(mockStock);
      expect(getWarehouseStockByWarehouse).toHaveBeenCalledWith(1);
    });
  });

  describe("warehouse.productDistribution", () => {
    it("returns distribution of a product across warehouses", async () => {
      const mockDist = [
        { warehouseId: 1, warehouseName: "Gudang Utama", quantity: 30 },
        { warehouseId: 2, warehouseName: "Gudang Cabang", quantity: 20 },
      ];
      (getWarehouseStockByProduct as any).mockResolvedValue(mockDist);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.warehouse.productDistribution({ productId: 10 });

      expect(result).toEqual(mockDist);
    });
  });

  describe("warehouse.transfer", () => {
    it("transfers stock between warehouses", async () => {
      const mockResult = { fromQty: 20, toQty: 30 };
      (performStockTransfer as any).mockResolvedValue(mockResult);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.warehouse.transfer({
        fromWarehouseId: 1,
        toWarehouseId: 2,
        productId: 10,
        qty: 5,
        date: "2026-03-30",
      });

      expect(result).toEqual(mockResult);
      expect(performStockTransfer).toHaveBeenCalledWith(
        expect.objectContaining({
          businessId: 100,
          fromWarehouseId: 1,
          toWarehouseId: 2,
          productId: 10,
          qty: 5,
        })
      );
    });

    it("rejects transfer to same warehouse", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.warehouse.transfer({
          fromWarehouseId: 1,
          toWarehouseId: 1,
          productId: 10,
          qty: 5,
          date: "2026-03-30",
        })
      ).rejects.toThrow("Gudang asal dan tujuan harus berbeda");
    });
  });

  describe("warehouse.transfers", () => {
    it("returns transfer history", async () => {
      const mockTransfers = [
        { id: 1, fromWarehouseId: 1, toWarehouseId: 2, productId: 10, qty: 5 },
      ];
      (getStockTransfersByBusiness as any).mockResolvedValue(mockTransfers);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.warehouse.transfers();

      expect(result).toEqual(mockTransfers);
      expect(getStockTransfersByBusiness).toHaveBeenCalledWith(100, 100);
    });
  });

  describe("warehouse.ensureDefault", () => {
    it("creates default warehouse if none exists", async () => {
      const mockWh = { id: 1, name: "Gudang Utama", isDefault: true };
      (ensureDefaultWarehouse as any).mockResolvedValue(mockWh);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.warehouse.ensureDefault();

      expect(result).toEqual(mockWh);
      expect(ensureDefaultWarehouse).toHaveBeenCalledWith(100);
    });
  });

  describe("warehouse.migrateStock", () => {
    it("migrates existing stock to default warehouse", async () => {
      (migrateStockToDefaultWarehouse as any).mockResolvedValue(undefined);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.warehouse.migrateStock();

      expect(result).toEqual({ success: true });
      expect(migrateStockToDefaultWarehouse).toHaveBeenCalledWith(100);
    });
  });
});
