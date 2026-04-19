import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, X } from "lucide-react";
import { formatRupiah } from "../../../shared/finance";
import { useRef, useMemo } from "react";
import { getProxiedImageUrl } from "@/lib/utils";

type Transaction = {
  id: number;
  txCode: string;
  date: string;
  type: "pemasukan" | "pengeluaran";
  category: string;
  description?: string | null;
  amount: number;
  paymentMethod: string;
  notes?: string | null;
  createdAt: Date | string;
};

type Business = {
  businessName: string;
  address?: string | null;
  phone?: string | null;
  npwp?: string | null;
  bankName?: string | null;
  bankAccount?: string | null;
  bankHolder?: string | null;
  brandColor?: string;
  logoUrl?: string | null;
  qrisImageUrl?: string | null;
  invoiceFooter?: string | null;
  signatureUrl?: string | null;
};

interface InvoicePrintDialogProps {
  open: boolean;
  onClose: () => void;
  transaction: Transaction;
  business: Business;
}

export function InvoicePrintDialog({ open, onClose, transaction, business }: InvoicePrintDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const brandColor = business.brandColor || "#2d9a5a";
  const proxiedLogoUrl = useMemo(() => getProxiedImageUrl(business.logoUrl), [business.logoUrl]);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return;

    const styles = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Inter', sans-serif; background: white; color: #1a1a1a; }
      @page { size: 80mm auto; margin: 0; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${transaction.txCode}</title>
          <style>${styles}</style>
        </head>
        <body>${content.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleDownload = () => {
    const content = printRef.current;
    if (!content) return;

    const styles = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Inter', sans-serif; background: white; color: #1a1a1a; }
    `;

    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Invoice ${transaction.txCode}</title>
    <style>${styles}</style>
  </head>
  <body>${content.innerHTML}</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Invoice-${transaction.txCode}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const paymentMethodLabel: Record<string, string> = {
    tunai: "Tunai / Cash",
    transfer: "Transfer Bank",
    qris: "QRIS",
    kartu_debit: "Kartu Debit",
    kartu_kredit: "Kartu Kredit",
    lainnya: "Lainnya",
  };

  const invoiceDate = new Date(transaction.date + "T00:00:00");
  const formattedDate = invoiceDate.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const isIncome = transaction.type === "pemasukan";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <h2 className="font-semibold text-sm">Preview Invoice</h2>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleDownload} className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Download
            </Button>
            <Button size="sm" onClick={handlePrint} className="gap-1.5" style={{ backgroundColor: brandColor }}>
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Invoice Preview */}
        <div className="overflow-y-auto max-h-[80vh] bg-gray-100 p-6">
          <div
            ref={printRef}
            style={{
              background: "white",
              width: "100%",
              maxWidth: "560px",
              margin: "0 auto",
              fontFamily: "'Inter', system-ui, sans-serif",
              boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            {/* Header with brand color */}
            <div style={{ background: brandColor, padding: "28px 32px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  {proxiedLogoUrl ? (
                    <img
                      src={proxiedLogoUrl}
                      alt="Logo"
                      style={{ height: "48px", width: "auto", borderRadius: "8px", background: "white", padding: "4px" }}
                    />
                  ) : (
                    <div style={{
                      width: "48px", height: "48px", borderRadius: "8px",
                      background: "rgba(255,255,255,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "20px", fontWeight: "700", color: "white"
                    }}>
                      {business.businessName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div style={{ color: "white", fontWeight: "700", fontSize: "18px", letterSpacing: "-0.3px" }}>
                      {business.businessName}
                    </div>
                    {business.address && (
                      <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px", marginTop: "2px" }}>
                        {business.address}
                      </div>
                    )}
                    {business.phone && (
                      <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}>
                        {business.phone}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "11px", fontWeight: "500", letterSpacing: "1px", textTransform: "uppercase" }}>
                    {isIncome ? "INVOICE" : "BUKTI PENGELUARAN"}
                  </div>
                  <div style={{ color: "white", fontWeight: "700", fontSize: "16px", marginTop: "4px" }}>
                    {transaction.txCode}
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Info */}
            <div style={{ padding: "24px 32px", borderBottom: "1px solid #f0f0f0" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "#888", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                    Tanggal
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: "500", color: "#1a1a1a" }}>{formattedDate}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#888", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                    Metode Pembayaran
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: "500", color: "#1a1a1a" }}>
                    {paymentMethodLabel[transaction.paymentMethod] || transaction.paymentMethod}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#888", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                    Kategori
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: "500", color: "#1a1a1a" }}>{transaction.category}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#888", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                    Jenis
                  </div>
                  <div style={{
                    display: "inline-block",
                    padding: "2px 10px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "600",
                    background: isIncome ? "#dcfce7" : "#fee2e2",
                    color: isIncome ? "#16a34a" : "#dc2626",
                  }}>
                    {isIncome ? "Pemasukan" : "Pengeluaran"}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div style={{ padding: "20px 32px", borderBottom: "1px solid #f0f0f0" }}>
              <div style={{ fontSize: "11px", color: "#888", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                Keterangan
              </div>
              <div style={{ fontSize: "14px", color: "#1a1a1a", lineHeight: "1.5" }}>
                {transaction.description || "-"}
              </div>
              {transaction.notes && (
                <div style={{ marginTop: "8px", fontSize: "13px", color: "#666", fontStyle: "italic" }}>
                  Catatan: {transaction.notes}
                </div>
              )}
            </div>

            {/* Total Amount */}
            <div style={{ padding: "24px 32px", background: "#fafafa" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: "14px", color: "#555", fontWeight: "500" }}>Total</div>
                <div style={{
                  fontSize: "26px",
                  fontWeight: "700",
                  color: isIncome ? "#16a34a" : "#dc2626",
                  letterSpacing: "-0.5px"
                }}>
                  {isIncome ? "+" : "-"}{formatRupiah(transaction.amount)}
                </div>
              </div>
            </div>

            {/* Bank Info / QRIS */}
            {(business.bankName || business.qrisImageUrl) && (
              <div style={{ padding: "20px 32px", borderTop: "1px solid #f0f0f0" }}>
                {business.bankName && (
                  <div style={{ marginBottom: business.qrisImageUrl ? "16px" : "0" }}>
                    <div style={{ fontSize: "11px", color: "#888", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                      Informasi Pembayaran
                    </div>
                    <div style={{ fontSize: "13px", color: "#1a1a1a" }}>
                      <span style={{ fontWeight: "600" }}>{business.bankName}</span>
                      {business.bankAccount && ` — ${business.bankAccount}`}
                      {business.bankHolder && ` a/n ${business.bankHolder}`}
                    </div>
                  </div>
                )}
                {business.qrisImageUrl && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "11px", color: "#888", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                      Scan QRIS untuk Pembayaran
                    </div>
                    <img
                      src={business.qrisImageUrl}
                      alt="QRIS"
                      style={{ height: "120px", width: "auto", margin: "0 auto" }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Signature */}
            {business.signatureUrl && (
              <div style={{ padding: "20px 32px", textAlign: "right", borderTop: "1px solid #f0f0f0" }}>
                <div style={{ fontSize: "11px", color: "#888", marginBottom: "8px" }}>Hormat kami,</div>
                <img src={business.signatureUrl} alt="Tanda Tangan" style={{ height: "48px", width: "auto", marginLeft: "auto" }} />
                <div style={{ fontSize: "12px", color: "#333", fontWeight: "600", marginTop: "4px" }}>{business.businessName}</div>
              </div>
            )}

            {/* Footer */}
            <div style={{
              padding: "16px 32px",
              background: brandColor,
              textAlign: "center",
            }}>
              <div style={{ color: "rgba(255,255,255,0.9)", fontSize: "12px" }}>
                {business.invoiceFooter || "Terima kasih atas kepercayaan Anda"}
              </div>
              {business.npwp && (
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "11px", marginTop: "4px" }}>
                  NPWP: {business.npwp}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
