import { useEffect, useRef, useState } from "react";

export default function Panduan() {
  const [activeSection, setActiveSection] = useState("intro-detail");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Panduan County — Dokumentasi Lengkap";
    const handleScroll = () => {
      const sections = document.querySelectorAll("[data-section]");
      let current = "";
      sections.forEach((s) => {
        if (window.scrollY >= (s as HTMLElement).offsetTop - 100) {
          current = s.getAttribute("data-section") || "";
        }
      });
      if (current) setActiveSection(current);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.querySelector(`[data-section="${id}"]`);
    if (el) {
      const top = (el as HTMLElement).offsetTop - 80;
      window.scrollTo({ top, behavior: "smooth" });
    }
    setSidebarOpen(false);
  };

  const navItems = [
    { group: "Mulai dari Sini", items: [
      { id: "intro-detail", icon: "🏦", label: "Apa itu County?" },
      { id: "start", icon: "🚀", label: "Getting Started" },
      { id: "mode", icon: "🔄", label: "Dua Mode County" },
    ]},
    { group: "Modul Utama", items: [
      { id: "dashboard", icon: "📊", label: "Dashboard & KPI" },
      { id: "pos", icon: "🛒", label: "POS (Kasir)" },
      { id: "transaksi", icon: "💸", label: "Transaksi & Jurnal" },
      { id: "rekening", icon: "🏦", label: "Manajemen Rekening" },
      { id: "inventori", icon: "📦", label: "Inventori & Gudang" },
      { id: "pelanggan", icon: "👥", label: "Pelanggan & Loyalty" },
      { id: "kredit", icon: "🤝", label: "Hutang & Piutang" },
      { id: "staff", icon: "👔", label: "Staff & Kehadiran" },
      { id: "produksi", icon: "🏭", label: "Produksi (BOM)" },
      { id: "outlet", icon: "🏪", label: "Multi-Outlet" },
      { id: "pajak", icon: "🧾", label: "Pajak" },
    ]},
    { group: "Laporan & Export", items: [
      { id: "laporan", icon: "📋", label: "30+ Laporan" },
      { id: "export", icon: "📥", label: "Export PDF & Excel" },
    ]},
    { group: "Integrasi & Alur", items: [
      { id: "integrasi", icon: "🔗", label: "Alur Integrasi" },
    ]},
    { group: "Pengaturan & Tim", items: [
      { id: "pengaturan", icon: "⚙️", label: "Pengaturan" },
      { id: "tim", icon: "👥", label: "Manajemen Tim" },
    ]},
    { group: "Bantuan", items: [
      { id: "troubleshoot", icon: "🔧", label: "Troubleshooting" },
      { id: "bestpractice", icon: "💡", label: "Best Practice" },
      { id: "faq", icon: "❓", label: "FAQ" },
    ]},
  ];

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#f0f4ff", minHeight: "100vh", color: "#1e293b" }}>
      {/* TOP NAV */}
      <nav style={{ background: "#1a2744", color: "white", padding: "14px 24px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 12px rgba(0,0,0,0.3)" }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#22c55e", letterSpacing: -0.5 }}>County</span>
        </a>
        <span style={{ background: "#22c55e", color: "white", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>Panduan Lengkap v5.0</span>
        <span style={{ fontSize: 13, color: "#94a3b8", marginLeft: "auto", display: window.innerWidth > 768 ? "block" : "none" }}>Update April 2026 — 13 Modul, 30+ Laporan, Integrasi Lengkap</span>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ background: "none", border: "none", color: "white", fontSize: 22, cursor: "pointer", marginLeft: window.innerWidth > 768 ? 0 : "auto" }}
        >☰</button>
      </nav>

      <div style={{ display: "flex", minHeight: "calc(100vh - 56px)" }}>
        {/* SIDEBAR */}
        <aside style={{
          width: 260, background: "#1a2744", color: "white", padding: "20px 0",
          position: "sticky", top: 56, height: "calc(100vh - 56px)", overflowY: "auto", flexShrink: 0,
          display: sidebarOpen || window.innerWidth > 768 ? "block" : "none",
        }}>
          {navItems.map((group) => (
            <div key={group.group}>
              <div style={{ padding: "8px 16px 4px", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>
                {group.group}
              </div>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "9px 20px", width: "100%",
                    color: activeSection === item.id ? "white" : "#94a3b8",
                    background: activeSection === item.id ? "rgba(255,255,255,0.06)" : "transparent",
                    borderLeft: activeSection === item.id ? "3px solid #22c55e" : "3px solid transparent",
                    border: "none", borderRight: "none", borderTop: "none", borderBottom: "none",
                    borderLeftWidth: 3, borderLeftStyle: "solid",
                    borderLeftColor: activeSection === item.id ? "#22c55e" : "transparent",
                    fontSize: 13.5, cursor: "pointer", textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </aside>

        {/* MAIN */}
        <main ref={mainRef} style={{ flex: 1, padding: "32px 40px", maxWidth: 900 }}>

          {/* HERO */}
          <div data-section="hero" style={{
            background: "linear-gradient(135deg, #1a2744 0%, #1e3a8a 100%)",
            borderRadius: 20, padding: 40, color: "white", marginBottom: 40,
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, background: "rgba(34,197,94,0.15)", borderRadius: "50%" }} />
            <div style={{ fontSize: 56, marginBottom: 16 }}>📚</div>
            <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>
              Panduan Lengkap <span style={{ color: "#22c55e" }}>County ERP</span>
            </h1>
            <p style={{ color: "#94a3b8", fontSize: 16, marginBottom: 24 }}>
              Dokumentasi lengkap seluruh modul County — dari POS, Akuntansi, Inventori, sampai 30+ Laporan.
              Ditulis untuk pemilik UMKM yang ingin menguasai County secara mendalam.
            </p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
              {[["13", "Modul"], ["30+", "Laporan"], ["63", "Tabel Data"], ["FIFO", "Valuasi Stok"], ["AI", "Scan Struk"], ["👥", "Multi-Tim"]].map(([num, label]) => (
                <div key={label} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#22c55e" }}>{num}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ═══════════════════════════════════════ */}
          {/* SECTION: APA ITU COUNTY */}
          {/* ═══════════════════════════════════════ */}
          <Section id="intro-detail" icon="🏦" iconBg="#eff6ff" title="Apa itu County?" subtitle="ERP lengkap untuk UMKM Indonesia">
            <p style={{ fontSize: 15, color: "#64748b", marginBottom: 20, lineHeight: 1.7 }}>
              County adalah sistem <strong style={{ color: "#1e293b" }}>ERP (Enterprise Resource Planning) all-in-one</strong> yang dirancang khusus untuk UMKM Indonesia.
              County menggabungkan kasir digital (POS), pembukuan otomatis, manajemen stok FIFO, pengelolaan pelanggan, dan 30+ jenis laporan dalam satu platform terintegrasi.
            </p>
            <p style={{ fontSize: 15, color: "#64748b", marginBottom: 20, lineHeight: 1.7 }}>
              Dengan County, setiap transaksi penjualan <strong style={{ color: "#1e293b" }}>otomatis</strong> tercatat di jurnal akuntansi, mengurangi stok gudang secara FIFO,
              menghitung komisi staff, dan menambah poin loyalitas pelanggan — semua terjadi secara real-time tanpa perlu input manual berulang.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 14 }}>
              {[
                ["🛒", "POS Kasir", "Kasir digital + split payment + struk"],
                ["📊", "Akuntansi Otomatis", "Jurnal, Laba Rugi, Rekening Koran"],
                ["📦", "Inventori FIFO", "Stok, batch, expired, multi-gudang"],
                ["👥", "CRM & Loyalty", "Pelanggan, poin, tier, deposit"],
                ["👔", "Staff & HR", "Absensi, komisi, role management"],
                ["🏭", "Produksi BOM", "Bill of Materials & log produksi"],
                ["🏪", "Multi-Outlet", "Banyak cabang, satu dashboard"],
                ["📋", "30+ Laporan", "Export PDF & Excel"],
              ].map(([icon, title, desc]) => (
                <div key={title} style={{ background: "#f0f4ff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{desc}</div>
                </div>
              ))}
            </div>
            <Callout type="info" icon="🎯" title="Cocok untuk siapa?">
              Toko retail (fashion, elektronik, sembako), restoran & kafe, usaha jasa (salon, laundry), produsen kecil dengan BOM,
              dan bisnis dengan banyak cabang (multi-outlet).
            </Callout>
          </Section>

          {/* ═══════════════════════════════════════ */}
          {/* SECTION: GETTING STARTED */}
          {/* ═══════════════════════════════════════ */}
          <Section id="start" icon="🚀" iconBg="#f0fdf4" title="Getting Started" subtitle="Setup lengkap dalam 6 langkah">
            <h3 style={h3Style}>Langkah 1: Daftar & Login</h3>
            <Steps items={[
              { title: "Buka county.finance di browser", desc: "Chrome, Safari, atau Firefox. HP atau laptop." },
              { title: "Klik \"Masuk\" dan login", desc: "Gunakan email atau Google account. Akun otomatis dibuat saat pertama kali." },
              { title: "Ikuti wizard Onboarding", desc: "Isi nama bisnis, pilih mode (UMKM atau Pribadi), selesai dalam 2 menit." },
            ]} />

            <h3 style={h3Style}>Langkah 2: Setup Rekening Keuangan</h3>
            <p style={pStyle}>Buka menu <strong>Manajemen Rekening</strong> dan tambahkan minimal 3 rekening:</p>
            <SimpleTable headers={["Tipe", "Contoh", "Fungsi di POS"]} rows={[
              ["🏦 Bank", "BCA, BNI, BRI, Mandiri", "Muncul saat pilih \"Transfer\""],
              ["📱 E-Wallet", "GoPay, OVO, Dana, ShopeePay", "Muncul saat pilih \"QRIS\""],
              ["💵 Kas", "Kas Toko, Kas Kasir", "Muncul saat pilih \"Tunai\""],
            ]} />
            <Callout type="warn" icon="⚠️" title="Penting!">
              Pastikan saldo awal diisi sesuai saldo riil saat ini. Ini mempengaruhi akurasi Rekening Koran dan Laba Rugi sejak hari pertama.
            </Callout>

            <h3 style={h3Style}>Langkah 3: Tambah Produk</h3>
            <p style={pStyle}>Buka <strong>Stok Produk</strong> dan tambahkan produk:</p>
            <SimpleTable headers={["Field", "Keterangan", "Wajib?"]} rows={[
              ["Nama Produk", "Contoh: \"Beras Premium 5kg\"", "✅ Ya"],
              ["SKU", "Kode unik (auto-generate jika kosong)", "Opsional"],
              ["HPP", "Harga beli dari supplier", "✅ Ya"],
              ["Harga Jual", "Harga untuk pelanggan", "✅ Ya"],
              ["Stok Awal", "Jumlah barang saat ini", "✅ Ya"],
              ["Stok Minimum", "Batas bawah sebelum alert muncul", "Disarankan"],
              ["Satuan", "pcs, box, kg, liter, dll", "Opsional"],
            ]} />
            <Callout type="tip" icon="📥" title="Punya banyak produk?">
              Klik "Import CSV" untuk upload semua produk sekaligus. Format: Nama, SKU, Kategori, HPP, Harga Jual, Stok, Min Stok, Satuan.
            </Callout>

            <h3 style={h3Style}>Langkah 4: Setup Gudang (Opsional)</h3>
            <p style={pStyle}>County otomatis membuat "Gudang Utama". Jika punya banyak lokasi penyimpanan, tambah gudang baru di menu <strong>Gudang</strong>.</p>

            <h3 style={h3Style}>Langkah 5: Undang Tim (Opsional)</h3>
            <Steps items={[
              { title: "Buka Pengaturan → tab Tim", desc: "Menu ini muncul untuk owner bisnis." },
              { title: "Klik \"Undang Anggota\" → isi email → pilih role", desc: "Role: Manager, Kasir, Gudang, atau Viewer." },
              { title: "Kirim link undangan via WhatsApp/email", desc: "Link otomatis ter-copy. Anggota login → otomatis terhubung." },
            ]} />

            <h3 style={h3Style}>Langkah 6: Mulai Jualan!</h3>
            <p style={pStyle}>Buka POS, pilih produk, checkout. Semua otomatis tercatat.</p>
          </Section>

          {/* ═══════════════════════════════════════ */}
          {/* SECTION: DUA MODE */}
          {/* ═══════════════════════════════════════ */}
          <Section id="mode" icon="🔄" iconBg="#fef9c3" title="Dua Mode County" subtitle="Pilih sesuai kebutuhan — bisa ganti kapan saja">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <ModeCard color="blue" title="👤 Mode Pribadi" desc="Untuk keuangan personal" items={["Jurnal Keuangan", "Transaksi & Kategori", "Hutang & Piutang", "Anggaran Bulanan", "Laporan Keuangan"]} />
              <ModeCard color="green" title="🏪 Mode UMKM" desc="Untuk bisnis — fitur lengkap" items={["Semua fitur Pribadi", "POS Kasir + Stok + Gudang", "Loyalty & Komisi Staff", "Multi-Outlet + Tim", "30+ Laporan + Pajak"]} />
            </div>
            <Callout type="tip" icon="💡" title="Cara ganti mode:">
              Buka <strong>Pengaturan</strong> → <strong>Mode Aplikasi</strong> → pilih mode → Simpan. Sidebar langsung berubah.
            </Callout>
          </Section>

          {/* ═══════════════════════════════════════ */}
          {/* DASHBOARD & KPI */}
          {/* ═══════════════════════════════════════ */}
          <Section id="dashboard" icon="📊" iconBg="#ede9fe" title="Dashboard & KPI" subtitle="Pusat kontrol bisnis Anda">
            <p style={pStyle}>Dashboard adalah halaman pertama setelah login. Semua kondisi bisnis terlihat sekilas dari sini.</p>
            <SimpleTable headers={["Elemen", "Keterangan"]} rows={[
              ["💰 Kartu KPI", "Total Pendapatan, Pengeluaran, dan Laba/Rugi bulan ini + perubahan (%) vs bulan lalu"],
              ["📈 Grafik Tren", "Bar chart pendapatan vs pengeluaran, pie chart distribusi kategori"],
              ["🤖 AI Ringkasan", "Analisis otomatis kondisi keuangan — ditulis oleh AI"],
              ["💊 Health Score", "Skor kesehatan bisnis (A-F) berdasarkan berbagai metrik"],
              ["⚡ Quick Actions", "Tombol cepat ke POS, Tambah Transaksi, Scan Struk, Laporan"],
              ["⚠️ Stok Kritis", "Daftar produk yang stoknya mendekati minimum (UMKM)"],
            ]} />
            <Callout type="tip" icon="🌅" title="Rutinitas Pagi:">
              Biasakan buka Dashboard setiap pagi — cek KPI, notifikasi jatuh tempo, dan stok kritis sebelum mulai kerja.
            </Callout>

            <h3 style={h3Style}>Cara Membaca KPI</h3>
            <Checklist items={[
              { icon: "🟢", text: <><strong>Panah hijau (↑):</strong> Naik dibanding bulan lalu — ini positif untuk pendapatan, negatif untuk pengeluaran.</> },
              { icon: "🔴", text: <><strong>Panah merah (↓):</strong> Turun dibanding bulan lalu — perlu investigasi jika terjadi pada pendapatan.</> },
              { icon: "💊", text: <><strong>Health Score A-B:</strong> Bisnis sehat. <strong>C:</strong> Perlu perhatian. <strong>D-F:</strong> Ada masalah serius yang perlu diperbaiki.</> },
            ]} />
          </Section>

          {/* ═══════════════════════════════════════ */}
          {/* POS */}
          {/* ═══════════════════════════════════════ */}
          <Section id="pos" icon="🛒" iconBg="#fdf4ff" title="POS (Point of Sale)" subtitle="Kasir digital terintegrasi — semua otomatis">

            <h3 style={h3Style}>Apa yang Terjadi Saat Checkout?</h3>
            <p style={pStyle}>Setiap transaksi POS otomatis melakukan 5 hal sekaligus:</p>
            <Checklist items={[
              { icon: "1️⃣", text: <><strong>Jurnal Akuntansi:</strong> Debit rekening pembayaran, Kredit Pendapatan — otomatis tercatat.</> },
              { icon: "2️⃣", text: <><strong>Stok Berkurang:</strong> Stok produk dikurangi secara FIFO dari gudang yang dipilih.</> },
              { icon: "3️⃣", text: <><strong>Loyalitas:</strong> Poin pelanggan bertambah (jika loyalty aktif dan pelanggan dipilih).</> },
              { icon: "4️⃣", text: <><strong>Komisi:</strong> Komisi kasir dihitung otomatis (jika fitur komisi aktif).</> },
              { icon: "5️⃣", text: <><strong>Struk:</strong> Kode struk unik (RCP-xxx) tercatat dengan detail lengkap.</> },
            ]} />

            <h3 style={h3Style}>Cara Menggunakan POS</h3>
            <Steps items={[
              { title: "Buka menu Kasir (POS) di sidebar", desc: "Aktifkan dulu di Pengaturan → Fitur → toggle POS jika belum muncul." },
              { title: "Pilih gudang sumber (opsional)", desc: "Default: Gudang Utama. Stok berkurang dari gudang yang dipilih." },
              { title: "Cari produk → klik untuk tambah ke keranjang", desc: "Cari berdasarkan nama, SKU, atau scan barcode. Klik + / − untuk ubah qty." },
              { title: "Pilih pelanggan (opsional tapi disarankan)", desc: "Cari pelanggan existing atau buat baru langsung. Ini penting untuk tracking loyalitas dan laporan per pelanggan." },
              { title: "Pilih metode pembayaran", desc: "3 kategori: Tunai (bayar cash, hitung kembalian), Transfer (pilih rekening bank), QRIS (pilih e-wallet)." },
              { title: "Klik Bayar / Checkout", desc: "Struk muncul otomatis. Semua tercatat, stok berkurang, jurnal terisi." },
            ]} />

            <h3 style={h3Style}>3 Kategori Pembayaran</h3>
            <SimpleTable headers={["Kategori", "Cara Kerja", "Rekening yang Tampil"]} rows={[
              ["💵 Tunai", "Masukkan uang diterima → kembalian otomatis", "Akun bertipe \"Kas\""],
              ["🏦 Transfer", "Pilih rekening bank tujuan transfer", "Akun bertipe \"Bank\" (BCA, BNI, dll)"],
              ["📱 QRIS", "Pilih e-wallet tujuan", "Akun bertipe \"E-Wallet\" (GoPay, OVO, dll)"],
            ]} />

            <h3 style={h3Style}>Split Payment (Bayar Gabungan)</h3>
            <Steps items={[
              { title: "Aktifkan toggle \"Split Payment\"", desc: "Di panel checkout, aktifkan mode split payment." },
              { title: "Tambah baris pembayaran", desc: "Klik + untuk tambah metode. Pilih metode dan nominal per baris." },
              { title: "Total harus pas", desc: "Jumlah semua metode harus ≥ total belanja." },
            ]} />
            <Callout type="info" icon="💡" title="Contoh Split Payment:">
              Total Rp150.000 → Tunai Rp100.000 + Transfer BCA Rp50.000. Masing-masing tercatat di rekening yang sesuai.
            </Callout>

            <h3 style={h3Style}>Kode Diskon</h3>
            <p style={pStyle}>Masukkan kode diskon di checkout → klik cek → diskon teraplikasi otomatis. Diskon bisa berupa persentase atau nominal tetap, dengan syarat minimum pembelian dan batas penggunaan.</p>

            <h3 style={h3Style}>Refund (Pembatalan)</h3>
            <p style={pStyle}>Saat transaksi di-refund:</p>
            <Checklist items={[
              { icon: "↩️", text: <><strong>Stok dikembalikan</strong> ke gudang (restore ke batch FIFO).</> },
              { icon: "📝", text: <><strong>Jurnal di-reverse:</strong> Debit Pendapatan, Kredit Kas — saldo kembali.</> },
              { icon: "📊", text: <><strong>Tercatat di Void/Refund Analysis</strong> untuk tracking alasan pembatalan.</> },
            ]} />

            <h3 style={h3Style}>Shift Kasir</h3>
            <p style={pStyle}>Buka shift di awal kerja (input kas awal) dan tutup shift di akhir (sistem rekap total penjualan, selisih kas). Laporan Shift tersedia untuk rekonsiliasi.</p>

            <h3 style={h3Style}>Contoh Skenario</h3>
            <Callout type="info" icon="🛍️" title="Toko Maju Jaya — Penjualan POS">
              <strong>Keranjang:</strong> Beras 5kg × 2 (Rp140.000) + Minyak 1L × 3 (Rp54.000) = Rp194.000<br />
              <strong>Diskon:</strong> Kode HEMAT10 (10%) = −Rp19.400<br />
              <strong>Grand Total:</strong> Rp174.600<br />
              <strong>Bayar:</strong> Tunai Rp200.000 → Kembalian Rp25.400<br /><br />
              <strong>Otomatis:</strong> Stok beras −2 (FIFO), stok minyak −3, jurnal tercatat, poin loyalitas Ibu Sari bertambah, komisi kasir terhitung.
            </Callout>

            <h3 style={h3Style}>Kesalahan Umum</h3>
            <SimpleTable headers={["Kesalahan", "Dampak", "Solusi"]} rows={[
              ["Tidak buka shift", "Laporan Shift tidak akurat, rekonsiliasi kas gagal", "Selalu buka shift di awal hari kerja"],
              ["Lupa pilih pelanggan", "Loyalitas tidak terakumulasi, laporan per pelanggan kosong", "Biasakan selalu pilih/buat pelanggan"],
              ["Jual saat stok 0", "Stok jadi negatif, FIFO tidak berjalan", "Cek stok sebelum jual, aktifkan alert stok"],
            ]} />
          </Section>

          {/* ═══════════════════════════════════════ */}
          {/* TRANSAKSI & JURNAL */}
          {/* ═══════════════════════════════════════ */}
          <Section id="transaksi" icon="💸" iconBg="#fef9c3" title="Transaksi & Jurnal" subtitle="Catat pemasukan & pengeluaran manual">
            <p style={pStyle}>
              Modul Transaksi digunakan untuk pencatatan manual diluar POS — bayar listrik, terima transfer dari klien, bayar supplier, dan lain-lain.
              Setiap transaksi otomatis masuk ke jurnal akuntansi dan mempengaruhi Laba Rugi.
            </p>

            <h3 style={h3Style}>Cara Mencatat Transaksi</h3>
            <Steps items={[
              { title: "Buka menu Transaksi", desc: "Klik tab Pemasukan (uang masuk) atau Pengeluaran (uang keluar)." },
              { title: "Klik \"+ Transaksi Baru\"", desc: "Form input muncul." },
              { title: "Isi detail transaksi", desc: "Tanggal, deskripsi, nominal, kategori (Gaji, Sewa, Utilitas, dll), metode pembayaran, rekening." },
              { title: "(Opsional) Upload bukti", desc: "Lampirkan foto struk atau bukti transfer." },
              { title: "(Opsional) Simpan sebagai Stok", desc: "Jika pengeluaran pembelian barang, aktifkan ini agar stok produk otomatis bertambah." },
              { title: "Klik Simpan", desc: "Transaksi tercatat, saldo rekening terupdate, masuk ke Laba Rugi." },
            ]} />

            <h3 style={h3Style}>Scan Struk dengan AI</h3>
            <Steps items={[
              { title: "Klik tombol \"Scan Struk\"", desc: "Di halaman Transaksi atau Dashboard." },
              { title: "Upload foto struk (JPG/PNG) atau PDF", desc: "Pastikan foto jelas dan seluruh struk terlihat." },
              { title: "AI proses otomatis (5-15 detik)", desc: "Status: preparing → converting → reading. AI menampilkan confidence score." },
              { title: "Review data yang diekstrak", desc: "Nama toko, tanggal, daftar item + harga, total, metode bayar. Edit jika perlu." },
              { title: "Pilih cara simpan", desc: "\"Masukkan ke Stok\" (transaksi + tambah stok) atau \"Catat Pengeluaran Saja\" (transaksi saja)." },
            ]} />

            <h3 style={h3Style}>Kategori Transaksi</h3>
            <SimpleTable headers={["Pemasukan", "Pengeluaran"]} rows={[
              ["Penjualan", "Gaji Karyawan"],
              ["Jasa / Service", "Sewa / Kontrak"],
              ["Pendapatan Lain", "Utilitas (Listrik, Air, Internet)"],
              ["Transfer Masuk", "Bahan Baku / Stok"],
              ["Investasi", "Transportasi / Operasional"],
            ]} />

            <Callout type="warn" icon="⚠️" title="Kesalahan yang Sering Terjadi:">
              <strong>Salah kategori</strong> → Gaji dimasukkan ke "Bahan Baku" → Laba Rugi tidak akurat. Selalu cek kategori sebelum simpan.<br />
              <strong>Tidak pilih rekening</strong> → Rekening Koran tidak balance. Selalu pilih dari mana uang masuk/keluar.
            </Callout>
          </Section>

          {/* ═══════════════════════════════════════ */}
          {/* MANAJEMEN REKENING */}
          {/* ═══════════════════════════════════════ */}
          <Section id="rekening" icon="🏦" iconBg="#f0fdf4" title="Manajemen Rekening" subtitle="Kelola semua rekening bank, e-wallet, dan kas">
            <p style={pStyle}>
              Setiap transaksi di County mengalir ke salah satu rekening yang Anda setup di sini.
              Tipe rekening menentukan kategori pembayaran di POS: Bank → Transfer, E-Wallet → QRIS, Kas → Tunai.
            </p>

            <h3 style={h3Style}>Cara Tambah Rekening</h3>
            <Steps items={[
              { title: "Buka menu Manajemen Rekening", desc: "Di sidebar, klik Manajemen Rekening." },
              { title: "Klik \"Tambah Rekening\"", desc: "Dialog form muncul." },
              { title: "Pilih tipe: Bank, E-Wallet, atau Kas", desc: "Ini menentukan di mana rekening muncul di POS." },
              { title: "Isi detail", desc: "Nama (contoh: BCA Bisnis), emoji ikon, warna, saldo awal, deskripsi." },
              { title: "Klik Simpan", desc: "Rekening langsung tersedia di POS dan form transaksi." },
            ]} />

            <h3 style={h3Style}>Fitur Lain</h3>
            <Checklist items={[
              { icon: "⭐", text: <><strong>Set Default:</strong> Tandai satu rekening sebagai default untuk seleksi cepat.</> },
              { icon: "🔄", text: <><strong>Aktif/Nonaktif:</strong> Rekening nonaktif tidak muncul di POS dan form transaksi. Histori tetap ada.</> },
              { icon: "📊", text: <><strong>Rekening Koran:</strong> Lihat statement debit/kredit per rekening di menu Rekening Koran.</> },
            ]} />

            <Callout type="tip" icon="💡" title="Best Practice:">
              Jika ada beberapa kasir, buat Kas terpisah per kasir (Kas Kasir A, Kas Kasir B) agar rekonsiliasi kas per shift lebih akurat.
            </Callout>
          </Section>

          {/* ═══════════════════════════════════════ */}
          {/* INVENTORI & GUDANG */}
          {/* ═══════════════════════════════════════ */}
          <Section id="inventori" icon="📦" iconBg="#fff7ed" title="Inventori & Gudang" subtitle="Stok FIFO, multi-gudang, expiry, dan alerts">
            <p style={pStyle}>County mengelola seluruh siklus hidup produk — dari pembelian sampai terjual — dengan metode FIFO (First In, First Out).</p>

            <h3 style={h3Style}>Sub-Modul Inventori</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              {[
                { icon: "📦", title: "Stok Produk", desc: "CRUD produk, gambar, HPP, harga jual, barcode, import CSV", color: "#f0fdf4", border: "#bbf7d0" },
                { icon: "🏭", title: "Gudang", desc: "Multi-gudang, transfer stok, nilai stok per gudang", color: "#fef3c7", border: "#fde68a" },
                { icon: "📊", title: "Valuasi FIFO", desc: "Nilai stok per batch: tanggal beli, qty, harga, remaining", color: "#dbeafe", border: "#93c5fd" },
                { icon: "⏰", title: "Stok Kedaluwarsa", desc: "Produk mendekati expired: kritis, peringatan, aman", color: "#fef2f2", border: "#fecaca" },
                { icon: "📅", title: "Usia Stok", desc: "Umur stok: 0-30, 31-60, 61-90, >90 hari", color: "#ede9fe", border: "#c4b5fd" },
                { icon: "🔔", title: "Peringatan Stok", desc: "Alert stok rendah, saran qty pesanan, link ke PO", color: "#fff7ed", border: "#fed7aa" },
                { icon: "📜", title: "Riwayat Stok", desc: "Log semua pergerakan: masuk, keluar, adjustment", color: "#f0f4ff", border: "#bfdbfe" },
                { icon: "🔄", title: "Mutasi Persediaan", desc: "Laporan pergerakan stok per produk, export PDF/Excel", color: "#fef9c3", border: "#fde047" },
              ].map(item => (
                <div key={item.title} style={{ borderRadius: 14, padding: 16, background: item.color, border: `1px solid ${item.border}` }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{item.desc}</div>
                </div>
              ))}
            </div>

            <h3 style={h3Style}>Transfer Stok Antar Gudang</h3>
            <Steps items={[
              { title: "Buka halaman Gudang → klik \"Transfer Stok\"", desc: "Minimal harus punya 2 gudang." },
              { title: "Pilih gudang asal dan tujuan", desc: "Contoh: Gudang Pusat → Gudang Cabang Mall." },
              { title: "Pilih produk dan jumlah", desc: "Sistem menampilkan stok tersedia di gudang asal." },
              { title: "Klik Transfer", desc: "Stok berpindah, tercatat di riwayat transfer." },
            ]} />

            <h3 style={h3Style}>Lihat Total Nilai Stok per Gudang</h3>
            <Steps items={[
              { title: "Buka halaman Gudang → tab Stok", desc: "Pilih gudang yang ingin dilihat." },
              { title: "Lihat tabel stok", desc: "Kolom: Produk, SKU, Stok, HPP, Harga Jual, Nilai Stok (HPP × qty)." },
              { title: "Cek footer tabel", desc: "Di baris bawah ada Total unit dan Total Nilai Stok untuk gudang tersebut." },
            ]} />

            <h3 style={h3Style}>Kesalahan Umum</h3>
            <SimpleTable headers={["Kesalahan", "Dampak", "Solusi"]} rows={[
              ["HPP tidak diisi (0)", "Laba Kotor dan valuasi FIFO salah", "Selalu isi HPP minimal dengan harga beli rata-rata"],
              ["Stok minimum tidak diset", "Tidak ada peringatan saat stok habis", "Set stok minimum untuk semua produk"],
              ["Edit stok manual tanpa adjustment", "Audit trail hilang", "Gunakan menu yang benar agar ada log"],
            ]} />
          </Section>

          {/* ═══════════════════════════════════════ */}
          {/* PELANGGAN & LOYALTY */}
          {/* ═══════════════════════════════════════ */}
          <Section id="pelanggan" icon="👥" iconBg="#eff6ff" title="Pelanggan & Loyalty" subtitle="Database pelanggan, poin, tier, deposit">

            <h3 style={h3Style}>Manajemen Pelanggan</h3>
            <p style={pStyle}>Simpan data pelanggan: nama (wajib), email, telepon, perusahaan, alamat, catatan. Lihat riwayat transaksi per pelanggan.</p>
            <Steps items={[
              { title: "Buka menu Pelanggan", desc: "Di sidebar atau langsung dari POS." },
              { title: "Klik \"Tambah Pelanggan\"", desc: "Isi minimal nama dan telepon." },
              { title: "Lihat riwayat transaksi", desc: "Klik pelanggan untuk lihat semua struk, tanggal, nominal yang pernah terjadi." },
            ]} />

            <h3 style={h3Style}>Program Loyalitas (Poin)</h3>
            <Steps items={[
              { title: "Buka menu Loyalitas → aktifkan program", desc: "Toggle ON di konfigurasi loyalitas." },
              { title: "Set konversi poin", desc: "Contoh: 1 poin per Rp10.000 belanja. Nilai tukar: 1 poin = Rp100." },
              { title: "Set threshold tier", desc: "Bronze (default), Silver (500 poin), Gold (2.000), Platinum (5.000)." },
              { title: "Otomatis jalan dari POS", desc: "Setiap belanja dengan pelanggan terpilih, poin bertambah. Tier naik otomatis." },
            ]} />

            <h3 style={h3Style}>Tier System</h3>
            <SimpleTable headers={["Tier", "Ikon", "Syarat"]} rows={[
              ["Bronze", "—", "Semua member baru"],
              ["Silver", "🥈", "Mencapai threshold Silver"],
              ["Gold", "🥇", "Mencapai threshold Gold"],
              ["Platinum", "💎", "Mencapai threshold Platinum"],
            ]} />

            <h3 style={h3Style}>Deposit Pelanggan</h3>
            <p style={pStyle}>Sistem saldo deposit untuk pelanggan tetap — top up, potong saat belanja, refund jika perlu. Cocok untuk kafe atau laundry dengan member card.</p>

            <Callout type="tip" icon="💡" title="Tips:">
              Program loyalitas sangat efektif untuk bisnis retail dengan pelanggan berulang. Set tier realistis agar pelanggan termotivasi.
            </Callout>
          </Section>

          {/* ═══════════════════════════════════════ */}
          {/* HUTANG & PIUTANG */}
          {/* ═══════════════════════════════════════ */}
          <Section id="kredit" icon="🤝" iconBg="#fef9c3" title="Hutang & Piutang (Kredit)" subtitle="Tracking semua uang yang belum dibayar">

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <ModeCard color="green" title="💰 Piutang" desc="Orang lain hutang ke Anda" items={["Pelanggan beli kredit", "Klien belum bayar invoice", "Tracking cicilan"]} />
              <ModeCard color="blue" title="💸 Hutang" desc="Anda hutang ke orang lain" items={["Hutang ke supplier", "Pinjaman", "Bayar bertahap"]} />
            </div>

            <h3 style={h3Style}>Penjualan Kredit (dari POS)</h3>
            <Steps items={[
              { title: "Jual produk via POS seperti biasa", desc: "Checkout normal." },
              { title: "Catat sebagai penjualan kredit", desc: "Piutang otomatis tercatat dengan pelanggan, total, dan jatuh tempo." },
              { title: "Pelanggan bayar cicilan", desc: "Buka Penjualan Kredit → detail kredit → Catat Pembayaran → isi nominal, metode, tanggal." },
              { title: "Status otomatis berubah", desc: "Belum Lunas → Cicilan → Lunas. Progress bar menunjukkan persentase." },
            ]} />

            <h3 style={h3Style}>Hutang Piutang Manual</h3>
            <p style={pStyle}>Untuk hutang/piutang diluar POS: buka menu Hutang & Piutang → pilih tab → klik Tambah → isi nama, deskripsi, jumlah, jatuh tempo.</p>

            <h3 style={h3Style}>Status Pembayaran</h3>
            <SimpleTable headers={["Status", "Artinya", "Warna"]} rows={[
              ["Belum Lunas", "Belum ada pembayaran sama sekali", "🟡 Kuning"],
              ["Cicilan", "Sudah dibayar sebagian", "🔵 Biru"],
              ["Lunas", "Terbayar penuh", "🟢 Hijau"],
              ["Terlambat", "Melewati jatuh tempo dan belum lunas", "🔴 Merah"],
            ]} />

            <Callout type="tip" icon="💡" title="Tips:">
              Selalu set tanggal jatuh tempo agar sistem menandai yang terlambat otomatis. Review mingguan untuk cash flow management.
            </Callout>
          </Section>

          {/* ═══════════════════════════════════════ */}
          {/* STAFF & KEHADIRAN */}
          {/* ═══════════════════════════════════════ */}
          <Section id="staff" icon="👔" iconBg="#fef3c7" title="Staff & Kehadiran" subtitle="Absensi, komisi, dan manajemen pegawai">

            <h3 style={h3Style}>Kehadiran (Absensi)</h3>
            <Steps items={[
              { title: "Buka menu Kehadiran", desc: "Staff masing-masing mengakses halaman ini." },
              { title: "Klik \"Clock In\" (hijau) saat mulai kerja", desc: "Status berubah ke \"Sedang Bekerja\"." },
              { title: "Klik \"Clock Out\" (merah) saat selesai", desc: "Total jam kerja otomatis terhitung." },
            ]} />
            <p style={pStyle}>View modes: Daily (per tanggal) dan Monthly (per bulan). Statistik: total hadir, terlambat, tidak hadir.</p>

            <h3 style={h3Style}>Komisi Staff</h3>
            <Steps items={[
              { title: "Buka menu Komisi → aktifkan sistem komisi", desc: "Toggle ON di konfigurasi." },
              { title: "Pilih tipe: Persentase atau Flat", desc: "Contoh: 2% per transaksi, atau Rp5.000 per struk." },
              { title: "Komisi otomatis terhitung dari POS", desc: "Setiap transaksi POS → komisi kasir tercatat: tanggal, kode struk, nominal jual, komisi." },
              { title: "Bayar komisi", desc: "Centang komisi → klik \"Tandai Lunas\" (individual atau bulk)." },
            ]} />

            <SimpleTable headers={["Tipe Komisi", "Contoh", "Cocok Untuk"]} rows={[
              ["Persentase", "2% × Rp500.000 = Rp10.000", "Retail dengan margin bervariasi"],
              ["Flat / Tetap", "Rp5.000 per transaksi", "Jasa dengan harga seragam"],
            ]} />

            <Callout type="tip" icon="💡" title="Tips:">
              Komisi persentase cocok untuk retail, flat rate cocok untuk jasa. Review dan bayar komisi setiap minggu untuk menjaga motivasi tim.
            </Callout>
          </Section>

          {/* ═══════════════════════════════════════ */}
          {/* PRODUKSI BOM */}
          {/* ═══════════════════════════════════════ */}
          <Section id="produksi" icon="🏭" iconBg="#ede9fe" title="Produksi (BOM)" subtitle="Bill of Materials dan log produksi">
            <p style={pStyle}>
              BOM (Bill of Materials) untuk bisnis yang memproduksi sendiri — bakery, furniture, konveksi, dll.
            </p>

            <h3 style={h3Style}>Setup Komposisi Produk</h3>
            <Steps items={[
              { title: "Buka halaman Produksi", desc: "Pilih produk jadi." },
              { title: "Tambahkan bahan baku", desc: "Nama material, jumlah per unit, harga per satuan." },
              { title: "HPP otomatis terhitung", desc: "Contoh: Roti Tawar = Tepung (Rp5.000) + Ragi (Rp2.000) + Mentega (Rp3.000) = HPP Rp10.000." },
            ]} />

            <h3 style={h3Style}>Catat Produksi</h3>
            <Steps items={[
              { title: "Pilih produk yang diproduksi", desc: "Dari daftar produk yang sudah punya komposisi BOM." },
              { title: "Masukkan jumlah yang diproduksi", desc: "Sistem hitung total biaya (qty × HPP per unit)." },
              { title: "Simpan", desc: "Stok produk jadi bertambah, biaya tercatat di jurnal, log produksi tersimpan." },
            ]} />
          </Section>

          {/* ═══════════════════════════════════════ */}
          {/* MULTI-OUTLET */}
          {/* ═══════════════════════════════════════ */}
          <Section id="outlet" icon="🏪" iconBg="#f0fdf4" title="Multi-Outlet" subtitle="Kelola banyak cabang dari satu dashboard">
            <p style={pStyle}>Setiap outlet memiliki data penjualan terpisah tapi laporan bisa dilihat gabungan atau per outlet.</p>

            <h3 style={h3Style}>Setup Outlet</h3>
            <Steps items={[
              { title: "Buka menu Outlet Management", desc: "Di sidebar." },
              { title: "Klik \"Tambah Outlet\"", desc: "Isi: nama, kode, alamat, telepon." },
              { title: "Hubungkan dengan gudang", desc: "Setiap outlet bisa punya gudang sendiri." },
              { title: "Tandai satu outlet sebagai default", desc: "Outlet default digunakan jika tidak ada pilihan spesifik." },
            ]} />

            <Callout type="info" icon="📊" title="Laporan Per Outlet:">
              Buka <strong>Penjualan per Outlet</strong> untuk bandingkan performa antar cabang — total penjualan, jumlah transaksi, dan rata-rata per transaksi.
            </Callout>
          </Section>

          {/* ═══════════════════════════════════════ */}
          {/* PAJAK */}
          {/* ═══════════════════════════════════════ */}
          <Section id="pajak" icon="🧾" iconBg="#fff7ed" title="Pajak" subtitle="Perhitungan dan pelaporan pajak UMKM">
            <p style={pStyle}>County menghitung estimasi pajak berdasarkan data transaksi real dan aturan pajak yang dikonfigurasi.</p>

            <SimpleTable headers={["Tab", "Fungsi"]} rows={[
              ["📊 Ringkasan", "Estimasi pajak otomatis dari omzet + progress bar batas Rp500jt"],
              ["🧮 Kalkulator", "Hitung PPh UMKM 0.5%, PPN 11%, PPh 21 (progresif), PPh 23"],
              ["📋 Tax Planning", "Bandingkan: Final 0.5% vs NPPN vs Pembukuan — pilih paling hemat"],
              ["📅 Deadline", "Kalender jatuh tempo pajak + denda keterlambatan"],
              ["📜 Aturan", "Daftar aturan pajak yang berlaku untuk bisnis"],
              ["💳 Riwayat", "Catat bukti pembayaran pajak untuk arsip"],
            ]} />

            <Callout type="tip" icon="💡" title="Tips Pajak UMKM:">
              UMKM dengan omzet di bawah Rp4.8M/tahun biasanya kena PPh Final 0.5%. Bayar tepat waktu agar tidak kena denda. Simpan bukti bayar sebagai lampiran transaksi.
            </Callout>
          </Section>

          {/* ═══════════════════════════════════════ */}
          {/* LAPORAN */}
          {/* ═══════════════════════════════════════ */}
          <Section id="laporan" icon="📋" iconBg="#eff6ff" title="30+ Laporan & Analitik" subtitle="Semua data bisnis dalam laporan terstruktur">

            <h3 style={h3Style}>A. Laporan Keuangan</h3>
            <SimpleTable headers={["Laporan", "Isi"]} rows={[
              ["📊 Laba Rugi Detail", "Pendapatan, HPP, Laba Kotor, Beban Operasional, Laba Bersih. Format Olsera. Perbandingan bulan lalu."],
              ["🏦 Rekening Koran", "Statement per rekening: debit, kredit, saldo berjalan per tanggal."],
              ["💵 Transaksi Tunai", "Rekonsiliasi kas: Kas Masuk vs Kas Keluar vs Saldo."],
            ]} />

            <h3 style={h3Style}>B. Laporan Penjualan (15 jenis)</h3>
            <SimpleTable headers={["Laporan", "Fungsi"]} rows={[
              ["Laporan Penjualan", "Harian/periode, chart, daftar struk, total & diskon"],
              ["Per Produk", "SKU, qty terjual, HPP, revenue, profit per produk"],
              ["Top Produk & Kategori", "Ranking produk dan kategori terlaris"],
              ["Per Pelanggan", "Total belanja per pelanggan"],
              ["Per Jam", "Identifikasi jam sibuk"],
              ["Per Tanggal", "Tren harian dalam rentang waktu"],
              ["Per Staff", "Performa penjualan per kasir"],
              ["Per Outlet", "Bandingkan performa antar cabang"],
              ["Per Perangkat", "Device mana yang generate revenue"],
              ["Ringkasan Pembayaran", "Distribusi metode: tunai, transfer, QRIS"],
              ["Ringkasan Diskon", "Efektivitas kode diskon"],
              ["Penjualan Kredit", "Outstanding kredit + status cicilan"],
              ["Void/Refund", "Analisis pembatalan: alasan, tren, nominal"],
              ["Laporan Shift", "Rekap per shift: waktu, kas, selisih"],
              ["Komisi Staff", "Detail komisi per pegawai + status bayar"],
            ]} />

            <h3 style={h3Style}>C. Laporan Inventori (6 jenis)</h3>
            <SimpleTable headers={["Laporan", "Fungsi"]} rows={[
              ["Mutasi Persediaan", "Pergerakan stok masuk/keluar per produk"],
              ["Valuasi FIFO", "Nilai stok per batch dan harga beli"],
              ["Stok Kedaluwarsa", "Produk mendekati/sudah expired"],
              ["Usia Stok", "Umur rata-rata stok di gudang"],
              ["Peringatan Stok", "Produk di bawah minimum"],
              ["Riwayat Stok", "Log semua pergerakan stok"],
            ]} />

            <h3 style={h3Style}>Cara Menggunakan</h3>
            <Steps items={[
              { title: "Buka Laporan Index (pusat semua laporan)", desc: "Cari laporan via search atau browse per kategori." },
              { title: "Klik laporan → set filter", desc: "Rentang tanggal, produk, staff, outlet, dll." },
              { title: "Lihat data + chart → export jika perlu", desc: "PDF untuk print/kirim, Excel untuk analisis lanjutan." },
            ]} />

            <h3 style={h3Style}>Tips Membaca Laporan</h3>
            <Checklist items={[
              { icon: "📊", text: <><strong>Laba Rugi:</strong> Fokus pada margin (Laba Kotor / Pendapatan). Bandingkan bulan ke bulan.</> },
              { icon: "⏰", text: <><strong>Per Jam:</strong> Identifikasi jam sibuk untuk optimasi jadwal staff.</> },
              { icon: "🏆", text: <><strong>Top Produk:</strong> Fokuskan promosi pada produk high-margin, bukan hanya yang laku.</> },
              { icon: "↩️", text: <><strong>Void/Refund:</strong> Jika tinggi, investigasi penyebab (salah input, barang rusak, dll).</> },
              { icon: "📅", text: <><strong>Usia Stok:</strong> Barang &gt; 90 hari tanpa terjual → promo atau clearance.</> },
            ]} />
          </Section>

          {/* ═══════════════════════════════════════ */}
          {/* EXPORT */}
          {/* ═══════════════════════════════════════ */}
          <Section id="export" icon="📥" iconBg="#f0fdf4" title="Export PDF & Excel" subtitle="Download laporan untuk arsip atau analisis">
            <p style={pStyle}>Hampir semua 30+ laporan mendukung export ke PDF dan Excel.</p>
            <SimpleTable headers={["Format", "Kegunaan", "Bisa Dibuka Di"]} rows={[
              ["📄 PDF", "Print, kirim ke stakeholder, arsip", "Browser, Adobe Reader"],
              ["📊 Excel (.xlsx)", "Analisis lanjutan, pivot table, grafik", "Excel, Google Sheets, LibreOffice"],
            ]} />
            <Steps items={[
              { title: "Buka laporan yang diinginkan", desc: "Set filter/tanggal sesuai kebutuhan." },
              { title: "Klik tombol PDF atau Excel", desc: "Biasanya di pojok kanan atas laporan." },
              { title: "File otomatis terdownload", desc: "Siap digunakan atau dikirim." },
            ]} />
          </Section>

          {/* ═══════════════════════════════════════ */}
          {/* ALUR INTEGRASI */}
          {/* ═══════════════════════════════════════ */}
          <Section id="integrasi" icon="🔗" iconBg="#ede9fe" title="Alur Integrasi Antar Modul" subtitle="Bagaimana data mengalir di County">
            <p style={pStyle}>Kekuatan utama County adalah integrasi otomatis. Anda input data sekali, sistem menyebarkan ke modul lain.</p>

            <h3 style={h3Style}>1. POS → Jurnal → Laba Rugi</h3>
            <Checklist items={[
              { icon: "🛒", text: <><strong>POS checkout</strong> → Debit rekening pembayaran (Kas/Bank/E-Wallet)</> },
              { icon: "📝", text: <><strong>Jurnal otomatis:</strong> Kredit Pendapatan sesuai subtotal, Debit Diskon jika ada</> },
              { icon: "📊", text: <><strong>Laba Rugi:</strong> Entry jurnal langsung masuk perhitungan P&L</> },
            ]} />

            <h3 style={h3Style}>2. POS → Inventori (FIFO)</h3>
            <Checklist items={[
              { icon: "📦", text: <><strong>Stok berkurang</strong> dari gudang yang dipilih, batch tertua dikurangi dulu (FIFO)</> },
              { icon: "📜", text: <><strong>Stock log</strong> tercatat: tipe OUT, referensi receipt code</> },
            ]} />

            <h3 style={h3Style}>3. POS → Loyalty & Komisi</h3>
            <Checklist items={[
              { icon: "⭐", text: <><strong>Poin loyalitas</strong> pelanggan bertambah otomatis (jika aktif)</> },
              { icon: "💰", text: <><strong>Komisi kasir</strong> terhitung dan tercatat (jika aktif)</> },
            ]} />

            <h3 style={h3Style}>4. Refund → Stok + Jurnal</h3>
            <Checklist items={[
              { icon: "↩️", text: <><strong>Stok dikembalikan</strong> ke batch FIFO</> },
              { icon: "📝", text: <><strong>Jurnal di-reverse:</strong> Debit Pendapatan, Kredit Kas</> },
            ]} />

            <h3 style={h3Style}>5. Kredit → Pembayaran → Akuntansi</h3>
            <Checklist items={[
              { icon: "1️⃣", text: <>Penjualan kredit → tercatat sebagai Piutang</> },
              { icon: "2️⃣", text: <>Setiap cicilan → Debit rekening pembayaran, Kredit Piutang</> },
              { icon: "3️⃣", text: <>Lunas → piutang tertutup, semua pembayaran ter-trace</> },
            ]} />

            <h3 style={h3Style}>6. Produksi → Inventori</h3>
            <Checklist items={[
              { icon: "🏭", text: <>Catat produksi → stok produk jadi bertambah, biaya tercatat sebagai HPP</> },
            ]} />

            <h3 style={h3Style}>7. Transaksi Manual → Rekening Koran</h3>
            <Checklist items={[
              { icon: "💸", text: <>Pemasukan/pengeluaran → saldo rekening berubah, tercatat di Rekening Koran, masuk Laba Rugi</> },
            ]} />
          </Section>

          {/* ═══════════════════════════════════════ */}
          {/* PENGATURAN */}
          {/* ═══════════════════════════════════════ */}
          <Section id="pengaturan" icon="⚙️" iconBg="#f1f5f9" title="Pengaturan" subtitle="Konfigurasi bisnis dan fitur">
            <SimpleTable headers={["Tab", "Fungsi"]} rows={[
              ["🔄 Mode", "Switch Pribadi ↔ UMKM, toggle POS, toggle Hutang Piutang"],
              ["👤 Profil", "Nama bisnis, deskripsi, kontak, alamat"],
              ["🧾 Pajak", "NPWP, status PKP, konfigurasi tax rules"],
              ["🎨 Branding", "Warna brand, upload logo (muncul di struk & invoice)"],
              ["🏦 Bank", "Shortcut ke Manajemen Rekening"],
              ["📱 QRIS", "Upload kode QRIS untuk pembayaran"],
              ["📦 Paket", "Info langganan: Free, Pro, Pro Plus"],
              ["📂 Kategori", "Kelola kategori produk (parent-child hierarchy)"],
              ["⚡ Fitur", "Toggle fitur on/off: POS, Hutang Piutang, Kalkulator"],
              ["👥 Tim", "Undang anggota, atur role & permission"],
            ]} />
          </Section>

          {/* ═══════════════════════════════════════ */}
          {/* TIM */}
          {/* ═══════════════════════════════════════ */}
          <Section id="tim" icon="👥" iconBg="#ede9fe" title="Manajemen Tim" subtitle="Role-based access control">

            <h3 style={h3Style}>5 Role Bawaan</h3>
            <SimpleTable headers={["Role", "Akses", "Cocok Untuk"]} rows={[
              ["👑 Owner", "Semua modul tanpa batasan", "Pemilik bisnis"],
              ["📋 Manager", "Semua kecuali Pajak, Pengaturan, Tim", "Manajer toko"],
              ["🛒 Kasir", "POS dan Transaksi saja", "Staff kasir"],
              ["🏭 Gudang", "Stok dan Gudang saja", "Staff gudang"],
              ["👁️ Viewer", "Dashboard, Analitik, Laporan (read-only)", "Investor/partner"],
            ]} />

            <h3 style={h3Style}>Cara Undang Anggota</h3>
            <Steps items={[
              { title: "Buka Pengaturan → tab Tim", desc: "Hanya owner yang bisa mengundang." },
              { title: "Klik \"Undang Anggota\" → isi email → pilih role", desc: "Custom permission juga bisa (toggle per modul)." },
              { title: "Link invite otomatis ter-copy", desc: "Kirim link via WhatsApp atau email ke anggota tim." },
              { title: "Anggota login → otomatis terhubung", desc: "Email harus sama persis. County auto-match saat login." },
            ]} />

            <Callout type="info" icon="🔀" title="Business Switcher:">
              Karyawan yang juga punya bisnis sendiri bisa switch antar bisnis via dropdown di sidebar. Permission tetap sesuai role di masing-masing bisnis.
            </Callout>
          </Section>

          {/* ═══════════════════════════════════════ */}
          {/* TROUBLESHOOTING */}
          {/* ═══════════════════════════════════════ */}
          <Section id="troubleshoot" icon="🔧" iconBg="#fef2f2" title="Troubleshooting" subtitle="Masalah umum dan cara mengatasinya">
            <SimpleTable headers={["Masalah", "Penyebab", "Solusi"]} rows={[
              ["Produk gagal ditambahkan", "Field wajib kosong atau format salah", "Pastikan nama, HPP, dan harga jual terisi. Gunakan angka saja."],
              ["Transaksi gagal disimpan", "Koneksi internet terputus", "Cek koneksi, refresh, input ulang."],
              ["Stok tidak berkurang setelah POS", "Gudang yang dipilih berbeda", "Pastikan pilih gudang yang benar di POS."],
              ["Laba Rugi tidak akurat", "Kategori salah, HPP kosong, atau data ganda", "Review transaksi bulan tersebut. Pastikan kategori benar dan HPP terisi."],
              ["Anggota tim tidak bisa masuk", "Email undangan ≠ email login", "Pastikan login dengan email yang sama persis."],
              ["Reset data gagal", "Tabel belum ter-migrasi", "Refresh halaman. Auto-migration berjalan saat halaman dimuat."],
              ["Data tidak muncul setelah update", "Migrasi database belum selesai", "Tunggu 1-2 menit setelah deploy, lalu refresh."],
              ["POS tidak muncul di sidebar", "Fitur POS belum diaktifkan", "Buka Pengaturan → Fitur → toggle POS → Simpan."],
            ]} />
          </Section>

          {/* ═══════════════════════════════════════ */}
          {/* BEST PRACTICE */}
          {/* ═══════════════════════════════════════ */}
          <Section id="bestpractice" icon="💡" iconBg="#fef9c3" title="Best Practice (Power User)" subtitle="Cara menggunakan County secara optimal">

            <h3 style={h3Style}>Rutinitas Harian</h3>
            <Steps items={[
              { title: "Pagi: Buka shift + cek Dashboard", desc: "Lihat KPI, stok kritis, notifikasi jatuh tempo." },
              { title: "Siang: Input pengeluaran", desc: "Catat sewa, utilitas, pembelian yang terjadi." },
              { title: "Sore: Cek stok + restock jika perlu", desc: "Lihat Peringatan Stok, buat Purchase Order jika rendah." },
              { title: "Malam: Tutup shift + cek laporan harian", desc: "Rekonsiliasi kas, review penjualan hari ini." },
            ]} />

            <h3 style={h3Style}>Rutinitas Mingguan</h3>
            <Checklist items={[
              { icon: "🤝", text: <>Review <strong>Hutang Piutang</strong> — follow up yang mendekati jatuh tempo.</> },
              { icon: "💰", text: <>Bayar <strong>komisi staff</strong> yang pending.</> },
              { icon: "📦", text: <>Cek <strong>Peringatan Stok</strong> dan buat Purchase Order.</> },
            ]} />

            <h3 style={h3Style}>Rutinitas Bulanan</h3>
            <Checklist items={[
              { icon: "📊", text: <>Export <strong>Laba Rugi Detail</strong> untuk arsip.</> },
              { icon: "🏦", text: <>Review <strong>Rekening Koran</strong> — cocokkan dengan mutasi bank asli.</> },
              { icon: "🧾", text: <>Bayar pajak dan update status di modul <strong>Pajak</strong>.</> },
              { icon: "📦", text: <>Lakukan <strong>stock opname</strong> (pengecekan fisik stok).</> },
              { icon: "🏆", text: <>Review <strong>Top Produk</strong> dan <strong>Usia Stok</strong> untuk keputusan pembelian.</> },
            ]} />

            <h3 style={h3Style}>Menghindari Data Tidak Konsisten</h3>
            <Checklist items={[
              { icon: "⚠️", text: <>Jangan edit stok manual — selalu gunakan menu adjustment agar ada audit trail.</> },
              { icon: "⚠️", text: <>Jangan hapus transaksi lama — gunakan adjustment atau void.</> },
              { icon: "⚠️", text: <>Backup data berkala via export Excel.</> },
              { icon: "⚠️", text: <>Pastikan semua kasir menggunakan shift — ini kunci rekonsiliasi kas.</> },
            ]} />

            <h3 style={h3Style}>Scale Bisnis dengan County</h3>
            <Checklist items={[
              { icon: "📈", text: <>Gunakan <strong>Penjualan per Jam</strong> untuk optimasi jadwal staff.</> },
              { icon: "🏆", text: <>Fokuskan promosi pada produk <strong>high-margin</strong>, bukan hanya yang laku.</> },
              { icon: "📅", text: <>Gunakan <strong>Usia Stok</strong> untuk identifikasi dead stock → clearance sale.</> },
              { icon: "👥", text: <>Analisis <strong>Per Pelanggan</strong> untuk identifikasi top customers → buat loyalty program.</> },
              { icon: "🏪", text: <>Mulai 1 outlet, tambah saat berkembang. Laporan per outlet untuk evaluasi performa.</> },
            ]} />

            <h3 style={h3Style}>Keamanan</h3>
            <Checklist items={[
              { icon: "🔒", text: <>Jangan bagikan password owner — gunakan fitur Tim untuk beri akses.</> },
              { icon: "🔒", text: <>Berikan role sesuai kebutuhan (least privilege): kasir tidak perlu akses Pengaturan.</> },
              { icon: "🔒", text: <>Review anggota tim berkala — nonaktifkan yang sudah tidak bekerja.</> },
            ]} />
          </Section>

          {/* ═══════════════════════════════════════ */}
          {/* FAQ */}
          {/* ═══════════════════════════════════════ */}
          <Section id="faq" icon="❓" iconBg="#eff6ff" title="FAQ — Pertanyaan yang Sering Ditanya" subtitle="Klik pertanyaan untuk lihat jawaban">
            {[
              { q: "🛒 Apa bedanya POS dengan Transaksi biasa?", a: "POS khusus untuk penjualan langsung ke pelanggan — otomatis kurangi stok, buat struk, dan catat jurnal. Transaksi biasa untuk pencatatan manual seperti bayar listrik, terima transfer klien, dll." },
              { q: "📦 Bagaimana cara lihat total nilai stok per gudang?", a: "Buka menu Gudang → tab Stok → pilih gudang. Di tabel, kolom terakhir (Nilai Stok) menunjukkan HPP × qty per produk. Footer tabel menampilkan total nilai stok gudang tersebut." },
              { q: "🔄 Apa itu FIFO?", a: "FIFO (First In, First Out) artinya barang yang masuk pertama akan dijual pertama. Jadi saat ada penjualan, County otomatis mengurangi batch stok yang paling tua dulu. Ini penting untuk akurasi valuasi stok dan perhitungan HPP." },
              { q: "💳 Bagaimana cara setup metode pembayaran di POS?", a: "Buka Manajemen Rekening → tambah rekening. Tipe rekening menentukan kategori di POS: Bank = Transfer, E-Wallet = QRIS, Kas = Tunai. Semua rekening aktif otomatis muncul di POS." },
              { q: "👥 Berapa anggota tim yang bisa diundang?", a: "Maksimal 5 anggota per bisnis (paket Pro+). Undang via email di Pengaturan → Tim. Setiap anggota bisa punya role dan permission berbeda." },
              { q: "📊 Laporan apa yang paling penting untuk UMKM?", a: "3 laporan wajib: (1) Laba Rugi Detail — apakah bisnis untung atau rugi, (2) Rekening Koran — apakah saldo rekening cocok, (3) Peringatan Stok — produk mana yang perlu di-restock." },
              { q: "🤝 Bagaimana cara catat penjualan kredit?", a: "Jual via POS seperti biasa, lalu catat sebagai kredit. Piutang otomatis tercatat. Saat pelanggan bayar cicilan, buka Penjualan Kredit → Catat Pembayaran. Status otomatis update." },
              { q: "📱 Apakah County bisa dipakai di HP?", a: "Bisa! County berbasis web (PWA). Di Android: Chrome → menu → 'Tambahkan ke layar utama'. Di iPhone: Safari → Share → 'Tambah ke Layar Utama'." },
              { q: "🔒 Apakah data saya aman?", a: "Ya. County menggunakan enkripsi dan OAuth login. Data di server terproteksi. Hanya owner dan anggota tim yang diberi akses yang bisa melihat data bisnis." },
              { q: "📤 Bisa export data ke Excel?", a: "Bisa! Semua 30+ laporan mendukung export ke PDF dan Excel (.xlsx). Klik tombol PDF atau Excel di pojok kanan atas laporan." },
              { q: "⏰ Apakah ada fitur tracking kedaluwarsa?", a: "Ada! Buka menu Stok Kedaluwarsa. Anda bisa filter: semua, expired, 30/60/90 hari lagi. Status badge: Kritis (merah), Peringatan (kuning), Aman (hijau)." },
              { q: "🏭 Berapa gudang yang bisa dibuat?", a: "Tidak ada batasan! Buat sebanyak yang dibutuhkan. Setiap gudang punya stok terpisah dan bisa transfer antar gudang kapan saja." },
              { q: "🆘 Bagaimana cara hubungi support?", a: "Hubungi admin County melalui WhatsApp yang tertera di halaman pembelian, atau kunjungi county.finance untuk informasi kontak terbaru." },
            ].map((item) => (
              <div key={item.q} style={{ border: "1px solid #e2e8f0", borderRadius: 12, marginBottom: 10, overflow: "hidden" }}>
                <button
                  onClick={() => setOpenFaq(openFaq === item.q ? null : item.q)}
                  style={{
                    padding: "14px 18px", fontWeight: 600, fontSize: 14.5, cursor: "pointer",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: "white", width: "100%", border: "none", textAlign: "left",
                  }}
                >
                  {item.q}
                  <span style={{ transition: "transform 0.2s", transform: openFaq === item.q ? "rotate(180deg)" : "none", fontSize: 12, color: "#64748b" }}>▼</span>
                </button>
                {openFaq === item.q && (
                  <div style={{ padding: "0 18px 14px", fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </Section>

          {/* FOOTER */}
          <div style={{ textAlign: "center", padding: "32px 0", color: "#64748b", fontSize: 13, borderTop: "1px solid #e2e8f0", marginTop: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#1a2744", marginBottom: 8 }}>County</div>
            <p>Panduan Lengkap County ERP — Versi 5.0 | April 2026</p>
            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>13 Modul, 30+ Laporan, Integrasi FIFO, Loyalty, Komisi, Multi-Outlet, dan banyak lagi</p>
            <p style={{ marginTop: 8 }}>
              <a href="https://county.finance" style={{ color: "#22c55e", textDecoration: "none", fontWeight: 600 }}>county.finance</a>
            </p>
          </div>

        </main>
      </div>
    </div>
  );
}

// ===== CONSTANTS =====
const h3Style: React.CSSProperties = { fontSize: 16, fontWeight: 700, marginTop: 24, marginBottom: 12, color: "#1e293b" };
const pStyle: React.CSSProperties = { fontSize: 14, color: "#64748b", marginBottom: 16, lineHeight: 1.7 };

// ===== HELPER COMPONENTS =====

function Section({ id, icon, iconBg, title, subtitle, children }: {
  id: string; icon: string; iconBg: string; title: string; subtitle: string; children: React.ReactNode;
}) {
  return (
    <div data-section={id} style={{ background: "white", borderRadius: 16, padding: 32, marginBottom: 28, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24, paddingBottom: 16, borderBottom: "2px solid #f0f4ff" }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{icon}</div>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b" }}>{title}</h2>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Steps({ items }: { items: { title: string; desc: string }[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1a2744", color: "white", fontWeight: 800, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>{i + 1}</div>
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: "#1e293b" }}>{item.title}</h4>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.5 }}>{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Callout({ type, icon, title, children }: { type: "tip" | "warn" | "info"; icon: string; title?: string; children: React.ReactNode }) {
  const styles = {
    tip: { bg: "#f0fdf4", border: "#bbf7d0", color: "#166534" },
    warn: { bg: "#fffbeb", border: "#fde68a", color: "#92400e" },
    info: { bg: "#eff6ff", border: "#bfdbfe", color: "#1e40af" },
  };
  const s = styles[type];
  return (
    <div style={{ borderRadius: 12, padding: "16px 20px", display: "flex", gap: 12, alignItems: "flex-start", margin: "16px 0", fontSize: 14, background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
      <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div style={{ margin: 0, lineHeight: 1.6 }}>
        {title && <strong style={{ display: "block", marginBottom: 4 }}>{title}</strong>}
        {children}
      </div>
    </div>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #e2e8f0", marginBottom: 16 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr>{headers.map((h) => <th key={h} style={{ background: "#1a2744", color: "white", padding: "12px 16px", textAlign: "left", fontWeight: 600, fontSize: 13 }}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => <td key={j} style={{ padding: "11px 16px", borderBottom: i < rows.length - 1 ? "1px solid #e2e8f0" : "none", background: i % 2 === 1 ? "#f8faff" : "white" }}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ModeCard({ color, title, desc, items }: { color: "blue" | "green"; title: string; desc: string; items: string[] }) {
  const styles = {
    blue: { bg: "#eff6ff", border: "#bfdbfe", titleColor: "#1d4ed8" },
    green: { bg: "#f0fdf4", border: "#bbf7d0", titleColor: "#15803d" },
  };
  const s = styles[color];
  return (
    <div style={{ borderRadius: 14, padding: 20, background: s.bg, border: `2px solid ${s.border}` }}>
      <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4, color: s.titleColor }}>{title}</h3>
      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>{desc}</p>
      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((item) => <li key={item} style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>✅ {item}</li>)}
      </ul>
    </div>
  );
}

function Checklist({ items }: { items: { icon: string; text: React.ReactNode }[] }) {
  return (
    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14.5, padding: "10px 14px", background: "#f8faff", borderRadius: 10, border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
          <div>{item.text}</div>
        </li>
      ))}
    </ul>
  );
}
