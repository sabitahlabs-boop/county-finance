// Kategori dan Sub-kategori Produk untuk UMKM Indonesia

export interface ProductSubCategory {
  value: string;
  label: string;
}

export interface ProductCategory {
  value: string;
  label: string;
  subcategories: ProductSubCategory[];
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    value: "makanan",
    label: "Makanan",
    subcategories: [
      { value: "makanan-ringan", label: "Makanan Ringan / Snack" },
      { value: "makanan-berat", label: "Makanan Berat / Nasi" },
      { value: "roti-kue", label: "Roti & Kue" },
      { value: "frozen-food", label: "Frozen Food" },
      { value: "bumbu-rempah", label: "Bumbu & Rempah" },
      { value: "bahan-baku-makanan", label: "Bahan Baku Makanan" },
      { value: "makanan-sehat", label: "Makanan Sehat / Diet" },
      { value: "oleh-oleh", label: "Oleh-oleh / Khas Daerah" },
    ],
  },
  {
    value: "minuman",
    label: "Minuman",
    subcategories: [
      { value: "minuman-dingin", label: "Minuman Dingin / Es" },
      { value: "minuman-panas", label: "Minuman Panas / Kopi & Teh" },
      { value: "jus-smoothie", label: "Jus & Smoothie" },
      { value: "minuman-kemasan", label: "Minuman Kemasan" },
      { value: "minuman-kesehatan", label: "Minuman Kesehatan / Herbal" },
      { value: "bahan-baku-minuman", label: "Bahan Baku Minuman" },
    ],
  },
  {
    value: "fashion",
    label: "Fashion & Pakaian",
    subcategories: [
      { value: "baju-atasan", label: "Baju / Atasan" },
      { value: "celana-rok", label: "Celana & Rok" },
      { value: "dress-gamis", label: "Dress & Gamis" },
      { value: "jaket-outer", label: "Jaket & Outer" },
      { value: "pakaian-dalam", label: "Pakaian Dalam" },
      { value: "pakaian-anak", label: "Pakaian Anak" },
      { value: "seragam", label: "Seragam / Uniform" },
      { value: "aksesoris-fashion", label: "Aksesoris Fashion" },
    ],
  },
  {
    value: "sepatu-tas",
    label: "Sepatu & Tas",
    subcategories: [
      { value: "sepatu-pria", label: "Sepatu Pria" },
      { value: "sepatu-wanita", label: "Sepatu Wanita" },
      { value: "sepatu-anak", label: "Sepatu Anak" },
      { value: "sandal", label: "Sandal" },
      { value: "tas-wanita", label: "Tas Wanita" },
      { value: "tas-pria", label: "Tas Pria / Ransel" },
      { value: "dompet", label: "Dompet" },
    ],
  },
  {
    value: "kecantikan",
    label: "Kecantikan & Perawatan",
    subcategories: [
      { value: "skincare", label: "Skincare / Perawatan Kulit" },
      { value: "makeup", label: "Makeup / Kosmetik" },
      { value: "haircare", label: "Perawatan Rambut" },
      { value: "parfum", label: "Parfum & Deodorant" },
      { value: "sabun-mandi", label: "Sabun & Mandi" },
      { value: "perawatan-tubuh", label: "Perawatan Tubuh" },
      { value: "alat-kecantikan", label: "Alat Kecantikan" },
    ],
  },
  {
    value: "elektronik",
    label: "Elektronik & Gadget",
    subcategories: [
      { value: "handphone", label: "Handphone & Tablet" },
      { value: "aksesoris-hp", label: "Aksesoris HP" },
      { value: "laptop-komputer", label: "Laptop & Komputer" },
      { value: "audio-video", label: "Audio & Video" },
      { value: "elektronik-rumah", label: "Elektronik Rumah Tangga" },
      { value: "kamera", label: "Kamera & Foto" },
    ],
  },
  {
    value: "rumah-tangga",
    label: "Rumah Tangga",
    subcategories: [
      { value: "perabot-rumah", label: "Perabot & Furnitur" },
      { value: "dapur", label: "Peralatan Dapur" },
      { value: "kebersihan", label: "Kebersihan & Deterjen" },
      { value: "dekorasi", label: "Dekorasi Rumah" },
      { value: "perlengkapan-mandi", label: "Perlengkapan Kamar Mandi" },
      { value: "alat-tulis", label: "Alat Tulis & Kantor" },
    ],
  },
  {
    value: "kesehatan",
    label: "Kesehatan & Farmasi",
    subcategories: [
      { value: "obat-bebas", label: "Obat Bebas / OTC" },
      { value: "suplemen", label: "Suplemen & Vitamin" },
      { value: "alat-kesehatan", label: "Alat Kesehatan" },
      { value: "herbal", label: "Herbal & Jamu" },
      { value: "bayi-anak", label: "Produk Bayi & Anak" },
    ],
  },
  {
    value: "pertanian",
    label: "Pertanian & Perkebunan",
    subcategories: [
      { value: "sayuran", label: "Sayuran" },
      { value: "buah-buahan", label: "Buah-buahan" },
      { value: "beras-biji", label: "Beras & Biji-bijian" },
      { value: "pupuk-pestisida", label: "Pupuk & Pestisida" },
      { value: "bibit-tanaman", label: "Bibit & Tanaman" },
    ],
  },
  {
    value: "otomotif",
    label: "Otomotif & Kendaraan",
    subcategories: [
      { value: "sparepart-motor", label: "Sparepart Motor" },
      { value: "sparepart-mobil", label: "Sparepart Mobil" },
      { value: "aksesoris-kendaraan", label: "Aksesoris Kendaraan" },
      { value: "oli-pelumas", label: "Oli & Pelumas" },
    ],
  },
  {
    value: "jasa",
    label: "Jasa & Layanan",
    subcategories: [
      { value: "jasa-laundry", label: "Laundry" },
      { value: "jasa-servis", label: "Servis & Reparasi" },
      { value: "jasa-salon", label: "Salon & Kecantikan" },
      { value: "jasa-fotografi", label: "Fotografi & Desain" },
      { value: "jasa-catering", label: "Catering & Event" },
      { value: "jasa-lainnya", label: "Jasa Lainnya" },
    ],
  },
  {
    value: "lainnya",
    label: "Lainnya",
    subcategories: [
      { value: "mainan", label: "Mainan & Hobi" },
      { value: "olahraga", label: "Olahraga & Outdoor" },
      { value: "buku-media", label: "Buku & Media" },
      { value: "hewan-peliharaan", label: "Hewan Peliharaan" },
      { value: "produk-digital", label: "Produk Digital" },
      { value: "lainnya-umum", label: "Lainnya / Umum" },
    ],
  },
];

export function getSubcategories(categoryValue: string): ProductSubCategory[] {
  const cat = PRODUCT_CATEGORIES.find((c) => c.value === categoryValue);
  return cat?.subcategories ?? [];
}

export function getCategoryLabel(value: string): string {
  const cat = PRODUCT_CATEGORIES.find((c) => c.value === value);
  return cat?.label ?? value;
}

export function getSubcategoryLabel(categoryValue: string, subcategoryValue: string): string {
  const subs = getSubcategories(categoryValue);
  const sub = subs.find((s) => s.value === subcategoryValue);
  return sub?.label ?? subcategoryValue;
}

/**
 * Generate SKU from product name: first 3 uppercase letters + 3-digit random number
 * e.g. "Baju Batik Pria" → "BAJ-042"
 */
export function generateSKU(productName: string): string {
  const prefix = productName
    .replace(/[^a-zA-Z]/g, "")
    .substring(0, 3)
    .toUpperCase()
    .padEnd(3, "X");
  const num = Math.floor(Math.random() * 900 + 100); // 100–999
  return `${prefix}-${num}`;
}
