import { useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { formatRupiah } from "../../../shared/finance";
import { getProxiedImageUrl } from "@/lib/utils";

type ReceiptItem = {
  name: string;
  qty: number;
  price: number;
};

type ReceiptPayment = {
  method: string;
  amount: number;
};

type ReceiptBusiness = {
  businessName: string;
  address?: string | null;
  phone?: string | null;
  brandColor?: string;
  logoUrl?: string | null;
  invoiceFooter?: string | null;
};

interface POSReceiptPrintProps {
  open: boolean;
  onClose: () => void;
  receiptCode: string;
  date: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  payments: ReceiptPayment[];
  customerPaid: number;
  changeAmount: number;
  customerName?: string;
  business: ReceiptBusiness;
  cashierName?: string;
}

// 80mm thermal = ~302px at 203dpi, we use 72mm printable area = ~272px
const RECEIPT_WIDTH = "72mm";

export function POSReceiptPrint({
  open, onClose, receiptCode, date, items, subtotal, discount,
  grandTotal, payments, customerPaid, changeAmount, customerName, business, cashierName,
}: POSReceiptPrintProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const brandColor = business.brandColor || "#2D8B84";
  const logoUrl = getProxiedImageUrl(business.logoUrl);

  const formattedDate = (() => {
    try {
      const d = new Date(date + "T00:00:00");
      return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return date;
    }
  })();

  const formattedTime = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) return;

    const styles = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: 'Inter', 'Segoe UI', sans-serif;
        background: white;
        color: #1a1a1a;
        width: ${RECEIPT_WIDTH};
        margin: 0 auto;
        padding: 0;
      }
      @page {
        size: 80mm auto;
        margin: 0;
      }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `;

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Struk ${receiptCode}</title><style>${styles}</style></head><body>${content.innerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 400);
  };

  const S = {
    receipt: {
      background: "white",
      width: RECEIPT_WIDTH,
      margin: "0 auto",
      fontFamily: "'Inter', sans-serif",
      fontSize: "11px",
      color: "#1a1a1a",
      lineHeight: "1.4",
    } as React.CSSProperties,
    header: {
      padding: "12px 10px 10px",
      textAlign: "center" as const,
      borderBottom: `2px solid ${brandColor}`,
    } as React.CSSProperties,
    logo: {
      height: "36px",
      width: "auto",
      marginBottom: "4px",
      borderRadius: "4px",
    } as React.CSSProperties,
    bizName: {
      fontSize: "14px",
      fontWeight: "700" as const,
      color: brandColor,
      letterSpacing: "-0.3px",
    } as React.CSSProperties,
    bizInfo: {
      fontSize: "9px",
      color: "#777",
      marginTop: "2px",
    } as React.CSSProperties,
    section: {
      padding: "8px 10px",
      borderBottom: "1px dashed #ccc",
    } as React.CSSProperties,
    row: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "4px",
    } as React.CSSProperties,
    label: {
      fontSize: "9px",
      color: "#888",
      fontWeight: "500" as const,
    } as React.CSSProperties,
    value: {
      fontSize: "10px",
      fontWeight: "500" as const,
      textAlign: "right" as const,
    } as React.CSSProperties,
    itemName: {
      fontSize: "10px",
      fontWeight: "500" as const,
      flex: "1",
    } as React.CSSProperties,
    itemQty: {
      fontSize: "9px",
      color: "#666",
      marginTop: "1px",
    } as React.CSSProperties,
    itemPrice: {
      fontSize: "10px",
      fontWeight: "600" as const,
      textAlign: "right" as const,
      whiteSpace: "nowrap" as const,
    } as React.CSSProperties,
    totalRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px",
      background: "#f8f8f8",
      borderBottom: "1px dashed #ccc",
    } as React.CSSProperties,
    totalLabel: {
      fontSize: "12px",
      fontWeight: "700" as const,
    } as React.CSSProperties,
    totalValue: {
      fontSize: "16px",
      fontWeight: "700" as const,
      color: brandColor,
    } as React.CSSProperties,
    footer: {
      padding: "10px",
      textAlign: "center" as const,
    } as React.CSSProperties,
    footerText: {
      fontSize: "9px",
      color: "#999",
    } as React.CSSProperties,
    dashes: {
      borderTop: "1px dashed #ccc",
      margin: "0",
    } as React.CSSProperties,
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xs p-0 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
          <h2 className="font-semibold text-xs">Preview Struk</h2>
          <div className="flex items-center gap-1.5">
            <Button size="sm" onClick={handlePrint} className="gap-1 h-7 text-xs" style={{ backgroundColor: brandColor }}>
              <Printer className="h-3 w-3" /> Cetak
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose} className="h-7 w-7 p-0">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Receipt Preview */}
        <div className="overflow-y-auto max-h-[75vh] bg-gray-100 p-3">
          <div ref={printRef} style={S.receipt}>

            {/* ─── Header: Logo + Business Name ─── */}
            <div style={S.header}>
              {logoUrl && (
                <img src={logoUrl} alt="Logo" style={S.logo} />
              )}
              <div style={S.bizName}>{business.businessName}</div>
              {business.address && <div style={S.bizInfo}>{business.address}</div>}
              {business.phone && <div style={S.bizInfo}>{business.phone}</div>}
            </div>

            {/* ─── Receipt Info ─── */}
            <div style={S.section}>
              <div style={{ ...S.row, marginBottom: "2px" }}>
                <span style={S.label}>No. Struk</span>
                <span style={{ fontSize: "10px", fontWeight: "600", fontFamily: "monospace" }}>{receiptCode}</span>
              </div>
              <div style={{ ...S.row, marginBottom: "2px" }}>
                <span style={S.label}>Tanggal</span>
                <span style={S.value}>{formattedDate} {formattedTime}</span>
              </div>
              {cashierName && (
                <div style={S.row}>
                  <span style={S.label}>Kasir</span>
                  <span style={S.value}>{cashierName}</span>
                </div>
              )}
              {customerName && (
                <div style={S.row}>
                  <span style={S.label}>Pelanggan</span>
                  <span style={S.value}>{customerName}</span>
                </div>
              )}
            </div>

            {/* ─── Items ─── */}
            <div style={S.section}>
              {items.map((item, i) => (
                <div key={i} style={{ ...S.row, marginBottom: i < items.length - 1 ? "4px" : "0" }}>
                  <div style={{ flex: 1 }}>
                    <div style={S.itemName}>{item.name}</div>
                    <div style={S.itemQty}>
                      {item.qty} x {formatRupiah(item.price)}
                    </div>
                  </div>
                  <div style={S.itemPrice}>{formatRupiah(item.price * item.qty)}</div>
                </div>
              ))}
            </div>

            {/* ─── Subtotal / Discount ─── */}
            <div style={S.section}>
              <div style={S.row}>
                <span style={{ fontSize: "10px" }}>Subtotal</span>
                <span style={{ fontSize: "10px", fontWeight: "500" }}>{formatRupiah(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div style={{ ...S.row, marginTop: "2px" }}>
                  <span style={{ fontSize: "10px", color: "#16a34a" }}>Diskon</span>
                  <span style={{ fontSize: "10px", color: "#16a34a", fontWeight: "500" }}>-{formatRupiah(discount)}</span>
                </div>
              )}
            </div>

            {/* ─── Grand Total ─── */}
            <div style={S.totalRow}>
              <span style={S.totalLabel}>TOTAL</span>
              <span style={S.totalValue}>{formatRupiah(grandTotal)}</span>
            </div>

            {/* ─── Payment Details ─── */}
            <div style={S.section}>
              {payments.map((p, i) => (
                <div key={i} style={{ ...S.row, marginBottom: "2px" }}>
                  <span style={{ fontSize: "10px", color: "#555" }}>{p.method}</span>
                  <span style={{ fontSize: "10px", fontWeight: "500" }}>{formatRupiah(p.amount)}</span>
                </div>
              ))}
              {changeAmount > 0 && (
                <div style={{ ...S.row, marginTop: "4px", paddingTop: "4px", borderTop: "1px dotted #ddd" }}>
                  <span style={{ fontSize: "10px", fontWeight: "600" }}>Kembalian</span>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: brandColor }}>{formatRupiah(changeAmount)}</span>
                </div>
              )}
            </div>

            {/* ─── Footer ─── */}
            <div style={S.footer}>
              <div style={{ ...S.footerText, fontWeight: "500", color: "#555", marginBottom: "4px" }}>
                {business.invoiceFooter || "Terima kasih atas kunjungan Anda!"}
              </div>
              <div style={S.footerText}>
                Powered by County
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
