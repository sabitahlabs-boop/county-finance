/**
 * Bluetooth Thermal Printer - ESC/POS via Web Bluetooth API
 * Supports most 58mm & 80mm BLE thermal printers (Xprinter, GOOJPRT, MTP, etc.)
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// Web Bluetooth API types (not included in default TS lib)
type BtDevice = { name?: string; gatt?: any; addEventListener: any };
type BtCharacteristic = { properties: { write: boolean; writeWithoutResponse: boolean }; writeValue: (d: BufferSource) => Promise<void>; writeValueWithoutResponse: (d: BufferSource) => Promise<void> };

// Known BLE printer service UUIDs (covers 90%+ of cheap thermal printers)
const PRINTER_SERVICE_UUIDS = [
  "000018f0-0000-1000-8000-00805f9b34fb",
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
  "49535343-fe7d-4ae5-8fa9-9fafd205e455",
];

// Known writable characteristic UUIDs
const WRITE_CHAR_UUIDS = [
  "00002af1-0000-1000-8000-00805f9b34fb",
  "0000ff02-0000-1000-8000-00805f9b34fb",
  "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f",
  "49535343-8841-43f4-a8d4-ecbe34729bb3",
];

// ─── ESC/POS Commands ───
const ESC = 0x1b;
const GS = 0x1d;
const CMD = {
  INIT: [ESC, 0x40],                    // Initialize printer
  ALIGN_CENTER: [ESC, 0x61, 0x01],      // Center align
  ALIGN_LEFT: [ESC, 0x61, 0x00],        // Left align
  ALIGN_RIGHT: [ESC, 0x61, 0x02],       // Right align
  BOLD_ON: [ESC, 0x45, 0x01],           // Bold on
  BOLD_OFF: [ESC, 0x45, 0x00],          // Bold off
  DOUBLE_SIZE: [ESC, 0x21, 0x30],       // Double width+height
  NORMAL_SIZE: [ESC, 0x21, 0x00],       // Normal size
  WIDE: [ESC, 0x21, 0x20],              // Double width only
  FEED_3: [ESC, 0x64, 0x03],            // Feed 3 lines
  FEED_5: [ESC, 0x64, 0x05],            // Feed 5 lines
  CUT: [GS, 0x56, 0x00],               // Full cut
  PARTIAL_CUT: [GS, 0x56, 0x01],       // Partial cut
};

// ─── Types ───
export type ReceiptData = {
  businessName: string;
  address?: string | null;
  phone?: string | null;
  receiptCode: string;
  date: string;
  cashierName?: string;
  customerName?: string;
  items: { name: string; qty: number; price: number }[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  payments: { method: string; amount: number }[];
  customerPaid: number;
  changeAmount: number;
  footerText?: string | null;
};

export type PrinterStatus = "disconnected" | "connecting" | "connected" | "printing" | "error";

// ─── Printer Class ───
class ThermalPrinter {
  private device: BtDevice | null = null;
  private characteristic: BtCharacteristic | null = null;
  private _status: PrinterStatus = "disconnected";
  private _printerName: string = "";
  private _onStatusChange: ((s: PrinterStatus) => void) | null = null;
  private _charWidth: number = 32; // 58mm=32, 80mm=48

  get status() { return this._status; }
  get printerName() { return this._printerName; }
  get isConnected() { return this._status === "connected" || this._status === "printing"; }

  set onStatusChange(fn: ((s: PrinterStatus) => void) | null) {
    this._onStatusChange = fn;
  }

  private setStatus(s: PrinterStatus) {
    this._status = s;
    this._onStatusChange?.(s);
  }

  /** Check if Web Bluetooth is available */
  static isSupported(): boolean {
    return !!(navigator as any).bluetooth;
  }

  /** Connect to a BLE thermal printer */
  async connect(charWidth: number = 32): Promise<boolean> {
    if (!ThermalPrinter.isSupported()) {
      throw new Error("Browser tidak mendukung Bluetooth. Gunakan Chrome/Edge.");
    }

    this._charWidth = charWidth;
    this.setStatus("connecting");

    try {
      // Request any BLE device — user picks from browser dialog
      this.device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: PRINTER_SERVICE_UUIDS,
      });

      if (!this.device) {
        this.setStatus("disconnected");
        return false;
      }

      this._printerName = this.device.name || "Thermal Printer";

      // Listen for disconnection
      this.device.addEventListener("gattserverdisconnected", () => {
        this.characteristic = null;
        this.setStatus("disconnected");
      });

      // Connect GATT
      const server = await this.device.gatt!.connect();

      // Try each known service UUID until one works
      for (const svcUuid of PRINTER_SERVICE_UUIDS) {
        try {
          const service = await server.getPrimaryService(svcUuid);
          // Try each known write characteristic
          for (const charUuid of WRITE_CHAR_UUIDS) {
            try {
              const char = await service.getCharacteristic(charUuid);
              if (char.properties.write || char.properties.writeWithoutResponse) {
                this.characteristic = char;
                this.setStatus("connected");
                return true;
              }
            } catch { /* try next */ }
          }
          // If known chars didn't work, try all characteristics in this service
          try {
            const chars = await service.getCharacteristics();
            for (const char of chars) {
              if (char.properties.write || char.properties.writeWithoutResponse) {
                this.characteristic = char;
                this.setStatus("connected");
                return true;
              }
            }
          } catch { /* try next service */ }
        } catch { /* service not found, try next */ }
      }

      // If known services didn't work, try discovering all services
      try {
        const services = await server.getPrimaryServices();
        for (const service of services) {
          try {
            const chars = await service.getCharacteristics();
            for (const char of chars) {
              if (char.properties.write || char.properties.writeWithoutResponse) {
                this.characteristic = char;
                this.setStatus("connected");
                return true;
              }
            }
          } catch { /* next */ }
        }
      } catch { /* no services */ }

      throw new Error("Printer tidak memiliki karakteristik yang didukung.");
    } catch (err: any) {
      if (err.name === "NotFoundError" || err.message?.includes("cancelled")) {
        // User cancelled the picker
        this.setStatus("disconnected");
        return false;
      }
      this.setStatus("error");
      throw err;
    }
  }

  /** Disconnect from printer */
  disconnect() {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.characteristic = null;
    this.setStatus("disconnected");
  }

  /** Print a receipt */
  async printReceipt(data: ReceiptData): Promise<void> {
    if (!this.characteristic) throw new Error("Printer belum tersambung.");
    this.setStatus("printing");
    try {
      const bytes = this.buildReceipt(data);
      await this.sendBytes(bytes);
      this.setStatus("connected");
    } catch (err) {
      this.setStatus("error");
      throw err;
    }
  }

  /** Send raw bytes in chunks (BLE MTU limit) */
  private async sendBytes(data: Uint8Array): Promise<void> {
    const CHUNK = 100; // Safe chunk size for most BLE printers
    for (let i = 0; i < data.length; i += CHUNK) {
      const chunk = data.slice(i, i + CHUNK);
      if (this.characteristic!.properties.writeWithoutResponse) {
        await this.characteristic!.writeValueWithoutResponse(chunk);
      } else {
        await this.characteristic!.writeValue(chunk);
      }
      // Small delay between chunks to prevent buffer overflow
      if (i + CHUNK < data.length) {
        await new Promise(r => setTimeout(r, 20));
      }
    }
  }

  // ─── Receipt Builder ───

  private buildReceipt(data: ReceiptData): Uint8Array {
    const W = this._charWidth;
    const buf: number[] = [];

    const push = (...bytes: number[]) => buf.push(...bytes);
    const pushCmd = (cmd: number[]) => push(...cmd);
    const pushText = (text: string) => {
      for (let i = 0; i < text.length; i++) {
        const c = text.charCodeAt(i);
        push(c > 127 ? 0x3f : c); // Replace non-ASCII with '?'
      }
    };
    const pushLine = (text: string) => { pushText(text); push(0x0a); };
    const pushDash = () => pushLine("-".repeat(W));
    const pushDoubleDash = () => pushLine("=".repeat(W));

    // Right-pad + left-pad for two-column line
    const twoCol = (left: string, right: string): string => {
      const space = W - left.length - right.length;
      if (space < 1) return (left + " " + right).slice(0, W);
      return left + " ".repeat(space) + right;
    };

    // Center text
    const center = (text: string): string => {
      if (text.length >= W) return text.slice(0, W);
      const pad = Math.floor((W - text.length) / 2);
      return " ".repeat(pad) + text;
    };

    // Format number as Rp
    const rp = (n: number): string => {
      const abs = Math.abs(n);
      const formatted = abs.toLocaleString("id-ID");
      const sign = n < 0 ? "-" : "";
      return sign + "Rp" + formatted;
    };

    // ── Build Receipt ──

    // Initialize
    pushCmd(CMD.INIT);
    pushCmd(CMD.ALIGN_CENTER);

    // Header
    pushCmd(CMD.BOLD_ON);
    pushCmd(CMD.DOUBLE_SIZE);
    pushLine(data.businessName.slice(0, Math.floor(W / 2)));
    pushCmd(CMD.NORMAL_SIZE);
    pushCmd(CMD.BOLD_OFF);

    if (data.address) pushLine(center(data.address.slice(0, W)));
    if (data.phone) pushLine(center(data.phone.slice(0, W)));

    pushDoubleDash();
    pushCmd(CMD.ALIGN_LEFT);

    // Receipt info
    pushLine(twoCol("No Struk:", data.receiptCode.slice(0, W - 10)));

    // Format date
    try {
      const d = new Date(data.date + "T00:00:00");
      const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      const dateStr = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      pushLine(twoCol("Tanggal:", `${dateStr} ${timeStr}`));
    } catch {
      pushLine(twoCol("Tanggal:", data.date));
    }

    if (data.cashierName) pushLine(twoCol("Kasir:", data.cashierName.slice(0, W - 7)));
    if (data.customerName) pushLine(twoCol("Pelanggan:", data.customerName.slice(0, W - 11)));

    pushDash();

    // Items
    for (const item of data.items) {
      pushLine(item.name.slice(0, W));
      const qtyPrice = `  ${item.qty} x ${rp(item.price)}`;
      const lineTotal = rp(item.price * item.qty);
      pushLine(twoCol(qtyPrice, lineTotal));
    }

    pushDash();

    // Subtotal
    pushLine(twoCol("Subtotal", rp(data.subtotal)));
    if (data.discount > 0) {
      pushLine(twoCol("Diskon", "-" + rp(data.discount)));
    }

    pushDoubleDash();

    // Grand Total
    pushCmd(CMD.BOLD_ON);
    pushCmd(CMD.WIDE);
    pushLine(twoCol("TOTAL", rp(data.grandTotal)));
    pushCmd(CMD.NORMAL_SIZE);
    pushCmd(CMD.BOLD_OFF);

    pushDoubleDash();

    // Payments
    for (const p of data.payments) {
      pushLine(twoCol(p.method, rp(p.amount)));
    }
    if (data.changeAmount > 0) {
      pushCmd(CMD.BOLD_ON);
      pushLine(twoCol("Kembalian", rp(data.changeAmount)));
      pushCmd(CMD.BOLD_OFF);
    }

    pushDash();

    // Footer
    pushCmd(CMD.ALIGN_CENTER);
    pushLine(center(data.footerText || "Terima kasih!"));
    pushLine(center("Powered by County"));
    push(0x0a);

    // Feed + cut
    pushCmd(CMD.FEED_5);
    pushCmd(CMD.PARTIAL_CUT);

    return new Uint8Array(buf);
  }
}

// Singleton instance
export const thermalPrinter = new ThermalPrinter();
