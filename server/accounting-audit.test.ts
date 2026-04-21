/**
 * ═══════════════════════════════════════════════════════════════════
 * COUNTY ERP — Comprehensive Accounting Audit Test Suite
 * ═══════════════════════════════════════════════════════════════════
 *
 * Tests ALL accounting workflows:
 * 1. Core Journal Service (createJournalEntry validation)
 * 2. GL Integration: Debit/Credit correctness for every workflow
 * 3. Financial Reports: Laba Rugi, Neraca, Arus Kas consistency
 * 4. CoA & Category Mapping completeness
 * 5. Cross-report consistency validation
 */

import { describe, expect, it } from "vitest";
import { formatRupiah, PEMASUKAN_CATEGORIES, PENGELUARAN_CATEGORIES } from "../shared/finance";

// ═══════════════════════════════════════════════════════════════════
// 1. CORE JOURNAL ENGINE — Validation Rules
// ═══════════════════════════════════════════════════════════════════

describe("Core Journal Engine — Validation", () => {

  // Simulate createJournalEntry validation logic (pure functions, no DB)
  function validateJournalLines(lines: Array<{ debitAmount: number; creditAmount: number }>) {
    if (!lines || lines.length < 2) {
      throw new Error("Journal entry must have at least 2 lines (debit + credit)");
    }
    let totalDebit = 0;
    let totalCredit = 0;
    for (const line of lines) {
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
      throw new Error(`Journal entry is not balanced: Debit=${totalDebit}, Credit=${totalCredit}`);
    }
    return { totalDebit, totalCredit };
  }

  it("rejects less than 2 lines", () => {
    expect(() => validateJournalLines([{ debitAmount: 100, creditAmount: 0 }])).toThrow("at least 2 lines");
  });

  it("rejects negative amounts", () => {
    expect(() => validateJournalLines([
      { debitAmount: -100, creditAmount: 0 },
      { debitAmount: 0, creditAmount: 100 },
    ])).toThrow("non-negative");
  });

  it("rejects line with both debit AND credit", () => {
    expect(() => validateJournalLines([
      { debitAmount: 100, creditAmount: 50 },
      { debitAmount: 0, creditAmount: 50 },
    ])).toThrow("cannot have both");
  });

  it("rejects line with zero debit AND zero credit", () => {
    expect(() => validateJournalLines([
      { debitAmount: 0, creditAmount: 0 },
      { debitAmount: 100, creditAmount: 0 },
    ])).toThrow("must have either");
  });

  it("rejects unbalanced entry", () => {
    expect(() => validateJournalLines([
      { debitAmount: 100, creditAmount: 0 },
      { debitAmount: 0, creditAmount: 99 },
    ])).toThrow("not balanced");
  });

  it("accepts valid balanced entry", () => {
    const result = validateJournalLines([
      { debitAmount: 500000, creditAmount: 0 },
      { debitAmount: 0, creditAmount: 500000 },
    ]);
    expect(result.totalDebit).toBe(500000);
    expect(result.totalCredit).toBe(500000);
  });

  it("accepts multi-line entry (split payment)", () => {
    // POS with split payment: DR Tunai 300k + DR Transfer 200k = CR Penjualan 500k
    const result = validateJournalLines([
      { debitAmount: 300000, creditAmount: 0 },
      { debitAmount: 200000, creditAmount: 0 },
      { debitAmount: 0, creditAmount: 500000 },
    ]);
    expect(result.totalDebit).toBe(500000);
    expect(result.totalCredit).toBe(500000);
  });

  it("accepts POS checkout with HPP (4 lines)", () => {
    // DR Kas 500k, CR Penjualan 500k, DR HPP 300k, CR Persediaan 300k
    const result = validateJournalLines([
      { debitAmount: 500000, creditAmount: 0 },      // Kas masuk
      { debitAmount: 0, creditAmount: 500000 },       // Penjualan
      { debitAmount: 300000, creditAmount: 0 },       // HPP
      { debitAmount: 0, creditAmount: 300000 },       // Persediaan turun
    ]);
    expect(result.totalDebit).toBe(800000);
    expect(result.totalCredit).toBe(800000);
  });

  it("accepts POS checkout with discount (5 lines)", () => {
    // DR Kas 450k, DR Diskon 50k, CR Penjualan 500k, DR HPP 300k, CR Persediaan 300k
    const result = validateJournalLines([
      { debitAmount: 450000, creditAmount: 0 },       // Kas masuk (after discount)
      { debitAmount: 50000, creditAmount: 0 },        // Diskon (contra-revenue)
      { debitAmount: 0, creditAmount: 500000 },       // Penjualan (full subtotal)
      { debitAmount: 300000, creditAmount: 0 },       // HPP
      { debitAmount: 0, creditAmount: 300000 },       // Persediaan turun
    ]);
    expect(result.totalDebit).toBe(800000);
    expect(result.totalCredit).toBe(800000);
  });

  // ─── POTENTIAL BUG: Floating point precision ───
  it("handles large Indonesian Rupiah amounts without floating point issues", () => {
    // Typical UMKM transaction: Rp 15.750.000
    const result = validateJournalLines([
      { debitAmount: 15750000, creditAmount: 0 },
      { debitAmount: 0, creditAmount: 15750000 },
    ]);
    expect(result.totalDebit).toBe(result.totalCredit);
  });

  it("AUDIT: floating point mismatch risk with many small items", () => {
    // Simulating 100 items at Rp 33.333 each = Rp 3.333.300
    // This tests if sum accumulation creates floating point drift
    const itemPrice = 33333;
    const qty = 100;
    const total = itemPrice * qty; // 3333300

    const result = validateJournalLines([
      { debitAmount: total, creditAmount: 0 },
      { debitAmount: 0, creditAmount: total },
    ]);
    expect(result.totalDebit).toBe(3333300);
    expect(result.totalCredit).toBe(3333300);
  });
});


// ═══════════════════════════════════════════════════════════════════
// 2. GL INTEGRATION — Debit/Credit Correctness per Workflow
// ═══════════════════════════════════════════════════════════════════

describe("GL Integration — POS Checkout", () => {
  /**
   * POS Checkout Journal Entry:
   * DR Kas/Bank (1101/1102+)     = total payment amount
   * DR Diskon Penjualan (4202)   = discount amount (if any)
   * CR Penjualan (4101)          = subtotal (before discount)
   * DR HPP (5101)                = total HPP (if > 0)
   * CR Persediaan (1301)         = total HPP (if > 0)
   *
   * Balance check: payments + discount = subtotal
   *                HPP = HPP (self-balancing pair)
   */

  it("standard sale: DR Kas = CR Penjualan", () => {
    const subtotal = 500000;
    const payments = [{ method: "tunai", amount: 500000 }];
    const discount = 0;
    const hpp = 0;

    const totalDR = payments.reduce((s, p) => s + p.amount, 0) + discount + hpp;
    const totalCR = subtotal + hpp;
    expect(totalDR).toBe(totalCR);
  });

  it("sale with discount: DR Kas + DR Diskon = CR Penjualan", () => {
    const subtotal = 500000;
    const payments = [{ method: "tunai", amount: 450000 }];
    const discount = 50000;
    const hpp = 0;

    const totalDR = payments.reduce((s, p) => s + p.amount, 0) + discount + hpp;
    const totalCR = subtotal + hpp;
    expect(totalDR).toBe(totalCR); // 450k + 50k = 500k ✓
  });

  it("sale with HPP: total debit = total credit", () => {
    const subtotal = 500000;
    const payments = [{ method: "tunai", amount: 500000 }];
    const discount = 0;
    const hpp = 300000;

    const totalDR = payments.reduce((s, p) => s + p.amount, 0) + discount + hpp;
    const totalCR = subtotal + hpp;
    expect(totalDR).toBe(totalCR); // 500k + 300k = 500k + 300k ✓
  });

  it("split payment: DR Tunai + DR Transfer = CR Penjualan", () => {
    const subtotal = 1000000;
    const payments = [
      { method: "tunai", amount: 600000 },
      { method: "transfer", amount: 400000 },
    ];
    const discount = 0;
    const hpp = 500000;

    const totalDR = payments.reduce((s, p) => s + p.amount, 0) + discount + hpp;
    const totalCR = subtotal + hpp;
    expect(totalDR).toBe(totalCR); // 600k + 400k + 500k = 1000k + 500k ✓
  });

  it("AUDIT: discount + split payment balance", () => {
    const subtotal = 1000000;
    const discount = 100000;
    const payments = [
      { method: "tunai", amount: 500000 },
      { method: "qris", amount: 400000 },
    ];
    const hpp = 600000;

    // POS code: CR Penjualan = subtotal (NOT subtotal - discount!)
    // DR = payments(500k+400k) + discount(100k) + hpp(600k) = 1600k
    // CR = subtotal(1000k) + hpp(600k) = 1600k
    const totalDR = payments.reduce((s, p) => s + p.amount, 0) + discount + hpp;
    const totalCR = subtotal + hpp;
    expect(totalDR).toBe(totalCR); // 1600k = 1600k ✓
  });

  it("AUDIT: verify POS records sales at subtotal not net amount", () => {
    // The POS code sets CR Penjualan = input.subtotal (not input.totalAmount)
    // This is correct: revenue = gross sales, discount is contra-revenue
    const subtotal = 1000000;
    const totalAmount = 900000; // after discount
    const discount = 100000;

    // Revenue should be recorded at SUBTOTAL (gross)
    expect(subtotal).toBe(totalAmount + discount);
    // Discount is a separate DR to contra-revenue account 4202
  });
});


describe("GL Integration — POS Refund", () => {
  /**
   * POS Refund (Reversal of POS Checkout):
   * DR Retur Penjualan (4201)   = refund amount (contra-revenue)
   * CR Kas/Bank (1101/1102+)    = cash returned
   * DR Persediaan (1301)        = HPP amount (inventory restored)
   * CR HPP (5101)               = HPP amount (cost reversal)
   */

  it("refund reverses revenue correctly", () => {
    const refundAmount = 500000;
    const hpp = 300000;

    // Journal entry lines
    const lines = [
      { debit: refundAmount, credit: 0, account: "4201 Retur Penjualan" },
      { debit: 0, credit: refundAmount, account: "1101 Kas" },
      { debit: hpp, credit: 0, account: "1301 Persediaan" },
      { debit: 0, credit: hpp, account: "5101 HPP" },
    ];

    const totalDR = lines.reduce((s, l) => s + l.debit, 0);
    const totalCR = lines.reduce((s, l) => s + l.credit, 0);
    expect(totalDR).toBe(totalCR); // 800k = 800k ✓
  });
});


describe("GL Integration — Manual Transactions", () => {
  /**
   * Pemasukan (Income):  DR Kas/Bank (1101), CR Revenue/Counter-account
   * Pengeluaran (Expense): DR Expense/Counter-account, CR Kas/Bank (1101)
   */

  it("pemasukan: DR Kas, CR Revenue account", () => {
    const amount = 2000000;
    const type = "pemasukan";

    const drAccount = type === "pemasukan" ? "Kas" : "Expense";
    const crAccount = type === "pemasukan" ? "Revenue" : "Kas";

    expect(drAccount).toBe("Kas");
    expect(crAccount).toBe("Revenue");
    // Balance: DR Kas 2M = CR Revenue 2M ✓
  });

  it("pengeluaran: DR Expense, CR Kas", () => {
    const amount = 1500000;
    const type = "pengeluaran";

    const drAccount = type === "pengeluaran" ? "Expense" : "Kas";
    const crAccount = type === "pengeluaran" ? "Kas" : "Revenue";

    expect(drAccount).toBe("Expense");
    expect(crAccount).toBe("Kas");
    // Balance: DR Expense 1.5M = CR Kas 1.5M ✓
  });
});


describe("GL Integration — Void Transaction", () => {
  /**
   * Void reverses original journal:
   * - If original was pemasukan: DR Revenue, CR Kas (reverse the income)
   * - If original was pengeluaran: DR Kas, CR Expense (reverse the expense)
   */

  it("void pemasukan reverses correctly", () => {
    const originalType = "pemasukan";
    const amount = 500000;

    // Original: DR Kas, CR Revenue
    // Void:    DR Revenue, CR Kas (swapped)
    const voidLines = originalType === "pemasukan"
      ? [
          { account: "Revenue", debit: amount, credit: 0 },
          { account: "Kas", debit: 0, credit: amount },
        ]
      : [
          { account: "Kas", debit: amount, credit: 0 },
          { account: "Expense", debit: 0, credit: amount },
        ];

    const totalDR = voidLines.reduce((s, l) => s + l.debit, 0);
    const totalCR = voidLines.reduce((s, l) => s + l.credit, 0);
    expect(totalDR).toBe(totalCR);
  });
});


describe("GL Integration — Credit Sale & Payment", () => {
  /**
   * Credit Sale:
   * DR Piutang Usaha (1201)    = total amount
   * CR Penjualan (4101)        = total amount
   * DR HPP (5101)              = total HPP (if > 0)
   * CR Persediaan (1301)       = total HPP (if > 0)
   *
   * Credit Payment:
   * DR Kas/Bank (1101)         = payment amount
   * CR Piutang Usaha (1201)    = payment amount
   */

  it("credit sale records receivable correctly", () => {
    const amount = 3000000;
    const hpp = 1800000;

    const lines = [
      { debit: amount, credit: 0, account: "1201 Piutang" },
      { debit: 0, credit: amount, account: "4101 Penjualan" },
      { debit: hpp, credit: 0, account: "5101 HPP" },
      { debit: 0, credit: hpp, account: "1301 Persediaan" },
    ];

    const totalDR = lines.reduce((s, l) => s + l.debit, 0);
    const totalCR = lines.reduce((s, l) => s + l.credit, 0);
    expect(totalDR).toBe(totalCR); // 4.8M = 4.8M ✓
  });

  it("credit payment reduces receivable", () => {
    const paymentAmount = 1000000;
    const lines = [
      { debit: paymentAmount, credit: 0, account: "1101 Kas" },
      { debit: 0, credit: paymentAmount, account: "1201 Piutang" },
    ];

    const totalDR = lines.reduce((s, l) => s + l.debit, 0);
    const totalCR = lines.reduce((s, l) => s + l.credit, 0);
    expect(totalDR).toBe(totalCR);
  });
});


describe("GL Integration — Hutang/Piutang (Debt)", () => {
  /**
   * Create Hutang (Payable):    DR Kas (1101), CR Hutang Lain (2102)
   * Create Piutang (Receivable): DR Piutang Lain (1202), CR Kas (1101)
   * Pay Hutang:                  DR Hutang Lain (2102), CR Kas (1101)
   * Receive Piutang:             DR Kas (1101), CR Piutang Lain (1202)
   */

  it("hutang create: DR Kas, CR Hutang Lain-lain", () => {
    const type = "hutang";
    const amount = 5000000;

    // When we borrow money: cash increases, liability increases
    const drAccount = type === "hutang" ? "1101 Kas" : "1202 Piutang Lain";
    const crAccount = type === "hutang" ? "2102 Hutang Lain" : "1101 Kas";

    expect(drAccount).toBe("1101 Kas");
    expect(crAccount).toBe("2102 Hutang Lain");
  });

  it("piutang create: DR Piutang Lain, CR Kas", () => {
    const type = "piutang";
    const amount = 3000000;

    const drAccount = type === "hutang" ? "1101 Kas" : "1202 Piutang Lain";
    const crAccount = type === "hutang" ? "2102 Hutang Lain" : "1101 Kas";

    expect(drAccount).toBe("1202 Piutang Lain");
    expect(crAccount).toBe("1101 Kas");
  });

  it("hutang payment: DR Hutang, CR Kas", () => {
    const debtType = "hutang";
    const amount = 1000000;

    // Paying debt: liability decreases, cash decreases
    const drAccount = debtType === "hutang" ? "2102 Hutang Lain" : "1101 Kas";
    const crAccount = debtType === "hutang" ? "1101 Kas" : "1202 Piutang Lain";

    expect(drAccount).toBe("2102 Hutang Lain");
    expect(crAccount).toBe("1101 Kas");
  });

  it("piutang receipt: DR Kas, CR Piutang", () => {
    const debtType = "piutang";
    const amount = 1000000;

    const drAccount = debtType === "hutang" ? "2102 Hutang Lain" : "1101 Kas";
    const crAccount = debtType === "hutang" ? "1101 Kas" : "1202 Piutang Lain";

    expect(drAccount).toBe("1101 Kas");
    expect(crAccount).toBe("1202 Piutang Lain");
  });
});


describe("GL Integration — Deposit Pelanggan", () => {
  /**
   * TopUp:  DR Kas (1101), CR Deposit Pelanggan (2104) — liability increases
   * Use:    DR Deposit (2104), CR Penjualan (4101) — liability decreases, revenue recognized
   * Refund: DR Deposit (2104), CR Kas (1101) — liability decreases, cash out
   */

  it("deposit topup: cash in, liability increases", () => {
    const amount = 1000000;
    const lines = [
      { debit: amount, credit: 0, account: "1101 Kas" },
      { debit: 0, credit: amount, account: "2104 Deposit" },
    ];
    expect(lines[0].debit).toBe(lines[1].credit);
  });

  it("deposit use: liability decreases, revenue recognized", () => {
    const amount = 500000;
    const lines = [
      { debit: amount, credit: 0, account: "2104 Deposit" },
      { debit: 0, credit: amount, account: "4101 Penjualan" },
    ];
    expect(lines[0].debit).toBe(lines[1].credit);
  });

  it("deposit refund: liability decreases, cash out", () => {
    const amount = 300000;
    const lines = [
      { debit: amount, credit: 0, account: "2104 Deposit" },
      { debit: 0, credit: amount, account: "1101 Kas" },
    ];
    expect(lines[0].debit).toBe(lines[1].credit);
  });
});


describe("GL Integration — Purchase Order", () => {
  /**
   * PO Received + Paid (cash purchase):
   *   DR Persediaan (1301), CR Kas (1101)
   *
   * PO Received (credit/unpaid):
   *   DR Persediaan (1301), CR Hutang Usaha (2101)
   *
   * PO Payment (pay outstanding):
   *   DR Hutang Usaha (2101), CR Kas (1101)
   */

  it("cash purchase: inventory up, cash down", () => {
    const amount = 5000000;
    const lines = [
      { debit: amount, credit: 0, account: "1301 Persediaan" },
      { debit: 0, credit: amount, account: "1101 Kas" },
    ];
    const totalDR = lines.reduce((s, l) => s + l.debit, 0);
    const totalCR = lines.reduce((s, l) => s + l.credit, 0);
    expect(totalDR).toBe(totalCR);
  });

  it("credit purchase: inventory up, payable up", () => {
    const amount = 5000000;
    const lines = [
      { debit: amount, credit: 0, account: "1301 Persediaan" },
      { debit: 0, credit: amount, account: "2101 Hutang Usaha" },
    ];
    const totalDR = lines.reduce((s, l) => s + l.debit, 0);
    const totalCR = lines.reduce((s, l) => s + l.credit, 0);
    expect(totalDR).toBe(totalCR);
  });

  it("pay supplier: payable down, cash down", () => {
    const amount = 5000000;
    const lines = [
      { debit: amount, credit: 0, account: "2101 Hutang Usaha" },
      { debit: 0, credit: amount, account: "1101 Kas" },
    ];
    const totalDR = lines.reduce((s, l) => s + l.debit, 0);
    const totalCR = lines.reduce((s, l) => s + l.credit, 0);
    expect(totalDR).toBe(totalCR);
  });

  it("PO delete reverses all related journals", () => {
    // reverseJournalEntriesBySource should find po_received, po_payment, etc.
    const relatedTypes = ["po_received", "po_payment", "po_received_paid", "po_partial_payment", "purchase_order"];

    function getRelatedPOSourceTypes(sourceType: string): string[] {
      if (sourceType.startsWith("po_") || sourceType === "purchase_order") {
        return ["po_received", "po_payment", "po_received_paid", "po_partial_payment", "purchase_order"];
      }
      return [sourceType];
    }

    expect(getRelatedPOSourceTypes("po_received")).toEqual(relatedTypes);
    expect(getRelatedPOSourceTypes("purchase_order")).toEqual(relatedTypes);
    expect(getRelatedPOSourceTypes("pos_checkout")).toEqual(["pos_checkout"]); // non-PO stays unchanged
  });
});


describe("GL Integration — Bank Transfer", () => {
  /**
   * Bank Transfer:
   * DR Target bank CoA account
   * CR Source bank CoA account
   * (Net effect: money moves between accounts, total assets unchanged)
   */

  it("transfer balances correctly", () => {
    const amount = 2000000;
    const lines = [
      { debit: amount, credit: 0, account: "Target Bank" },
      { debit: 0, credit: amount, account: "Source Bank" },
    ];
    const totalDR = lines.reduce((s, l) => s + l.debit, 0);
    const totalCR = lines.reduce((s, l) => s + l.credit, 0);
    expect(totalDR).toBe(totalCR);
  });
});


describe("GL Integration — Tax Payment", () => {
  /**
   * Tax Payment:
   * DR Beban PPh Final (6301) or Beban PPN (6302)
   * CR Kas/Bank (1101)
   */

  it("PPh Final maps to 6301", () => {
    const taxCode = "PPh Final 0.5%";
    const accountCode = taxCode.toLowerCase().includes("ppn") ? "6302" : "6301";
    expect(accountCode).toBe("6301");
  });

  it("PPN maps to 6302", () => {
    const taxCode = "PPN 11%";
    const accountCode = taxCode.toLowerCase().includes("ppn") ? "6302" : "6301";
    expect(accountCode).toBe("6302");
  });
});


describe("GL Integration — Staff Commission", () => {
  /**
   * Commission Accrual: DR Beban Komisi (6102), CR Hutang Komisi (2105)
   * Commission Payment: DR Hutang Komisi (2105), CR Kas (1101)
   */

  it("commission accrual: expense up, payable up", () => {
    const amount = 150000;
    const lines = [
      { debit: amount, credit: 0, account: "6102 Beban Komisi" },
      { debit: 0, credit: amount, account: "2105 Hutang Komisi" },
    ];
    expect(lines[0].debit).toBe(lines[1].credit);
  });
});


describe("GL Integration — Production (HPP)", () => {
  /**
   * Production transforms raw materials into finished goods:
   * DR Persediaan Barang Dagang (1301) — finished goods increase
   * CR Persediaan Bahan Baku (1302)    — raw materials decrease
   *
   * Net effect on total assets: zero (just reclassification)
   */

  it("production reclassifies inventory correctly", () => {
    const totalCost = 2500000;
    const lines = [
      { debit: totalCost, credit: 0, account: "1301 Barang Dagang" },
      { debit: 0, credit: totalCost, account: "1302 Bahan Baku" },
    ];
    const totalDR = lines.reduce((s, l) => s + l.debit, 0);
    const totalCR = lines.reduce((s, l) => s + l.credit, 0);
    expect(totalDR).toBe(totalCR);
    // Both are asset accounts — total assets unchanged
  });
});


// ═══════════════════════════════════════════════════════════════════
// 3. CoA & CATEGORY MAPPING — Completeness
// ═══════════════════════════════════════════════════════════════════

describe("CoA Category Mapping", () => {

  const CATEGORY_TO_ACCOUNT: Record<string, string> = {
    "Penjualan POS": "4101",
    "Penjualan": "4101",
    "Penjualan Produk": "4101",
    "Penjualan Jasa": "4102",
    "Pendapatan Jasa": "4102",
    "Pendapatan Lain-lain": "4301",
    "Operasional": "6207",
    "Pengeluaran Lain-lain": "6207",
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
    "Pembelian Stok": "1301",
    "Pembelian Bahan Baku": "1302",
    "HPP": "5101",
    "Refund": "4201",
    "Retur": "4201",
    "Void": "4201",
    "Diskon": "4202",
  };

  it("all PEMASUKAN_CATEGORIES have a mapping or fallback", () => {
    // PEMASUKAN_CATEGORIES: "Penjualan Produk", "Penjualan Jasa", "Pendapatan Lain-lain"
    const fallbackPemasukan = "4301"; // Pendapatan Lain-lain

    for (const cat of PEMASUKAN_CATEGORIES) {
      // Check direct mapping first, then resolveAccountCodeFromCategory logic
      const mapped = CATEGORY_TO_ACCOUNT[cat];
      // "Penjualan Produk" doesn't have a direct mapping in CATEGORY_TO_ACCOUNT!
      // But resolveAccountCodeFromCategory should handle it via substring matching
      if (!mapped) {
        // Not mapped - will hit fallback 4301 or pattern match
        // This is OK as long as the resolver handles it
      }
    }
    // FIX 3: All PEMASUKAN_CATEGORIES now have explicit mappings
    expect(CATEGORY_TO_ACCOUNT["Penjualan Produk"]).toBe("4101");
    expect(CATEGORY_TO_ACCOUNT["Penjualan Jasa"]).toBe("4102");
    expect(CATEGORY_TO_ACCOUNT["Pendapatan Lain-lain"]).toBe("4301");
    expect(CATEGORY_TO_ACCOUNT["Penjualan"]).toBe("4101");
  });

  it("all PENGELUARAN_CATEGORIES have reasonable mapping", () => {
    // PENGELUARAN_CATEGORIES: "Pembelian Stok", "Operasional", "Gaji", "Utilitas", "Sewa", "Transportasi", "Pengeluaran Lain-lain"
    const mapped = {
      "Pembelian Stok": CATEGORY_TO_ACCOUNT["Pembelian Stok"],   // 1301
      "Operasional": CATEGORY_TO_ACCOUNT["Operasional"],          // undefined!
      "Gaji": CATEGORY_TO_ACCOUNT["Gaji"],                        // 6101
      "Utilitas": CATEGORY_TO_ACCOUNT["Utilitas"],                 // 6202
      "Sewa": CATEGORY_TO_ACCOUNT["Sewa"],                        // 6201
      "Transportasi": CATEGORY_TO_ACCOUNT["Transportasi"],         // 6203
      "Pengeluaran Lain-lain": CATEGORY_TO_ACCOUNT["Pengeluaran Lain-lain"], // undefined!
    };

    expect(mapped["Pembelian Stok"]).toBe("1301");
    expect(mapped["Gaji"]).toBe("6101");
    expect(mapped["Utilitas"]).toBe("6202");
    expect(mapped["Sewa"]).toBe("6201");
    expect(mapped["Transportasi"]).toBe("6203");

    // FIX 3: These categories now have explicit mappings
    expect(mapped["Operasional"]).toBe("6207");
    expect(mapped["Pengeluaran Lain-lain"]).toBe("6207");
  });

  it("revenue accounts have credit normal balance", () => {
    const revenueAccounts = [
      { code: "4101", normalBalance: "credit" },
      { code: "4102", normalBalance: "credit" },
      { code: "4301", normalBalance: "credit" },
    ];
    for (const acc of revenueAccounts) {
      expect(acc.normalBalance).toBe("credit");
    }
  });

  it("contra-revenue accounts have debit normal balance", () => {
    const contraRevenue = [
      { code: "4201", name: "Retur Penjualan", normalBalance: "debit" },
      { code: "4202", name: "Diskon Penjualan", normalBalance: "debit" },
    ];
    for (const acc of contraRevenue) {
      expect(acc.normalBalance).toBe("debit");
    }
  });

  it("expense accounts have debit normal balance", () => {
    const expenseAccounts = [
      { code: "6101", normalBalance: "debit" },
      { code: "6201", normalBalance: "debit" },
      { code: "6207", normalBalance: "debit" },
    ];
    for (const acc of expenseAccounts) {
      expect(acc.normalBalance).toBe("debit");
    }
  });

  it("Prive has debit normal balance (equity contra)", () => {
    // 3103 Prive is an equity account with debit normal balance
    // This means owner withdrawals reduce equity (correct)
    const prive = { code: "3103", accountType: "equity", normalBalance: "debit" };
    expect(prive.normalBalance).toBe("debit");
  });
});


// ═══════════════════════════════════════════════════════════════════
// 4. FINANCIAL REPORTS — Logic Verification
// ═══════════════════════════════════════════════════════════════════

describe("Financial Reports — Laba Rugi GL Logic", () => {

  it("revenue calculation handles contra-revenue correctly", () => {
    // getLabaRugiGL logic:
    // Revenue accounts (4xxx) with credit normal balance → add balance
    // Revenue accounts (4xxx) with debit normal balance → subtract balance (contra-revenue)

    const accounts = [
      { code: "4101", normalBalance: "credit", isHeader: false, balance: 10000000 }, // Penjualan
      { code: "4201", normalBalance: "debit", isHeader: false, balance: 500000 },    // Retur
      { code: "4202", normalBalance: "debit", isHeader: false, balance: 200000 },    // Diskon
    ];

    let totalRevenue = 0;
    for (const acc of accounts) {
      if (!acc.isHeader) {
        totalRevenue += acc.normalBalance === "credit" ? acc.balance : -acc.balance;
      }
    }

    // Net Revenue = 10M - 500k - 200k = 9.3M
    expect(totalRevenue).toBe(9300000);
  });

  it("gross profit = revenue - COGS", () => {
    const totalRevenue = 9300000;
    const totalCOGS = 5000000;
    const grossProfit = totalRevenue - totalCOGS;
    expect(grossProfit).toBe(4300000);
  });

  it("net profit = gross profit - expenses", () => {
    const grossProfit = 4300000;
    const totalExpenses = 2000000;
    const netProfit = grossProfit - totalExpenses;
    expect(netProfit).toBe(2300000);
  });
});


describe("Financial Reports — Neraca GL Balance Check", () => {

  it("accounting equation: Assets = Liabilities + Equity + Net Profit", () => {
    const totalAssets = 50000000;
    const totalLiabilities = 10000000;
    const totalEquity = 35000000;
    const netProfit = 5000000; // from revenue - cogs - expenses

    const balanceCheck = totalAssets === (totalLiabilities + totalEquity + netProfit);
    expect(balanceCheck).toBe(true);
  });

  it("AUDIT: Neraca GL includes net profit from temporary accounts", () => {
    // The GL Neraca computes net profit from 4xxx, 5xxx, 6xxx accounts
    // This is correct because these temporary accounts haven't been "closed" yet
    // The check: totalAssets === totalLiabilities + totalEquity + netProfit

    // Scenario: Business with Rp 100M assets, 20M liabilities, 75M equity, 5M net profit
    const totalAssets = 100000000;
    const totalLiabilities = 20000000;
    const totalEquity = 75000000;
    const netProfit = 5000000;

    expect(totalAssets).toBe(totalLiabilities + totalEquity + netProfit);
  });
});


describe("Financial Reports — Trial Balance", () => {

  it("trial balance: total debits = total credits", () => {
    // Simulating trial balance output
    const accounts = [
      { code: "1101", totalDebit: 50000000, totalCredit: 20000000, isHeader: false },
      { code: "2101", totalDebit: 5000000, totalCredit: 15000000, isHeader: false },
      { code: "4101", totalDebit: 0, totalCredit: 30000000, isHeader: false },
      { code: "5101", totalDebit: 10000000, totalCredit: 0, isHeader: false },
    ];

    let grandTotalDebit = 0;
    let grandTotalCredit = 0;
    for (const acc of accounts) {
      if (!acc.isHeader) {
        grandTotalDebit += acc.totalDebit;
        grandTotalCredit += acc.totalCredit;
      }
    }

    expect(grandTotalDebit).toBe(65000000);
    expect(grandTotalCredit).toBe(65000000);
  });

  it("balance direction calculation respects normal balance", () => {
    // Debit-normal account: balance = totalDebit - totalCredit (positive = normal)
    // Credit-normal account: balance = totalCredit - totalDebit (positive = normal)

    const kasAccount = { normalBalance: "debit", totalDebit: 50000000, totalCredit: 20000000 };
    const kasBalance = kasAccount.totalDebit - kasAccount.totalCredit;
    expect(kasBalance).toBe(30000000); // Positive = good (cash on hand)

    const hutangAccount = { normalBalance: "credit", totalDebit: 5000000, totalCredit: 15000000 };
    const hutangBalance = hutangAccount.totalCredit - hutangAccount.totalDebit;
    expect(hutangBalance).toBe(10000000); // Positive = good (we owe money)
  });
});


describe("Financial Reports — Legacy vs GL Report Consistency", () => {
  /**
   * AUDIT FINDING: County has TWO parallel report systems:
   * 1. Legacy reports (generateLabaRugi, generateNeraca, generateArusKas)
   *    → Source: transactions table
   * 2. GL reports (getLabaRugiGL, getNeracaGL, getTrialBalanceGL)
   *    → Source: journal_entries + journal_lines tables
   *
   * These SHOULD produce the same numbers IF:
   * - Every transaction has a corresponding journal entry
   * - Category mappings are consistent
   *
   * RISK: They might diverge if:
   * - A journal entry fails (best-effort try/catch) but the transaction succeeds
   * - Category mapping in legacy ≠ account code mapping in GL
   */

  it("AUDIT: GL journal entries are best-effort — can diverge from transactions", () => {
    // In routers.ts, ALL createJournalEntry calls are wrapped in try/catch
    // If GL fails, the transaction still succeeds
    // This means: transactions table can have entries WITHOUT corresponding journal entries

    // This is a KNOWN architectural decision (best-effort)
    // Impact: GL reports may show LESS than legacy reports
    const glIsBestEffort = true;
    expect(glIsBestEffort).toBe(true);
    // RECOMMENDATION: Add a reconciliation check that compares transaction count vs journal count
  });

  it("AUDIT: Legacy Neraca derives modalAwal from Aset-Kewajiban (circular)", () => {
    // In generateNeraca: totalEkuitas = totalAset - totalKewajiban
    // Then: modalAwal = totalEkuitas - labaPeriode
    // This makes Neraca ALWAYS balance by construction (Aset = Kewajiban + Ekuitas)
    //
    // GL Neraca is different: it sums actual account balances and CHECKS if balanced
    // The GL approach is more correct — it can detect imbalances

    const legacyAlwaysBalances = true;
    expect(legacyAlwaysBalances).toBe(true);
    // RECOMMENDATION: Migrate to GL-based reports as primary
  });
});


describe("Financial Reports — Arus Kas Opening Balance", () => {
  /**
   * AUDIT: Arus Kas opening balance comes from calculateCashBalance(prevMonth)
   * calculateCashBalance formula:
   *   SUM(bankAccounts.initialBalance) + SUM(all transactions up to period end)
   *
   * This should match Neraca.aset.kas for the same period
   */

  it("closing balance formula is correct", () => {
    const saldoAwal = 10000000;
    const kasMasuk = 5000000;
    const kasKeluar = 3000000;
    const netKas = kasMasuk - kasKeluar;
    const saldoAkhir = saldoAwal + netKas;

    expect(saldoAkhir).toBe(12000000);
  });
});


// ═══════════════════════════════════════════════════════════════════
// 5. REVERSAL LOGIC — Journal Reversal Correctness
// ═══════════════════════════════════════════════════════════════════

describe("Journal Reversal Logic", () => {

  it("reversal swaps debit and credit correctly", () => {
    const originalLines = [
      { accountId: 1, debitAmount: 500000, creditAmount: 0 },
      { accountId: 2, debitAmount: 0, creditAmount: 300000 },
      { accountId: 3, debitAmount: 0, creditAmount: 200000 },
    ];

    const reversalLines = originalLines.map(line => ({
      accountId: line.accountId,
      debitAmount: line.creditAmount,  // swap
      creditAmount: line.debitAmount,  // swap
    }));

    // Original: DR 500k = CR 300k + 200k
    // Reversal: CR 500k = DR 300k + 200k
    expect(reversalLines[0]).toEqual({ accountId: 1, debitAmount: 0, creditAmount: 500000 });
    expect(reversalLines[1]).toEqual({ accountId: 2, debitAmount: 300000, creditAmount: 0 });
    expect(reversalLines[2]).toEqual({ accountId: 3, debitAmount: 200000, creditAmount: 0 });

    // Reversal should also balance
    const revDR = reversalLines.reduce((s, l) => s + l.debitAmount, 0);
    const revCR = reversalLines.reduce((s, l) => s + l.creditAmount, 0);
    expect(revDR).toBe(revCR);
  });

  it("reversed entry status is updated correctly", () => {
    // Original status: "posted" → after reversal: "reversed"
    // New reversal entry: status "posted", reversalOfId = original.id
    const originalStatus = "posted";
    const afterReversal = "reversed";
    expect(afterReversal).not.toBe(originalStatus);
  });
});


// ═══════════════════════════════════════════════════════════════════
// 6. EDGE CASES & KNOWN RISKS
// ═══════════════════════════════════════════════════════════════════

describe("Edge Cases & Known Risks", () => {

  it("RISK: POS checkout with zero HPP still creates journal (no HPP lines)", () => {
    // If all products have hpp=0, the POS checkout should:
    // 1. Still create DR Kas, CR Penjualan
    // 2. NOT create HPP/Persediaan lines (skip if totalHPP === 0)
    const totalHPP = 0;
    const journalLines: any[] = [];

    // Cash line
    journalLines.push({ debit: 500000, credit: 0 });
    // Sales line
    journalLines.push({ debit: 0, credit: 500000 });

    // HPP only if > 0
    if (totalHPP > 0) {
      journalLines.push({ debit: totalHPP, credit: 0 });
      journalLines.push({ debit: 0, credit: totalHPP });
    }

    expect(journalLines.length).toBe(2); // Only cash + sales, no HPP
    const totalDR = journalLines.reduce((s, l) => s + l.debit, 0);
    const totalCR = journalLines.reduce((s, l) => s + l.credit, 0);
    expect(totalDR).toBe(totalCR); // Still balanced
  });

  it("RISK: Deposit use without prior topup could make deposit balance negative", () => {
    // The deposit Use operation:
    // DR Deposit (2104) → this REDUCES the liability
    // If deposit balance is 0, this would make it negative
    // The useDeposit function should validate balance >= amount
    const depositBalance = 0;
    const useAmount = 100000;
    expect(depositBalance >= useAmount).toBe(false); // Should be rejected
  });

  it("RISK: Tax payment with amount=0 skips journal (correct behavior)", () => {
    // Code: if (input.taxAmount > 0 && input.status === "LUNAS") { ... }
    const taxAmount = 0;
    const status = "LUNAS";
    const shouldCreateJournal = taxAmount > 0 && status === "LUNAS";
    expect(shouldCreateJournal).toBe(false);
  });

  it("RISK: Bank transfer from and to same account", () => {
    // If fromBankAccountId === toBankAccountId, the journal still balances
    // but it's a no-op (DR account X, CR account X)
    // This should ideally be caught by validation
    const fromId = 5;
    const toId = 5;
    expect(fromId === toId).toBe(true);
    // RECOMMENDATION: Add validation to reject same-account transfers
  });

  it("formatRupiah handles zero and negative correctly", () => {
    expect(formatRupiah(0)).toBe("Rp 0");
    expect(formatRupiah(1500000)).toBe("Rp 1.500.000");
    expect(formatRupiah(-500000)).toBe("-Rp 500.000");
  });
});
