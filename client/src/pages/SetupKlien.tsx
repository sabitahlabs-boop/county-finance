/**
 * Setup Klien — Bulk import data klien dari Excel template
 * Admin-only: upload Excel template → parse → preview → confirm → import
 */
import { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, ArrowRight, Trash2, Download } from "lucide-react";

// ─── Types for parsed data ───
interface ParsedGudang { name: string; address?: string }
interface ParsedProduk {
  name: string; sku?: string; category?: string; subcategory?: string;
  productType: "barang" | "jasa"; hpp: number; sellingPrice: number;
  priceType: "fixed" | "dynamic"; discountPercent: number; unit: string; stockMinimum: number;
}
interface ParsedStokGudang { productName: string; warehouseName: string; qty: number }
interface ParsedRekening { accountName: string; accountType: "bank" | "ewallet" | "cash"; bankName?: string; accountNumber?: string; initialBalance: number }
interface ParsedSupplier { name: string; phone?: string; email?: string; address?: string }

interface ParsedData {
  gudang: ParsedGudang[];
  produk: ParsedProduk[];
  stokGudang: ParsedStokGudang[];
  rekening: ParsedRekening[];
  supplier: ParsedSupplier[];
}

interface ParseError { tab: string; row: number; message: string }

// ─── Helpers ───
function cleanStr(val: any): string { return val == null ? "" : String(val).trim(); }
function cleanNum(val: any): number { const n = parseFloat(String(val ?? "0").replace(/[^\d.-]/g, "")); return isNaN(n) ? 0 : n; }

function mapAccountType(raw: string): "bank" | "ewallet" | "cash" {
  const lower = raw.toLowerCase().replace(/[^a-z]/g, "");
  if (lower.includes("bank")) return "bank";
  if (lower.includes("wallet") || lower.includes("ewallet")) return "ewallet";
  return "cash";
}

function mapProductType(raw: string): "barang" | "jasa" {
  return raw.toLowerCase().includes("jasa") ? "jasa" : "barang";
}

function mapPriceType(raw: string): "fixed" | "dynamic" {
  return raw.toLowerCase().includes("dynamic") ? "dynamic" : "fixed";
}

// ─── Excel Parser ───
function parseExcelTemplate(workbook: XLSX.WorkBook): { data: ParsedData; errors: ParseError[] } {
  const errors: ParseError[] = [];
  const data: ParsedData = { gudang: [], produk: [], stokGudang: [], rekening: [], supplier: [] };

  // Helper to check if a row is the example row (has green italic styling or specific example values)
  const isExampleRow = (row: any[], firstCellValue: string) => {
    if (!firstCellValue) return false;
    const examples = ["gudang utama", "gudang cabang", "kopi arabika", "jasa konsultasi", "potong rambut",
      "kas toko", "bca bisnis", "gopay", "budi santoso", "pt. supplier jaya", "andi kasir", "siti manager"];
    return examples.some(e => firstCellValue.toLowerCase().includes(e));
  };

  // ── Gudang tab ──
  const wsG = workbook.Sheets["Gudang"];
  if (wsG) {
    const rows: any[][] = XLSX.utils.sheet_to_json(wsG, { header: 1, defval: "" });
    for (let i = 1; i < rows.length; i++) { // skip header row 0
      const [nama, alamat] = rows[i].map(cleanStr);
      if (!nama || isExampleRow(rows[i], nama)) continue;
      data.gudang.push({ name: nama, address: alamat || undefined });
    }
  }

  // ── Produk tab ──
  const wsP = workbook.Sheets["Produk"];
  if (wsP) {
    const rows: any[][] = XLSX.utils.sheet_to_json(wsP, { header: 1, defval: "" });
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const nama = cleanStr(r[0]);
      if (!nama || isExampleRow(r, nama)) continue;
      const productType = mapProductType(cleanStr(r[4]));
      const hpp = cleanNum(r[5]);
      const sellingPrice = cleanNum(r[6]);
      if (productType === "barang" && sellingPrice <= 0) {
        errors.push({ tab: "Produk", row: i + 1, message: `"${nama}" — Harga jual harus > 0` });
      }
      data.produk.push({
        name: nama, sku: cleanStr(r[1]) || undefined,
        category: cleanStr(r[2]) || undefined, subcategory: cleanStr(r[3]) || undefined,
        productType, hpp, sellingPrice,
        priceType: mapPriceType(cleanStr(r[7])),
        discountPercent: cleanNum(r[8]),
        unit: cleanStr(r[9]) || "pcs",
        stockMinimum: productType === "jasa" ? 0 : cleanNum(r[10]),
      });
    }
  }

  // ── Stok Gudang tab ──
  const wsS = workbook.Sheets["Stok Gudang"];
  if (wsS) {
    const rows: any[][] = XLSX.utils.sheet_to_json(wsS, { header: 1, defval: "" });
    // Stok Gudang has instruction row at 0, header at 1, data from 2
    for (let i = 2; i < rows.length; i++) {
      const [produkName, gudangName, qty] = [cleanStr(rows[i][0]), cleanStr(rows[i][1]), cleanNum(rows[i][2])];
      if (!produkName || isExampleRow(rows[i], produkName)) continue;
      if (!gudangName) {
        errors.push({ tab: "Stok Gudang", row: i + 1, message: `"${produkName}" — Nama gudang kosong` });
        continue;
      }
      data.stokGudang.push({ productName: produkName, warehouseName: gudangName, qty });
    }
  }

  // ── Rekening tab ──
  const wsR = workbook.Sheets["Rekening"];
  if (wsR) {
    const rows: any[][] = XLSX.utils.sheet_to_json(wsR, { header: 1, defval: "" });
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const nama = cleanStr(r[0]);
      if (!nama || isExampleRow(r, nama)) continue;
      data.rekening.push({
        accountName: nama,
        accountType: mapAccountType(cleanStr(r[1])),
        bankName: cleanStr(r[2]) || undefined,
        accountNumber: cleanStr(r[3]) || undefined,
        initialBalance: cleanNum(r[4]),
      });
    }
  }

  // ── Kontak tab (only supplier) ──
  const wsK = workbook.Sheets["Kontak"];
  if (wsK) {
    const rows: any[][] = XLSX.utils.sheet_to_json(wsK, { header: 1, defval: "" });
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const nama = cleanStr(r[0]);
      const tipe = cleanStr(r[1]).toLowerCase();
      if (!nama || isExampleRow(r, nama)) continue;
      if (tipe.includes("supplier")) {
        data.supplier.push({
          name: nama,
          phone: cleanStr(r[2]) || undefined,
          email: cleanStr(r[3]) || undefined,
          address: cleanStr(r[4]) || undefined,
        });
      }
      // Note: Pelanggan not imported yet (no customer table)
    }
  }

  return { data, errors };
}

// ─── Tab Preview Component ───
function TabPreview({ title, count, headers, rows, color }: {
  title: string; count: number; headers: string[];
  rows: string[][]; color: string;
}) {
  if (count === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className={color}>{count}</Badge>
        <span className="font-medium text-sm">{title}</span>
      </div>
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50">
              {headers.map(h => <th key={h} className="px-3 py-1.5 text-left font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 10).map((row, i) => (
              <tr key={i} className="border-t border-border">
                {row.map((cell, j) => <td key={j} className="px-3 py-1.5">{cell}</td>)}
              </tr>
            ))}
            {rows.length > 10 && (
              <tr className="border-t border-border">
                <td colSpan={headers.length} className="px-3 py-1.5 text-center text-muted-foreground italic">
                  ... dan {rows.length - 10} baris lagi
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Component ───
export default function SetupKlien() {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [parseErrors, setParseErrors] = useState<ParseError[]>([]);
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [importResult, setImportResult] = useState<any>(null);
  const utils = trpc.useUtils();

  const bulkSetup = trpc.business.bulkSetup.useMutation({
    onSuccess: (result) => {
      setImportResult(result);
      setStep("done");
      utils.invalidate();
      toast.success(`${result.gudang + result.produk + result.rekening + result.supplier} item berhasil diimport`);
    },
    onError: (err) => {
      toast.error(`Gagal import: ${err.message}`);
      setStep("preview");
    },
  });

  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  }, []);

  function processFile(f: File) {
    if (!f.name.endsWith(".xlsx") && !f.name.endsWith(".xls")) {
      toast.error("Format salah — upload file Excel (.xlsx) saja");
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const result = parseExcelTemplate(wb);
        setParsed(result.data);
        setParseErrors(result.errors);
        setStep("preview");
      } catch (err) {
        toast.error("Gagal membaca file — pastikan file adalah template Excel yang valid");
      }
    };
    reader.readAsArrayBuffer(f);
  }

  function handleConfirmImport() {
    if (!parsed) return;
    setStep("importing");
    bulkSetup.mutate(parsed);
  }

  function handleReset() {
    setFile(null);
    setParsed(null);
    setParseErrors([]);
    setImportResult(null);
    setStep("upload");
  }

  const totalItems = parsed ? parsed.gudang.length + parsed.produk.length + parsed.rekening.length + parsed.supplier.length : 0;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold">Setup Klien</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Import data bisnis klien dari template Excel — gudang, produk, stok, rekening, dan supplier
          </p>
        </div>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Template Excel
              </CardTitle>
              <CardDescription>
                Download template, isi data klien, lalu upload kembali di sini
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Download template link */}
              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <Download className="w-4 h-4" />
                <a href="/api/download-template" className="underline hover:no-underline" onClick={(e) => {
                  e.preventDefault();
                  toast.info("Template Excel sudah ada di folder COUNTY atau bisa diminta ke admin");
                }}>
                  Belum punya template? Lihat tab INSTRUKSI di file template
                </a>
              </div>

              {/* Drop zone */}
              <div
                className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground/60 mb-3" />
                <p className="text-sm font-medium">Drag & drop file Excel di sini</p>
                <p className="text-xs text-muted-foreground mt-1">atau klik untuk pilih file (.xlsx)</p>
                <input
                  id="file-input"
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Preview */}
        {step === "preview" && parsed && (
          <>
            {/* File info */}
            <Card>
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">{file?.name}</span>
                  <Badge variant="outline" className="text-xs">{totalItems} item</Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Ganti File
                </Button>
              </CardContent>
            </Card>

            {/* Parse errors */}
            {parseErrors.length > 0 && (
              <Card className="border-amber-300 dark:border-amber-700">
                <CardContent className="py-3 px-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                        {parseErrors.length} peringatan ditemukan
                      </p>
                      <ul className="text-xs text-amber-600 dark:text-amber-400/80 mt-1 space-y-0.5">
                        {parseErrors.map((e, i) => (
                          <li key={i}>Tab {e.tab}, baris {e.row}: {e.message}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Data preview by tab */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preview Data</CardTitle>
                <CardDescription>Periksa data sebelum import. Baris contoh (kuning) otomatis di-skip.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <TabPreview
                  title="Gudang" count={parsed.gudang.length}
                  color="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                  headers={["Nama", "Alamat"]}
                  rows={parsed.gudang.map(g => [g.name, g.address || "-"])}
                />
                <TabPreview
                  title="Produk" count={parsed.produk.length}
                  color="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  headers={["Nama", "Tipe", "HPP", "Harga Jual", "Satuan"]}
                  rows={parsed.produk.map(p => [
                    p.name, p.productType,
                    `Rp ${p.hpp.toLocaleString("id-ID")}`,
                    `Rp ${p.sellingPrice.toLocaleString("id-ID")}`,
                    p.unit,
                  ])}
                />
                <TabPreview
                  title="Stok Gudang" count={parsed.stokGudang.length}
                  color="bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300"
                  headers={["Produk", "Gudang", "Jumlah"]}
                  rows={parsed.stokGudang.map(s => [s.productName, s.warehouseName, String(s.qty)])}
                />
                <TabPreview
                  title="Rekening" count={parsed.rekening.length}
                  color="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                  headers={["Nama", "Tipe", "Bank", "No. Rek", "Saldo Awal"]}
                  rows={parsed.rekening.map(r => [
                    r.accountName, r.accountType, r.bankName || "-",
                    r.accountNumber || "-", `Rp ${r.initialBalance.toLocaleString("id-ID")}`,
                  ])}
                />
                <TabPreview
                  title="Supplier" count={parsed.supplier.length}
                  color="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                  headers={["Nama", "Telepon", "Email"]}
                  rows={parsed.supplier.map(s => [s.name, s.phone || "-", s.email || "-"])}
                />

                {totalItems === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Tidak ada data yang terdeteksi. Pastikan file yang di-upload adalah template yang benar.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action buttons */}
            {totalItems > 0 && (
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleReset}>Batal</Button>
                <Button onClick={handleConfirmImport} className="gap-2">
                  Import {totalItems} Item <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* Step 3: Importing */}
        {step === "importing" && (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary mb-3" />
              <p className="font-medium">Mengimport data...</p>
              <p className="text-sm text-muted-foreground mt-1">Mohon tunggu, sedang memproses {totalItems} item</p>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Done */}
        {step === "done" && importResult && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center mb-6">
                <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-3" />
                <h2 className="text-lg font-semibold">Import Selesai!</h2>
              </div>

              {/* Result summary */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-xl mx-auto mb-6">
                {[
                  { label: "Gudang", count: importResult.gudang },
                  { label: "Produk", count: importResult.produk },
                  { label: "Stok", count: importResult.stokGudang },
                  { label: "Rekening", count: importResult.rekening },
                  { label: "Supplier", count: importResult.supplier },
                ].map(({ label, count }) => (
                  <div key={label} className="text-center p-3 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-primary">{count}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>

              {/* Import errors */}
              {importResult.errors?.length > 0 && (
                <div className="border border-amber-300 dark:border-amber-700 rounded-lg p-3 mb-6 max-w-xl mx-auto">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">
                    {importResult.errors.length} item gagal diimport:
                  </p>
                  <ul className="text-xs text-amber-600 dark:text-amber-400/80 space-y-0.5">
                    {importResult.errors.map((e: string, i: number) => <li key={i}>• {e}</li>)}
                  </ul>
                </div>
              )}

              <div className="text-center">
                <Button onClick={handleReset} variant="outline">Import Klien Lain</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
