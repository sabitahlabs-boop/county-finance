/**
 * Export utilities — PDF (jsPDF + autotable) and Excel (xlsx)
 * Reusable across all report pages in County.
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// ─── Types ───
export interface ExportColumn {
  header: string;       // Display name
  key: string;          // Data key
  width?: number;       // PDF column width (optional)
  align?: "left" | "center" | "right";
  format?: (value: any) => string; // Custom formatter
}

export interface ExportOptions {
  title: string;
  subtitle?: string;       // e.g. "Periode: 1 Apr 2026 - 17 Apr 2026"
  columns: ExportColumn[];
  data: Record<string, any>[];
  filename: string;        // Without extension
  orientation?: "portrait" | "landscape";
  summaryRow?: Record<string, any>; // Optional summary/total row
}

// ─── PDF Export ───
export function exportToPDF(options: ExportOptions) {
  const { title, subtitle, columns, data, filename, orientation = "portrait", summaryRow } = options;

  const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, pageWidth / 2, 15, { align: "center" });

  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, pageWidth / 2, 22, { align: "center" });
  }

  // Prepare table data
  const headers = columns.map(c => c.header);
  const body = data.map(row =>
    columns.map(col => {
      const val = row[col.key];
      return col.format ? col.format(val) : (val ?? "-").toString();
    })
  );

  // Add summary row if provided
  if (summaryRow) {
    body.push(
      columns.map(col => {
        const val = summaryRow[col.key];
        return col.format ? col.format(val) : (val ?? "").toString();
      })
    );
  }

  // Column alignments
  const columnStyles: Record<number, { halign: "left" | "center" | "right" }> = {};
  columns.forEach((col, i) => {
    if (col.align) columnStyles[i] = { halign: col.align };
  });

  autoTable(doc, {
    head: [headers],
    body,
    startY: subtitle ? 28 : 22,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [30, 77, 155], // County navy
      textColor: 255,
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles,
    // Bold the summary row
    didParseCell: (hookData) => {
      if (summaryRow && hookData.section === "body" && hookData.row.index === body.length - 1) {
        hookData.cell.styles.fontStyle = "bold";
        hookData.cell.styles.fillColor = [226, 232, 240];
      }
    },
    // Footer with page numbers
    didDrawPage: (hookData) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(
        `County — ${title} — Halaman ${hookData.pageNumber} / ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: "center" }
      );
      doc.text(
        `Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 4,
        { align: "center" }
      );
    },
  });

  doc.save(`${filename}.pdf`);
}

// ─── Excel Export ───
export function exportToExcel(options: ExportOptions) {
  const { title, subtitle, columns, data, filename, summaryRow } = options;

  // Build rows: header info rows + empty row + column headers + data + summary
  const wsData: any[][] = [];

  // Title row
  wsData.push([title]);
  if (subtitle) wsData.push([subtitle]);
  wsData.push([]); // empty row

  // Column headers
  wsData.push(columns.map(c => c.header));

  // Data rows
  for (const row of data) {
    wsData.push(
      columns.map(col => {
        const val = row[col.key];
        return col.format ? col.format(val) : (val ?? "");
      })
    );
  }

  // Summary row
  if (summaryRow) {
    wsData.push(
      columns.map(col => {
        const val = summaryRow[col.key];
        return col.format ? col.format(val) : (val ?? "");
      })
    );
  }

  // Create workbook
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws["!cols"] = columns.map(col => ({ wch: col.width ?? 18 }));

  // Merge title row across all columns
  const lastCol = columns.length - 1;
  if (!ws["!merges"]) ws["!merges"] = [];
  ws["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } });
  if (subtitle) {
    ws["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: lastCol } });
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Laporan");

  // Generate and save
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([buf], { type: "application/octet-stream" }), `${filename}.xlsx`);
}

// ─── Convenience: Format Rupiah for export ───
export function fmtRp(amount: number | null | undefined): string {
  if (amount == null) return "Rp 0";
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

// ─── Convenience: Format date for export ───
export function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}
