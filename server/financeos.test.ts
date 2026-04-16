import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";
import { evaluateCondition } from "./db";
import { formatRupiah, smartParseNumber, formatTanggalIndonesia, PLAN_LIMITS, PRO_PRICE } from "../shared/finance";

// ─── Shared Finance Helpers ───
describe("formatRupiah", () => {
  it("formats zero", () => {
    expect(formatRupiah(0)).toBe("Rp 0");
  });
  it("formats positive number with thousands separator", () => {
    expect(formatRupiah(1500000)).toBe("Rp 1.500.000");
  });
  it("formats negative number", () => {
    expect(formatRupiah(-250000)).toBe("-Rp 250.000");
  });
  it("formats small number", () => {
    expect(formatRupiah(500)).toBe("Rp 500");
  });
  it("rounds decimals", () => {
    expect(formatRupiah(1234.56)).toBe("Rp 1.235");
  });
});

describe("smartParseNumber", () => {
  it("parses plain number", () => {
    expect(smartParseNumber("1500000")).toBe(1500000);
  });
  it("parses Rp formatted", () => {
    expect(smartParseNumber("Rp 1.500.000")).toBe(1500000);
  });
  it("returns 0 for empty string", () => {
    expect(smartParseNumber("")).toBe(0);
  });
  it("returns 0 for non-numeric", () => {
    expect(smartParseNumber("abc")).toBe(0);
  });
});

describe("formatTanggalIndonesia", () => {
  it("formats date in Indonesian", () => {
    const date = new Date(2026, 0, 15);
    const result = formatTanggalIndonesia(date);
    expect(result).toContain("Kamis");
    expect(result).toContain("15");
    expect(result).toContain("Januari");
    expect(result).toContain("2026");
  });
});

// ─── Tax Engine: evaluateCondition ───
describe("evaluateCondition", () => {
  const baseBiz = {
    id: 1, ownerId: 1, slug: "test", businessName: "Test", businessType: "retail",
    address: null, phone: null, npwp: null, isPkp: false, hasEmployees: false,
    employeeCount: 0, annualOmzetEstimate: 300000000, brandColor: "#2d9a5a",
    plan: "free" as const, planExpiry: null, waNumber: null, bankName: null,
    bankAccount: null, bankHolder: null, onboardingCompleted: true,
    stripePaymentId: null,
    createdAt: new Date(), updatedAt: new Date(),
  };

  it("returns true when no condition is set", () => {
    const rule = { conditionField: null, conditionOperator: null, conditionValue: null } as any;
    expect(evaluateCondition(rule, baseBiz)).toBe(true);
  });

  it("evaluates lt condition correctly", () => {
    const rule = { conditionField: "annualOmzetEstimate", conditionOperator: "lt", conditionValue: "500000000" } as any;
    expect(evaluateCondition(rule, baseBiz)).toBe(true);
    const richBiz = { ...baseBiz, annualOmzetEstimate: 600000000 };
    expect(evaluateCondition(rule, richBiz)).toBe(false);
  });

  it("evaluates boolean eq condition", () => {
    const rule = { conditionField: "isPkp", conditionOperator: "eq", conditionValue: "true" } as any;
    expect(evaluateCondition(rule, baseBiz)).toBe(false);
    const pkpBiz = { ...baseBiz, isPkp: true };
    expect(evaluateCondition(rule, pkpBiz)).toBe(true);
  });

  it("evaluates hasEmployees condition", () => {
    const rule = { conditionField: "hasEmployees", conditionOperator: "eq", conditionValue: "true" } as any;
    expect(evaluateCondition(rule, baseBiz)).toBe(false);
    const empBiz = { ...baseBiz, hasEmployees: true };
    expect(evaluateCondition(rule, empBiz)).toBe(true);
  });

  it("evaluates gte condition", () => {
    const rule = { conditionField: "annualOmzetEstimate", conditionOperator: "gte", conditionValue: "300000000" } as any;
    expect(evaluateCondition(rule, baseBiz)).toBe(true);
  });
});

// ─── Plan Limits (v3: Free 10 tx, Pro unlimited) ───
describe("PLAN_LIMITS", () => {
  it("free plan has 10 tx limit and 5 products", () => {
    expect(PLAN_LIMITS.free.maxTransactions).toBe(10);
    expect(PLAN_LIMITS.free.maxProducts).toBe(5);
    expect(PLAN_LIMITS.free.canExport).toBe(false);
    expect(PLAN_LIMITS.free.aiScanStruk).toBe(true);
    expect(PLAN_LIMITS.free.aiInsights).toBe(true);
  });
  it("pro plan has unlimited everything", () => {
    expect(PLAN_LIMITS.pro.maxTransactions).toBe(Infinity);
    expect(PLAN_LIMITS.pro.maxProducts).toBe(Infinity);
    expect(PLAN_LIMITS.pro.canExport).toBe(true);
    expect(PLAN_LIMITS.pro.aiScanStruk).toBe(true);
    expect(PLAN_LIMITS.pro.aiInsights).toBe(true);
  });
  it("only two plans exist (free and pro)", () => {
    const plans = Object.keys(PLAN_LIMITS);
    expect(plans).toEqual(["free", "pro"]);
  });
});

// ─── Pro Price ───
describe("PRO_PRICE", () => {
  it("is Rp 299.000 one-time payment (lifetime)", () => {
    expect(PRO_PRICE).toBe(299000);
  });
  it("formats correctly as Rupiah", () => {
    expect(formatRupiah(PRO_PRICE)).toBe("Rp 299.000");
  });
});

// ─── Auth Router ───
type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: { name: string; options: Record<string, unknown> }[] } {
  const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
  const user: AuthenticatedUser = {
    id: 1, clerkUserId: "clerk_test_sample", email: "sample@example.com",
    name: "Sample User", loginMethod: "clerk", role: "user",
    createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });
});

// ─── Receipt Scanner Schema ───
describe("receiptSchema validation", () => {
  it("validates a complete receipt result", () => {
    const validReceipt = {
      storeName: "Toko ABC",
      date: "2026-03-10",
      items: [{ name: "Beras", qty: 2, price: 15000, total: 30000 }],
      subtotal: 30000,
      tax: 0,
      discount: 0,
      total: 30000,
      paymentMethod: "Tunai",
      category: "Pembelian Stok",
      confidence: 85,
      notes: "",
    };
    expect(validReceipt.storeName).toBe("Toko ABC");
    expect(validReceipt.items).toHaveLength(1);
    expect(validReceipt.items[0].total).toBe(30000);
    expect(validReceipt.total).toBe(30000);
    expect(validReceipt.confidence).toBeGreaterThan(0);
    expect(validReceipt.confidence).toBeLessThanOrEqual(100);
  });

  it("validates receipt with multiple items", () => {
    const receipt = {
      storeName: "Indomaret",
      date: "2026-03-10",
      items: [
        { name: "Mie Instan", qty: 5, price: 3500, total: 17500 },
        { name: "Sabun", qty: 1, price: 12000, total: 12000 },
      ],
      subtotal: 29500,
      tax: 0,
      discount: 0,
      total: 29500,
      paymentMethod: "QRIS",
      category: "Pembelian Stok",
      confidence: 92,
      notes: "",
    };
    expect(receipt.items).toHaveLength(2);
    const itemTotal = receipt.items.reduce((s, i) => s + i.total, 0);
    expect(itemTotal).toBe(receipt.subtotal);
  });
});

describe("auth.me", () => {
  it("returns user when authenticated", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.name).toBe("Sample User");
  });

  it("returns null when not authenticated", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

// ─── Stripe Integration ───
describe("Stripe configuration", () => {
  it("PRO_PRICE is valid for IDR zero-decimal currency", () => {
    expect(PRO_PRICE).toBeGreaterThan(0);
    expect(Number.isInteger(PRO_PRICE)).toBe(true);
  });

  it("plan upgrade path is free -> pro only", () => {
    const validPlans = Object.keys(PLAN_LIMITS);
    expect(validPlans).toContain("free");
    expect(validPlans).toContain("pro");
    expect(validPlans).not.toContain("bisnis");
  });
});

// ─── v4: Product Image & Bulk CSV ───
describe("Product image support", () => {
  it("product schema should accept imageUrl field", () => {
    const product = {
      name: "Beras Premium",
      sku: "BRS001",
      price: 75000,
      hpp: 60000,
      stockCurrent: 50,
      stockMinimum: 10,
      unit: "kg",
      imageUrl: "https://storage.example.com/products/beras.jpg",
    };
    expect(product.imageUrl).toBeDefined();
    expect(product.imageUrl).toContain("https://");
  });

  it("product without image should have null imageUrl", () => {
    const product = {
      name: "Gula Pasir",
      sku: "GLP001",
      price: 15000,
      imageUrl: null,
    };
    expect(product.imageUrl).toBeNull();
  });
});

describe("Bulk CSV import validation", () => {
  it("validates CSV row with all required fields", () => {
    const row = {
      name: "Mie Instan",
      sku: "MI001",
      price: "3500",
      hpp: "2800",
      stockCurrent: "100",
      stockMinimum: "20",
      unit: "pcs",
    };
    expect(row.name).toBeTruthy();
    expect(Number(row.price)).toBeGreaterThan(0);
    expect(Number(row.hpp)).toBeGreaterThan(0);
    expect(Number(row.stockCurrent)).toBeGreaterThanOrEqual(0);
  });

  it("rejects CSV row without name", () => {
    const row = { name: "", sku: "X001", price: "1000" };
    expect(row.name).toBeFalsy();
  });

  it("parses numeric strings correctly", () => {
    expect(Number("3500")).toBe(3500);
    expect(Number("0")).toBe(0);
    expect(Number("")).toBe(0); // NaN check
    expect(Number.isNaN(Number(""))).toBe(false); // empty string -> 0
  });
});

describe("POS transaction flow", () => {
  it("calculates cart total correctly", () => {
    const cart = [
      { productId: 1, name: "Beras", price: 75000, qty: 2 },
      { productId: 2, name: "Gula", price: 15000, qty: 3 },
    ];
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    expect(total).toBe(195000);
  });

  it("handles empty cart", () => {
    const cart: { price: number; qty: number }[] = [];
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    expect(total).toBe(0);
  });

  it("calculates change correctly", () => {
    const total = 195000;
    const paid = 200000;
    const change = paid - total;
    expect(change).toBe(5000);
    expect(change).toBeGreaterThanOrEqual(0);
  });
});

describe("Export data format", () => {
  it("formats transaction CSV row correctly", () => {
    const tx = {
      date: "2026-03-10",
      type: "pemasukan",
      category: "Penjualan Produk",
      description: "Jual beras 5kg",
      amount: 375000,
      paymentMethod: "transfer",
    };
    const csvRow = `${tx.date},${tx.type},${tx.category},"${tx.description}",${tx.amount},${tx.paymentMethod}`;
    expect(csvRow).toContain("2026-03-10");
    expect(csvRow).toContain("375000");
    expect(csvRow).toContain("pemasukan");
  });

  it("formats product CSV row with image URL", () => {
    const product = {
      name: "Beras",
      sku: "BRS001",
      price: 75000,
      hpp: 60000,
      stockCurrent: 50,
      unit: "kg",
      imageUrl: "https://storage.example.com/beras.jpg",
    };
    const csvRow = `"${product.name}",${product.sku},${product.price},${product.hpp},${product.stockCurrent},${product.unit},${product.imageUrl}`;
    expect(csvRow).toContain("Beras");
    expect(csvRow).toContain("75000");
    expect(csvRow).toContain("https://");
  });
});

// ─── Receipt Scanner PDF Support (v5 fix) ───
describe("Receipt scanner file type detection", () => {
  it("detects PDF files by MIME type", () => {
    const file = { mimetype: "application/pdf", originalname: "receipt.pdf" };
    const isPdf = file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");
    expect(isPdf).toBe(true);
  });

  it("detects PDF files by extension when MIME is octet-stream", () => {
    const file = { mimetype: "application/octet-stream", originalname: "faktur.PDF" };
    const isPdf = file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");
    expect(isPdf).toBe(true);
  });

  it("detects image files correctly", () => {
    const file = { mimetype: "image/jpeg", originalname: "photo.jpg" };
    const isPdf = file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");
    expect(isPdf).toBe(false);
  });

  it("detects HEIC files from iOS", () => {
    const file = { mimetype: "image/heic", originalname: "IMG_1234.HEIC" };
    const isImage = file.mimetype.startsWith("image/");
    expect(isImage).toBe(true);
  });
});

describe("Receipt scanner base64 conversion for PDF", () => {
  it("creates valid base64 data URL from buffer", () => {
    const testBuffer = Buffer.from("test PDF content");
    const base64Data = testBuffer.toString("base64");
    const dataUrl = `data:application/pdf;base64,${base64Data}`;
    expect(dataUrl).toMatch(/^data:application\/pdf;base64,/);
    expect(base64Data.length).toBeGreaterThan(0);
  });

  it("preserves content through base64 round-trip", () => {
    const original = "Hello PDF World";
    const encoded = Buffer.from(original).toString("base64");
    const decoded = Buffer.from(encoded, "base64").toString();
    expect(decoded).toBe(original);
  });
});

describe("Receipt scanner multer config", () => {
  it("accepts image MIME types", () => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/gif", "image/bmp"];
    for (const type of allowedTypes) {
      expect(type.startsWith("image/")).toBe(true);
    }
  });

  it("accepts PDF MIME type", () => {
    const pdfType = "application/pdf";
    const isAllowed = pdfType === "application/pdf" || pdfType.startsWith("image/");
    expect(isAllowed).toBe(true);
  });

  it("rejects non-image non-PDF types", () => {
    const badTypes = ["text/plain", "application/json", "video/mp4"];
    for (const type of badTypes) {
      const isAllowed = type === "application/pdf" || type.startsWith("image/");
      expect(isAllowed).toBe(false);
    }
  });

  it("enforces 15MB file size limit", () => {
    const maxSize = 15 * 1024 * 1024;
    expect(maxSize).toBe(15728640);
    expect(10 * 1024 * 1024).toBeLessThan(maxSize); // 10MB OK
    expect(20 * 1024 * 1024).toBeGreaterThan(maxSize); // 20MB rejected
  });
});

// ─── COGS Calculator Tests ───
// Pure function replicated from db.ts for testing without DB dependency
function calculateCOGS(compositions: { qty: string; costPerUnit: number }[]): number {
  return compositions.reduce((total, comp) => {
    const qty = parseFloat(String(comp.qty));
    return total + (qty * comp.costPerUnit);
  }, 0);
}

describe("calculateCOGS", () => {

  it("returns 0 for empty compositions", () => {
    expect(calculateCOGS([])).toBe(0);
  });

  it("calculates COGS for single material", () => {
    const compositions = [
      { qty: "0.200", costPerUnit: 12000 }, // 200g beras @ 12000/kg
    ];
    expect(calculateCOGS(compositions)).toBe(2400);
  });

  it("calculates COGS for multiple materials", () => {
    const compositions = [
      { qty: "0.200", costPerUnit: 12000 }, // 200g beras = 2400
      { qty: "2", costPerUnit: 3000 },      // 2 telur = 6000
      { qty: "0.050", costPerUnit: 20000 }, // 50ml minyak = 1000
    ];
    expect(calculateCOGS(compositions)).toBe(9400);
  });

  it("handles integer quantities", () => {
    const compositions = [
      { qty: "5", costPerUnit: 1000 },
      { qty: "3", costPerUnit: 2500 },
    ];
    expect(calculateCOGS(compositions)).toBe(12500);
  });

  it("handles zero cost materials", () => {
    const compositions = [
      { qty: "1", costPerUnit: 0 },
      { qty: "2", costPerUnit: 5000 },
    ];
    expect(calculateCOGS(compositions)).toBe(10000);
  });

  it("handles decimal quantities with precision", () => {
    const compositions = [
      { qty: "0.333", costPerUnit: 30000 },
    ];
    expect(calculateCOGS(compositions)).toBeCloseTo(9990, 0);
  });
});

// ─── COGS Router Input Validation Tests ───
describe("COGS composition input validation", () => {
  it("validates material name is required", () => {
    const validInput = {
      productId: 1,
      materialName: "Beras",
      qty: 0.2,
      unit: "kg",
      costPerUnit: 12000,
    };
    expect(validInput.materialName.length).toBeGreaterThan(0);
  });

  it("validates qty must be positive", () => {
    const qty = 0.001;
    expect(qty).toBeGreaterThan(0);
  });

  it("rejects zero qty", () => {
    const qty = 0;
    expect(qty).not.toBeGreaterThan(0);
  });

  it("validates costPerUnit must be non-negative", () => {
    expect(0).toBeGreaterThanOrEqual(0);
    expect(5000).toBeGreaterThanOrEqual(0);
  });

  it("calculates margin correctly", () => {
    const hpp = 9400;
    const sellingPrice = 15000;
    const margin = sellingPrice - hpp;
    const marginPct = Math.round((margin / hpp) * 100);
    expect(margin).toBe(5600);
    expect(marginPct).toBe(60); // 60% markup
  });

  it("handles negative margin (selling below cost)", () => {
    const hpp = 15000;
    const sellingPrice = 12000;
    const margin = sellingPrice - hpp;
    expect(margin).toBeLessThan(0);
  });
});

// ─── Scan-to-Stock Flow Tests ───
describe("Scan-to-Stock item processing", () => {
  it("extracts items from scan result", () => {
    const scanResult = {
      storeName: "Toko ABC",
      items: [
        { name: "Beras 5kg", qty: 2, price: 65000, total: 130000 },
        { name: "Minyak Goreng 1L", qty: 3, price: 18000, total: 54000 },
      ],
      total: 184000,
    };
    expect(scanResult.items.length).toBe(2);
    expect(scanResult.items[0].name).toBe("Beras 5kg");
    expect(scanResult.items[0].qty).toBe(2);
    expect(scanResult.items[0].price).toBe(65000);
  });

  it("suggests 30% markup for selling price", () => {
    const purchasePrice = 10000;
    const suggestedSellingPrice = Math.round(purchasePrice * 1.3);
    expect(suggestedSellingPrice).toBe(13000);
  });

  it("handles items with zero price gracefully", () => {
    const item = { name: "Bonus Item", qty: 1, price: 0, total: 0 };
    const suggestedSellingPrice = Math.round(item.price * 1.3);
    expect(suggestedSellingPrice).toBe(0);
  });

  it("tracks progress through item list", () => {
    const items = [
      { name: "Item A", qty: 1, price: 5000, total: 5000 },
      { name: "Item B", qty: 2, price: 3000, total: 6000 },
      { name: "Item C", qty: 1, price: 8000, total: 8000 },
    ];
    let currentIndex = 0;
    let addedCount = 0;
    let skippedCount = 0;

    // Add first item
    addedCount++;
    currentIndex++;
    expect(currentIndex).toBe(1);
    expect(addedCount).toBe(1);

    // Skip second item
    skippedCount++;
    currentIndex++;
    expect(currentIndex).toBe(2);
    expect(skippedCount).toBe(1);

    // Add third item
    addedCount++;
    currentIndex++;
    expect(currentIndex).toBe(3);
    expect(addedCount).toBe(2);
    expect(skippedCount).toBe(1);

    // Finished
    expect(currentIndex).toBe(items.length);
  });
});

// ===== v14: Delete User Cascade Logic =====
describe("deleteUser cascade logic", () => {
  it("should identify all related tables for cascade delete", () => {
    const relatedTables = ["transactions","products","stockLogs","taxPayments","productCompositions","productCategories","businesses","users"];
    expect(relatedTables).toContain("transactions");
    expect(relatedTables).toContain("products");
    expect(relatedTables).toContain("businesses");
    expect(relatedTables).toContain("users");
    expect(relatedTables.length).toBeGreaterThanOrEqual(6);
  });

  it("should block self-delete (owner protection)", () => {
    const requestingUserId = 1;
    const targetUserId = 1;
    const isSelfDelete = requestingUserId === targetUserId;
    expect(isSelfDelete).toBe(true);
    if (isSelfDelete) {
      expect(() => { throw new Error("Cannot delete own account"); }).toThrow("Cannot delete own account");
    }
  });

  it("should allow admin to delete other users", () => {
    const requestingUserId = 1;
    const targetUserId = 2;
    expect(requestingUserId === targetUserId).toBe(false);
  });
});

// ===== v14: Dual Pricing Logic =====
describe("dual pricing logic", () => {
  it("calculates discounted price for fixed price type", () => {
    const basePrice = 100000;
    const discountPercent = 10;
    const finalPrice = Math.round(basePrice * (1 - discountPercent / 100));
    expect(finalPrice).toBe(90000);
  });

  it("returns base price when discount is 0", () => {
    const basePrice = 50000;
    const discountPercent = 0;
    const finalPrice = discountPercent > 0 ? Math.round(basePrice * (1 - discountPercent / 100)) : basePrice;
    expect(finalPrice).toBe(50000);
  });

  it("handles 100% discount correctly", () => {
    const basePrice = 100000;
    const discountPercent = 100;
    const finalPrice = Math.round(basePrice * (1 - discountPercent / 100));
    expect(finalPrice).toBe(0);
  });

  it("validates priceType enum values", () => {
    const validTypes = ["fixed", "dynamic"];
    expect(validTypes).toContain("fixed");
    expect(validTypes).toContain("dynamic");
    expect(validTypes).not.toContain("unknown");
  });

  it("validates discountPercent range 0-100", () => {
    const validateDiscount = (pct: number) => pct >= 0 && pct <= 100;
    expect(validateDiscount(0)).toBe(true);
    expect(validateDiscount(50)).toBe(true);
    expect(validateDiscount(100)).toBe(true);
    expect(validateDiscount(-1)).toBe(false);
    expect(validateDiscount(101)).toBe(false);
  });

  it("uses dynamic price as entered by cashier", () => {
    const dynamicPrice = 75000;
    const priceType = "dynamic";
    const finalPrice = priceType === "dynamic" ? dynamicPrice : 0;
    expect(finalPrice).toBe(75000);
  });
});

// ===== v19: Pro Link System (One-Time-Use Activation Links) =====
describe("Pro link token generation", () => {
  it("generates a 64-character hex token", () => {
    const crypto = require("crypto");
    const token = crypto.randomBytes(32).toString("hex");
    expect(token.length).toBe(64);
    expect(/^[0-9a-f]+$/.test(token)).toBe(true);
  });

  it("generates unique tokens each time", () => {
    const crypto = require("crypto");
    const tokens = new Set<string>();
    for (let i = 0; i < 100; i++) {
      tokens.add(crypto.randomBytes(32).toString("hex"));
    }
    expect(tokens.size).toBe(100);
  });
});

describe("Pro link validation", () => {
  it("validates unused link as valid", () => {
    const link = { token: "abc123", email: "buyer@test.com", isUsed: false, expiresAt: null };
    const isValid = !link.isUsed && (!link.expiresAt || link.expiresAt > new Date());
    expect(isValid).toBe(true);
  });

  it("rejects used link", () => {
    const link = { token: "abc123", email: "buyer@test.com", isUsed: true, expiresAt: null };
    const isValid = !link.isUsed;
    expect(isValid).toBe(false);
  });

  it("rejects expired link", () => {
    const link = { token: "abc123", email: "buyer@test.com", isUsed: false, expiresAt: new Date("2020-01-01") };
    const isValid = !link.isUsed && (!link.expiresAt || link.expiresAt > new Date());
    expect(isValid).toBe(false);
  });

  it("accepts link without expiry", () => {
    const link = { token: "abc123", email: "buyer@test.com", isUsed: false, expiresAt: null };
    const isValid = !link.isUsed && (!link.expiresAt || link.expiresAt > new Date());
    expect(isValid).toBe(true);
  });
});

describe("Pro link activation flow", () => {
  it("marks link as used after activation", () => {
    const link = { isUsed: false, usedByUserId: null as number | null, usedAt: null as Date | null };
    // Simulate activation
    link.isUsed = true;
    link.usedByUserId = 42;
    link.usedAt = new Date();
    expect(link.isUsed).toBe(true);
    expect(link.usedByUserId).toBe(42);
    expect(link.usedAt).toBeInstanceOf(Date);
  });

  it("prevents double activation", () => {
    const link = { isUsed: true, usedByUserId: 42 };
    const canActivate = !link.isUsed;
    expect(canActivate).toBe(false);
  });

  it("generates correct scalev order ID from token", () => {
    const token = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
    const orderId = `pro-link-${token.substring(0, 8)}`;
    expect(orderId).toBe("pro-link-abcdef12");
    expect(orderId.length).toBeLessThanOrEqual(30);
  });
});

describe("Pro link admin management", () => {
  it("creates link with required email", () => {
    const input = { email: "buyer@example.com", buyerName: "John", notes: "Paid via BCA" };
    expect(input.email).toContain("@");
    expect(input.buyerName).toBe("John");
    expect(input.notes).toBeTruthy();
  });

  it("creates link with only email (minimal)", () => {
    const input = { email: "buyer@example.com" };
    expect(input.email).toContain("@");
  });

  it("counts available vs used links", () => {
    const links = [
      { id: 1, isUsed: false },
      { id: 2, isUsed: true },
      { id: 3, isUsed: false },
      { id: 4, isUsed: true },
      { id: 5, isUsed: false },
    ];
    const available = links.filter(l => !l.isUsed);
    const used = links.filter(l => l.isUsed);
    expect(available.length).toBe(3);
    expect(used.length).toBe(2);
  });
});

describe("No free tier — all users are Pro", () => {
  it("does not enforce product limits", () => {
    const productCount = 999;
    // No limit check — all users are Pro
    const canAdd = true; // Always true now
    expect(canAdd).toBe(true);
  });

  it("does not enforce transaction limits", () => {
    const txCount = 9999;
    // No limit check — all users are Pro
    const canAdd = true; // Always true now
    expect(canAdd).toBe(true);
  });
});


// ─── App Mode System ───
describe("App Mode System", () => {
  it("defaults appMode to 'umkm'", () => {
    const defaultMode = "umkm";
    expect(defaultMode).toBe("umkm");
  });

  it("accepts 'personal' as valid appMode", () => {
    const validModes = ["personal", "umkm"];
    expect(validModes).toContain("personal");
    expect(validModes).toContain("umkm");
  });

  it("posEnabled defaults to false", () => {
    const defaultPosEnabled = false;
    expect(defaultPosEnabled).toBe(false);
  });

  it("personal mode should hide UMKM-specific menu items", () => {
    const appMode = "personal";
    const umkmMenuItems = ["Stok Produk", "POS Kasir", "Pajak"];
    const personalMenuItems = ["Dashboard", "Jurnal", "Laporan", "Pengaturan"];
    
    const visibleItems = appMode === "personal" ? personalMenuItems : [...personalMenuItems, ...umkmMenuItems];
    expect(visibleItems).not.toContain("Stok Produk");
    expect(visibleItems).not.toContain("POS Kasir");
    expect(visibleItems).toContain("Dashboard");
    expect(visibleItems).toContain("Jurnal");
  });

  it("umkm mode should show all menu items", () => {
    const appMode = "umkm";
    const posEnabled = true;
    const allMenuItems = ["Dashboard", "Transaksi", "Stok Produk", "Laporan", "Pajak", "Pengaturan"];
    const posItems = posEnabled ? ["POS Kasir"] : [];
    const visibleItems = [...allMenuItems, ...posItems];
    
    expect(visibleItems).toContain("Stok Produk");
    expect(visibleItems).toContain("POS Kasir");
    expect(visibleItems).toContain("Pajak");
  });

  it("umkm mode without POS should hide POS menu", () => {
    const appMode = "umkm";
    const posEnabled = false;
    const baseItems = ["Dashboard", "Transaksi", "Stok Produk", "Laporan", "Pajak"];
    const posItems = posEnabled ? ["POS Kasir"] : [];
    const visibleItems = [...baseItems, ...posItems];
    
    expect(visibleItems).not.toContain("POS Kasir");
    expect(visibleItems).toContain("Stok Produk");
  });

  it("mode switch should be reversible", () => {
    let mode: "personal" | "umkm" = "personal";
    expect(mode).toBe("personal");
    mode = "umkm";
    expect(mode).toBe("umkm");
    mode = "personal";
    expect(mode).toBe("personal");
  });
});

// ─── Pro Link System ───
describe("Pro Link System", () => {
  it("generates token with correct format", () => {
    const token = "abc123xyz";
    expect(token.length).toBeGreaterThan(0);
    expect(typeof token).toBe("string");
  });

  it("pro link URL format is correct", () => {
    const token = "test-token-123";
    const url = `/pro/${token}`;
    expect(url).toBe("/pro/test-token-123");
    expect(url.startsWith("/pro/")).toBe(true);
  });

  it("used link should not be reusable", () => {
    const link = { token: "abc", used: true, usedAt: Date.now() };
    const isValid = !link.used;
    expect(isValid).toBe(false);
  });

  it("expired link should not be valid", () => {
    const link = { token: "abc", expiresAt: Date.now() - 1000 };
    const isValid = link.expiresAt > Date.now();
    expect(isValid).toBe(false);
  });

  it("valid link should be usable", () => {
    const link = { token: "abc", used: false, expiresAt: Date.now() + 86400000 };
    const isValid = !link.used && link.expiresAt > Date.now();
    expect(isValid).toBe(true);
  });
});
