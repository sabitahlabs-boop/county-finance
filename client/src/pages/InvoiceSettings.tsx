'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ImageOff, Upload, Trash2, Loader2, FileSignature, Eye, Settings2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc';
import { getProxiedImageUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { toast } from 'sonner';

interface InvoiceSettingsState {
  showCustomerName: boolean;
  showCustomerAddress: boolean;
  showCustomerPhone: boolean;
  showInvoiceNumber: boolean;
  showPurchaseDate: boolean;
  showDueDate: boolean;
  showPaymentMethod: boolean;
  showTotal: boolean;
  showSignature: boolean;
  showLogo: boolean;
  footerText: string;
}

const DUMMY_INVOICE = {
  txCode: 'INV-2024-001234',
  date: '15 April 2024',
  dueDate: '30 April 2024',
  customerName: 'PT Maju Jaya Indonesia',
  customerAddress: 'Jl. Sudirman No. 45, Jakarta Selatan',
  customerPhone: '+62 812-3456-7890',
  paymentMethod: 'Transfer Bank',
  category: 'Penjualan Langsung',
  description: 'Sabitah Glow Serum 30ml x3',
  amount: 387000,
};

export default function InvoiceSettings() {
  const utils = trpc.useUtils();
  const [settings, setSettings] = useState<InvoiceSettingsState>({
    showCustomerName: true,
    showCustomerAddress: true,
    showCustomerPhone: true,
    showInvoiceNumber: true,
    showPurchaseDate: true,
    showDueDate: false,
    showPaymentMethod: true,
    showTotal: true,
    showSignature: false,
    showLogo: true,
    footerText: '',
  });

  const [invoiceFooter, setInvoiceFooter] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');
  const [sigUploading, setSigUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: invoiceSetting } = trpc.invoiceSettings.get.useQuery();
  const { data: business } = trpc.business.mine.useQuery();
  const updateSettingsMutation = trpc.invoiceSettings.update.useMutation({
    onError: (err) => toast.error(err.message),
  });
  const updateBizMutation = trpc.business.update.useMutation({
    onSuccess: () => utils.business.mine.invalidate(),
    onError: (err) => toast.error(err.message),
  });

  const logoUrl = useMemo(() => getProxiedImageUrl(business?.logoUrl), [business?.logoUrl]);
  const proxiedSignatureUrl = useMemo(() => getProxiedImageUrl(signatureUrl), [signatureUrl]);
  const brandColor = business?.brandColor || '#3CB981';

  // Load settings from server ONCE on initial data
  useEffect(() => {
    if (invoiceSetting && !initialLoaded) {
      setSettings({
        showCustomerName: invoiceSetting.showCustomerName ?? true,
        showCustomerAddress: invoiceSetting.showCustomerAddress ?? true,
        showCustomerPhone: invoiceSetting.showCustomerPhone ?? true,
        showInvoiceNumber: invoiceSetting.showInvoiceNumber ?? true,
        showPurchaseDate: invoiceSetting.showPurchaseDate ?? true,
        showDueDate: invoiceSetting.showDueDate ?? false,
        showPaymentMethod: invoiceSetting.showPaymentMethod ?? true,
        showTotal: invoiceSetting.showTotal ?? true,
        showSignature: invoiceSetting.showSignature ?? false,
        showLogo: invoiceSetting.showLogo ?? true,
        footerText: invoiceSetting.footerText ?? '',
      });
      setInitialLoaded(true);
    }
  }, [invoiceSetting, initialLoaded]);

  // Load business data for footer and signature
  useEffect(() => {
    if (business && !initialLoaded) {
      setInvoiceFooter(business.invoiceFooter || '');
      setSignatureUrl(business.signatureUrl || '');
    }
  }, [business, initialLoaded]);

  // Mark loaded once both are ready
  useEffect(() => {
    if (business && invoiceSetting !== undefined) {
      setInitialLoaded(true);
    }
  }, [business, invoiceSetting]);

  // Auto-save toggle settings with debounce
  const autoSaveSettings = useCallback((newSettings: InvoiceSettingsState) => {
    setIsSaving(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      updateSettingsMutation.mutate(
        {
          showCustomerName: newSettings.showCustomerName,
          showCustomerAddress: newSettings.showCustomerAddress,
          showCustomerPhone: newSettings.showCustomerPhone,
          showInvoiceNumber: newSettings.showInvoiceNumber,
          showPurchaseDate: newSettings.showPurchaseDate,
          showDueDate: newSettings.showDueDate,
          showPaymentMethod: newSettings.showPaymentMethod,
          showTotal: newSettings.showTotal,
          showSignature: newSettings.showSignature,
          showLogo: newSettings.showLogo,
          footerText: newSettings.footerText,
        },
        {
          onSuccess: () => setIsSaving(false),
          onError: () => {
            setIsSaving(false);
            toast.error('Gagal menyimpan pengaturan');
          },
        }
      );
    }, 800);
  }, [updateSettingsMutation]);

  const handleToggle = (key: keyof Omit<InvoiceSettingsState, 'footerText'>) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    autoSaveSettings(newSettings);
  };

  const handleFooterChange = (value: string) => {
    setInvoiceFooter(value);
  };

  const handleFooterSave = () => {
    updateBizMutation.mutate(
      { invoiceFooter },
      { onSuccess: () => toast.success('Footer berhasil disimpan') }
    );
  };

  const handleUploadSignature = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }
    setSigUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/upload-image', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload gagal');
      setSignatureUrl(data.url);
      updateBizMutation.mutate({ signatureUrl: data.url });
      toast.success('Tanda tangan berhasil diupload');
    } catch (err: any) {
      toast.error(err.message || 'Gagal upload');
    } finally {
      setSigUploading(false);
    }
  };

  const handleDeleteSignature = () => {
    setSignatureUrl('');
    updateBizMutation.mutate({ signatureUrl: '' });
    toast.success('Tanda tangan berhasil dihapus');
  };

  const toggleItems = [
    { key: 'showLogo', label: 'Logo Bisnis', desc: 'Tampilkan logo di header invoice' },
    { key: 'showInvoiceNumber', label: 'Nomor Invoice', desc: 'Kode transaksi unik' },
    { key: 'showPurchaseDate', label: 'Tanggal Transaksi', desc: 'Tanggal pembelian' },
    { key: 'showDueDate', label: 'Jatuh Tempo', desc: 'Batas waktu pembayaran' },
    { key: 'showCustomerName', label: 'Nama Pelanggan', desc: 'Nama customer/client' },
    { key: 'showCustomerAddress', label: 'Alamat Pelanggan', desc: 'Alamat lengkap' },
    { key: 'showCustomerPhone', label: 'Telepon Pelanggan', desc: 'Nomor HP/telepon' },
    { key: 'showPaymentMethod', label: 'Metode Pembayaran', desc: 'Tunai/Transfer/QRIS' },
    { key: 'showTotal', label: 'Total Harga', desc: 'Subtotal, pajak, grand total' },
    { key: 'showSignature', label: 'Tanda Tangan', desc: 'Tanda tangan digital di bawah' },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Pengaturan Invoice</h1>
          <p className="text-slate-400">Atur tampilan, footer, dan tanda tangan invoice Anda</p>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Settings Panel - LEFT */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-4"
          >
            {/* Toggle Switches */}
            <div className="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-5">
                <Settings2 className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Elemen Invoice</h2>
              </div>

              <div className="space-y-1">
                {toggleItems.map((item) => (
                  <motion.div
                    key={item.key}
                    whileHover={{ x: 2 }}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-700/30 transition-colors cursor-pointer"
                    onClick={() => handleToggle(item.key as keyof Omit<InvoiceSettingsState, 'footerText'>)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 font-medium">{item.label}</p>
                      <p className="text-xs text-slate-500 truncate">{item.desc}</p>
                    </div>
                    <Switch
                      checked={settings[item.key]}
                      onCheckedChange={() =>
                        handleToggle(item.key as keyof Omit<InvoiceSettingsState, 'footerText'>)
                      }
                      className="data-[state=checked]:bg-emerald-500 ml-3 shrink-0"
                    />
                  </motion.div>
                ))}
              </div>

              {/* Save Status */}
              <AnimatePresence>
                {(updateSettingsMutation.isPending || isSaving) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 flex items-center gap-2 text-xs text-slate-400"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    Menyimpan...
                  </motion.div>
                )}
                {!isSaving && updateSettingsMutation.isSuccess && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 flex items-center gap-2 text-xs text-emerald-400"
                  >
                    <Check className="w-3 h-3" />
                    Tersimpan
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Text */}
            <div className="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileSignature className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Footer Invoice</h2>
              </div>
              <textarea
                value={invoiceFooter}
                onChange={(e) => handleFooterChange(e.target.value)}
                placeholder="Contoh: Terima kasih atas kepercayaan Anda. Barang yang sudah dibeli tidak dapat dikembalikan."
                rows={3}
                maxLength={200}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-slate-500">{invoiceFooter.length}/200</p>
                <Button
                  size="sm"
                  onClick={handleFooterSave}
                  disabled={updateBizMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-4"
                >
                  {updateBizMutation.isPending ? (
                    <><Loader2 className="h-3 w-3 animate-spin mr-1.5" /> Menyimpan</>
                  ) : 'Simpan Footer'}
                </Button>
              </div>
            </div>

            {/* Signature Upload */}
            <div className="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileSignature className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Tanda Tangan Digital</h2>
              </div>

              {signatureUrl ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-slate-600 bg-white p-4 text-center">
                    <img
                      src={proxiedSignatureUrl || signatureUrl}
                      alt="Tanda Tangan"
                      className="h-16 mx-auto"
                    />
                  </div>
                  <div className="flex gap-2">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadSignature(file);
                          e.target.value = '';
                        }}
                      />
                      <Button variant="outline" size="sm" className="w-full gap-2 border-slate-600 text-slate-300 hover:bg-slate-700" asChild disabled={sigUploading}>
                        <span>
                          {sigUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                          Ganti
                        </span>
                      </Button>
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 border-red-800/50 text-red-400 hover:bg-red-950/30 hover:text-red-300"
                      onClick={handleDeleteSignature}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Hapus
                    </Button>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadSignature(file);
                      e.target.value = '';
                    }}
                  />
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-600 p-6 hover:border-emerald-500/50 transition-colors">
                    {sigUploading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-slate-400 mb-2" />
                    ) : (
                      <Upload className="h-6 w-6 text-slate-400 mb-2" />
                    )}
                    <p className="text-xs font-medium text-slate-300">Klik untuk upload tanda tangan</p>
                    <p className="text-xs text-slate-500 mt-1">PNG transparan direkomendasikan</p>
                  </div>
                </label>
              )}
            </div>
          </motion.div>

          {/* Invoice Preview - RIGHT */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Pratinjau Invoice</h3>
              </div>

              {/* Invoice Preview Card — matches InvoicePrintDialog exactly */}
              <div
                className="rounded-xl shadow-2xl overflow-hidden"
                style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
              >
                {/* Header with brand color */}
                <div style={{ background: brandColor, padding: '24px 28px 20px' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {settings.showLogo && logoUrl && !logoError ? (
                        <img
                          src={logoUrl}
                          alt="Logo"
                          className="h-10 w-auto rounded-lg bg-white p-1"
                          onError={() => setLogoError(true)}
                        />
                      ) : settings.showLogo ? (
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                          style={{ background: 'rgba(255,255,255,0.2)' }}
                        >
                          {(business?.businessName || 'C').charAt(0).toUpperCase()}
                        </div>
                      ) : null}
                      <div>
                        <div className="text-white font-bold text-base">
                          {business?.businessName || 'Nama Bisnis Anda'}
                        </div>
                        {business?.address && (
                          <div className="text-white/70 text-xs mt-0.5">{business.address}</div>
                        )}
                        {business?.phone && (
                          <div className="text-white/70 text-xs">{business.phone}</div>
                        )}
                      </div>
                    </div>
                    {settings.showInvoiceNumber && (
                      <div className="text-right">
                        <div className="text-white/60 text-[10px] font-semibold tracking-widest uppercase">INVOICE</div>
                        <div className="text-white font-bold text-sm mt-0.5">{DUMMY_INVOICE.txCode}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Invoice Body — white background */}
                <div className="bg-white text-slate-900">
                  {/* Date & Payment Info */}
                  {(settings.showPurchaseDate || settings.showDueDate || settings.showPaymentMethod) && (
                    <div className="px-7 py-4 border-b border-slate-100">
                      <div className="grid grid-cols-3 gap-4">
                        {settings.showPurchaseDate && (
                          <div>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Tanggal</p>
                            <p className="text-xs font-medium text-slate-800">{DUMMY_INVOICE.date}</p>
                          </div>
                        )}
                        {settings.showDueDate && (
                          <div>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Jatuh Tempo</p>
                            <p className="text-xs font-medium text-slate-800">{DUMMY_INVOICE.dueDate}</p>
                          </div>
                        )}
                        {settings.showPaymentMethod && (
                          <div>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Pembayaran</p>
                            <p className="text-xs font-medium text-slate-800">{DUMMY_INVOICE.paymentMethod}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Customer Info */}
                  {(settings.showCustomerName || settings.showCustomerAddress || settings.showCustomerPhone) && (
                    <div className="px-7 py-4 border-b border-slate-100">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Tagihan Untuk</p>
                      {settings.showCustomerName && (
                        <p className="text-sm font-semibold text-slate-800">{DUMMY_INVOICE.customerName}</p>
                      )}
                      {settings.showCustomerAddress && (
                        <p className="text-xs text-slate-500 mt-0.5">{DUMMY_INVOICE.customerAddress}</p>
                      )}
                      {settings.showCustomerPhone && (
                        <p className="text-xs text-slate-500 mt-0.5">{DUMMY_INVOICE.customerPhone}</p>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  <div className="px-7 py-4 border-b border-slate-100">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Keterangan</p>
                    <p className="text-xs text-slate-700">{DUMMY_INVOICE.description}</p>
                  </div>

                  {/* Total */}
                  {settings.showTotal && (
                    <div className="px-7 py-5 bg-slate-50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500 font-medium">Total</span>
                        <span className="text-xl font-bold text-emerald-600">
                          +Rp {DUMMY_INVOICE.amount.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Signature */}
                  {settings.showSignature && (
                    <div className="px-7 py-4 border-t border-slate-100 text-right">
                      <p className="text-[10px] text-slate-400 mb-2">Hormat kami,</p>
                      {signatureUrl && proxiedSignatureUrl ? (
                        <img
                          src={proxiedSignatureUrl}
                          alt="Tanda Tangan"
                          className="h-10 w-auto ml-auto"
                        />
                      ) : (
                        <div className="h-10 w-28 border-b border-slate-300 ml-auto" />
                      )}
                      <p className="text-xs text-slate-600 font-semibold mt-1">
                        {business?.businessName || 'Nama Bisnis'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer with brand color */}
                <div style={{ background: brandColor }} className="px-7 py-3.5 text-center">
                  <p className="text-white/90 text-xs">
                    {invoiceFooter || 'Terima kasih atas kepercayaan Anda'}
                  </p>
                  {business?.npwp && (
                    <p className="text-white/60 text-[10px] mt-1">NPWP: {business.npwp}</p>
                  )}
                </div>
              </div>

              {/* Preview Note */}
              <p className="text-center text-xs text-slate-500 mt-3">
                Preview ini sesuai dengan tampilan invoice saat dicetak
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
