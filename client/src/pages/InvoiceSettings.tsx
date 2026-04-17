'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, ImageOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc';
import { getProxiedImageUrl } from '@/lib/utils';

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
  invoiceNumber: 'INV-2024-001234',
  purchaseDate: '15 April 2024',
  dueDate: '30 April 2024',
  customerName: 'PT Maju Jaya Indonesia',
  customerAddress: 'Jl. Sudirman No. 45, Jakarta Selatan, DKI Jakarta 12190',
  customerPhone: '+62 812-3456-7890',
  paymentMethod: 'Bank Transfer',
  items: [
    { description: 'Jasa Konsultasi Bisnis', qty: 1, unitPrice: 5000000, total: 5000000 },
    { description: 'Pelatihan Karyawan', qty: 2, unitPrice: 2000000, total: 4000000 },
    { description: 'Software License (6 bulan)', qty: 1, unitPrice: 1500000, total: 1500000 },
  ],
};

export default function InvoiceSettings() {
  const [settings, setSettings] = useState<InvoiceSettingsState>({
    showCustomerName: true,
    showCustomerAddress: true,
    showCustomerPhone: true,
    showInvoiceNumber: true,
    showPurchaseDate: true,
    showDueDate: true,
    showPaymentMethod: true,
    showTotal: true,
    showSignature: true,
    showLogo: true,
    footerText: 'Terima kasih atas bisnis Anda. Pembayaran dapat dilakukan melalui rekening berikut.',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: invoiceSetting } = trpc.invoiceSettings.get.useQuery();
  const { data: business } = trpc.business.mine.useQuery();
  const updateMutation = trpc.invoiceSettings.update.useMutation();

  const logoUrl = useMemo(() => getProxiedImageUrl(business?.logoUrl), [business?.logoUrl]);

  // Load settings from server on mount
  useEffect(() => {
    if (invoiceSetting) {
      setSettings({
        showCustomerName: invoiceSetting.showCustomerName ?? true,
        showCustomerAddress: invoiceSetting.showCustomerAddress ?? true,
        showCustomerPhone: invoiceSetting.showCustomerPhone ?? true,
        showInvoiceNumber: invoiceSetting.showInvoiceNumber ?? true,
        showPurchaseDate: invoiceSetting.showPurchaseDate ?? true,
        showDueDate: invoiceSetting.showDueDate ?? true,
        showPaymentMethod: invoiceSetting.showPaymentMethod ?? true,
        showTotal: invoiceSetting.showTotal ?? true,
        showSignature: invoiceSetting.showSignature ?? true,
        showLogo: invoiceSetting.showLogo ?? true,
        footerText: invoiceSetting.footerText ?? '',
      });
    }
  }, [invoiceSetting]);

  // Auto-save with debounce
  const autoSave = (newSettings: InvoiceSettingsState) => {
    setIsSaving(true);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      updateMutation.mutate(
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
          onSuccess: () => {
            setIsSaving(false);
          },
          onError: () => {
            setIsSaving(false);
          },
        }
      );
    }, 1000);
  };

  const handleToggle = (key: keyof Omit<InvoiceSettingsState, 'footerText'>) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    autoSave(newSettings);
  };

  const handleFooterChange = (value: string) => {
    const newSettings = { ...settings, footerText: value };
    setSettings(newSettings);
    autoSave(newSettings);
  };

  const toggleItems = [
    { key: 'showCustomerName', label: 'Nama Pelanggan' },
    { key: 'showCustomerAddress', label: 'Alamat Pelanggan' },
    { key: 'showCustomerPhone', label: 'Nomor Telepon Pelanggan' },
    { key: 'showInvoiceNumber', label: 'Nomor Invoice' },
    { key: 'showPurchaseDate', label: 'Tanggal Pembelian' },
    { key: 'showDueDate', label: 'Jatuh Tempo' },
    { key: 'showPaymentMethod', label: 'Metode Pembayaran' },
    { key: 'showTotal', label: 'Total' },
    { key: 'showSignature', label: 'Tanda Tangan' },
    { key: 'showLogo', label: 'Logo Bisnis' },
  ] as const;

  const subtotal = DUMMY_INVOICE.items.reduce((sum, item) => sum + item.total, 0);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Pengaturan Invoice</h1>
          <p className="text-slate-400">Sesuaikan tampilan dan informasi yang ditampilkan di invoice Anda</p>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings Panel - LEFT COLUMN */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-white mb-6">Elemen Invoice</h2>

              {/* Toggle Items */}
              <div className="space-y-4 mb-8">
                {toggleItems.map((item) => (
                  <motion.div
                    key={item.key}
                    whileHover={{ x: 4 }}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-700/30 transition-colors"
                  >
                    <Label
                      htmlFor={item.key}
                      className="text-slate-300 cursor-pointer font-medium text-sm flex-1"
                    >
                      {item.label}
                    </Label>
                    <Switch
                      id={item.key}
                      checked={settings[item.key]}
                      onCheckedChange={() =>
                        handleToggle(item.key as keyof Omit<InvoiceSettingsState, 'footerText'>)
                      }
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </motion.div>
                ))}
              </div>

              {/* Footer Text Input */}
              <div className="space-y-3 pt-6 border-t border-slate-700/50">
                <Label className="text-slate-300 font-medium text-sm">Footer Text / Catatan</Label>
                <Input
                  value={settings.footerText}
                  onChange={(e) => handleFooterChange(e.target.value)}
                  placeholder="Masukkan catatan atau footer..."
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 h-24 resize-none"
                  maxLength={200}
                />
                <p className="text-xs text-slate-500 text-right">
                  {settings.footerText.length}/200
                </p>
              </div>

              {/* Save Status */}
              {updateMutation.isPending || isSaving ? (
                <div className="mt-6 flex items-center gap-2 text-sm text-slate-400">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  Menyimpan...
                </div>
              ) : updateMutation.isSuccess ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 flex items-center gap-2 text-sm text-emerald-400"
                >
                  <Check className="w-4 h-4" />
                  Tersimpan
                </motion.div>
              ) : null}
            </div>
          </motion.div>

          {/* Invoice Preview - RIGHT COLUMN */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="sticky top-8">
              <h3 className="text-lg font-semibold text-white mb-4">Pratinjau Invoice</h3>

              {/* Invoice Card */}
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                {/* Invoice Content */}
                <div className="p-8 text-slate-900">
                  {/* Header with Logo */}
                  <div className="mb-8 pb-8 border-b border-slate-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {settings.showLogo && logoUrl && !logoError ? (
                          <div className="mb-4">
                            <img
                              src={logoUrl}
                              alt="Logo"
                              className="h-12 w-auto object-contain"
                              onError={() => setLogoError(true)}
                            />
                          </div>
                        ) : settings.showLogo && logoError ? (
                          <div className="mb-4 flex items-center gap-2 text-slate-400 text-sm">
                            <ImageOff className="w-5 h-5" />
                            <span>Logo gagal dimuat — coba upload ulang di Pengaturan</span>
                          </div>
                        ) : null}
                        <h1 className="text-2xl font-bold text-slate-900">
                          {business?.businessName || 'PT Bisnis Saya'}
                        </h1>
                        <p className="text-sm text-slate-600 mt-1">{business?.address}</p>
                        {business?.phone && (
                          <p className="text-sm text-slate-600">{business.phone}</p>
                        )}
                      </div>
                      <div className="text-right">
                        {settings.showInvoiceNumber && (
                          <div className="mb-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Invoice No.
                            </p>
                            <p className="text-lg font-bold text-slate-900">
                              {DUMMY_INVOICE.invoiceNumber}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-slate-200">
                    {settings.showPurchaseDate && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                          Tanggal Pembelian
                        </p>
                        <p className="text-sm font-medium text-slate-900">
                          {DUMMY_INVOICE.purchaseDate}
                        </p>
                      </div>
                    )}
                    {settings.showDueDate && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                          Jatuh Tempo
                        </p>
                        <p className="text-sm font-medium text-slate-900">
                          {DUMMY_INVOICE.dueDate}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Customer Info */}
                  {(settings.showCustomerName ||
                    settings.showCustomerAddress ||
                    settings.showCustomerPhone) && (
                    <div className="mb-8 pb-8 border-b border-slate-200">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                        Tagihan Untuk
                      </p>
                      {settings.showCustomerName && (
                        <p className="font-semibold text-slate-900">
                          {DUMMY_INVOICE.customerName}
                        </p>
                      )}
                      {settings.showCustomerAddress && (
                        <p className="text-sm text-slate-600 mt-1 max-w-sm">
                          {DUMMY_INVOICE.customerAddress}
                        </p>
                      )}
                      {settings.showCustomerPhone && (
                        <p className="text-sm text-slate-600 mt-1">
                          {DUMMY_INVOICE.customerPhone}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Items Table */}
                  <div className="mb-8">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Deskripsi
                          </th>
                          <th className="text-right py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wide w-20">
                            Qty
                          </th>
                          <th className="text-right py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wide w-32">
                            Harga Satuan
                          </th>
                          <th className="text-right py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wide w-32">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {DUMMY_INVOICE.items.map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-100">
                            <td className="py-4 px-2 text-sm text-slate-900">{item.description}</td>
                            <td className="text-right py-4 px-2 text-sm text-slate-900">
                              {item.qty}
                            </td>
                            <td className="text-right py-4 px-2 text-sm text-slate-900">
                              Rp {item.unitPrice.toLocaleString('id-ID')}
                            </td>
                            <td className="text-right py-4 px-2 text-sm font-medium text-slate-900">
                              Rp {item.total.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  {settings.showTotal && (
                    <div className="mb-8 pb-8 border-b border-slate-200">
                      <div className="flex justify-end">
                        <div className="w-80">
                          <div className="flex justify-between py-2 text-sm text-slate-600">
                            <span>Subtotal</span>
                            <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between py-2 text-sm text-slate-600">
                            <span>PPN (10%)</span>
                            <span>Rp {tax.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between py-3 px-4 bg-slate-900 text-white rounded-lg mt-2 font-semibold">
                            <span>Total</span>
                            <span>Rp {total.toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Method */}
                  {settings.showPaymentMethod && (
                    <div className="mb-8 pb-8 border-b border-slate-200">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Metode Pembayaran
                      </p>
                      <p className="text-sm font-medium text-slate-900">
                        {DUMMY_INVOICE.paymentMethod}
                      </p>
                    </div>
                  )}

                  {/* Signature */}
                  {settings.showSignature && (
                    <div className="mb-8 pb-8 border-b border-slate-200">
                      <div className="flex justify-end">
                        <div className="text-center w-40">
                          <div className="h-16 border-b border-slate-900 mb-2" />
                          <p className="text-xs text-slate-600">Tanda Tangan & Stempel</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  {settings.footerText && (
                    <div className="text-center pt-4">
                      <p className="text-xs text-slate-600 leading-relaxed max-w-lg mx-auto">
                        {settings.footerText}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
