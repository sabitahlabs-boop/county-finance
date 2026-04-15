# County TODO — Rebuild v2 (Simpel + AI + Premium UI)

## Database & Backend
- [x] Redesign database schema (simplified for form-first approach)
- [x] Build AI receipt scanner using Forge API (photo → extract items, amounts, date)
- [x] Build tRPC routers: business setup, transactions, products, tax calculator, reports, admin
- [x] Upload receipt endpoint (/api/upload-receipt) with S3 storage
- [x] Scan receipt endpoint (/api/scan-receipt) with Gemini AI

## Setup Wizard (Super Mudah)
- [x] Step 1: Nama bisnis + tipe usaha (1 screen, minimal fields)
- [x] Step 2: Status pajak — NPWP, PKP, karyawan, estimasi omzet
- [x] Step 3: Konfirmasi + mulai

## Form Transaksi (Simpel)
- [x] Quick-add income form (minimal fields)
- [x] Quick-add expense form (minimal fields)
- [x] AI Scan Struk — upload/foto struk → AI extract → auto-fill → confirm & save
- [x] Product linking optional

## Dashboard (Ringkas & Cantik)
- [x] 4 KPI cards: Omzet, Pengeluaran, Laba Bersih, Estimasi Pajak
- [x] Monthly trend chart (Omzet Bulanan)
- [x] Quick action buttons: Catat Pemasukan, Catat Pengeluaran, Scan Struk, Lihat Laporan
- [x] Recent transactions list
- [x] Low stock alerts (Stok Kritis)
- [x] AI Ringkasan (AI Summary) — auto-generated financial summary
- [x] AI Health Score — financial health analysis with grade

## Halaman Lainnya
- [x] Transaksi — list view with filters, search, summary cards
- [x] Stok Produk — product cards with stock management, adjust, history
- [x] Laporan — Laba Rugi + Arus Kas + CSV export
- [x] Pajak — calculator + rules table + payment history + due date alerts
- [x] Pengaturan — bisnis, pajak, branding, bank, paket (Free/Pro only)
- [x] Super Admin — manage all tenants, users, plans
- [x] Upgrade Pro — pricing page with Stripe checkout

## UI/UX (Cantik & Siap Jual)
- [x] Premium color theme with green-teal gradients
- [x] Smooth animations with Framer Motion
- [x] Border-0 shadow-md card styling across all pages
- [x] Empty states with icons
- [x] Loading skeletons
- [x] Toast notifications for all actions
- [x] AI-Powered badge on dashboard

## Stripe Payment Integration (v3)
- [x] Stripe one-time payment for Pro upgrade (Rp 199.000)
- [x] Stripe checkout session endpoint (/api/stripe/create-checkout)
- [x] Stripe webhook handler (/api/stripe/webhook) with test event support
- [x] Payment verification endpoint (/api/stripe/verify-payment)
- [x] Payment status endpoint (/api/stripe/payment-status)
- [x] Auto-upgrade business plan to Pro on successful payment
- [x] Upgrade/pricing page with feature comparison (Free vs Pro)
- [x] Stripe sandbox test mode configured

## AI Features (v3)
- [x] AI Scan Struk — photo receipt → AI extract → auto-fill transaction
- [x] AI Auto-Categorization endpoint (/api/ai/categorize)
- [x] AI Dashboard Summary endpoint (/api/ai/dashboard-summary)
- [x] AI Financial Health Score endpoint (/api/ai/health-score)
- [x] AI Smart Suggestions endpoint (/api/ai/suggestions)
- [x] AI Summary card on Dashboard
- [x] AI Health Score card on Dashboard with expandable details

## Plan Simplification (v3)
- [x] Simplified to 2 plans only: Free (10 tx, 5 products) and Pro (unlimited, Rp 199.000)
- [x] Updated PLAN_LIMITS in shared/finance.ts
- [x] Updated Pengaturan page to show only Free/Pro
- [x] Free plan has AI access (scan struk + insights)
- [x] Pro plan has full AI access (health score + suggestions + export)

## Tests
- [x] 38 unit tests passing (v4: added product image, bulk CSV, POS cart, export format tests) (formatRupiah, smartParseNumber, formatTanggalIndonesia, evaluateCondition, PLAN_LIMITS, PRO_PRICE, receiptSchema, auth.logout, auth.me, Stripe config)

## Future / Not Yet Implemented
- [ ] Google Sheets sync (auto-create spreadsheet per tenant, sync transactions)
- [ ] PDF export for financial reports
- [ ] WhatsApp notification integration (actual API)
- [x] Landing page for marketing (v8)

## Bug Fixes (v3.1)
- [x] Fix AI Scan Struk infinite loading — removed S3 upload step, now sends base64 directly to AI
- [x] Remove "bisnis" plan from Super Admin dropdown (only Free and Pro)
- [x] Remove "bisnis" plan from all UI dropdowns and backend logic
- [x] Fix React error #321 in Super Admin page (removed bisnis SelectItem)

## Bug Fixes (v3.2)
- [x] Fix Super Admin "Invalid hook call" error (moved useUtils to component level)
- [x] Fix Super Admin tab still showing "Bisnis" label
- [x] Fix AI Scan Struk failing on iOS — moved to tRPC procedure (trpc.ai.scanReceipt), no more fetch to Express endpoint

## v4 — Major Feature Update
- [x] Fix AI Scan Struk — rewrote to multipart FormData upload, iOS HEIC conversion, image compression
- [x] Add product image upload (photo for each product in stock)
- [x] Bulk CSV upload for stock (upload many products at once)
- [x] Export database to Excel/CSV for customer backup (transactions, products, reports)
- [x] Build POS (Point of Sale) system for direct sales
- [x] Polish UI — quick action buttons, POS in sidebar, premium cards
- [x] Add imageUrl column to products table in database schema

## Bug Fixes (v5) — Scan Struk iOS/PDF Fix
- [x] Fix PDF scan failing with "Invalid prompt: messages do not match ModelMessage[] schema" — converted PDF buffer to base64 data URL for AI SDK
- [x] Fix frontend scan dialog: separate Camera and Gallery buttons for iOS compatibility (capture="environment" forces camera-only)
- [x] Add PDF file support to scan struk (both frontend accept and backend multer filter)
- [x] Add proper status text during scan process (preparing, converting, scanning)
- [x] Add fallback when canvas HEIC conversion fails — sends original file
- [x] Increase timeout from 45s to 60s for PDF processing
- [x] Add dark mode support for error states in scan dialog
- [x] Reset file inputs on retry so same file can be re-selected
- [x] Add 48 unit tests (was 38) — added PDF detection, base64 conversion, multer config tests

## v6 — Scan-to-Stock + COGS Calculator
- [x] Scan Struk → offer to add scanned items to stock one-by-one (editable qty, price, name before saving)
- [x] After scan result, show "Tambah ke Stok?" button for each item
- [x] Item-by-item review dialog with editable fields (name, qty, price, unit, SKU)
- [x] Match existing products by name similarity before creating new
- [x] COGS Calculator — calculate HPP based on material/ingredient composition
- [x] COGS database schema (product_compositions table linking products to materials)
- [x] COGS UI — add/edit composition for each product, auto-calculate HPP
- [x] COGS summary showing material cost breakdown per product
- [x] Unit tests for new features (64 tests total — added COGS calculator, composition validation, scan-to-stock flow tests)

## v7 — Rebrand to County + Dark Mode + QRIS
- [x] Rename app from FinanceOS to County (all references)
- [x] Generate new County logo
- [x] Update VITE_APP_TITLE to County (note: built-in secret, updated via index.html and branding)
- [x] Add dark/light mode toggle in UI (user can switch) — toggle in sidebar footer with sun/moon icons
- [x] Add QRIS input feature (upload/save QRIS QR code for payments) — new tab in Pengaturan + display in POS
- [x] Update tests and verify all changes (64 tests passing)

## v8 — FOMO Landing Page + Pricing Update
- [x] Create high-converting landing page with FOMO elements (LandingPage.tsx)
- [x] Hero section with bold headline, countdown timer, and urgency ("Kelola Bisnis Jadi Super Mudah dengan AI")
- [x] Feature showcase section — 9 feature cards + highlight Scan Struk → Auto Stok
- [x] Kelebihan County vs competitors section (6 benefit cards)
- [x] Price comparison table: County vs Moka vs Majoo vs Jurnal (County cheapest at Rp 299K lifetime)
- [x] Social proof / testimonials section (6 testimonials with 5-star ratings)
- [x] Pricing section: Rp 2.000.000 crossed out → Rp 299.000 lifetime with HEMAT badge
- [x] FOMO elements: countdown timer, limited slots, urgency badges, "18 orang sedang melihat"
- [x] Sticky CTA button for mobile
- [x] Update Stripe pricing from Rp 199.000 to Rp 299.000
- [x] Wire all CTA buttons to Stripe checkout / login
- [x] Responsive design for mobile and desktop
- [x] Smooth scroll animations with framer-motion
- [x] Added /landing preview route for testing

## v9 — Logo Upload + Invoice Printing + Auto-fill Scan-to-Stock
- [x] Customer logo upload in Pengaturan → Branding tab (logoUrl field in businesses table)
- [x] Invoice printing template with customer logo, clean & professional design (InvoicePrintDialog.tsx)
- [x] Print button (Printer icon) on each transaction row in Transaksi page
- [x] Invoice includes: logo, business name, address, NPWP, bank info, QRIS QR code
- [x] Improve ScanToStockDialog: auto-fill nama produk, hpp, qty from scan result (all editable, not locked)
- [x] Visual badge "Dari scan" on auto-filled fields, +30% suggested selling price badge
- [ ] Lynk payment gateway integration (pending — user will setup when moving to own server)
- [x] 64 unit tests passing

## v10 — UI Redesign (Colorful, Interactive, Elegant)
- [x] Redesign color palette — vibrant indigo-violet primary, rainbow chart palette, gradient utilities
- [x] Redesign Dashboard — colorful KPI cards with gradient icons, gradient bar chart, spring animations
- [x] Redesign Sidebar — dark gradient sidebar, colorful active menu icons, gradient logo
- [ ] Redesign Transaksi page — colorful category badges, better card design
- [ ] Redesign Stok Produk — vibrant product cards, better visual hierarchy
- [ ] Redesign POS/Kasir — more interactive, colorful, fun to use
- [ ] Add micro-interactions and hover effects throughout
- [ ] Improve mobile responsiveness with colorful touch-friendly design
- [x] Update index.css theme variables — vibrant oklch colors, glass effects, glow shadows
- [x] Maintain dark mode compatibility with new colors

## v10.1 — Bug Fixes (Pengaturan Page)
- [x] Fix React error #321 in Pengaturan (undefined/null values in controlled inputs)
- [x] Fix image/logo upload not working in Branding tab
- [x] Fix cannot save/update business information (Profil, Pajak, Bank, QRIS tabs)
- [x] Test all 6 Pengaturan tabs end-to-end

## v11 — New Logo + Color Theme Update
- [x] Upload new County logo to CDN
- [x] Update browser tab title from FinanceOS to County
- [x] Update favicon with County logo
- [x] Update sidebar logo with new County logo image
- [x] Update color theme to match logo (navy blue #1E4D9B, orange #F47920, green #4CAF50)
- [x] Update landing page with new brand colors

## v11.1 — Bug Fix: Onboarding Slug Error
- [x] Fix "Slug sudah digunakan" error when completing onboarding setup wizard

## v12 — Admin: Delete User Feature
- [ ] Add deleteUser DB helper with cascade delete (business, transactions, products, stock logs, tax payments, compositions)
- [ ] Add admin tRPC procedure: admin.deleteUser
- [ ] Update Super Admin UI with delete button + confirmation dialog
- [ ] Write vitest for deleteUser procedure

## v13 — Stok Produk: Kategori Dropdown, Auto-SKU, Min Stok Default 0
- [x] Tambah data kategori & sub-kategori produk (shared constants)
- [x] Update form tambah/edit produk: kategori & sub-kategori jadi dropdown
- [x] Sub-kategori dropdown dinamis berdasarkan kategori yang dipilih
- [x] SKU auto-generate dari 3 huruf depan nama + angka 3 digit random
- [x] Stok minimum default 0 (bukan 5)

## v13.1 — Kategori Manual: Setting dulu baru muncul di Stok Produk
- [x] Tambah tabel product_categories di DB schema (id, businessId, name, parentId)
- [x] Push migrasi DB
- [x] Tambah DB helpers: getCategories, createCategory, updateCategory, deleteCategory
- [x] Tambah tRPC procedures: category.list, category.create, category.update, category.delete
- [x] Tambah tab "Kategori Produk" di halaman Pengaturan (CRUD kategori & sub-kategori)
- [x] Update form Stok Produk: dropdown kategori & sub-kategori dari DB
- [x] Hapus referensi hardcoded PRODUCT_CATEGORIES dari StokProduk.tsx

## v14 — Admin Delete User + Dual Pricing
- [x] Add deleteUserWithAllData DB helper (cascade: business, transactions, products, stock logs, tax payments, compositions, categories)
- [x] Add admin.deleteUser tRPC procedure (admin only)
- [x] Update Super Admin UI: delete button + confirmation dialog per user
- [x] Add priceType field to products table (enum: 'fixed' | 'dynamic')
- [x] Add discountPercent field to products table (0-100)
- [x] Push DB migration
- [x] Update product form: priceType toggle (Harga Pasti / Harga Dinamis), discountPercent input
- [x] Update POS: show discounted price for 'fixed' type, allow price override for 'dynamic' type
- [x] Write vitest for deleteUser and pricing logic (73 tests total)

## v15 — Remove Manus Branding + Update Domain to county.finance
- [x] Hapus semua referensi "Manus" dari UI, teks, dan comments
- [x] Update domain dari county.manus.space ke county.finance
- [x] Ganti semua "FinanceOS" → "County" di codebase
- [x] Update landing page: hapus referensi Manus, pure County branding
- [x] Update login page: hapus Manus logo/teks, pure County branding
- [x] Update onboarding wizard: hapus Manus, pure County
- [x] Update all pages: pastikan tidak ada Manus branding
- [x] Update footer: hapus Manus, tambah County copyright
- [x] Update meta tags & SEO: county.finance
- [x] Test semua halaman: tidak ada Manus visible
- [x] Rename ManusDialog.tsx → CountyDialog.tsx
- [x] Update violet/purple gradients → County navy blue (#1E4D9B)
- [x] Domain county.finance + www.county.finance berhasil di-bind

## v16 — Freemium System (Free vs Pro + Scalev Integration)
- [ ] Tambah kolom plan ('free'|'pro'), planActivatedAt, scalevOrderId di tabel businesses
- [ ] Push migrasi DB
- [ ] Tambah DB helpers: getBusinessPlan, upgradeToPro
- [ ] Tambah tRPC: business.getPlan
- [x] Build webhook endpoint /api/scalev/webhook untuk auto-upgrade ke Pro
- [ ] Tambah ProUpgradeBanner di DashboardLayout (hanya untuk Free user)
- [ ] Tambah UpgradeModal dengan link pembayaran Scalev
- [ ] Enforce limit Free: max 20 produk di StokProduk
- [ ] Enforce limit Free: max 50 transaksi/bulan di Transaksi
- [ ] Enforce limit Free: sembunyikan Laporan Pajak (Pro only)
- [ ] Enforce limit Free: sembunyikan AI Scan struk (Pro only)
- [ ] Enforce limit Free: sembunyikan Export PDF/Excel (Pro only)
- [ ] Update landing page: dua CTA (Coba Gratis + Mulai Pro via Scalev)
- [ ] Tambah halaman /pricing di landing page
- [ ] Tulis vitest untuk plan enforcement logic

## v16 — Freemium System (Free vs Pro + Scalev Integration)
- [x] Add scalevOrderId and planActivatedAt fields to businesses table
- [x] Push DB migration
- [x] Add plan management DB helpers: upgradeBusinessToProByEmail, getBusinessPlan, checkPlanLimits
- [x] Build Scalev webhook endpoint (/api/scalev/webhook) to auto-upgrade users after payment
- [x] Add tRPC procedures: business.getPlan, business.upgradeToPro
- [x] Build ProUpgradeBanner component (shows on dashboard for Free users)
- [x] Add ProUpgradeBanner to DashboardLayout
- [x] Update landing page: dual CTA buttons (Beli Pro via Scalev + Coba Gratis)
- [x] Free tier limits: max 20 produk, 50 transaksi/bulan
- [x] Pro tier: semua fitur unlimited
- [x] 73 unit tests passing

## v17 — Scalev Payment Link Integration
- [x] Pasang link Scalev (https://county.myscalev.com/p/county) di tombol Beli Pro di landing page
- [ ] Investigasi fitur "External URL" di Scalev untuk auto-upgrade webhook

## v19 — Semi-Otomatis Pro Link (Opsi B) + Hapus Free Tier
- [x] Rollback ke v17 (hapus sistem kode aktivasi v18)
- [x] Tambah tabel pro_links di DB (token unik, email, status used/expired, createdAt)
- [x] Push migrasi DB
- [x] Backend: generate token unik, validasi token, auto-upgrade ke Pro
- [x] Super Admin UI: input email → generate link Pro → copy link → manage links
- [x] Endpoint /pro/:token → validasi → redirect OAuth → auto Pro
- [x] Hapus free tier: landing page hanya tombol Beli, hapus Coba Gratis
- [x] Update Scalev External URL → WA admin
- [x] Hapus ProUpgradeBanner (tidak ada free tier lagi)
- [x] Hapus limit produk/transaksi (semua user = Pro)
- [x] Write vitest untuk Pro link system

## v20 — All-in-One Adaptive Mode System
- [x] DB: Tambah field appMode (personal/umkm) dan posEnabled (boolean) di tabel business
- [x] Push migrasi DB
- [x] Backend: DB helpers dan router untuk switch mode & toggle POS
- [x] DashboardLayout: sidebar dinamis berdasarkan appMode dan posEnabled
- [x] Dashboard: tampilan berbeda untuk personal vs UMKM
- [x] Jurnal Pribadi page: halaman jurnal keuangan pribadi dengan grafik interaktif
- [x] Onboarding: pilihan mode (Jurnal Pribadi / UMKM)
- [x] Pengaturan: switch mode dan toggle POS
- [x] Landing Page: showcase kedua use case (personal & UMKM)
- [x] Write vitest untuk mode system

## v21 — Bug Fixes (Mode Switch & POS Toggle)
- [x] Fix mode switch error "No values to set" in Pengaturan
- [x] Fix POS toggle error "No values to set" in Pengaturan

## v22 — Landing Page Login Button
- [x] Tambah tombol "Masuk" di navbar landing page untuk user yang sudah terdaftar
- [x] Jika user sudah login, redirect langsung ke dashboard (skip landing page)

## v23 — QA Bug Fixes (DONE)
- [x] BUG-1: transaction.delete masih ada cek plan === "free" (harus dihapus karena tidak ada free tier)
- [x] BUG-2: export.allData masih ada cek plan === "free" (harus dihapus)
- [x] BUG-3: Laporan — canExport = business?.plan === "pro" — user baru default plan "free" sehingga export diblokir
- [x] BUG-4: POS tidak ada cetak struk / print receipt setelah checkout
- [x] BUG-5: Transaksi tidak ada fitur edit transaksi (hanya delete)

## v24 — Final Features (Update Terakhir) — SELESAI
- [x] Notifikasi WA ke admin saat user baru daftar (via notifyOwner)
- [x] Halaman Riwayat Stok dengan log perubahan stok per produk
- [x] Export PDF untuk Laporan Laba Rugi dan Arus Kas

## v25 — Scan Struk Fix + Multi-Bank Account (Jurnal Pribadi)
- [x] Fix scan struk: hasil scan harus tersimpan sebagai transaksi (pemasukan/pengeluaran)
- [x] Scan struk: user bisa pilih tipe transaksi (pemasukan/pengeluaran) sebelum/sesudah scan
- [x] Multi-bank account: DB schema (tabel bank_accounts per user)
- [x] Multi-bank account: backend helpers dan tRPC procedures (CRUD akun, saldo)
- [x] Multi-bank account: UI di Jurnal Pribadi — tambah akun, lihat saldo per akun
- [x] Multi-bank account: pencatatan transaksi per akun bank
- [x] Pastikan tidak ada error di fitur lain setelah perubahan

## v26 — Major Feature Update (8 Features + PWA)
- [x] F1: Transfer Antar Akun — transfer saldo antar bank account (BCA→GoPay dll)
- [x] F2: Hutang & Piutang — DB schema, CRUD, tracking pembayaran, status, analisa
- [x] F3: Invoice Footer — tanda tangan digital + info rekening bank di invoice
- [x] F4: Anggaran Bulanan — buat budget per kategori, notifikasi melebihi anggaran
- [x] F5: Mini Kalkulator — floating calculator widget, toggle di Pengaturan
- [x] F6: Analytic Dashboard Penjualan — grafik penjualan, top produk, tren
- [x] F7: Manajemen Client — data client, invoice per client, tracking pembayaran
- [x] F8: Notifikasi Jatuh Tempo — reminder invoice/hutang/piutang yang jatuh tempo
- [x] F9: PWA Support — service worker, manifest, installable, add to home screen
- [x] 115 unit tests passing (16 new feature tests)
- [x] Pastikan semua fitur baru tidak break fitur lama

## v27 — Playbook + Landing Page Redesign
- [x] Buat playbook lengkap penggunaan County untuk usher (panduan step-by-step semua fitur)
- [x] Redesign landing page mengikuti style Dana Cerdas Pro (reogdigital.my.id/dana-cerdas-pro)
- [x] 115 unit tests still passing
- [x] Update checkpoint dan deliver

## v28 — Halaman Panduan Publik (/panduan)
- [x] Buat halaman Panduan interaktif sebagai route publik /panduan di County app
- [x] Tidak perlu login untuk akses
- [x] Checkpoint dan deploy

## v29 — Bug Fix: Token Claim Tidak Otomatis Upgrade ke Pro
- [x] Investigasi flow token claim → user upgrade ke Pro
- [x] Fix bug 1: OAuth redirect selalu ke / — sekarang Home.tsx cek sessionStorage dan redirect ke /pro/{token}
- [x] Fix bug 2: User baru kena PRECONDITION_FAILED — sekarang Onboarding auto-redirect ke /pro/{token} setelah setup selesai
- [x] Fix bug 3: Race condition markProLinkUsed — sekarang mark used DULU sebelum upgrade, notification non-blocking
- [x] Fix bug 4: BAE sudah Pro tapi token belum used — data diperbaiki manual
- [x] Tambah idempotent check: kalau link sudah dipakai user yang sama, return success
- [x] Tambah check: kalau bisnis sudah Pro, langsung mark used dan return success
- [x] 115 unit tests passing
- [x] Test dan verifikasi fix

## v30 — Bug Fix: 404 on Direct URL Access / Page Refresh (Mobile)
- [x] Root cause: /dashboard tidak ada di App.tsx routes → jatuh ke NotFound
- [x] Fix: tambah route /dashboard yang redirect ke / (Home)
- [x] Update service worker v2 — force cache bust + better navigation fallback
- [x] Update NotFound page ke bahasa Indonesia
- [x] 115 unit tests passing
- [x] Checkpoint dan deploy

## v31 — Affiliate Link System
- [x] DB schema: tabel affiliates (id, refCode, name, scalevUrl, whatsapp, isActive, clickCount, createdAt)
- [x] Backend: CRUD helpers + tRPC routes untuk manage affiliates
- [x] Backend: public endpoint untuk resolve refCode → scalevUrl + auto track clicks
- [x] Super Admin: tab Affiliate untuk manage affiliates (tambah, edit, on/off, hapus, copy link)
- [x] Landing page: detect ?ref= param → tombol Beli redirect ke Scalev affiliate
- [x] Landing page: tanpa ref → tetap ke Scalev default
- [x] 115 unit tests passing
- [x] Test dan checkpoint

## v32 — Enhanced Tax Features (Inspired by PahamPajak)
- [x] Kalkulator PPh UMKM 0.5% (PP 55/2022) — input omzet, auto hitung, cek batas Rp 500jt
- [x] Kalkulator PPN 11%/12% — input harga, hitung PPN inklusif/eksklusif
- [x] Kalkulator PPh 21 (tarif progresif + 8 status PTKP)
- [x] Kalkulator PPh 23 (Jasa 2% / Dividen 15%)
- [x] Tax Planning Simulator — bandingkan Final 0.5% vs NPPN vs Pembukuan + visual bar chart
- [x] Ringkasan Pajak Otomatis — estimasi pajak dari data transaksi County + progress bar batas Rp 500jt
- [x] Kalender Deadline Pajak + tabel denda keterlambatan
- [x] Grafik omzet bulanan untuk tracking tahunan
- [x] Redesign halaman Pajak: 6 tab (Ringkasan, Kalkulator, Tax Planning, Deadline, Aturan, Riwayat)
- [x] 115 unit tests passing
- [x] Test dan checkpoint

## v33 — Perbaikan Flow Scan Struk
- [x] Setelah AI baca struk, tampilkan pilihan: "Masukkan ke Stok Item" atau "Catat Pengeluaran Saja"
- [x] Flow "Masukkan ke Stok": simpan transaksi + buka ScanToStockDialog untuk pilih item satu-satu
- [x] Flow "Catat Pengeluaran Saja": langsung catat transaksi tanpa masuk stok
- [x] Pilihan rekening bank/metode pembayaran muncul di kedua flow (dropdown dengan bank accounts)
- [x] Jenis transaksi (Pemasukan/Pengeluaran) bisa dipilih di kedua flow
- [x] 115 unit tests passing
- [x] Test dan checkpoint

## v34 — Sistem Gudang (Warehouse) + Fix Kalkulator
- [x] Fix kalkulator: jangan auto pop-out, hanya muncul saat user klik tombol kalkulator (FAB button)
- [x] DB schema: tabel warehouses (id, businessId, name, address, phone, notes, isDefault, isActive)
- [x] DB schema: tabel warehouse_stock (warehouseId, productId, quantity) — stok per gudang
- [x] DB schema: tabel stock_transfers (fromWarehouseId, toWarehouseId, productId, qty, date, notes)
- [x] Backend: CRUD gudang, stok per gudang, transfer antar gudang, ensureDefault, migrateStock
- [x] Integrasi: stok produk dilihat per gudang (WarehouseDistribution component di StokProduk)
- [x] Integrasi: penjualan/kasir POS mengurangi stok dari gudang tertentu (warehouse selector di POS)
- [x] Integrasi: scan struk masuk ke gudang tertentu (ScanToStockDialog warehouse selector)
- [x] Integrasi: transaksi pembelian stok masuk ke gudang tertentu (warehouseId di transaction.create)
- [x] Integrasi: product.create auto-sync stok awal ke default warehouse
- [x] Integrasi: product.adjustStock sync ke warehouse stock
- [x] Frontend: halaman Gudang (list gudang, stok per gudang, transfer antar gudang, riwayat transfer)
- [x] Frontend: update Stok Produk untuk lihat distribusi stok per gudang
- [x] Frontend: update Kasir POS untuk pilih gudang sumber
- [x] 130 unit tests passing (15 new warehouse tests)
- [x] Test dan checkpoint

## v35 — Update Panduan Pengguna (User Guide)
- [x] Update halaman /panduan dengan semua fitur terbaru (termasuk sistem gudang)
- [x] Buat panduan sangat mudah dipahami oleh usher (step-by-step, visual, bahasa sederhana)
- [x] Tambah panduan fitur gudang: buat gudang, lihat stok per gudang, transfer antar gudang
- [x] Tambah panduan fitur POS dengan pilihan gudang
- [x] Tambah panduan scan struk ke gudang
- [x] Update semua section panduan yang ada (25+ topik, v3.0)
- [x] Tambah section Riwayat Stok
- [x] Tambah FAQ gudang (berapa gudang, bagaimana stok terupdate)
- [x] Tambah contoh penggunaan gudang (Toko Kue Ibu Ani)
- [x] Tambah tabel integrasi gudang ke semua fitur
- [x] Test dan checkpoint

## v36 — PDF Panduan Pengguna (Offline Download)
- [x] Buat versi Markdown lengkap dari panduan pengguna v3.0 (21 section, 18 halaman)
- [x] Convert Markdown ke PDF dengan styling profesional (navy headers, green accents, tables, callout boxes)
- [x] Upload PDF ke CDN
- [x] Tambah tombol "Download PDF (Offline)" di hero section halaman /panduan
- [x] Test dan checkpoint

## v37 — Mode Multi Akun + Role (County Plus) + Fix Tambah Produk Gudang
- [x] DB schema: tabel team_members (businessId, userId, role, permissions JSON, invitedBy, status, joinedAt)
- [x] DB schema: tabel team_invites (businessId, email, role, permissions JSON, token, expiresAt, status)
- [x] Backend: CRUD team members (invite, accept, remove, update role/permissions)
- [x] Backend: team.myContext — cek apakah user owner atau karyawan, return permissions
- [x] Backend: 5 preset roles (owner, manager, kasir, gudang, viewer) + custom permissions
- [x] Backend: owner bisa set permissions granular per karyawan (13 fitur: POS, stok, gudang, transaksi, laporan, dll)
- [x] Frontend: tab Tim di Pengaturan (list karyawan, invite, edit role, hapus)
- [x] Frontend: invite flow — owner kirim invite via email, karyawan accept via /accept-invite/:token
- [x] Frontend: role editor — owner bisa toggle fitur mana yang bisa diakses karyawan
- [x] Frontend: sidebar menu filtered berdasarkan permissions user (karyawan hanya lihat menu yang diizinkan)
- [x] Frontend: badge role (Kasir/Manager/Gudang/Viewer) di sidebar header untuk karyawan
- [x] Shared: PATH_PERMISSION_MAP, ROLE_PERMISSIONS, PERMISSION_LABELS di shared/permissions.ts
- [x] Fix: tambah pilihan gudang di form Tambah Produk (dropdown gudang tujuan, default ke gudang utama)
- [x] Backend: product.create terima warehouseId opsional, stok awal masuk ke gudang yang dipilih
- [x] 146 unit tests passing (16 new team tests)
- [x] Test dan checkpoint

## v38 — Fix Multi Akun: Pro+ Add-on (Super Admin Only)
- [x] Fix: Multi Akun bukan fitur bawaan Pro, tapi add-on berbayar (Pro+)
- [x] DB: update plan enum di businesses table → free, pro, pro_plus (migrasi berhasil)
- [x] Backend: enforce plan check di semua team routes (list, invite, invites — hanya Pro+ yang bisa akses)
- [x] Backend: enforce max 5 team members per business (Pro+)
- [x] Backend: getPlan return isProPlus flag untuk frontend
- [x] Super Admin: tambah plan selector (Free/Pro/Pro+) di manage bisnis + stats Pro/Pro+ terpisah
- [x] Frontend: sembunyikan tab Tim di Pengaturan untuk non-Pro+ users (business.plan === "pro_plus")
- [x] Frontend: badge role tetap muncul untuk karyawan yang sudah di-invite
- [x] 152 unit tests passing (6 new Pro+ plan tests)
- [x] Test dan checkpoint

## v39 — Final Major Update: Business Switcher, UI/UX Recheck, Onboarding, Competitive Gap Close
- [x] Competitive analysis: riset BukuWarung, Moka POS, iReap, Jurnal, Kledo — identifikasi gap
- [x] Business Switcher: backend resolveBusinessForUser() — resolve bisnis berdasarkan x-business-id header
- [x] Business Switcher: update context.ts — baca x-business-id dari request header
- [x] Business Switcher: update semua 85+ procedure dari getBusinessByOwnerId ke resolveBusinessForUser
- [x] Business Switcher: frontend BusinessContext.tsx — state management untuk active business
- [x] Business Switcher: dropdown di sidebar DashboardLayout — karyawan bisa switch antar bisnis
- [x] Business Switcher: tRPC client kirim x-business-id header otomatis
- [x] UI/UX Audit: tambah link Panduan di sidebar menu (UMKM + Personal)
- [x] UI/UX Audit: tambah notification center di desktop sidebar header
- [x] Onboarding Tooltip System: komponen OnboardingGuide.tsx — 6 step guided tour untuk user baru
- [x] Onboarding: data-onboarding attributes di Dashboard (quick-actions, ai-summary, kpi-cards)
- [x] Onboarding: data-onboarding attributes di sidebar (sidebar-menu, panduan-link)
- [x] Onboarding: auto-trigger untuk first-time users, bisa di-reset dari Panduan
- [x] Competitive Gap: Excel export (.xls) di halaman Laporan (Laba Rugi + Arus Kas)
- [x] Update Panduan ke v4.0: 30+ topik, tambah section Multi Akun, Business Switcher, Excel Export, Onboarding
- [x] Update Panduan: FAQ baru (invite karyawan, switch bisnis, ulang tur)
- [x] Update Panduan: hero stats 30+ topik, badge v4.0
- [x] Fix warehouse tests: update mock dari getBusinessByOwnerId ke resolveBusinessForUser
- [x] 152 unit tests passing (all 5 test files green)
- [x] Test dan checkpoint

## v40 — Fix Business Switcher Toggle di Sidebar
- [x] Fix: Business Switcher sekarang selalu visible di sidebar (bukan hanya saat multi-business)
- [x] Single business: info card dengan nama bisnis + badge Owner/Role
- [x] Multiple businesses: dropdown dengan gradient card, icon bisnis, role badge, dan checkmark aktif
- [x] Collapsed sidebar: compact icon Building2 dengan badge jumlah bisnis
- [x] Dropdown items: warna berbeda untuk bisnis sendiri (biru) vs bisnis boss (amber)
- [x] 152 unit tests passing
- [x] Test dan checkpoint

## v41 — Fix SEO Issues on Homepage
- [x] Fix: title set via document.title → "County — Aplikasi Akuntansi & Manajemen Bisnis UMKM" (53 chars)
- [x] Fix: meta keywords ditambahkan (15 keywords: akuntansi, UMKM, manajemen bisnis, POS, kasir, stok, gudang, dll)

## v42 — Overhaul Mode Jurnal Keuangan Pribadi
- [x] Setup Wizard: PersonalSetupWizard.tsx — 3 step wizard (akun bank + saldo awal, tagihan bulanan, tabungan impian)
- [x] Setup Wizard: auto-trigger saat pertama kali masuk mode pribadi (personalSetupDone flag)
- [x] Setup Wizard: step 1 — tambah akun bank/e-wallet/cash dengan saldo awal
- [x] Setup Wizard: step 2 — tambah tagihan rutin bulanan (kredit, listrik, internet, dll)
- [x] Setup Wizard: step 3 — tambah tabungan impian (target, deadline, tabungan awal)
- [x] Rename "Anggaran" → "Tagihan & Anggaran" di sidebar menu
- [x] Halaman Tagihan & Anggaran di-rewrite: 3 tab (Tagihan Rutin, Anggaran, Tabungan Impian)
- [x] Fitur Tabungan Impian: CRUD goals, progress bar, deposit, target date, emoji icons
- [x] Fitur Tagihan Rutin: CRUD monthly bills, kategori, due date, status bayar
- [x] DB: tabel savings_goals + monthly_bills + field personalSetupDone + debtEnabled
- [x] Backend: routes savings.list/create/update/delete, monthlyBills.list/create/update/delete
- [x] Backend: business.completePersonalSetup + business.toggleDebt
- [x] Hutang Piutang jadi toggle di Pengaturan Mode Aplikasi (mode pribadi only)
- [x] Sidebar: Hutang & Piutang tersembunyi by default, muncul setelah toggle diaktifkan
- [x] Onboarding tooltip di-rebuild total: 12 step UMKM + 10 step Personal, detail per tombol
- [x] Onboarding: setiap step ada "Kenapa ini penting?" expandable + tips praktis
- [x] Onboarding: konten berbeda untuk mode Personal vs UMKM
- [x] Fix: Pengaturan.tsx mode property → appMode
- [x] 152 unit tests passing
- [x] Zero error di mode pribadi (hanya pre-existing TS errors di Markdown.tsx dan ComponentShowcase.tsx)

## v43 — Integrasi Jurnal: Tagihan, Tabungan, Hutang Piutang + Fix Error
- [x] Fix: error page setelah setup wizard selesai (hooks order fix di PersonalDashboard)
- [x] Tagihan Bulanan: tombol "Bayar" + pilih rekening + otomatis catat transaksi pengeluaran di jurnal (monthlyBills.pay route)
- [x] Tabungan Impian: tombol "Tambah Dana" + pilih rekening + otomatis catat transaksi pengeluaran di jurnal (savings.addFunds + bankAccountName)
- [x] Hutang Piutang: pilih rekening bayar/terima + otomatis catat transaksi di jurnal (hutang=pengeluaran, piutang=pemasukan) + keterangan detail (nama pihak, sisa, catatan)
- [x] Semua integrasi berlaku untuk mode Personal DAN UMKM (shared routes, same backend)
- [x] 15 new journal integration tests (journal-integration.test.ts)
- [x] Test dan checkpoint

## v43.1 — Bug Fix: Error Page Setelah Setup Wizard + Hapus Akun Bank
- [x] Fix: "An unexpected error occurred" crash setelah setup wizard selesai (React hooks violation — semua useMemo dipindah sebelum conditional return)
- [x] Tombol hapus & edit akun bank sekarang visible di mobile (tidak hanya hover)
- [x] Test dan checkpoint (167 tests passing)

## v43.2 — AI Ringkasan: Beda Konteks untuk Pribadi vs UMKM
- [x] Sesuaikan prompt AI ringkasan untuk mode Jurnal Pribadi (bahasa personal, fokus pemasukan/pengeluaran/tabungan/hutang/piutang)
- [x] Sesuaikan prompt AI ringkasan untuk mode UMKM (bahasa bisnis, fokus omzet/laba/pajak/stok)
- [x] Kirim appMode dari frontend ke backend supaya AI tahu konteksnya
- [x] Test dan checkpoint (167 tests passing)
