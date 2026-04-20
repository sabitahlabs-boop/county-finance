import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Printer, Check, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';

type LayoutOption = '1x1' | '2x1' | '3x1';

interface SelectedProduct {
  id: string;
  checked: boolean;
}

interface Product {
  id: number;
  name: string;
  sku: string | null;
  barcode: string | null;
  productCode: string | null;
  sellingPrice: number;
  stockCurrent: number;
  imageUrl?: string | null;
  category?: string | null;
}

/**
 * Barcode Component - Creates a simple Code128-style barcode visualization
 */
const BarcodeDisplay: React.FC<{ barcode: string; productName: string }> = ({
  barcode,
  productName,
}: {
  barcode: string;
  productName: string;
}) => {
  // Generate a pattern based on the barcode string
  const generateBarcodePattern = (code: string) => {
    const pattern: boolean[] = [];
    for (let i = 0; i < code.length; i++) {
      const char = code.charCodeAt(i);
      for (let j = 0; j < 8; j++) {
        pattern.push(((char >> j) & 1) === 1);
      }
    }
    return pattern;
  };

  const pattern = generateBarcodePattern(barcode);

  return (
    <div className="flex flex-col items-center gap-2 bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Barcode bars */}
      <div className="flex items-end gap-px h-20 justify-center">
        {pattern.map((isBlack, idx) => (
          <div
            key={idx}
            className={`${
              isBlack ? 'bg-black' : 'bg-white dark:bg-gray-900'
            } transition-all duration-200`}
            style={{
              width: isBlack ? '2px' : '1px',
              height: `${20 + (isBlack ? 4 : 0)}px`,
            }}
          />
        ))}
      </div>

      {/* Barcode number */}
      <div className="text-center">
        <p className="font-mono text-sm font-semibold text-black">{barcode}</p>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-xs truncate">{productName}</p>
      </div>
    </div>
  );
};

/**
 * Product Card Component
 */
const ProductCard: React.FC<{
  product: Product;
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
}> = ({ product, isSelected, onToggleSelect }: {
  product: Product;
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`relative border rounded-lg p-4 transition-all duration-200 ${
        isSelected
          ? 'border-green-500 bg-green-500/10'
          : 'border-gray-700 bg-gray-900/40 hover:border-gray-600'
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggleSelect(product.id)}
        className={`absolute top-3 right-3 w-5 h-5 rounded border transition-all duration-200 flex items-center justify-center ${
          isSelected
            ? 'bg-green-500 border-green-500'
            : 'border-gray-600 hover:border-gray-500'
        }`}
      >
        {isSelected && <Check size={16} className="text-white" />}
      </button>

      {/* Content */}
      <div className="pr-8">
        <h3 className="font-semibold text-white text-sm mb-1">{product.name}</h3>

        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-3">
          <div>
            <span className="text-gray-500 dark:text-gray-400">SKU:</span>
            <p className="font-mono text-green-400">{product.sku}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Barcode:</span>
            <p className="font-mono text-green-400">{product.barcode}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Price:</span>
            <p className="text-white">Rp {product.sellingPrice.toLocaleString('id-ID')}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Stock:</span>
            <p className="text-white">{product.stockCurrent} units</p>
          </div>
        </div>

        {/* Mini barcode preview */}
        <div className="mt-3 bg-gray-800 p-2 rounded">
          <div className="flex items-center gap-1 h-12 justify-center bg-white dark:bg-gray-900 rounded p-1">
            <div className="flex items-end gap-px">
              {(product.barcode || product.sku || String(product.id)).substring(0, 16).split('').map((char: string, idx: number) => {
                const code = char.charCodeAt(0);
                return (
                  <div
                    key={idx}
                    className={`${(code % 2 === 0) ? 'bg-black' : 'bg-white dark:bg-gray-900'}`}
                    style={{
                      width: '3px',
                      height: `${8 + ((code % 3) * 2)}px`,
                    }}
                  />
                );
              })}
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 mt-1 font-mono">
            {product.barcode || product.sku || '-'}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Main BarcodeManager Component
 */
export default function BarcodeManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Record<string, boolean>>({});
  const [layoutOption, setLayoutOption] = useState<LayoutOption>('2x1');
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch products
  const { data: products = [], isLoading } = trpc.product.list.useQuery();

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.sku ?? '').toLowerCase().includes(query) ||
        (p.barcode ?? '').toLowerCase().includes(query) ||
        (p.category ?? '').toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  // Get selected products
  const checkedProducts = useMemo(
    () => filteredProducts.filter((p) => selectedProducts[p.id]),
    [filteredProducts, selectedProducts]
  );

  // Toggle selection
  const handleToggleSelect = (id: number) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Select all visible
  const handleSelectAll = () => {
    const newSelected = { ...selectedProducts };
    filteredProducts.forEach((p) => {
      newSelected[p.id] = !checkedProducts.length ? true : false;
    });
    setSelectedProducts(newSelected);
  };

  // Print barcode
  const handlePrint = () => {
    if (checkedProducts.length === 0) {
      alert('Pilih minimal satu produk untuk dicetak');
      return;
    }
    window.print();
  };

  const gridColsClass = {
    '1x1': 'grid-cols-1',
    '2x1': 'grid-cols-2',
    '3x1': 'grid-cols-3',
  }[layoutOption];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Kelola Barcode</h1>
        <p className="text-gray-400">
          Kelola dan cetak barcode produk Anda dengan mudah
        </p>
      </div>

      {/* Controls */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4 mb-6 backdrop-blur">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-400 mb-2">Cari Produk</label>
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
              />
              <input
                type="text"
                placeholder="Nama, SKU, atau barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 pl-10 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
              />
            </div>
          </div>

          {/* Layout */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Tata Letak</label>
            <select
              value={layoutOption}
              onChange={(e) => setLayoutOption(e.target.value as LayoutOption)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-green-500 transition-colors"
            >
              <option value="1x1">1 × 1</option>
              <option value="2x1">2 × 1</option>
              <option value="3x1">3 × 1</option>
            </select>
          </div>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            disabled={checkedProducts.length === 0}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded transition-colors"
          >
            <Printer size={18} />
            <span>Cetak ({checkedProducts.length})</span>
          </button>
        </div>

        {/* Selection Info */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="text-gray-400">
            Menampilkan {filteredProducts.length} produk
            {searchQuery && ` (hasil pencarian)`}
          </div>
          {filteredProducts.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="text-green-400 hover:text-green-300 transition-colors"
            >
              {checkedProducts.length === filteredProducts.length
                ? 'Batalkan Semua'
                : 'Pilih Semua'}
            </button>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="mb-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border border-green-500 border-t-transparent" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <X size={48} className="mx-auto mb-4 opacity-50" />
            <p>Tidak ada produk ditemukan</p>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isSelected={selectedProducts[product.id] || false}
                  onToggleSelect={handleToggleSelect}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Print Preview (Hidden on Screen, Shown on Print) */}
      <div
        ref={printRef}
        className="hidden print:block"
      >
        <div className={`grid ${gridColsClass} gap-0 p-4`}>
          {checkedProducts.map((product) => (
            <div
              key={product.id}
              className="p-6 flex flex-col items-center justify-center"
              style={{ minHeight: '200px', pageBreakInside: 'avoid' }}
            >
              <BarcodeDisplay
                barcode={product.barcode || product.sku || String(product.id)}
                productName={product.name}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
