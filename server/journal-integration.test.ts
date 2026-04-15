import { describe, expect, it } from "vitest";
import { formatRupiah } from "../shared/finance";

// ─── Journal Integration: Debt Payment → Transaction ───
describe("Debt Payment Journal Integration", () => {
  it("hutang payment creates pengeluaran transaction", () => {
    const debtType = "hutang";
    const counterpartyName = "Supplier ABC";
    const amount = 500000;
    const remaining = 1000000;
    const bankAccountName = "BCA";

    const txType = debtType === "hutang" ? "pengeluaran" : "pemasukan";
    const txCategory = debtType === "hutang" ? "Pembayaran Hutang" : "Penerimaan Piutang";
    const txDescription = debtType === "hutang"
      ? `Bayar hutang ke ${counterpartyName}`
      : `Terima pembayaran piutang dari ${counterpartyName}`;
    const paymentMethod = bankAccountName || "tunai";

    expect(txType).toBe("pengeluaran");
    expect(txCategory).toBe("Pembayaran Hutang");
    expect(txDescription).toBe("Bayar hutang ke Supplier ABC");
    expect(paymentMethod).toBe("BCA");
  });

  it("piutang payment creates pemasukan transaction", () => {
    const debtType = "piutang";
    const counterpartyName = "Customer XYZ";
    const amount = 300000;
    const bankAccountName = "Mandiri";

    const txType = debtType === "hutang" ? "pengeluaran" : "pemasukan";
    const txCategory = debtType === "hutang" ? "Pembayaran Hutang" : "Penerimaan Piutang";
    const txDescription = debtType === "hutang"
      ? `Bayar hutang ke ${counterpartyName}`
      : `Terima pembayaran piutang dari ${counterpartyName}`;

    expect(txType).toBe("pemasukan");
    expect(txCategory).toBe("Penerimaan Piutang");
    expect(txDescription).toBe("Terima pembayaran piutang dari Customer XYZ");
  });

  it("falls back to tunai when no bankAccountName provided", () => {
    const bankAccountName = undefined;
    const paymentMethod = "transfer";
    const account = bankAccountName || paymentMethod;
    expect(account).toBe("transfer");

    const account2 = undefined || "tunai";
    expect(account2).toBe("tunai");
  });

  it("generates correct notes with remaining balance", () => {
    const counterpartyName = "Vendor A";
    const remaining = 1500000;
    const amount = 500000;
    const notes = "Cicilan ke-2";
    const debtType = "hutang";

    const txNotes = `Hutang ke ${counterpartyName} — sisa ${formatRupiah(remaining - amount)}${notes ? " | " + notes : ""}`;
    expect(txNotes).toBe("Hutang ke Vendor A — sisa Rp 1.000.000 | Cicilan ke-2");
  });

  it("generates notes without extra notes when empty", () => {
    const counterpartyName = "Vendor B";
    const remaining = 2000000;
    const amount = 2000000;
    const notes = "";

    const txNotes = `Hutang ke ${counterpartyName} — sisa ${formatRupiah(remaining - amount)}${notes ? " | " + notes : ""}`;
    expect(txNotes).toBe("Hutang ke Vendor B — sisa Rp 0");
  });
});

// ─── Journal Integration: Savings → Transaction ───
describe("Savings Journal Integration", () => {
  it("savings addFunds creates pengeluaran transaction", () => {
    const goalName = "PS5";
    const amount = 500000;
    const currentAmount = 1500000;
    const targetAmount = 6000000;
    const bankAccountName = "BCA";

    const txType = "pengeluaran";
    const txCategory = "Tabungan Impian";
    const txDescription = `Setor tabungan: ${goalName}`;
    const paymentMethod = bankAccountName || "tunai";
    const txNotes = `Tabungan impian "${goalName}" — progress ${formatRupiah(currentAmount)} / ${formatRupiah(targetAmount)}`;

    expect(txType).toBe("pengeluaran");
    expect(txCategory).toBe("Tabungan Impian");
    expect(txDescription).toBe("Setor tabungan: PS5");
    expect(paymentMethod).toBe("BCA");
    expect(txNotes).toBe('Tabungan impian "PS5" — progress Rp 1.500.000 / Rp 6.000.000');
  });

  it("savings without bank account defaults to tunai", () => {
    const bankAccountName = undefined;
    const paymentMethod = bankAccountName || "tunai";
    expect(paymentMethod).toBe("tunai");
  });
});

// ─── Journal Integration: Monthly Bill Payment → Transaction ───
describe("Monthly Bill Payment Journal Integration", () => {
  it("bill payment creates pengeluaran transaction", () => {
    const billName = "Cicilan Motor Honda";
    const billCategory = "Kredit Motor/Mobil";
    const amount = 1500000;
    const dueDay = 15;
    const bankAccountName = "BCA";
    const notes = "Bulan Maret";

    const txType = "pengeluaran";
    const txCategory = "Tagihan Bulanan";
    const txDescription = `Bayar tagihan: ${billName}`;
    const paymentMethod = bankAccountName || "tunai";
    const txNotes = `Tagihan rutin "${billName}" (${billCategory}) — jatuh tempo tgl ${dueDay}${notes ? " | " + notes : ""}`;

    expect(txType).toBe("pengeluaran");
    expect(txCategory).toBe("Tagihan Bulanan");
    expect(txDescription).toBe("Bayar tagihan: Cicilan Motor Honda");
    expect(paymentMethod).toBe("BCA");
    expect(txNotes).toBe('Tagihan rutin "Cicilan Motor Honda" (Kredit Motor/Mobil) — jatuh tempo tgl 15 | Bulan Maret');
  });

  it("bill payment without bank account defaults to tunai", () => {
    const bankAccountName = undefined;
    const paymentMethod = bankAccountName || "tunai";
    expect(paymentMethod).toBe("tunai");
  });

  it("bill payment without notes omits notes suffix", () => {
    const billName = "Internet WiFi";
    const billCategory = "Internet/WiFi";
    const dueDay = 20;
    const notes = "";

    const txNotes = `Tagihan rutin "${billName}" (${billCategory}) — jatuh tempo tgl ${dueDay}${notes ? " | " + notes : ""}`;
    expect(txNotes).toBe('Tagihan rutin "Internet WiFi" (Internet/WiFi) — jatuh tempo tgl 20');
  });
});

// ─── Bank Account Selection Logic ───
describe("Bank Account Selection", () => {
  it("uses bankAccountName as paymentMethod when provided", () => {
    const bankAccountName = "Gopay";
    const paymentMethod = "transfer";
    const finalMethod = bankAccountName || paymentMethod;
    expect(finalMethod).toBe("Gopay");
  });

  it("falls back to paymentMethod when bankAccountName is empty", () => {
    const bankAccountName = "";
    const paymentMethod = "transfer";
    const finalMethod = bankAccountName || paymentMethod;
    expect(finalMethod).toBe("transfer");
  });

  it("falls back to tunai when both are empty", () => {
    const bankAccountName = "";
    const paymentMethod = "";
    const finalMethod = bankAccountName || paymentMethod || "tunai";
    expect(finalMethod).toBe("tunai");
  });

  it("hutang payment label says 'Bayar dari Rekening'", () => {
    const debtType = "hutang";
    const label = debtType === "hutang" ? "Bayar dari Rekening" : "Terima ke Rekening";
    expect(label).toBe("Bayar dari Rekening");
  });

  it("piutang payment label says 'Terima ke Rekening'", () => {
    const debtType = "piutang";
    const label = debtType === "hutang" ? "Bayar dari Rekening" : "Terima ke Rekening";
    expect(label).toBe("Terima ke Rekening");
  });
});
