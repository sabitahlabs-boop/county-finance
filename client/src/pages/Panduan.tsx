import { useEffect, useRef, useState } from "react";

export default function Panduan() {
  const [activeSection, setActiveSection] = useState("intro-detail");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Panduan County — Buku Pintar Usher";
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
      { id: "intro-detail", icon: "🏠", label: "Apa itu County?" },
      { id: "start", icon: "🚀", label: "Cara Mulai" },
      { id: "mode", icon: "🔄", label: "Dua Mode County" },
    ]},
    { group: "Fitur Utama", items: [
      { id: "dashboard", icon: "📊", label: "Dashboard" },
      { id: "transaksi", icon: "💸", label: "Transaksi" },
      { id: "scan", icon: "📷", label: "Scan Struk (AI)" },
      { id: "stok", icon: "📦", label: "Stok Produk" },
      { id: "gudang", icon: "🏭", label: "Gudang" },
      { id: "kasir", icon: "🛒", label: "Kasir (POS)" },
    ]},
    { group: "Fitur Lanjutan", items: [
      { id: "riwayat-stok", icon: "📜", label: "Riwayat Stok" },
      { id: "client", icon: "👥", label: "Manajemen Client" },
      { id: "hutang", icon: "🤝", label: "Hutang & Piutang" },
      { id: "anggaran", icon: "🎯", label: "Anggaran Bulanan" },
      { id: "transfer", icon: "🔁", label: "Transfer Antar Akun" },
      { id: "analitik", icon: "📈", label: "Analitik Penjualan" },
      { id: "laporan", icon: "📋", label: "Laporan Keuangan" },
      { id: "pajak", icon: "🧾", label: "Pajak" },
    ]},
    { group: "Multi Akun & Tim", items: [
      { id: "multi-akun", icon: "👥", label: "Multi Akun (Pro+)" },
      { id: "business-switch", icon: "🔀", label: "Switch Bisnis" },
    ]},
    { group: "Pengaturan & Ekstra", items: [
      { id: "pengaturan", icon: "⚙️", label: "Pengaturan" },
      { id: "excel-export", icon: "📊", label: "Export Excel" },
      { id: "onboarding", icon: "🎓", label: "Tur Panduan" },
      { id: "extras", icon: "✨", label: "Fitur Ekstra" },
      { id: "tips", icon: "💡", label: "Tips & Trik" },
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
        <span style={{ background: "#22c55e", color: "white", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>Panduan Usher v4.0</span>
        <span style={{ fontSize: 13, color: "#94a3b8", marginLeft: "auto", display: window.innerWidth > 768 ? "block" : "none" }}>Update Maret 2026 — Multi Akun, Gudang, Business Switcher</span>
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
        <main ref={mainRef} style={{ flex: 1, padding: "32px 40px", maxWidth: 860 }}>

          {/* HERO */}
          <div data-section="hero" style={{
            background: "linear-gradient(135deg, #1a2744 0%, #1e3a8a 100%)",
            borderRadius: 20, padding: 40, color: "white", marginBottom: 40,
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, background: "rgba(34,197,94,0.15)", borderRadius: "50%" }} />
            <div style={{ fontSize: 56, marginBottom: 16 }}>📚</div>
            <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>
              Panduan Lengkap <span style={{ color: "#22c55e" }}>County</span>
            </h1>
            <p style={{ color: "#94a3b8", fontSize: 16, marginBottom: 24 }}>
              Buku pintar untuk usher County. Semua yang perlu kamu tahu, dari A sampai Z — dengan bahasa yang mudah dipahami. Termasuk fitur terbaru: <strong style={{ color: "#22c55e" }}>Multi Akun, Business Switcher, Gudang, Excel Export</strong>.
            </p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
              {[["30+", "Topik Lengkap"], ["Rp 299K", "Sekali Bayar"], ["∞", "Akses Selamanya"], ["AI", "Scan Struk Otomatis"], ["👥", "Multi Akun"], ["🏭", "Multi-Gudang"]].map(([num, label]) => (
                <div key={label} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#22c55e" }}>{num}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{label}</div>
                </div>
              ))}
            </div>
            <a
              href="https://d2xsxph8kpxj0f.cloudfront.net/310519663380060214/BWbi9ugLsQu4nq5jm7TSFB/panduan-county-v3_ce01fd5c.pdf"
              download="Panduan-County-v3.pdf"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "#22c55e", color: "white", fontWeight: 700,
                fontSize: 14, padding: "12px 24px", borderRadius: 12,
                textDecoration: "none", cursor: "pointer",
                boxShadow: "0 4px 14px rgba(34,197,94,0.4)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(34,197,94,0.5)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(34,197,94,0.4)"; }}
            >
              <span style={{ fontSize: 18 }}>📥</span>
              Download PDF (Offline)
            </a>
          </div>

          {/* ════════════════════════════════════════════ */}
          {/* SECTION: APA ITU COUNTY */}
          {/* ════════════════════════════════════════════ */}
          <Section id="intro-detail" icon="🏦" iconBg="#eff6ff" title="Apa itu County?" subtitle="Kenalan dulu sebelum mulai">
            <p style={{ fontSize: 15, color: "#64748b", marginBottom: 20, lineHeight: 1.7 }}>
              County adalah <strong style={{ color: "#1e293b" }}>aplikasi keuangan all-in-one</strong> yang dibuat khusus untuk pemilik UMKM dan perorangan di Indonesia. Bisa dipakai di HP, tablet, maupun laptop — tanpa perlu install apapun, cukup buka browser.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 14 }}>
              {[
                ["📷", "Scan Struk AI", "Foto struk → langsung tercatat otomatis"],
                ["📊", "Laporan Real-Time", "Laba rugi & arus kas selalu up-to-date"],
                ["🛒", "Kasir (POS)", "Sistem kasir terintegrasi langsung"],
                ["📦", "Stok Otomatis", "Stok berkurang saat ada penjualan"],
                ["🏭", "Multi-Gudang", "Kelola stok di banyak gudang sekaligus"],
                ["🧾", "Invoice Profesional", "Invoice dengan logo & tanda tangan"],
                ["🧮", "Pajak Otomatis", "Hitung PPh, PPN, dan tax planning"],
                ["📱", "Bisa di HP (PWA)", "Install di home screen seperti app native"],
              ].map(([icon, title, desc]) => (
                <div key={title} style={{ background: "#f0f4ff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{desc}</div>
                </div>
              ))}
            </div>
            <Callout type="tip" icon="💰" title="Model Harga County">
              Bayar <strong>Rp 299.000 SEKALI</strong> — akses selamanya. Tidak ada biaya bulanan, tidak ada biaya tahunan, tidak ada kejutan tagihan.
            </Callout>
          </Section>

          {/* ════════════════════════════════════════════ */}
          {/* SECTION: CARA MULAI */}
          {/* ════════════════════════════════════════════ */}
          <Section id="start" icon="🚀" iconBg="#f0fdf4" title="Cara Mulai Pakai County" subtitle="4 langkah mudah, selesai dalam 5 menit">
            <Steps items={[
              { title: "Buka county.finance di browser", desc: "Bisa pakai Chrome, Safari, atau Firefox. Di HP maupun laptop. Tidak perlu download apapun." },
              { title: 'Klik tombol "Masuk" dan login', desc: "County pakai sistem login aman. Kalau belum punya akun, otomatis dibuat saat pertama kali login." },
              { title: "Isi wizard setup (3 langkah singkat)", desc: "Masukkan nama bisnis, pilih tipe usaha, isi info pajak (opsional), dan pilih mode (Pribadi atau UMKM). Selesai dalam 2 menit." },
              { title: "Siap! County langsung bisa dipakai", desc: "Kamu langsung masuk ke Dashboard. Mulai catat transaksi, scan struk, atau tambah produk." },
            ]} />
            <Callout type="info" icon="📲" title="Mau install di HP?">
              <strong>Android:</strong> Buka county.finance di Chrome → ketuk menu ⋮ → pilih "Tambahkan ke layar utama".<br />
              <strong>iPhone:</strong> Buka di Safari → ketuk ikon Share → "Tambah ke Layar Utama".<br />
              County akan muncul seperti aplikasi biasa di home screen HP kamu!
            </Callout>
          </Section>

          {/* ════════════════════════════════════════════ */}
          {/* SECTION: DUA MODE */}
          {/* ════════════════════════════════════════════ */}
          <Section id="mode" icon="🔄" iconBg="#fef9c3" title="Dua Mode County" subtitle="Pilih sesuai kebutuhan — bisa ganti kapan saja">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <ModeCard color="blue" title="👤 Mode Pribadi" desc="Untuk keuangan personal — catat pemasukan & pengeluaran sehari-hari" items={["Jurnal Keuangan Multi-Akun", "Transaksi & Kategori", "Hutang & Piutang", "Anggaran Bulanan", "Laporan Keuangan", "AI Ringkasan"]} />
              <ModeCard color="green" title="🏪 Mode UMKM" desc="Untuk bisnis — semua fitur Mode Pribadi + fitur bisnis lengkap" items={["Semua fitur Pribadi", "Stok Produk + Multi-Gudang", "Kasir POS", "Analitik Penjualan", "Pajak Otomatis", "Manajemen Client"]} />
            </div>
            <Callout type="tip" icon="💡" title="Cara ganti mode:">
              Buka <strong>Pengaturan</strong> → scroll ke bagian <strong>Mode Aplikasi</strong> → pilih mode → klik Simpan. Sidebar langsung berubah!
            </Callout>
          </Section>

          {/* ════════════════════════════════════════════ */}
          {/* SECTION: DASHBOARD */}
          {/* ════════════════════════════════════════════ */}
          <Section id="dashboard" icon="📊" iconBg="#ede9fe" title="Dashboard — Pusat Kontrol" subtitle="Semua info penting ada di satu halaman">
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 16 }}>Dashboard adalah halaman pertama yang muncul setelah login. Semua kondisi keuangan bisa dilihat sekilas dari sini.</p>
            <SimpleTable headers={["Elemen", "Keterangan"]} rows={[
              ["💰 Kartu KPI", "Omzet bulan ini, total pengeluaran, laba bersih, estimasi pajak"],
              ["📈 Grafik Tren", "Pergerakan omzet bulan ke bulan dalam setahun"],
              ["⚡ Quick Actions", "Tombol cepat: Catat Pemasukan, Pengeluaran, Scan Struk, Lihat Laporan, Kasir POS"],
              ["⚠️ Stok Kritis", "Produk yang stoknya hampir habis (Mode UMKM)"],
              ["🤖 AI Ringkasan", "Analisis otomatis kondisi keuangan bulan ini — ditulis oleh AI"],
              ["💊 Health Score", "Nilai kesehatan keuangan bisnis + rekomendasi perbaikan"],
            ]} />
            <Callout type="tip" icon="🌅" title="Rutinitas Pagi:">
              Biasakan buka Dashboard setiap pagi — cek ringkasan keuangan, notifikasi jatuh tempo, dan stok kritis sebelum mulai kerja.
            </Callout>
          </Section>

          {/* ════════════════════════════════════════════ */}
          {/* SECTION: TRANSAKSI */}
          {/* ════════════════════════════════════════════ */}
          <Section id="transaksi" icon="💸" iconBg="#fef9c3" title="Transaksi" subtitle="Catat semua uang masuk dan keluar">
            <Steps items={[
              { title: 'Klik "+ Transaksi Baru"', desc: "Ada di pojok kanan atas halaman Transaksi." },
              { title: "Pilih tab: Pemasukan atau Pengeluaran", desc: "Pemasukan = uang masuk (penjualan, dll). Pengeluaran = uang keluar (beli stok, bayar sewa, dll)." },
              { title: "Isi form dan klik Simpan", desc: "Isi tanggal, jumlah, kategori, metode bayar, dan keterangan. Kalau mau link ke produk (stok berkurang otomatis), pilih produk di bagian bawah form." },
            ]} />
            <Callout type="info" icon="📦" title="Link ke Produk & Gudang:">
              Saat buat transaksi yang terkait produk (misal: beli stok atau jual barang), pilih produk di form. Stok akan otomatis bertambah/berkurang, dan <strong>stok gudang juga ikut terupdate</strong> secara otomatis ke gudang utama (atau gudang yang dipilih di POS).
            </Callout>
            <Callout type="tip" icon="🖨️" title="Cetak Invoice:">
              Klik ikon printer di baris transaksi untuk cetak invoice profesional dengan logo bisnis dan tanda tangan digital.
            </Callout>
            <Callout type="tip" icon="✏️" title="Edit & Hapus:">
              Klik ikon pensil untuk edit transaksi, atau ikon tempat sampah untuk hapus. Konfirmasi akan muncul sebelum penghapusan.
            </Callout>
          </Section>

          {/* ════════════════════════════════════════════ */}
          {/* SECTION: SCAN STRUK */}
          {/* ════════════════════════════════════════════ */}
          <Section id="scan" icon="📷" iconBg="#f0fdf4" title="Scan Struk dengan AI" subtitle="Fitur paling canggih County — foto struk, langsung tercatat!">
            <Callout type="warn" icon="⭐" title="Ini fitur terfavorit pengguna County!">
              Tidak perlu ketik manual — cukup foto struk belanja, AI akan baca dan catat otomatis dalam 5-15 detik.
            </Callout>
            <div style={{ marginTop: 16 }}>
              <Steps items={[
                { title: 'Klik tombol "Scan Struk"', desc: "Ada di Dashboard (tombol kamera) atau halaman Transaksi." },
                { title: "Pilih sumber: Kamera atau Galeri", desc: "Langsung foto struk, atau pilih foto yang sudah ada di galeri HP. Bisa juga upload file PDF." },
                { title: "AI proses otomatis (5-15 detik)", desc: "AI membaca: nama toko, tanggal, daftar item + harga, total, dan metode bayar." },
                { title: "Pilih cara simpan", desc: "Setelah AI selesai baca, kamu punya 2 pilihan:" },
              ]} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, margin: "20px 0" }}>
              <div style={{ borderRadius: 14, padding: 20, background: "#f0fdf4", border: "2px solid #bbf7d0" }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, color: "#15803d" }}>📦 Masukkan ke Stok</h3>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>Simpan sebagai transaksi DAN tambahkan item ke stok produk</p>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                  {["Pilih tipe transaksi & metode bayar", "Pilih gudang tujuan", "Simpan transaksi", "Review item satu per satu", "Nama, qty, harga sudah terisi otomatis", "Edit jika perlu, lalu tambah ke stok"].map(s => (
                    <li key={s} style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>✅ {s}</li>
                  ))}
                </ul>
              </div>
              <div style={{ borderRadius: 14, padding: 20, background: "#eff6ff", border: "2px solid #bfdbfe" }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, color: "#1d4ed8" }}>💸 Catat Pengeluaran Saja</h3>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>Simpan sebagai transaksi saja, tanpa masuk stok</p>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                  {["Pilih tipe transaksi & metode bayar", "Simpan langsung sebagai transaksi", "Cocok untuk: bayar sewa, listrik, dll", "Tidak perlu review item satu-satu"].map(s => (
                    <li key={s} style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>✅ {s}</li>
                  ))}
                </ul>
              </div>
            </div>

            <Callout type="info" icon="🏭" title="Scan Struk + Gudang:">
              Saat pilih "Masukkan ke Stok", kamu bisa pilih <strong>gudang tujuan</strong>. Stok akan masuk ke gudang yang kamu pilih. Kalau tidak pilih gudang, otomatis masuk ke gudang utama.
            </Callout>
          </Section>

          {/* ════════════════════════════════════════════ */}
          {/* SECTION: STOK PRODUK */}
          {/* ════════════════════════════════════════════ */}
          <Section id="stok" icon="📦" iconBg="#fff7ed" title="Stok Produk" subtitle="Kelola inventaris bisnis dengan mudah • Mode UMKM">
            <SimpleTable headers={["Field", "Keterangan", "Wajib?"]} rows={[
              ["Nama Produk", "Nama produk yang dijual", "✅ Ya"],
              ["SKU", "Kode produk (auto-generate jika kosong)", "Opsional"],
              ["Kategori", "Kategori produk (buat dulu di Pengaturan)", "Opsional"],
              ["Harga Jual", "Harga ke konsumen", "✅ Ya"],
              ["HPP", "Harga beli / biaya produksi", "Opsional"],
              ["Tipe Harga", "Tetap (fixed) atau Dinamis (bisa diubah saat jual)", "Opsional"],
              ["Diskon %", "Persentase diskon default", "Opsional"],
              ["Stok", "Jumlah stok saat ini", "✅ Ya"],
              ["Stok Minimum", "Batas sebelum muncul alert stok kritis", "Opsional"],
              ["Foto Produk", "Gambar produk (upload dari HP/laptop)", "Opsional"],
            ]} />

            <Callout type="info" icon="🏭" title="Stok & Gudang Terintegrasi:">
              Setiap produk menampilkan <strong>distribusi stok per gudang</strong>. Kamu bisa lihat berapa stok di Gudang A, berapa di Gudang B, langsung dari halaman Stok Produk. Saat tambah produk baru, stok awal otomatis masuk ke gudang utama.
            </Callout>

            <Callout type="tip" icon="📥" title="Import Massal:">
              Punya banyak produk? Klik "Import CSV" untuk upload semua produk sekaligus. Template CSV bisa didownload dari halaman yang sama.
            </Callout>

            <Callout type="tip" icon="🧮" title="Kalkulator HPP (COGS):">
              Buka detail produk → tab "Komposisi" untuk menghitung HPP berdasarkan bahan baku. Masukkan bahan + harga → HPP otomatis terhitung.
            </Callout>
          </Section>

          {/* ════════════════════════════════════════════ */}
          {/* SECTION: GUDANG (NEW!) */}
          {/* ════════════════════════════════════════════ */}
          <Section id="gudang" icon="🏭" iconBg="#fef3c7" title="Manajemen Gudang" subtitle="Fitur baru! Kelola stok di banyak lokasi • Mode UMKM">
            <Callout type="warn" icon="🆕" title="Fitur Terbaru County!">
              Sekarang kamu bisa punya <strong>banyak gudang</strong> — misalnya Gudang Toko Pusat, Gudang Cabang, Gudang Online. Stok dikelola terpisah per gudang, tapi tetap bisa ditransfer antar gudang kapan saja.
            </Callout>

            <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 24, marginBottom: 12, color: "#1e293b" }}>Halaman Gudang punya 3 Tab:</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
              {[
                { icon: "🏭", title: "Tab Gudang", desc: "Daftar semua gudang. Tambah, edit, hapus, dan set gudang utama.", color: "#fef3c7", border: "#fde68a" },
                { icon: "📦", title: "Tab Stok", desc: "Lihat stok per gudang. Pilih gudang → lihat semua produk & jumlah stok di gudang itu.", color: "#dcfce7", border: "#86efac" },
                { icon: "📜", title: "Tab Riwayat", desc: "Riwayat transfer stok antar gudang. Siapa pindah apa, dari mana ke mana, kapan.", color: "#dbeafe", border: "#93c5fd" },
              ].map(t => (
                <div key={t.title} style={{ borderRadius: 14, padding: 18, background: t.color, border: `2px solid ${t.border}` }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{t.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{t.title}</div>
                  <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>{t.desc}</div>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: "#1e293b" }}>Cara Pakai Gudang:</h3>

            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#1e293b" }}>1. Buat Gudang Baru</h4>
            <Steps items={[
              { title: 'Buka menu "Gudang" di sidebar', desc: "Menu Gudang ada di sidebar sebelah kiri (Mode UMKM)." },
              { title: 'Klik tombol "Tambah Gudang"', desc: "Tombol kuning di pojok kanan atas." },
              { title: "Isi detail gudang", desc: "Nama gudang (wajib), alamat, telepon, dan catatan (opsional). Klik Tambah." },
            ]} />
            <Callout type="info" icon="⭐" title="Gudang Utama:">
              Gudang pertama yang kamu buat otomatis jadi <strong>Gudang Utama</strong>. Semua stok baru dan transaksi tanpa gudang spesifik akan masuk ke sini. Kamu bisa ganti gudang utama kapan saja dengan klik ikon bintang.
            </Callout>

            <div style={{ height: 20 }} />
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#1e293b" }}>2. Lihat Stok per Gudang</h4>
            <Steps items={[
              { title: "Klik tab Stok", desc: "Di halaman Gudang, klik tab kedua: Stok." },
              { title: "Pilih gudang dari dropdown", desc: "Pilih gudang yang mau dilihat stoknya." },
              { title: "Lihat daftar produk + jumlah stok", desc: "Tabel menampilkan: nama produk, SKU, jumlah stok, satuan, HPP, harga jual, dan nilai stok (HPP × qty). Produk dengan stok di bawah minimum ditandai merah." },
            ]} />

            <div style={{ height: 20 }} />
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#1e293b" }}>3. Transfer Stok Antar Gudang</h4>
            <Steps items={[
              { title: 'Klik tombol "Transfer Stok"', desc: "Tombol ada di pojok kanan atas halaman Gudang. Minimal harus punya 2 gudang." },
              { title: "Pilih gudang asal dan gudang tujuan", desc: "Dari gudang mana → ke gudang mana." },
              { title: "Pilih produk dan jumlah", desc: "Pilih produk yang mau dipindah. Sistem menampilkan stok tersedia di gudang asal. Masukkan jumlah yang mau ditransfer." },
              { title: "Klik Transfer Stok", desc: "Stok langsung berpindah. Riwayat transfer tercatat di tab Riwayat." },
            ]} />

            <Callout type="tip" icon="💡" title="Contoh Penggunaan Gudang:">
              <strong>Toko Kue Ibu Ani:</strong><br />
              • Gudang Dapur (stok bahan baku) → Gudang Toko (stok jadi untuk dijual) → Gudang Online (stok untuk pesanan online)<br />
              • Setiap hari, transfer kue jadi dari Dapur ke Toko dan Online<br />
              • POS di toko ambil stok dari "Gudang Toko"<br />
              • Pesanan online ambil stok dari "Gudang Online"
            </Callout>

            <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 24, marginBottom: 12, color: "#1e293b" }}>Gudang Terhubung ke Semua Fitur:</h3>
            <SimpleTable headers={["Fitur", "Hubungan dengan Gudang"]} rows={[
              ["📦 Stok Produk", "Setiap produk menampilkan distribusi stok per gudang"],
              ["🛒 Kasir (POS)", "Pilih gudang sumber sebelum mulai jual — stok berkurang dari gudang itu"],
              ["📷 Scan Struk → Stok", "Pilih gudang tujuan saat tambah item dari scan struk ke stok"],
              ["💸 Transaksi", "Transaksi yang terkait produk otomatis update stok gudang utama"],
              ["➕ Tambah Produk", "Stok awal produk baru otomatis masuk ke gudang utama"],
              ["📊 Adjust Stok", "Penyesuaian stok manual juga update stok gudang"],
            ]} />
          </Section>

          {/* ════════════════════════════════════════════ */}
          {/* SECTION: KASIR POS */}
          {/* ════════════════════════════════════════════ */}
          <Section id="kasir" icon="🛒" iconBg="#fdf4ff" title="Kasir (POS)" subtitle="Sistem kasir terintegrasi — cocok untuk toko fisik • Mode UMKM">
            <Callout type="warn" icon="⚙️" title="Aktifkan dulu:">
              Buka Pengaturan → Mode Aplikasi → toggle "Aktifkan POS" → Simpan. Baru menu Kasir muncul di sidebar.
            </Callout>
            <div style={{ marginTop: 16 }}>
              <Steps items={[
                { title: "Pilih gudang sumber (opsional)", desc: "Di bagian atas halaman POS, ada dropdown gudang. Pilih gudang mana yang mau diambil stoknya untuk penjualan ini. Kalau tidak dipilih, stok berkurang dari gudang utama." },
                { title: "Cari produk dan klik untuk tambah ke keranjang", desc: "Gunakan search bar atau scroll daftar produk di sebelah kiri. Untuk produk harga dinamis, masukkan harga jual saat menambah." },
                { title: "Atur jumlah di keranjang", desc: "Klik + atau - untuk ubah jumlah. Bisa juga ubah harga jual langsung di keranjang." },
                { title: 'Pilih metode bayar dan klik "Bayar"', desc: "Tunai (masukkan uang diterima → hitung kembalian otomatis), Transfer Bank, atau QRIS. Tombol quick amount tersedia untuk pembayaran tunai." },
                { title: "Pembayaran berhasil!", desc: "Struk otomatis muncul. Klik 'Cetak Struk' untuk print. Transaksi tercatat otomatis, stok berkurang otomatis dari gudang yang dipilih." },
              ]} />
            </div>
            <Callout type="info" icon="📱" title="QRIS di Struk:">
              Upload gambar QRIS di Pengaturan → QRIS. QRIS akan muncul di halaman POS saat pilih metode bayar QRIS, dan juga di struk cetak.
            </Callout>
          </Section>

          {/* ════════════════════════════════════════════ */}
          {/* SECTION: RIWAYAT STOK */}
          {/* ════════════════════════════════════════════ */}
          <Section id="riwayat-stok" icon="📜" iconBg="#f0fdf4" title="Riwayat Stok" subtitle="Log lengkap semua perubahan stok • Mode UMKM">
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 16 }}>Halaman ini mencatat SEMUA perubahan stok yang pernah terjadi — dari mana pun asalnya. Berguna untuk audit dan tracking.</p>
            <SimpleTable headers={["Tipe", "Artinya", "Contoh"]} rows={[
              ["🟢 Stok Masuk", "Stok bertambah (beli/restock)", "Beli 50 pcs bahan baku"],
              ["🔴 Stok Keluar", "Stok berkurang (jual/pakai)", "Jual 3 pcs via POS"],
              ["🟡 Penyesuaian", "Koreksi manual", "Stok fisik beda dengan sistem"],
              ["🔵 Stok Awal", "Stok pertama kali diinput", "Tambah produk baru dengan stok 100"],
            ]} />
            <Callout type="tip" icon="🔍" title="Filter & Cari:">
              Gunakan search bar untuk cari berdasarkan nama produk, SKU, atau catatan. Filter berdasarkan tipe pergerakan (masuk/keluar/penyesuaian).
            </Callout>
          </Section>

          {/* ════════════════════════════════════════════ */}
          {/* SECTION: CLIENT */}
          {/* ════════════════════════════════════════════ */}
          <Section id="client" icon="👥" iconBg="#eff6ff" title="Manajemen Client" subtitle="Kelola data pelanggan dan supplier • Mode UMKM">
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 16 }}>Simpan data pelanggan (customer) dan pemasok (supplier) untuk memudahkan tracking hutang/piutang dan riwayat transaksi per client.</p>
            <Checklist items={[
              { icon: "✅", text: <><strong>Tambah Client:</strong> Klik "+ Tambah Client" → isi nama, email, telepon, alamat, tipe (Customer/Supplier)</> },
              { icon: "✅", text: <><strong>Lacak Hutang per Client:</strong> Setiap client punya riwayat hutang/piutang tersendiri</> },
              { icon: "✅", text: <><strong>Invoice per Client:</strong> Saat cetak invoice, bisa pilih client tujuan — nama & alamat otomatis terisi</> },
              { icon: "✅", text: <><strong>Riwayat Transaksi:</strong> Lihat semua transaksi dengan client tertentu dalam satu tempat</> },
            ]} />
          </Section>

          {/* ════════════════════════════════════════════ */}
          {/* SECTION: HUTANG PIUTANG */}
          {/* ════════════════════════════════════════════ */}
          <Section id="hutang" icon="🤝" iconBg="#fef9c3" title="Hutang & Piutang" subtitle="Tracking semua utang dengan mudah — tidak ada yang terlewat">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <ModeCard color="blue" title="💸 Hutang" desc="Kamu yang berhutang ke orang lain" items={["Ada tanggal jatuh tempo", "Bisa bayar cicilan", "Notifikasi mendekati jatuh tempo"]} />
              <ModeCard color="green" title="💰 Piutang" desc="Orang lain yang berhutang ke kamu" items={["Ada tanggal jatuh tempo", "Tracking pembayaran cicilan", "Notifikasi kalau terlambat bayar"]} />
            </div>
            <SimpleTable headers={["Status", "Artinya"]} rows={[
              ["🟢 Lunas", "Sudah dibayar penuh"],
              ["🟡 Belum Lunas", "Masih ada sisa yang harus dibayar"],
              ["🔴 Terlambat", "Melewati jatuh tempo dan belum lunas"],
            ]} />
          </Section>

          {/* ════════════════════════════════════════════ */}
          {/* SECTION: ANGGARAN */}
          {/* ════════════════════════════════════════════ */}
          <Section id="anggaran" icon="🎯" iconBg="#f0fdf4" title="Anggaran Bulanan" subtitle="Rencanakan pengeluaran agar tidak bocor">
            <Steps items={[
              { title: 'Pilih bulan dan klik "+ Tambah Anggaran"', desc: "Pilih bulan yang mau direncanakan, lalu tambah anggaran per kategori." },
              { title: "Isi kategori dan jumlah anggaran", desc: "Contoh: Operasional Rp 2.000.000, Gaji Rp 5.000.000, Marketing Rp 1.000.000." },
              { title: "Monitor progress sepanjang bulan", desc: "Progress bar warna berubah: hijau (aman), kuning (mendekati batas), merah (melebihi anggaran)." },
            ]} />
            <div style={{ marginTop: 16 }}>
              {[["Operasional", 65, "#22c55e"], ["Marketing", 82, "#f59e0b"], ["Gaji", 97, "#ef4444"]].map(([label, pct, color]) => (
                <div key={label as string} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span>{label as string}</span>
                    <span>{pct}% terpakai {(pct as number) > 90 ? "⚠️" : ""}</span>
                  </div>
                  <div style={{ background: "#e2e8f0", borderRadius: 8, height: 10, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: color as string, borderRadius: 8 }} />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ════════════════════════════════════════════ */}
          {/* SECTION: TRANSFER */}
          {/* ════════════════════════════════════════════ */}
          <Section id="transfer" icon="🔁" iconBg="#ede9fe" title="Transfer Antar Akun" subtitle="Pindah saldo antar rekening — saldo selalu akurat">
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", margin: "12px 0" }}>
              {["Buka Transaksi", "+ Transaksi Baru", "Tab Transfer", "Pilih Akun Asal & Tujuan", "Klik Transfer ✅"].map((step, i, arr) => (
                <div key={step} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ background: "#1a2744", color: "white", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600 }}>{step}</div>
                  {i < arr.length - 1 && <span style={{ color: "#22c55e", fontSize: 20, fontWeight: 900 }}>→</span>}
                </div>
              ))}
            </div>
            <Callout type="info" icon="ℹ️">
              Sistem otomatis buat 2 transaksi: pengeluaran dari akun asal dan pemasukan ke akun tujuan. Saldo kedua akun langsung terupdate.
            </Callout>
          </Section>

          {/* ════════════════════════════════════════════ */}
          {/* SECTION: ANALITIK */}
          {/* ════════════════════════════════════════════ */}
          <Section id="analitik" icon="📈" iconBg="#fef9c3" title="Analitik Penjualan" subtitle="Lihat tren bisnis dalam grafik interaktif • Mode UMKM">
            <Checklist items={[
              { icon: "📊", text: <><strong>Grafik Penjualan Bulanan</strong> — bar chart perbulan dalam setahun</> },
              { icon: "🥧", text: <><strong>Penjualan per Kategori</strong> — pie chart kategori produk terlaris</> },
              { icon: "💳", text: <><strong>Metode Pembayaran</strong> — berapa % bayar tunai vs transfer vs QRIS</> },
              { icon: "🏆", text: <><strong>Top Produk Terlaris</strong> — daftar produk dengan penjualan tertinggi</> },
              { icon: "📉", text: <><strong>Tren Pengeluaran</strong> — grafik pengeluaran bulanan untuk kontrol biaya</> },
            ]} />
          </Section>

          {/* ════════════════════════════════════════════ */}
          {/* SECTION: LAPORAN */}
          {/* ════════════════════════════════════════════ */}
          <Section id="laporan" icon="📋" iconBg="#eff6ff" title="Laporan Keuangan" subtitle="Laba Rugi dan Arus Kas otomatis — siap untuk audit">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <ModeCard color="blue" title="📊 Laba Rugi" desc="Ringkasan pendapatan vs pengeluaran" items={["Total pendapatan per kategori", "Total pengeluaran per kategori", "Laba bersih periode terpilih"]} />
              <ModeCard color="green" title="💧 Arus Kas" desc="Aliran uang masuk dan keluar detail" items={["Kas masuk per metode bayar", "Kas keluar per kategori", "Bisa filter per periode"]} />
            </div>
            <Callout type="tip" icon="📥" title="Export Laporan:">
              Klik tombol Export → pilih format CSV, Excel, atau PDF. Cocok untuk laporan ke investor, bank, atau arsip pajak.
            </Callout>
          </Section>

          {/* ════════════════════════════════════════════ */}
          {/* SECTION: PAJAK */}
          {/* ════════════════════════════════════════════ */}
          <Section id="pajak" icon="🧾" iconBg="#fff7ed" title="Pajak" subtitle="Hitung, rencanakan, dan bayar pajak dengan benar • Mode UMKM">
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 16 }}>County menghitung estimasi pajak berdasarkan data bisnis yang sudah diisi di Pengaturan — tipe usaha, status PKP, jumlah karyawan, dan omzet tahunan.</p>
            <SimpleTable headers={["Tab Pajak", "Isi"]} rows={[
              ["📊 Ringkasan", "Estimasi pajak otomatis dari data transaksi + progress bar batas Rp 500jt"],
              ["🧮 Kalkulator", "PPh UMKM 0.5%, PPN 11%/12%, PPh 21 (progresif), PPh 23"],
              ["📋 Tax Planning", "Bandingkan: Final 0.5% vs NPPN vs Pembukuan — pilih yang paling hemat"],
              ["📅 Deadline", "Kalender jatuh tempo pajak + tabel denda keterlambatan"],
              ["📜 Aturan", "Daftar aturan pajak yang berlaku untuk bisnis kamu"],
              ["💳 Riwayat", "Catat bukti pembayaran pajak untuk arsip"],
            ]} />
            <Callout type="tip" icon="🔔" title="Pengingat Pajak:">
              County bisa kirim notifikasi pengingat pajak. Klik tombol "Kirim Pengingat" di halaman Pajak.
            </Callout>
          </Section>

          {/* ════════════════════════════════════════════ */}
          {/* SECTION: MULTI AKUN (PRO+) */}
          {/* ════════════════════════════════════════════ */}
          <Section id="multi-akun" icon="👥" iconBg="#ede9fe" title="Multi Akun — Tim Karyawan (Pro+)" subtitle="Boss bisa invite karyawan untuk akses County dengan fitur terbatas">
            <Callout type="info" icon="💎" title="Fitur Pro+ (Add-on)">
              Multi Akun adalah fitur tambahan untuk paket <strong>Pro+</strong>. Hanya bisa diaktifkan oleh Super Admin. Boss bisa invite maksimal <strong>5 karyawan</strong> untuk menggunakan County.
            </Callout>

            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: "#1e293b" }}>Cara Kerja Multi Akun</h3>
            <Steps items={[
              { title: "Super Admin aktifkan Pro+", desc: "Super Admin mengubah paket bisnis kamu dari Pro ke Pro+ di panel admin." },
              { title: "Boss buka Pengaturan → Tab Tim", desc: "Setelah Pro+ aktif, tab 'Tim' muncul di halaman Pengaturan. Di sini boss bisa kelola semua karyawan." },
              { title: "Boss invite karyawan", desc: "Klik 'Undang Anggota' → isi email karyawan → pilih role (Kasir, Manager, Gudang, Viewer, atau Custom) → klik Kirim." },
              { title: "Karyawan terima invite", desc: "Karyawan buka link invite → login dengan akun County mereka → otomatis tergabung ke bisnis boss." },
              { title: "Karyawan akses fitur sesuai izin", desc: "Sidebar karyawan hanya menampilkan menu yang diizinkan. Misalnya Kasir hanya lihat POS dan Transaksi." },
            ]} />

            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "24px 0 12px", color: "#1e293b" }}>5 Role Bawaan</h3>
            <SimpleTable headers={["Role", "Akses Fitur", "Cocok Untuk"]} rows={[
              ["👑 Owner", "Semua fitur tanpa batasan", "Pemilik bisnis"],
              ["📋 Manager", "Semua kecuali pengaturan & tim", "Manajer toko / operasional"],
              ["🛒 Kasir", "POS, Transaksi", "Staff kasir"],
              ["🏭 Gudang", "Stok Produk, Gudang, Riwayat Stok", "Staff gudang / inventory"],
              ["👁️ Viewer", "Dashboard, Laporan (read-only)", "Investor / partner"],
            ]} />

            <Callout type="tip" icon="🎨" title="Custom Permission">
              Boss juga bisa buat kombinasi custom — misalnya kasir yang juga bisa lihat stok, atau gudang yang juga bisa lihat laporan. Tinggal toggle on/off per fitur di halaman edit member.
            </Callout>

            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "24px 0 12px", color: "#1e293b" }}>Batas & Aturan</h3>
            <SimpleTable headers={["Aturan", "Detail"]} rows={[
              ["Maks karyawan", "5 orang per bisnis (Pro+)"],
              ["Siapa yang bisa invite?", "Hanya owner bisnis"],
              ["Siapa yang aktifkan Pro+?", "Hanya Super Admin"],
              ["Karyawan bisa punya bisnis sendiri?", "Bisa! Pakai Business Switcher untuk pindah"],
              ["Karyawan bisa dikeluarkan?", "Bisa, owner klik 'Hapus' di tab Tim"],
            ]} />
          </Section>

          {/* ════════════════════════════════════════════ */}
          {/* SECTION: BUSINESS SWITCHER */}
          {/* ════════════════════════════════════════════ */}
          <Section id="business-switch" icon="🔀" iconBg="#fef9c3" title="Business Switcher — Pindah Antar Bisnis" subtitle="Untuk karyawan yang juga punya bisnis sendiri">
            <p style={{ fontSize: 15, color: "#64748b", marginBottom: 20, lineHeight: 1.7 }}>
              Kalau kamu adalah karyawan di bisnis orang lain <strong>dan</strong> juga punya bisnis sendiri di County, kamu bisa pindah antar bisnis dengan mudah menggunakan <strong>Business Switcher</strong>.
            </p>

            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: "#1e293b" }}>Cara Pakai</h3>
            <Steps items={[
              { title: "Lihat sidebar", desc: "Di bagian atas sidebar, ada dropdown yang menunjukkan bisnis mana yang sedang aktif." },
              { title: "Klik dropdown", desc: "Kamu akan lihat daftar semua bisnis yang bisa kamu akses — bisnis sendiri dan bisnis tempat kamu jadi karyawan." },
              { title: "Pilih bisnis", desc: "Klik bisnis yang mau kamu buka. Sidebar dan semua data akan langsung berubah sesuai bisnis yang dipilih." },
            ]} />

            <Callout type="info" icon="🔑" title="Permission Tetap Berlaku">
              Saat kamu switch ke bisnis boss, kamu tetap hanya bisa akses fitur sesuai role yang diberikan. Misalnya kalau role kamu 'Kasir', kamu hanya bisa buka POS dan Transaksi di bisnis boss — tapi di bisnis sendiri kamu punya akses penuh.
            </Callout>

            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "24px 0 12px", color: "#1e293b" }}>Skenario Umum</h3>
            <SimpleTable headers={["Situasi", "Yang Terjadi"]} rows={[
              ["Karyawan tanpa bisnis sendiri", "Langsung masuk ke dashboard bisnis boss"],
              ["Karyawan + punya bisnis sendiri", "Default buka bisnis sendiri, bisa switch ke bisnis boss via dropdown"],
              ["Owner bisnis (bukan karyawan)", "Dropdown tidak muncul, langsung ke bisnis sendiri"],
              ["Karyawan di 2+ bisnis", "Semua bisnis muncul di dropdown, bisa switch kapan saja"],
            ]} />
          </Section>

          {/* ════════════════════════════════════════════ */}
          {/* SECTION: PENGATURAN */}
          {/* ════════════════════════════════════════════ */}
          <Section id="pengaturan" icon="⚙️" iconBg="#f1f5f9" title="Pengaturan" subtitle="Kustomisasi County sesuai bisnis kamu">
            <SimpleTable headers={["Tab", "Isi"]} rows={[
              ["👤 Profil Bisnis", "Nama bisnis, tipe usaha, alamat, telepon"],
              ["🧾 Pajak", "NPWP, status PKP, karyawan, omzet tahunan"],
              ["🎨 Branding", "Upload logo + warna brand (muncul di invoice & sidebar)"],
              ["🏦 Bank", "Info rekening bank untuk ditampilkan di invoice"],
              ["📱 QRIS", "Upload gambar QRIS untuk struk POS dan pembayaran"],
              ["📂 Kategori", "Buat & kelola kategori dan sub-kategori produk"],
              ["🖊️ Invoice", "Footer kustom, tanda tangan digital, toggle kalkulator"],
              ["🔄 Mode", "Switch Pribadi/UMKM, toggle POS on/off"],
              ["👥 Tim (Pro+)", "Invite karyawan, atur role & permission, hapus anggota"],
            ]} />
          </Section>

          {/* ════════════════════════════════════════════ */}
          {/* SECTION: EXCEL EXPORT */}
          {/* ════════════════════════════════════════════ */}
          <Section id="excel-export" icon="📊" iconBg="#f0fdf4" title="Export Laporan ke Excel" subtitle="Download laporan dalam format Excel untuk analisis lebih lanjut">
            <p style={{ fontSize: 15, color: "#64748b", marginBottom: 20, lineHeight: 1.7 }}>
              Selain PDF dan CSV, sekarang kamu bisa export laporan ke format <strong>Excel (.xls)</strong> yang bisa langsung dibuka di Microsoft Excel, Google Sheets, atau LibreOffice.
            </p>

            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: "#1e293b" }}>Cara Export</h3>
            <Steps items={[
              { title: "Buka halaman Laporan", desc: "Klik menu 'Laporan' di sidebar." },
              { title: "Pilih periode", desc: "Pilih bulan dan tahun yang mau diexport." },
              { title: "Pilih tab laporan", desc: "Pilih 'Laba Rugi' atau 'Arus Kas'." },
              { title: "Klik tombol Excel (hijau)", desc: "Klik tombol hijau bertuliskan 'Excel' di pojok kanan atas kartu laporan. File akan langsung terdownload." },
            ]} />

            <SimpleTable headers={["Format", "Kegunaan", "Bisa Dibuka Di"]} rows={[
              ["📄 PDF", "Cetak atau kirim ke klien/investor", "Browser, Adobe Reader"],
              ["📊 Excel (.xls)", "Analisis data, buat grafik, pivot table", "Excel, Google Sheets, LibreOffice"],
              ["📋 CSV", "Import ke software akuntansi lain", "Semua spreadsheet app"],
            ]} />

            <Callout type="tip" icon="💡" title="Tips">
              Gunakan Excel export kalau kamu mau buat analisis custom — misalnya grafik tren bulanan, perbandingan kategori pengeluaran, atau laporan untuk investor.
            </Callout>
          </Section>

          {/* ════════════════════════════════════════════ */}
          {/* SECTION: ONBOARDING TUR */}
          {/* ════════════════════════════════════════════ */}
          <Section id="onboarding" icon="🎓" iconBg="#ede9fe" title="Tur Panduan Interaktif" subtitle="Panduan pop-up otomatis untuk user baru">
            <p style={{ fontSize: 15, color: "#64748b", marginBottom: 20, lineHeight: 1.7 }}>
              Saat pertama kali masuk County, kamu akan disambut dengan <strong>Tur Panduan Interaktif</strong> — pop-up yang menjelaskan setiap bagian penting di Dashboard dengan cara yang menyenangkan.
            </p>

            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: "#1e293b" }}>Apa yang Ditunjukkan?</h3>
            <SimpleTable headers={["Langkah", "Yang Ditunjukkan"]} rows={[
              ["1. Dashboard", "Penjelasan halaman utama dan ringkasan keuangan"],
              ["2. Aksi Cepat", "Tombol-tombol shortcut: catat pemasukan, pengeluaran, scan struk, POS"],
              ["3. AI Ringkasan", "Fitur AI yang menganalisis keuangan otomatis"],
              ["4. Kartu KPI", "Omzet, pengeluaran, laba bersih, dan estimasi pajak"],
              ["5. Menu Sidebar", "Navigasi ke semua fitur County"],
              ["6. Link Panduan", "Cara akses panduan ini kapan saja"],
            ]} />

            <Callout type="info" icon="🔄" title="Mau Ulang Tur?">
              Kalau mau lihat tur lagi, buka halaman Panduan ini → scroll ke bawah → klik tombol <strong>"Mulai Ulang Tur Panduan"</strong>. Tur akan muncul lagi saat kamu buka Dashboard.
            </Callout>
          </Section>

          {/* ════════════════════════════════════════════ */}
          {/* SECTION: EXTRAS */}
          {/* ════════════════════════════════════════════ */}
          <Section id="extras" icon="✨" iconBg="#fdf4ff" title="Fitur Ekstra" subtitle="Kalkulator, notifikasi, dan PWA">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
              {[
                ["🧮", "Mini Kalkulator", "Tombol kalkulator melayang di pojok kanan bawah layar. Klik untuk buka, klik lagi untuk tutup. Aktifkan di Pengaturan → Invoice → toggle Kalkulator."],
                ["🔔", "Notifikasi Jatuh Tempo", "Ikon lonceng di header menampilkan hutang/piutang yang mau jatuh tempo. Klik untuk lihat detail."],
                ["📱", "Install di HP (PWA)", "Buka di Chrome → menu ⋮ → 'Tambahkan ke layar utama'. County jadi seperti app biasa di HP!"],
                ["🌙", "Mode Gelap", "Toggle di bagian bawah sidebar — switch antara mode terang dan mode gelap."],
              ].map(([icon, title, desc]) => (
                <div key={title} style={{ background: "#f0f4ff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{desc}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* ════════════════════════════════════════════ */}
          {/* SECTION: TIPS */}
          {/* ════════════════════════════════════════════ */}
          <Section id="tips" icon="💡" iconBg="#fef9c3" title="Tips & Trik Penggunaan Maksimal" subtitle="Cara pakai County seperti pro">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
              {[
                { bg: "#fef9c3", border: "#fde047", titleColor: "#854d0e", textColor: "#92400e", icon: "🌅", title: "Rutinitas Pagi", desc: "Cek Dashboard setiap pagi — lihat ringkasan keuangan dan notifikasi jatuh tempo sebelum mulai kerja." },
                { bg: "#dcfce7", border: "#86efac", titleColor: "#14532d", textColor: "#166534", icon: "📷", title: "Scan Semua Struk", desc: "Setiap beli stok atau bayar operasional, langsung scan struk — lebih cepat dari ketik manual." },
                { bg: "#dbeafe", border: "#93c5fd", titleColor: "#1e3a8a", textColor: "#1e40af", icon: "🏭", title: "Pakai Multi-Gudang", desc: "Pisahkan stok per lokasi: gudang produksi, gudang toko, gudang online. Transfer stok antar gudang saat perlu." },
                { bg: "#ede9fe", border: "#c4b5fd", titleColor: "#3b0764", textColor: "#5b21b6", icon: "📊", title: "Review Akhir Bulan", desc: "Cek Laporan Laba Rugi dan Analitik Penjualan setiap akhir bulan — identifikasi tren dan perbaiki strategi." },
                { bg: "#fef9c3", border: "#fde047", titleColor: "#854d0e", textColor: "#92400e", icon: "🏷️", title: "Setup Kategori Dulu", desc: "Sebelum tambah produk, buat dulu kategori di Pengaturan → Kategori. Ini bikin laporan lebih rapi." },
                { bg: "#dcfce7", border: "#86efac", titleColor: "#14532d", textColor: "#166534", icon: "🖼️", title: "Upload Logo Bisnis", desc: "Upload logo di Pengaturan → Branding. Logo akan muncul di invoice dan sidebar — terlihat lebih profesional." },
                { bg: "#dbeafe", border: "#93c5fd", titleColor: "#1e3a8a", textColor: "#1e40af", icon: "📅", title: "Buat Anggaran Tiap Bulan", desc: "Luangkan 5 menit di awal bulan untuk set anggaran per kategori — cegah pengeluaran bocor." },
                { bg: "#ede9fe", border: "#c4b5fd", titleColor: "#3b0764", textColor: "#5b21b6", icon: "🛒", title: "Pakai POS untuk Jual", desc: "Jangan catat penjualan manual — pakai POS agar stok berkurang otomatis dan struk bisa dicetak." },
              ].map((tip) => (
                <div key={tip.title} style={{ background: tip.bg, border: `1px solid ${tip.border}`, borderRadius: 14, padding: 18 }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{tip.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, color: tip.titleColor }}>{tip.title}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.5, color: tip.textColor }}>{tip.desc}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* ════════════════════════════════════════════ */}
          {/* SECTION: FAQ */}
          {/* ════════════════════════════════════════════ */}
          <Section id="faq" icon="❓" iconBg="#eff6ff" title="FAQ — Pertanyaan yang Sering Ditanya" subtitle="Klik pertanyaan untuk lihat jawaban">
            {[
              { q: "💰 Apakah ada biaya bulanan setelah bayar?", a: "Tidak ada! County menggunakan model bayar sekali Rp 299.000 — akses selamanya. Tidak ada biaya bulanan, tidak ada biaya tahunan, tidak ada kejutan tagihan." },
              { q: "📱 Apakah County bisa dipakai di HP?", a: "Bisa! County bisa dipakai di HP, tablet, maupun laptop — cukup buka browser. Bahkan bisa diinstall di home screen HP seperti aplikasi biasa (PWA). Di Android: Chrome → menu ⋮ → 'Tambahkan ke layar utama'. Di iPhone: Safari → Share → 'Tambah ke Layar Utama'." },
              { q: "🏭 Berapa gudang yang bisa dibuat?", a: "Tidak ada batasan! Kamu bisa buat sebanyak mungkin gudang sesuai kebutuhan bisnis. Setiap gudang punya stok terpisah dan bisa transfer antar gudang kapan saja." },
              { q: "🔒 Apakah data saya aman?", a: "Ya, sangat aman. County menggunakan enkripsi dan sistem login OAuth yang aman. Data disimpan di server terproteksi dan hanya bisa diakses oleh pemilik akun." },
              { q: "💻 Bisa dipakai di banyak perangkat sekaligus?", a: "Bisa! Karena County berbasis web, kamu bisa login dari perangkat manapun dan data selalu tersinkronisasi secara real-time." },
              { q: "📊 Berapa batas transaksi dan produk?", a: "Untuk pengguna Pro, tidak ada batasan! Transaksi, produk, gudang, client, laporan — semua unlimited." },
              { q: "📦 Bagaimana stok gudang terupdate?", a: "Stok gudang terupdate otomatis dari: (1) Penjualan POS — stok berkurang dari gudang yang dipilih, (2) Scan struk ke stok — stok bertambah di gudang tujuan, (3) Transaksi pembelian stok — stok bertambah di gudang utama, (4) Transfer antar gudang — stok berpindah. Semua otomatis!" },
              { q: "✏️ Bagaimana kalau salah input transaksi?", a: "Gampang! Buka halaman Transaksi → cari transaksi yang salah → klik ikon pensil untuk edit, atau ikon tempat sampah untuk hapus. Konfirmasi akan muncul sebelum penghapusan." },
              { q: "📤 Bisa export data ke Excel atau PDF?", a: "Bisa! Buka halaman Laporan → klik tombol Export → pilih format PDF, Excel (.xls), atau CSV. File Excel bisa langsung dibuka di Microsoft Excel atau Google Sheets." },
              { q: "👥 Bagaimana cara invite karyawan?", a: "Pastikan bisnis kamu sudah di-upgrade ke Pro+ oleh Super Admin. Lalu buka Pengaturan → tab Tim → klik 'Undang Anggota' → isi email dan pilih role. Karyawan akan terima link invite." },
              { q: "🔀 Karyawan bisa punya bisnis sendiri?", a: "Bisa! Karyawan yang juga punya bisnis sendiri di County bisa switch antar bisnis menggunakan dropdown Business Switcher di sidebar. Permission tetap berlaku sesuai role di masing-masing bisnis." },
              { q: "🎓 Bagaimana cara ulang tur panduan?", a: "Buka halaman Panduan → scroll ke bawah → klik tombol 'Mulai Ulang Tur Panduan'. Tur interaktif akan muncul lagi saat kamu buka Dashboard." },
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
            <p>Panduan Resmi Usher County — Versi 4.0 | Maret 2026</p>
            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Termasuk: Multi Akun, Business Switcher, Gudang, Excel Export, Onboarding, dan 30+ fitur lainnya</p>
            <p style={{ marginTop: 8 }}>
              <a href="https://county.finance" style={{ color: "#22c55e", textDecoration: "none", fontWeight: 600 }}>county.finance</a>
            </p>
          </div>

        </main>
      </div>
    </div>
  );
}

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
    <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #e2e8f0" }}>
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
    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14.5, padding: "10px 14px", background: "#f8faff", borderRadius: 10, border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
          <div>{item.text}</div>
        </li>
      ))}
    </ul>
  );
}
