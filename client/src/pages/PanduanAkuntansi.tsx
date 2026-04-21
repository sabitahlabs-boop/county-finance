import { useEffect, useRef, useState } from "react";

export default function PanduanAkuntansi() {
  const [activeSection, setActiveSection] = useState("prinsip");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Panduan Akuntansi County — Tata Cara Pengisian yang Benar";
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
    { group: "Fondasi", items: [
      { id: "prinsip", icon: "📐", label: "Prinsip Double-Entry" },
      { id: "coa", icon: "📋", label: "Chart of Accounts" },
      { id: "flow", icon: "🔄", label: "Alur Bisnis di County" },
    ]},
    { group: "Studi Kasus Dasar", items: [
      { id: "case1", icon: "1️⃣", label: "Beli Barang Tunai" },
      { id: "case2", icon: "2️⃣", label: "Beli Barang Hutang" },
      { id: "case3", icon: "3️⃣", label: "Jual Sebelum Bayar Supplier" },
      { id: "case4", icon: "4️⃣", label: "Batalkan / Reverse PO" },
      { id: "case5", icon: "5️⃣", label: "Penjualan Kredit (Piutang)" },
      { id: "case6", icon: "6️⃣", label: "Bayar Biaya Operasional" },
      { id: "case7", icon: "7️⃣", label: "Hitung Profit Bulanan" },
      { id: "case8", icon: "8️⃣", label: "Jurnal Penyesuaian" },
    ]},
    { group: "Studi Kasus Lanjutan", items: [
      { id: "case9", icon: "9️⃣", label: "Retur Barang ke Supplier" },
      { id: "case10", icon: "🔟", label: "Transfer Antar Rekening" },
      { id: "case11", icon: "1️⃣1️⃣", label: "Stock Opname" },
      { id: "case12", icon: "1️⃣2️⃣", label: "PO Bayar Sebagian" },
    ]},
    { group: "Referensi", items: [
      { id: "cheatsheet", icon: "📊", label: "Cheat Sheet Jurnal" },
      { id: "checklist", icon: "✅", label: "Checklist Bulanan" },
      { id: "mistakes", icon: "⚠️", label: "Kesalahan Umum" },
      { id: "glossary", icon: "📖", label: "Glosarium" },
    ]},
  ];

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#f0f4ff", minHeight: "100vh", color: "#1e293b" }}>
      {/* TOP NAV */}
      <nav style={{ background: "#1a2744", color: "white", padding: "14px 24px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 12px rgba(0,0,0,0.3)" }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#22c55e", letterSpacing: -0.5 }}>County</span>
        </a>
        <span style={{ background: "#22c55e", color: "white", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>Panduan Akuntansi v1.0</span>
        <span style={{ fontSize: 13, color: "#94a3b8", marginLeft: "auto", display: window.innerWidth > 768 ? "block" : "none" }}>Tata Cara Pengisian yang Benar — Berdasarkan SAK EMKM</span>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ background: "none", border: "none", color: "white", fontSize: 22, cursor: "pointer", marginLeft: window.innerWidth > 768 ? 0 : "auto" }}
        >☰</button>
      </nav>

      <div style={{ display: "flex", minHeight: "calc(100vh - 56px)" }}>
        {/* SIDEBAR */}
        <aside style={{
          width: 280, background: "#1a2744", color: "white", padding: "20px 0",
          position: "sticky", top: 56, height: "calc(100vh - 56px)", overflowY: "auto", flexShrink: 0,
          display: sidebarOpen || window.innerWidth > 768 ? "block" : "none",
          scrollbarWidth: "thin",
        }}>
          {navItems.map((group) => (
            <div key={group.group}>
              <div style={{ padding: "12px 18px 6px", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1.2 }}>
                {group.group}
              </div>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", width: "100%",
                    color: activeSection === item.id ? "white" : "#94a3b8",
                    background: activeSection === item.id ? "rgba(255,255,255,0.06)" : "transparent",
                    borderLeft: activeSection === item.id ? "3px solid #22c55e" : "3px solid transparent",
                    border: "none", borderRight: "none", borderTop: "none", borderBottom: "none",
                    fontSize: 13.5, cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                  }}
                >
                  <span style={{ fontSize: 16, width: 22, textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </aside>

        {/* MAIN */}
        <main ref={mainRef} style={{ flex: 1, padding: "32px 40px", maxWidth: 920 }}>

          {/* HERO */}
          <div style={{
            background: "linear-gradient(135deg, #1a2744 0%, #1e3a8a 100%)",
            borderRadius: 20, padding: 48, color: "white", marginBottom: 36,
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: -60, right: -60, width: 250, height: 250, background: "rgba(34,197,94,0.12)", borderRadius: "50%" }} />
            <div style={{ position: "absolute", bottom: -40, left: "30%", width: 180, height: 180, background: "rgba(59,130,246,0.08)", borderRadius: "50%" }} />
            <div style={{ fontSize: 56, marginBottom: 16, position: "relative", zIndex: 1 }}>📚</div>
            <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, lineHeight: 1.2, position: "relative", zIndex: 1 }}>
              Panduan <span style={{ color: "#22c55e" }}>Akuntansi County</span>
            </h1>
            <p style={{ color: "#94a3b8", fontSize: 16, marginBottom: 28, maxWidth: 600, position: "relative", zIndex: 1, lineHeight: 1.6 }}>
              Tata cara pengisian yang benar berdasarkan standar akuntansi UMKM (SAK EMKM). Ditulis untuk pebisnis, bukan akuntan — semua pakai contoh nyata dan bahasa sehari-hari.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", position: "relative", zIndex: 1 }}>
              {[["12", "Studi Kasus"], ["SAK", "EMKM Based"], ["📝", "Jurnal Otomatis"], ["✅", "Cara Verifikasi"]].map(([num, label]) => (
                <div key={label} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 20px", textAlign: "center", backdropFilter: "blur(4px)" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#22c55e" }}>{num}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 1: PRINSIP DOUBLE-ENTRY */}
          <Section id="prinsip" icon="📐" iconBg="#eff6ff" title="Prinsip Dasar: Double-Entry" subtitle="Aturan emas pembukuan — setiap transaksi selalu punya DUA sisi">
            <p style={{ color: "#64748b", marginBottom: 16 }}>Bayangkan kamu punya dompet dan toko. Kalau kamu ambil uang dari dompet untuk beli barang, maka:</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <Callout type="blue" title="💰 Dompet (Kas)" text="Uang berkurang Rp 100 juta" />
              <Callout type="green" title="📦 Gudang (Persediaan)" text="Barang bertambah senilai Rp 100 juta" />
            </div>
            <p style={{ color: "#64748b", marginBottom: 16 }}>Inilah inti <strong style={{ color: "#1e293b" }}>double-entry</strong>: setiap uang yang keluar, pasti ada sesuatu yang masuk. Setiap uang yang masuk, pasti ada sesuatu yang berkurang. Tidak pernah ada transaksi yang cuma satu sisi.</p>
            <Callout type="info" title="🎯 Kenapa ini penting buat pebisnis?" text="Karena dengan double-entry, kamu bisa tahu persis: berapa uang yang benar-benar kamu punya, berapa yang masih nyangkut di barang atau piutang, dan berapa yang kamu hutangi ke orang lain. Laporan keuangan jadi akurat — bukan asal catat keluar-masuk saja." />
            <h3 style={h3Style}>Istilah Penting (Bahasa Bisnis)</h3>
            <SimpleTable headers={["Istilah Akuntansi", "Artinya dalam Bahasa Bisnis", "Contoh"]} rows={[
              ["Debit", "Bertambah untuk Aset & Biaya", "Stok barang bertambah = Debit Persediaan"],
              ["Kredit", "Bertambah untuk Hutang, Modal & Pendapatan", "Punya hutang baru = Kredit Hutang Usaha"],
              ["Aset", "Semua yang kamu miliki (uang, barang, piutang)", "Kas, stok barang, deposit"],
              ["Liabilitas", "Semua yang kamu hutangi ke orang lain", "Hutang supplier, pinjaman"],
              ["Ekuitas", "Modal — selisih Aset dan Hutang = kekayaan bersih", "Modal awal, laba ditahan"],
              ["HPP", "Harga Pokok Penjualan — berapa biaya barang yang terjual", "Harga beli barang yang laku"],
            ]} />
            <Callout type="tip" title="💡 Rumus Emas" text={<><strong>Aset = Liabilitas + Ekuitas</strong><br />Contoh: Kamu punya barang Rp 100jt (aset) tapi belum bayar ke supplier (hutang Rp 100jt). Aset 100jt = Hutang 100jt + Modal 0. Masih seimbang!</>} />
          </Section>

          {/* SECTION 2: CHART OF ACCOUNTS */}
          <Section id="coa" icon="📋" iconBg="#f0fdf4" title="Chart of Accounts (CoA)" subtitle="Daftar kotak tempat uang dan barang dicatat — mengikuti SAK EMKM">
            <p style={{ color: "#64748b", marginBottom: 16 }}>Bayangkan CoA sebagai lemari dengan banyak laci. Setiap transaksi harus dimasukkan ke laci yang tepat supaya laporan keuangan akurat.</p>
            <SimpleTable headers={["Kode", "Nama Akun", "Tipe", "Fungsi di County"]} rows={[
              ["1101", "Kas Umum", "Aset", "Uang tunai di tangan / kas toko"],
              ["1102", "Bank", "Aset", "Saldo di rekening bank (BCA, BNI, dll)"],
              ["1103", "E-Wallet", "Aset", "Saldo GoPay, OVO, Dana, ShopeePay"],
              ["1201", "Piutang Usaha", "Aset", "Uang yang orang lain hutangi ke kamu"],
              ["1301", "Persediaan Barang Dagang", "Aset", "Nilai barang yang ada di gudang"],
              ["2101", "Hutang Usaha", "Liabilitas", "Uang yang kamu hutangi ke supplier"],
              ["3101", "Modal", "Ekuitas", "Modal awal bisnis"],
              ["4101", "Pendapatan Penjualan", "Pendapatan", "Omzet dari penjualan POS"],
              ["5101", "Harga Pokok Penjualan", "HPP", "Biaya barang yang terjual"],
              ["6101", "Beban Gaji", "Beban", "Gaji karyawan"],
              ["6102", "Beban Sewa", "Beban", "Biaya sewa toko / kantor"],
              ["6103", "Beban Utilitas", "Beban", "Listrik, air, internet"],
              ["6199", "Beban Operasional Lain", "Beban", "Transportasi, perlengkapan, dll"],
            ]} />
            <Callout type="info" title="🏷️ Cara Baca Kode Akun" text="Digit pertama menunjukkan tipe: 1xxx = Aset, 2xxx = Hutang, 3xxx = Modal, 4xxx = Pendapatan, 5xxx = HPP, 6xxx = Beban. County otomatis menggunakan kode ini di balik layar." />
          </Section>

          {/* SECTION 3: ALUR BISNIS */}
          <Section id="flow" icon="🔄" iconBg="#fef9c3" title="Alur Bisnis di County" subtitle="Siklus lengkap dari beli barang sampai hitung profit">
            <FlowDiagram items={["📝 Buat PO", "📦 Terima Barang", "💰 Bayar Supplier", "🛒 Jual via POS", "📊 Cek Laporan"]} />
            <p style={{ color: "#64748b", marginBottom: 16 }}>Di setiap tahap, County otomatis mencatat jurnal akuntansi. Kamu tidak perlu paham akuntansi — tapi kamu perlu paham <strong style={{ color: "#1e293b" }}>urutan yang benar</strong> supaya pembukuan tetap akurat.</p>
            <SimpleTable headers={["Tahap", "Apa yang Terjadi", "Jurnal Otomatis"]} rows={[
              ["1. Buat PO", "Catat rencana pembelian ke supplier, belum ada dampak ke keuangan", "Belum ada jurnal — ini baru rencana"],
              ["2. Terima Barang", "Barang masuk gudang, stok bertambah", "Debit: Persediaan ↑ | Kredit: Hutang Usaha ↑"],
              ["3. Bayar Supplier", "Uang keluar, hutang berkurang", "Debit: Hutang Usaha ↓ | Kredit: Kas/Bank ↓"],
              ["4. Jual via POS", "Barang keluar, uang masuk, profit tercatat", "Debit: Kas ↑ | Kredit: Pendapatan ↑ | Debit: HPP ↑ | Kredit: Persediaan ↓"],
            ]} />
            <Callout type="warn" title="⚠️ Urutan Itu Penting!" text="Jangan loncat tahap. Kalau kamu langsung bayar tanpa buat PO dan terima barang dulu, maka stok tidak bertambah dan HPP tidak terhitung saat jual. Laporan Laba Rugi jadi tidak akurat." />
          </Section>

          {/* CASE 1: BELI BARANG TUNAI */}
          <CaseSection id="case1" num="1️⃣" title="Case 1: Beli Barang ke Supplier — Bayar Tunai" subtitle="Skenario paling sederhana: beli, terima, bayar langsung">
            <Callout type="blue" title="📋 Situasi Bisnis" text="Kamu beli 50 pcs Kaos Polos dari Supplier Textile Jaya seharga Rp 5.000.000 (HPP Rp 100.000/pcs). Barang langsung dikirim dan kamu bayar tunai dari Kas Toko." />
            <h3 style={h3Style}>Langkah di County</h3>
            <Steps items={[
              { title: "Buat Purchase Order (PO)", desc: "Buka menu Purchase Order → klik + Buat PO Baru. Pilih supplier Textile Jaya, tambahkan item Kaos Polos qty 50, harga Rp 100.000. Total: Rp 5.000.000." },
              { title: "Terima Barang (Update status → Diterima)", desc: "Setelah barang tiba, buka PO → klik Tandai Diterima. Stok Kaos Polos otomatis bertambah 50 pcs di gudang. Jurnal: Persediaan +5jt, Hutang Usaha +5jt." },
              { title: "Bayar Supplier (Update status → Lunas)", desc: "Klik Tandai Lunas, pilih rekening Kas Toko. Uang keluar Rp 5jt, hutang hilang. Jurnal: Hutang Usaha -5jt, Kas -5jt." },
            ]} />
            <h3 style={h3Style}>Jurnal yang Tercatat Otomatis</h3>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}><strong>Saat Terima Barang:</strong></p>
            <JournalTable rows={[
              { account: "1301 — Persediaan Barang Dagang", debit: "Rp 5.000.000", credit: "—" },
              { account: "2101 — Hutang Usaha", debit: "—", credit: "Rp 5.000.000", indent: true },
            ]} footer="Rp 5.000.000" />
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 8, marginTop: 16 }}><strong>Saat Bayar Supplier:</strong></p>
            <JournalTable rows={[
              { account: "2101 — Hutang Usaha", debit: "Rp 5.000.000", credit: "—" },
              { account: "1101 — Kas Umum", debit: "—", credit: "Rp 5.000.000", indent: true },
            ]} footer="Rp 5.000.000" />
            <ResultBox items={[
              "Stok Kaos Polos bertambah 50 pcs di gudang",
              "Kas Toko berkurang Rp 5.000.000",
              "Hutang Usaha = Rp 0 (sudah lunas)",
              "Persediaan Barang naik Rp 5.000.000",
            ]} />
            <h3 style={h3Style}>Cara Verifikasi</h3>
            <Checklist items={[
              { icon: "📦", text: "Buka Stok Produk → cek qty Kaos Polos = bertambah 50" },
              { icon: "🏦", text: "Buka Rekening Koran → pilih Kas Toko → ada debit Rp 5jt" },
              { icon: "📊", text: "Buka Laporan GL → cari akun 2101 (Hutang) → saldo harus 0" },
            ]} />
          </CaseSection>

          {/* CASE 2: BELI BARANG HUTANG */}
          <CaseSection id="case2" num="2️⃣" title="Case 2: Beli Barang Belum Bayar (Jadi Hutang)" subtitle="Barang sudah di gudang tapi uang belum keluar — skenario paling umum UMKM">
            <Callout type="blue" title="📋 Situasi Bisnis" text="Kamu beli barang senilai Rp 100.000.000 dari Supplier A. Rincian: Barang A (200 pcs × Rp 200.000 = 40jt), Barang B (150 pcs × Rp 200.000 = 30jt), Barang C (100 pcs × Rp 300.000 = 30jt). Barang sudah dikirim, tapi belum dibayar." />
            <h3 style={h3Style}>Langkah di County</h3>
            <Steps items={[
              { title: "Buat Purchase Order", desc: "Buka Purchase Order → tambahkan 3 item (A, B, C) dengan qty dan harga masing-masing. Total: Rp 100.000.000." },
              { title: "Terima Barang (Tandai Diterima)", desc: "Klik Tandai Diterima. Stok semua item bertambah di gudang. County otomatis mencatat hutang Rp 100jt ke Supplier A." },
              { title: "⏸️ JANGAN bayar dulu — status tetap Diterima", desc: "Biarkan PO dalam status Diterima. Barang sudah bisa dijual via POS. Hutang tetap tercatat di pembukuan sampai kamu bayar." },
            ]} />
            <h3 style={h3Style}>Jurnal yang Tercatat Otomatis</h3>
            <JournalTable rows={[
              { account: "1301 — Persediaan Barang Dagang", debit: "Rp 100.000.000", credit: "—" },
              { account: "2101 — Hutang Usaha", debit: "—", credit: "Rp 100.000.000", indent: true },
            ]} footer="Rp 100.000.000" />
            <ResultBox items={[
              "Stok bertambah: A (200 pcs), B (150 pcs), C (100 pcs)",
              "Kas Toko: TIDAK BERUBAH (uang belum keluar)",
              "Hutang Usaha: +Rp 100.000.000 (tercatat otomatis)",
              "Barang sudah bisa dijual via POS walaupun belum bayar",
            ]} />
            <Callout type="info" title="📝 Ini Benar & Normal!" text="Di akuntansi, sah-sah saja punya barang yang belum dibayar. Yang penting tercatat sebagai hutang. Kalau kamu buka Laporan GL dan lihat akun 2101 (Hutang Usaha), saldo harus menunjukkan Rp 100jt. Itu artinya pembukuanmu benar." />
            <WrongBox items={[
              "Hutang tidak muncul di Laporan GL → kemungkinan status PO tidak di-update ke Diterima",
              "Stok tidak bertambah → kemungkinan kamu lupa klik Tandai Diterima",
              "Kas berkurang padahal belum bayar → kemungkinan salah pilih status Lunas langsung",
            ]} />
          </CaseSection>

          {/* CASE 3: JUAL SEBELUM BAYAR SUPPLIER */}
          <CaseSection id="case3" num="3️⃣" title="Case 3: Jual Barang Sebelum Bayar Supplier" subtitle="Barang sudah di gudang, belum bayar ke supplier, tapi sudah mulai jualan">
            <Callout type="blue" title="📋 Lanjutan dari Case 2" text="Dari stok 200 pcs Barang A (HPP Rp 200.000), kamu berhasil jual 80 pcs dengan harga jual Rp 350.000/pcs via POS. Total omzet: Rp 28.000.000. Kamu belum bayar ke Supplier A sama sekali." />
            <h3 style={h3Style}>Langkah di County</h3>
            <Steps items={[
              { title: "Jual via POS seperti biasa", desc: "Buka POS → cari Barang A → qty 80 → checkout. Pilih metode pembayaran (tunai / transfer / QRIS). Stok otomatis berkurang 80 pcs." },
            ]} />
            <h3 style={h3Style}>Jurnal yang Tercatat Otomatis (Saat Jual)</h3>
            <JournalTable rows={[
              { account: "1101 — Kas Umum", debit: "Rp 28.000.000", credit: "—", note: "Uang masuk dari penjualan" },
              { account: "4101 — Pendapatan Penjualan", debit: "—", credit: "Rp 28.000.000", indent: true, note: "Omzet tercatat" },
              { account: "5101 — HPP", debit: "Rp 16.000.000", credit: "—", note: "80 × Rp 200.000 (harga beli)" },
              { account: "1301 — Persediaan", debit: "—", credit: "Rp 16.000.000", indent: true, note: "Stok berkurang" },
            ]} footer="Rp 44.000.000" />
            <h3 style={h3Style}>Kondisi Pembukuan Setelah Jual</h3>
            <SimpleTable headers={["Akun", "Saldo", "Penjelasan"]} rows={[
              ["💰 Kas", "+Rp 28.000.000", "Uang dari penjualan 80 pcs"],
              ["📦 Persediaan", "Rp 84.000.000", "100jt − 16jt HPP yang terjual = sisa stok"],
              ["💸 Hutang Usaha", "Rp 100.000.000", "Masih utuh — belum bayar sama sekali"],
              ["📈 Pendapatan", "Rp 28.000.000", "Omzet kotor"],
              ["📉 HPP", "Rp 16.000.000", "Biaya 80 pcs yang terjual"],
            ]} />
            <Callout type="info" title="💡 Laba Kotor" text={<>Pendapatan Rp 28jt − HPP Rp 16jt = <strong>Laba Kotor Rp 12.000.000</strong><br />Tapi ingat: kamu masih <strong>hutang Rp 100jt</strong> ke Supplier A! Jadi uang Rp 28jt di kas bukan berarti kamu untung bersih segitu — sebagian harus untuk bayar supplier.</>} />
            <Callout type="warn" title="⚠️ Jangan Sampai Lupa Bayar Supplier!" text="Kas kamu Rp 28jt, tapi hutang Rp 100jt. Kalau semua uang dipakai belanja pribadi, bisnis jadi minus. Prioritaskan bayar supplier dari hasil penjualan." />
          </CaseSection>

          {/* CASE 4: REVERSE PO */}
          <CaseSection id="case4" num="4️⃣" title="Case 4: Batalkan / Reverse Purchase Order" subtitle="Apa yang terjadi kalau PO dibatalkan — dan kenapa uang TIDAK boleh tiba-tiba muncul">
            <Callout type="red" title="📋 Situasi Bisnis" text="Dari Case 2: kamu sudah terima barang Rp 100jt, sudah jual 80 pcs Barang A (senilai Rp 16jt HPP), belum bayar ke Supplier A. Sekarang kamu mau batalkan seluruh PO." />
            <h3 style={h3Style}>Apa yang Terjadi Saat Hapus PO di County</h3>
            <Steps items={[
              { title: "Stok yang BELUM terjual dikembalikan (reversed)", desc: "Barang A sisa 120 pcs, Barang B 150 pcs, Barang C 100 pcs → semua dikurangi dari gudang. Stok kembali ke kondisi sebelum PO." },
              { title: "Jurnal GL di-reverse (bukan dihapus!)", desc: "County membuat jurnal pembalik — bukan menghapus catatan lama. Ini penting untuk audit trail. Jurnal lama ditandai REVERSED, jurnal baru mengembalikan saldo." },
              { title: "Hutang otomatis hilang", desc: "Karena barang dikembalikan, hutang Rp 100jt juga di-reverse. Saldo hutang kembali ke 0." },
            ]} />
            <h3 style={h3Style}>Jurnal Pembalik (Reversal)</h3>
            <JournalTable rows={[
              { account: "2101 — Hutang Usaha", debit: "Rp 100.000.000", credit: "—", note: "Hutang dibatalkan" },
              { account: "1301 — Persediaan", debit: "—", credit: "Rp 100.000.000", indent: true, note: "Stok dikembalikan" },
            ]} footer="Rp 100.000.000" />
            <WrongBox items={[
              "Kas tiba-tiba bertambah Rp 100jt → SALAH! Kamu kan belum pernah bayar, jadi tidak ada uang yang kembali",
              "Catatan jurnal lama hilang/dihapus → SALAH! Harus ada trail bahwa PO pernah ada lalu dibatalkan",
              "Stok yang sudah terjual (80 pcs Barang A) ikut dikembalikan → SALAH! Yang sudah terjual tetap terjual",
            ]} />
            <ResultBox items={[
              "Kas: tetap Rp 28jt (dari penjualan 80 pcs — ini uang yang SAH milikmu)",
              "Hutang: kembali ke Rp 0",
              "Stok sisa: kembali ke 0 (yang belum terjual dikembalikan)",
              "Catatan: Ada jurnal asli + jurnal pembalik (audit trail lengkap)",
            ]} />
            <Callout type="info" title="🧮 Realita Bisnis: Kalau Barang Sebagian Sudah Laku" text="Kalau kamu sudah jual 80 pcs seharga Rp 28jt (HPP 16jt), maka secara bisnis kamu tetap harus bayar HPP barang yang sudah laku = Rp 16.000.000 ke Supplier A. Sisanya (barang yang belum laku) bisa diretur. Negosiasi ini dilakukan di luar County — tapi pembukuannya tetap harus benar." />
          </CaseSection>

          {/* CASE 5: PENJUALAN KREDIT */}
          <CaseSection id="case5" num="5️⃣" title="Case 5: Penjualan Kredit (Piutang)" subtitle="Barang sudah keluar tapi uang belum masuk — pelanggan bayar nanti">
            <Callout type="blue" title="📋 Situasi Bisnis" text="Pelanggan Toko Maju beli 100 pcs Barang B seharga Rp 350.000/pcs (total Rp 35.000.000). Bayar nanti — kredit 30 hari." />
            <h3 style={h3Style}>Langkah di County</h3>
            <Steps items={[
              { title: "Jual via POS → catat sebagai Penjualan Kredit", desc: "Checkout normal, pilih pelanggan Toko Maju, catat sebagai kredit. Set jatuh tempo 30 hari. Stok berkurang 100 pcs." },
              { title: "Menunggu — piutang tercatat otomatis", desc: "Di Hutang & Piutang, muncul piutang Rp 35jt dari Toko Maju. Status: Belum Lunas. Kas belum bertambah." },
              { title: "Toko Maju bayar cicilan Rp 20jt", desc: "Buka Penjualan Kredit → klik detail → Catat Pembayaran → nominal Rp 20jt, pilih rekening BCA Bisnis. Status berubah ke Cicilan." },
              { title: "Toko Maju bayar sisanya Rp 15jt", desc: "Catat pembayaran lagi Rp 15jt. Status berubah ke Lunas. Piutang = 0." },
            ]} />
            <h3 style={h3Style}>Alur Jurnal</h3>
            <SimpleTable headers={["Saat", "Debit", "Kredit", "Nominal"]} rows={[
              ["Jual Kredit", "1201 Piutang Usaha", "4101 Pendapatan", "Rp 35.000.000"],
              ["Jual Kredit", "5101 HPP", "1301 Persediaan", "Rp 20.000.000"],
              ["Terima Cicilan 1", "1102 Bank (BCA)", "1201 Piutang", "Rp 20.000.000"],
              ["Terima Cicilan 2", "1102 Bank (BCA)", "1201 Piutang", "Rp 15.000.000"],
            ]} />
            <ResultBox items={[
              "Piutang: Rp 0 (sudah lunas)",
              "Bank BCA: +Rp 35.000.000",
              "Stok Barang B: −100 pcs",
              "Laba Kotor dari transaksi ini: Rp 35jt − Rp 20jt HPP = Rp 15.000.000",
            ]} />
          </CaseSection>

          {/* CASE 6: BAYAR BIAYA OPERASIONAL */}
          <CaseSection id="case6" num="6️⃣" title="Case 6: Bayar Biaya Operasional" subtitle="Gaji, sewa, listrik — semua pengeluaran non-barang">
            <Callout type="blue" title="📋 Situasi Bisnis" text="Akhir bulan, kamu bayar: Gaji 2 karyawan Rp 8.000.000, Sewa toko Rp 5.000.000, Listrik + Internet Rp 2.000.000. Total pengeluaran: Rp 15.000.000." />
            <h3 style={h3Style}>Langkah di County</h3>
            <Steps items={[
              { title: "Catat Pengeluaran Gaji", desc: "Buka Transaksi → tab Pengeluaran → + Baru. Kategori: Gaji Karyawan, nominal Rp 8.000.000, rekening: BCA Bisnis." },
              { title: "Catat Pengeluaran Sewa", desc: "Kategori: Sewa / Kontrak, nominal Rp 5.000.000, rekening: BCA Bisnis." },
              { title: "Catat Pengeluaran Utilitas", desc: "Kategori: Utilitas, nominal Rp 2.000.000, rekening: BCA Bisnis." },
            ]} />
            <h3 style={h3Style}>Jurnal Otomatis</h3>
            <JournalTable rows={[
              { account: "6101 — Beban Gaji", debit: "Rp 8.000.000", credit: "—" },
              { account: "6102 — Beban Sewa", debit: "Rp 5.000.000", credit: "—" },
              { account: "6103 — Beban Utilitas", debit: "Rp 2.000.000", credit: "—" },
              { account: "1102 — Bank (BCA)", debit: "—", credit: "Rp 15.000.000", indent: true },
            ]} footer="Rp 15.000.000" />
            <Callout type="warn" title="⚠️ Pilih Kategori yang Tepat!" text="Salah kategori = Laba Rugi salah. Gaji masuk Gaji, jangan masuk Bahan Baku. Sewa masuk Sewa, jangan masuk Operasional Lain. County menggunakan kategori ini untuk menyusun laporan Laba Rugi Detail." />
          </CaseSection>

          {/* CASE 7: HITUNG PROFIT BULANAN */}
          <CaseSection id="case7" num="7️⃣" title="Case 7: Hitung Profit Bulanan" subtitle="Cara menghitung apakah bisnis untung atau rugi bulan ini">
            <Callout type="green" title="📋 Rekap Bulan Ini (dari case sebelumnya)" text="Penjualan tunai: Rp 28jt. Penjualan kredit: Rp 35jt. HPP total: Rp 36jt. Beban operasional: Rp 15jt." />
            <h3 style={h3Style}>Rumus Laba Rugi</h3>
            <SimpleTable headers={["Komponen", "Rumus", "Nominal"]} rows={[
              ["Pendapatan Kotor", "Omzet POS tunai + kredit", "Rp 63.000.000"],
              ["HPP", "Harga beli barang yang terjual", "(Rp 36.000.000)"],
              ["LABA KOTOR ⭐", "Pendapatan − HPP", "Rp 27.000.000"],
              ["Beban Gaji", "", "(Rp 8.000.000)"],
              ["Beban Sewa", "", "(Rp 5.000.000)"],
              ["Beban Utilitas", "", "(Rp 2.000.000)"],
              ["Total Beban Operasional", "", "(Rp 15.000.000)"],
              ["LABA BERSIH ⭐", "Laba Kotor − Beban", "Rp 12.000.000"],
            ]} />
            <h3 style={h3Style}>Cara Lihat di County</h3>
            <Checklist items={[
              { icon: "📊", text: "Buka Laba Rugi Detail → set tanggal bulan ini → semua angka di atas otomatis tersaji" },
              { icon: "💊", text: "Cek Dashboard → KPI card Laba/Rugi menunjukkan angka yang sama" },
              { icon: "📈", text: "Margin = Laba Kotor / Pendapatan = 27jt / 63jt = 42.8% → sehat untuk retail!" },
            ]} />
            <Callout type="tip" title="💡 Tips Baca Laba Rugi" text="Jangan cuma lihat angka Laba Bersih. Perhatikan juga: (1) Margin laba kotor — kalau turun, HPP kamu naik atau harga jual turun. (2) Perbandingan vs bulan lalu (%) — tren lebih penting dari angka absolut. (3) Beban terbesar — di situ potensi efisiensi." />
          </CaseSection>

          {/* CASE 8: JURNAL PENYESUAIAN */}
          <CaseSection id="case8" num="8️⃣" title="Case 8: Jurnal Penyesuaian (Manual Adjustment)" subtitle="Koreksi pembukuan tanpa mengubah data lama — hanya bisa dilakukan Owner">
            <Callout type="purple" title="📋 Situasi Bisnis" text="Setelah stock opname, kamu menemukan stok fisik Barang C hanya 95 pcs, padahal di sistem tercatat 100 pcs. Selisih 5 pcs (senilai Rp 1.500.000) perlu disesuaikan." />
            <h3 style={h3Style}>Langkah di County</h3>
            <Steps items={[
              { title: "Buka menu Jurnal Penyesuaian", desc: "Di sidebar, klik Jurnal Penyesuaian. Menu ini hanya bisa diakses oleh Owner bisnis." },
              { title: "Klik Buat Penyesuaian Baru", desc: "Isi deskripsi: Penyesuaian stok opname Barang C — selisih 5 pcs." },
              { title: "Tambahkan baris jurnal", desc: "Baris 1: Akun 6199 Beban Operasional Lain → Debit Rp 1.500.000 | Baris 2: Akun 1301 Persediaan → Kredit Rp 1.500.000. Total Debit harus = Total Kredit (balance)." },
              { title: "Simpan", desc: "Jurnal penyesuaian tersimpan. Saldo persediaan di GL berkurang Rp 1.5jt, beban bertambah Rp 1.5jt." },
            ]} />
            <Callout type="warn" title="🔒 Hanya Owner yang Bisa!" text="Fitur Jurnal Penyesuaian sengaja dibatasi hanya untuk owner bisnis. Jika staff/manager mencoba mengakses, akan muncul error Akses Ditolak. Ini untuk mencegah manipulasi data keuangan." />
            <h3 style={h3Style}>Kapan Perlu Jurnal Penyesuaian?</h3>
            <SimpleTable headers={["Situasi", "Debit", "Kredit"]} rows={[
              ["Stok selisih (kurang dari sistem)", "Beban / Selisih Stok", "Persediaan"],
              ["Stok selisih (lebih dari sistem)", "Persediaan", "Pendapatan Lain"],
              ["Salah catat kategori transaksi", "Kategori yang benar", "Kategori yang salah"],
              ["Piutang macet (write-off)", "Beban Piutang Tak Tertagih", "Piutang Usaha"],
              ["Koreksi saldo awal", "Akun yang harus naik", "Akun yang harus turun"],
            ]} />
          </CaseSection>

          {/* CASE 9: RETUR BARANG */}
          <CaseSection id="case9" num="9️⃣" title="Case 9: Retur Barang ke Supplier" subtitle="Barang cacat atau salah kirim — kembalikan ke supplier">
            <Callout type="blue" title="📋 Situasi Bisnis" text="Dari PO senilai Rp 10.000.000 (100 pcs × Rp 100.000), ditemukan 10 pcs cacat. Kamu retur ke supplier. Supplier mengurangi tagihan Rp 1.000.000." />
            <h3 style={h3Style}>Cara Menangani di County</h3>
            <p style={{ color: "#64748b", marginBottom: 16 }}>Saat ini County belum punya fitur retur parsial. Gunakan <strong style={{ color: "#1e293b" }}>Jurnal Penyesuaian</strong>:</p>
            <JournalTable rows={[
              { account: "2101 — Hutang Usaha", debit: "Rp 1.000.000", credit: "—" },
              { account: "1301 — Persediaan", debit: "—", credit: "Rp 1.000.000", indent: true },
            ]} footer="Rp 1.000.000" />
            <p style={{ color: "#64748b", marginBottom: 16 }}>Artinya: hutang ke supplier berkurang Rp 1jt (karena kamu retur), dan stok juga berkurang (barang cacat keluar). Jangan lupa <strong style={{ color: "#1e293b" }}>kurangi stok manual</strong> di Stok Produk → adjustment untuk 10 pcs yang diretur.</p>
            <ResultBox items={[
              "Stok: 100 − 10 = 90 pcs",
              "Hutang: Rp 10jt − Rp 1jt = Rp 9.000.000",
              "Nilai persediaan: 90 × Rp 100.000 = Rp 9.000.000 (cocok!)",
            ]} />
          </CaseSection>

          {/* CASE 10: TRANSFER ANTAR REKENING */}
          <CaseSection id="case10" num="🔟" title="Case 10: Transfer Antar Rekening" subtitle="Pindah uang dari kas ke bank, bank ke e-wallet, dll">
            <Callout type="blue" title="📋 Situasi Bisnis" text="Kamu setor uang tunai dari kas toko ke rekening BCA sebesar Rp 10.000.000." />
            <h3 style={h3Style}>Cara Menangani di County</h3>
            <p style={{ color: "#64748b", marginBottom: 16 }}>Catat <strong style={{ color: "#1e293b" }}>2 transaksi</strong>:</p>
            <Steps items={[
              { title: "Catat Pengeluaran dari Kas Toko", desc: "Transaksi → Pengeluaran → Rp 10jt → kategori Transfer Internal → rekening: Kas Toko." },
              { title: "Catat Pemasukan ke BCA", desc: "Transaksi → Pemasukan → Rp 10jt → kategori Transfer Internal → rekening: BCA Bisnis." },
            ]} />
            <Callout type="info" title="💡 Kenapa 2 transaksi?" text="Karena County mencatat setiap rekening terpisah. Pengeluaran dari Kas Toko akan mengurangi saldo Kas, dan Pemasukan ke BCA akan menambah saldo BCA. Jurnal akhirnya akan balance." />
          </CaseSection>

          {/* CASE 11: STOCK OPNAME */}
          <CaseSection id="case11" num="1️⃣1️⃣" title="Case 11: Stock Opname" subtitle="Penghitungan fisik stok dan rekonsiliasi dengan sistem">
            <Callout type="blue" title="📋 Situasi Bisnis" text="Setiap akhir bulan, kamu hitung stok fisik di gudang dan cocokkan dengan sistem. Proses ini disebut stock opname." />
            <h3 style={h3Style}>Langkah Stock Opname</h3>
            <Steps items={[
              { title: "Siapkan daftar stok dari sistem", desc: "Buka Stok Produk → export ke Excel. Ini baseline yang akan dibandingkan dengan fisik." },
              { title: "Hitung stok fisik", desc: "Hitung satu per satu di gudang. Catat di kertas atau input langsung di tablet." },
              { title: "Bandingkan dan cari selisih", desc: "Selisih = Stok Fisik − Stok Sistem. Jika ada selisih, catat dan cari penyebabnya." },
              { title: "Catat penyesuaian di Jurnal Penyesuaian", desc: "Untuk setiap selisih, buat jurnal penyesuaian (hanya owner yang bisa)." },
            ]} />
            <Callout type="tip" title="💡 Tips Stock Opname" text="Lakukan setiap akhir bulan atau kuartal. Agenda: matikan POS sementara, hitung bersama-sama, catat hasil, buat adjustment di hari berikutnya. Konsistensi adalah kunci akurasi data." />
          </CaseSection>

          {/* CASE 12: PO BAYAR SEBAGIAN */}
          <CaseSection id="case12" num="1️⃣2️⃣" title="Case 12: PO Bayar Sebagian" subtitle="Cicilan pembayaran ke supplier — tercatat otomatis">
            <Callout type="blue" title="📋 Situasi Bisnis" text="Kamu beli barang Rp 10.000.000 dari Supplier Z. Kesepakatan: bayar 50% DP saat terima barang, 50% dalam 30 hari." />
            <h3 style={h3Style}>Langkah di County</h3>
            <Steps items={[
              { title: "Buat PO dan tandai Diterima", desc: "Status berubah menjadi Diterima. Hutang Rp 10jt tercatat otomatis." },
              { title: "Bayar DP Rp 5jt", desc: "Klik Edit / Bayar Sebagian → catat pembayaran Rp 5jt. Hutang berkurang jadi Rp 5jt." },
              { title: "Bayar sisanya Rp 5jt dalam 30 hari", desc: "Catat pembayaran lagi Rp 5jt. Status PO berubah menjadi Lunas." },
            ]} />
            <Callout type="info" title="📊 Progress Tracking" text="Di Laporan PO, kamu bisa lihat progress pembayaran setiap PO. Kolom Status menunjukkan: Ditunggu, Diterima, Cicilan, Lunas." />
          </CaseSection>

          {/* CHEAT SHEET */}
          <Section id="cheatsheet" icon="📊" iconBg="#fff7ed" title="Cheat Sheet Jurnal Akuntansi" subtitle="Referensi cepat jurnal untuk transaksi umum">
            <SimpleTable headers={["Transaksi", "Debit", "Kredit"]} rows={[
              ["Beli barang tunai", "Persediaan (1301)", "Kas (1101)"],
              ["Beli barang hutang", "Persediaan (1301)", "Hutang Usaha (2101)"],
              ["Jual barang tunai", "Kas (1101) | HPP (5101)", "Pendapatan (4101) | Persediaan (1301)"],
              ["Jual barang kredit", "Piutang (1201) | HPP (5101)", "Pendapatan (4101) | Persediaan (1301)"],
              ["Terima pembayaran piutang", "Kas/Bank (1101/1102)", "Piutang (1201)"],
              ["Bayar hutang supplier", "Hutang Usaha (2101)", "Kas/Bank (1101/1102)"],
              ["Bayar gaji karyawan", "Beban Gaji (6101)", "Kas/Bank (1101/1102)"],
              ["Bayar sewa toko", "Beban Sewa (6102)", "Kas/Bank (1101/1102)"],
              ["Bayar listrik/air", "Beban Utilitas (6103)", "Kas/Bank (1101/1102)"],
              ["Transfer kas ke bank", "Bank (1102)", "Kas (1101)"],
              ["Stock opname kurang", "Beban Operasional Lain (6199)", "Persediaan (1301)"],
              ["Stock opname lebih", "Persediaan (1301)", "Pendapatan Lain (4999)"],
            ]} />
          </Section>

          {/* CHECKLIST */}
          <Section id="checklist" icon="✅" iconBg="#f0fdf4" title="Checklist Bulanan" subtitle="Rutinitas akhir bulan untuk pembukuan yang akurat">
            <h3 style={h3Style}>Minggu Pertama</h3>
            <Checklist items={[
              { icon: "📊", text: "Cek Laba Rugi Detail — apakah angka HPP masuk akal?" },
              { icon: "🏦", text: "Cek Rekening Koran — cocokkan dengan mutasi bank riil" },
              { icon: "📦", text: "Lakukan Stock Opname jika ada selisih stok yang suspicious" },
            ]} />
            <h3 style={h3Style}>Minggu Kedua</h3>
            <Checklist items={[
              { icon: "🤝", text: "Review Hutang & Piutang — follow up yang mendekati jatuh tempo" },
              { icon: "💸", text: "Catat semua transaksi manual yang belum tercatat" },
              { icon: "📝", text: "Buat Jurnal Penyesuaian jika ada koreksi yang perlu" },
            ]} />
            <h3 style={h3Style}>Minggu Ketiga</h3>
            <Checklist items={[
              { icon: "🧾", text: "Hitung estimasi pajak dan catat di modul Pajak" },
              { icon: "📋", text: "Export Laporan GL untuk arsip" },
              { icon: "💊", text: "Cek Dashboard — apakah Health Score konsisten atau ada masalah?" },
            ]} />
          </Section>

          {/* MISTAKES */}
          <Section id="mistakes" icon="⚠️" iconBg="#fee2e2" title="Kesalahan Umum & Cara Mengatasinya" subtitle="Problem yang sering terjadi dan solusinya">
            <SimpleTable headers={["Kesalahan", "Gejala", "Penyebab", "Solusi"]} rows={[
              ["HPP tidak tercatat", "Laba Rugi 0 atau negatif meski banyak jual", "Harga beli (HPP) tidak diisi saat input produk", "Edit produk → isi HPP → simpan. Jual lagi akan terukur."],
              ["Hutang tidak muncul", "Laporan GL Hutang = 0 padahal punya PO belum bayar", "Status PO tidak di-update ke Diterima", "Buka PO → klik Tandai Diterima → hutang otomatis muncul"],
              ["Stok negatif", "Stok menunjukkan angka negatif (-10 pcs)", "Jual lebih banyak dari stok yang ada", "Cek stok awal — mungkin kurang. Catat adjustment."],
              ["Kas tidak pas", "Rekening Koran tidak match dengan kas fisik", "Ada transaksi manual yang belum di-catat, atau POS tidak sync", "Cek riwayat transaksi, cari yang missing. Jangan edit lama, catat adjustment."],
              ["Laporan tidak update", "Laporan masih menunjukkan data lama", "Browser cache atau belum refresh setelah input", "Ctrl+Shift+Del (hard refresh) di browser — hapus cache."],
            ]} />
          </Section>

          {/* GLOSSARY */}
          <Section id="glossary" icon="📖" iconBg="#ede9fe" title="Glosarium Istilah Akuntansi" subtitle="Definisi singkat untuk terminologi yang dipakai">
            <SimpleTable headers={["Istilah", "Definisi"]} rows={[
              ["Debit", "Sisi kiri jurnal — mencatat kenaikan Aset & Biaya, penurunan Hutang & Pendapatan"],
              ["Kredit", "Sisi kanan jurnal — mencatat penurunan Aset & Biaya, kenaikan Hutang & Pendapatan"],
              ["Double-Entry", "Prinsip dasar akuntansi: setiap transaksi punya 2 sisi yang balance"],
              ["Aset", "Semua yang dimiliki bisnis (uang, barang, piutang, aset tetap)"],
              ["Liabilitas", "Semua yang dihutangkan bisnis (hutang supplier, pinjaman)"],
              ["Ekuitas", "Kekayaan bersih = Aset − Liabilitas. Sering disebut Modal."],
              ["HPP (Harga Pokok Penjualan)", "Biaya pembelian barang yang sudah terjual kepada pelanggan"],
              ["FIFO", "First In First Out — metode valuasi stok dimana barang yang masuk pertama dijual pertama"],
              ["Jurnal", "Catatan transaksi yang berisi akun debit, akun kredit, dan nominal"],
              ["GL (General Ledger)", "Buku besar — ringkasan saldo semua akun di perusahaan"],
              ["Piutang", "Uang yang orang lain hutang ke bisnis (aset)"],
              ["Hutang", "Uang yang bisnis hutang ke orang lain (liabilitas)"],
              ["Laba Kotor", "Pendapatan − HPP. Belum dikurangi beban operasional."],
              ["Laba Bersih", "Laba Kotor − Total Beban. Ini profit sesungguhnya."],
              ["Jurnal Penyesuaian", "Jurnal manual yang dibuat owner untuk koreksi/adjustment pembukuan"],
              ["Reverse", "Membatalkan transaksi dengan membuat jurnal kebalikan"],
              ["SAK EMKM", "Standar Akuntansi Keuangan Entitas Mikro, Kecil, Menengah — standar yang dipakai UMKM"],
            ]} />
          </Section>

          {/* FOOTER */}
          <div style={{ textAlign: "center", padding: "32px 0", color: "#64748b", fontSize: 13, borderTop: "1px solid #e2e8f0", marginTop: 32 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#1a2744", marginBottom: 8 }}>County</div>
            <p>Panduan Akuntansi County — Versi 1.0 | April 2026</p>
            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>12 Studi Kasus, 4 Referensi, Berdasarkan SAK EMKM</p>
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

function CaseSection({ id, num, title, subtitle, children }: {
  id: string; num: string; title: string; subtitle: string; children: React.ReactNode;
}) {
  const colors: { [key: string]: string } = {
    "1️⃣": "#dcfce7", "2️⃣": "#dbeafe", "3️⃣": "#fef3c7", "4️⃣": "#fee2e2",
    "5️⃣": "#fef9c3", "6️⃣": "#ede9fe", "7️⃣": "#dcfce7", "8️⃣": "#f5f3ff",
    "9️⃣": "#fee2e2", "🔟": "#dbeafe", "1️⃣1️⃣": "#ede9fe", "1️⃣2️⃣": "#eff6ff",
  };
  return (
    <Section id={id} icon={num} iconBg={colors[num] || "#eff6ff"} title={title} subtitle={subtitle}>
      {children}
    </Section>
  );
}

function Steps({ items }: { items: { title: string; desc: string }[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
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

function Callout({ type, title, text }: { type: string; title: string; text: string | React.ReactNode }) {
  const styles: { [key: string]: { bg: string; border: string; color: string } } = {
    blue: { bg: "#eff6ff", border: "#bfdbfe", color: "#1e40af" },
    green: { bg: "#f0fdf4", border: "#bbf7d0", color: "#166534" },
    yellow: { bg: "#fffbeb", border: "#fde68a", color: "#92400e" },
    red: { bg: "#fef2f2", border: "#fecaca", color: "#991b1b" },
    purple: { bg: "#f5f3ff", border: "#ddd6fe", color: "#5b21b6" },
    info: { bg: "#eff6ff", border: "#bfdbfe", color: "#1e40af" },
    warn: { bg: "#fffbeb", border: "#fde68a", color: "#92400e" },
    tip: { bg: "#f0fdf4", border: "#bbf7d0", color: "#166534" },
  };
  const s = styles[type] || styles.info;
  return (
    <div style={{ borderRadius: 12, padding: "16px 20px", display: "flex", gap: 12, alignItems: "flex-start", margin: "20px 0", fontSize: 14, background: s.bg, border: `1px solid ${s.border}`, color: s.color, lineHeight: 1.6 }}>
      <div>
        {title && <strong style={{ display: "block", marginBottom: 4 }}>{title}</strong>}
        {text}
      </div>
    </div>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #e2e8f0", marginBottom: 20 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr>{headers.map((h) => <th key={h} style={{ background: "#1a2744", color: "white", padding: "12px 16px", textAlign: "left", fontWeight: 600, fontSize: 13 }}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => <td key={j} style={{ padding: "11px 16px", borderBottom: i < rows.length - 1 ? "1px solid #e2e8f0" : "none", background: i % 2 === 1 ? "#f8faff" : "white", verticalAlign: "top" }}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function JournalTable({ rows, footer }: {
  rows: { account: string; debit: string; credit: string; indent?: boolean; note?: string }[];
  footer?: string;
}) {
  return (
    <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #e2e8f0", marginBottom: 20 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ background: "#243352", color: "white" }}>
            <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Akun</th>
            <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Debit</th>
            <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Kredit</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 1 ? "#f8faff" : "white" }}>
              <td style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", paddingLeft: row.indent ? 32 : 16, fontWeight: 600, color: "#1e293b" }}>{row.account}</td>
              <td style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", textAlign: "right", color: "#16a34a", fontWeight: 600 }}>{row.debit}</td>
              <td style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", textAlign: "right", color: "#dc2626", fontWeight: 600 }}>{row.credit}</td>
            </tr>
          ))}
        </tbody>
        {footer && (
          <tfoot>
            <tr style={{ background: "#f1f5f9", borderTop: "2px solid #e2e8f0" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700 }}>Total</td>
              <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700 }}>{footer}</td>
              <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700 }}>{footer}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

function ResultBox({ items }: { items: string[] }) {
  return (
    <div style={{ background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)", border: "2px solid #86efac", borderRadius: 14, padding: "20px 24px", margin: "20px 0" }}>
      <div style={{ fontWeight: 700, color: "#166534", fontSize: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>✅ Hasil Akhir yang Benar</div>
      <ul style={{ listStyle: "none" }}>
        {items.map((item, i) => (
          <li key={i} style={{ fontSize: 14, color: "#166534", padding: "4px 0", display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span style={{ flexShrink: 0 }}>✅</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function WrongBox({ items }: { items: string[] }) {
  return (
    <div style={{ background: "linear-gradient(135deg, #fef2f2, #fff1f2)", border: "2px solid #fca5a5", borderRadius: 14, padding: "20px 24px", margin: "20px 0" }}>
      <div style={{ fontWeight: 700, color: "#991b1b", fontSize: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>❌ Yang TIDAK Boleh Terjadi</div>
      <ul style={{ listStyle: "none" }}>
        {items.map((item, i) => (
          <li key={i} style={{ fontSize: 14, color: "#991b1b", padding: "4px 0", display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span style={{ flexShrink: 0 }}>❌</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Checklist({ items }: { items: { icon: string; text: string | React.ReactNode }[] }) {
  return (
    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, padding: "12px 16px", background: "#f8faff", borderRadius: 10, border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
          <div>{item.text}</div>
        </li>
      ))}
    </ul>
  );
}

function FlowDiagram({ items }: { items: string[] }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap", margin: "20px 0", justifyContent: "center" }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, textAlign: "center", whiteSpace: "nowrap", border: "2px solid #818cf8", background: "#e0e7ff", color: "#3730a3" }}>
            {item}
          </div>
          {i < items.length - 1 && <div style={{ fontSize: 20, color: "#94a3b8", padding: "0 6px" }}>→</div>}
        </div>
      ))}
    </div>
  );
}
