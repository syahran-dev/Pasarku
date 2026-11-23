'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatRupiah } from '@/lib/formatters';
import {
  MapPin,
  Truck,
  Store,
  CreditCard,
  Tag,
  ShieldCheck,
  AlertCircle,
  QrCode,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui';

export default function CheckoutPage() {
  const router = useRouter();
  const [quoteData, setQuoteData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('QRIS');
  const [voucherInput, setVoucherInput] = useState('PASARKUHEMAT');
  const [courierSelections, setCourierSelections] = useState<Record<string, any>>({});

  const fetchQuote = async (voucherCode?: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/checkout/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voucherCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal memuat rincian pesanan');
        setIsLoading(false);
        return;
      }
      setQuoteData(data);

      // Default courier selections
      const initialCouriers: Record<string, any> = {};
      data.subOrders.forEach((so: any) => {
        initialCouriers[so.storeId] = {
          code: so.shippingOptions[0].code,
          service: so.shippingOptions[0].service,
        };
      });
      setCourierSelections(initialCouriers);
    } catch {
      setErrorMsg('Terjadi kesalahan koneksi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote('PASARKUHEMAT');
  }, []);

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuote(voucherInput.trim());
  };

  const handleCourierChange = (storeId: string, option: any) => {
    setCourierSelections((prev) => ({
      ...prev,
      [storeId]: { code: option.code, service: option.service },
    }));
  };

  const handlePlaceOrder = async () => {
    if (!quoteData?.address?.id) {
      setErrorMsg('Alamat pengiriman belum tersedia');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/checkout/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressId: quoteData.address.id,
          paymentMethod: selectedPaymentMethod,
          courierSelections,
          voucherCode: quoteData.summary.appliedVoucher?.code || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal menyelesaikan pesanan.');
        setIsSubmitting(false);
        return;
      }

      router.push(data.redirectUrl);
    } catch {
      setErrorMsg('Gagal memproses pesanan ke server.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-gray-400">
        <p className="animate-pulse">Menghitung kalkulasi multi-toko & ongkos kirim resmi...</p>
      </div>
    );
  }

  if (!quoteData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-red-500 font-bold">{errorMsg || 'Keranjang belanja Anda kosong'}</p>
        <Button variant="outline" onClick={() => router.push('/cart')}>
          Kembali ke Keranjang
        </Button>
      </div>
    );
  }

  const { address, subOrders, summary } = quoteData;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-gray-900 mb-6">Checkout Pesanan</h1>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 text-sm border border-red-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Alamat Pengiriman */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-pasarku-500" /> Alamat Pengiriman
              </h2>
              <span className="text-xs text-pasarku-600 font-bold">Utama</span>
            </div>
            {address ? (
              <div className="text-xs text-gray-600 space-y-1">
                <p className="font-bold text-gray-800 text-sm">{address.recipientName} ({address.phoneNumber})</p>
                <p>{address.addressLine}</p>
                <p>{address.cityName}, {address.postalCode}</p>
              </div>
            ) : (
              <p className="text-xs text-red-500">Belum ada alamat tersimpan.</p>
            )}
          </div>

          {/* 2. Rincian Pesanan per Toko (Sub-Orders) */}
          <div className="space-y-4">
            <h2 className="font-bold text-sm text-gray-900">Rincian Paket & Ekspedisi ({subOrders.length} Toko)</h2>
            {subOrders.map((so: any) => (
              <div key={so.storeId} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Store className="w-4 h-4 text-pasarku-500" />
                  <span className="font-bold text-sm text-gray-900">{so.storeName}</span>
                  <span className="text-xs text-gray-400">({so.storeCity})</span>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  {so.items.map((it: any) => (
                    <div key={it.cartItemId} className="flex gap-3 items-center justify-between">
                      <div className="flex gap-3 items-center">
                        <img src={it.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover bg-gray-50 border border-gray-100" />
                        <div>
                          <p className="text-xs font-semibold text-gray-800 line-clamp-1">{it.name}</p>
                          <span className="text-[11px] text-gray-400">Varian: {it.variantTitle}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-gray-800">{formatRupiah(it.price)}</span>
                        <span className="text-[11px] text-gray-400 block">x{it.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shipping Courier Selector */}
                <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-800">
                    <span className="flex items-center gap-1.5 text-pasarku-700">
                      <Truck className="w-4 h-4" /> Pilih Layanan Pengiriman:
                    </span>
                    <span className="text-gray-500">Bobot: {so.totalWeightGram} gr</span>
                  </div>
                  <select
                    className="w-full text-xs bg-white border border-gray-300 rounded-lg p-2.5 text-gray-800 focus:outline-none focus:ring-1 focus:ring-pasarku-500"
                    onChange={(e) => {
                      const selected = so.shippingOptions.find((opt: any) => `${opt.code}-${opt.service}` === e.target.value);
                      if (selected) handleCourierChange(so.storeId, selected);
                    }}
                  >
                    {so.shippingOptions.map((opt: any) => (
                      <option key={`${opt.code}-${opt.service}`} value={`${opt.code}-${opt.service}`}>
                        {opt.name} - {opt.service} ({formatRupiah(opt.cost)}) • Estimasi {opt.etd}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* 3. Metode Pembayaran */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h2 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-pasarku-500" /> Pilih Metode Pembayaran
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                { id: 'QRIS', title: 'QRIS PasarKu', desc: 'Gojek, OVO, DANA, BCA Mobile', icon: <QrCode className="w-4 h-4 text-pasarku-600" /> },
                { id: 'BCA_VA', title: 'BCA Virtual Account', desc: 'Verifikasi instan otomatis', icon: <Building className="w-4 h-4 text-blue-600" /> },
                { id: 'MANDIRI_VA', title: 'Mandiri Virtual Account', desc: 'Livin by Mandiri & ATM', icon: <Building className="w-4 h-4 text-amber-600" /> },
                { id: 'COD', title: 'Bayar di Tempat (COD)', desc: 'Siapkan uang pas saat barang tiba', icon: <Truck className="w-4 h-4 text-green-600" /> },
              ].map((m) => (
                <label
                  key={m.id}
                  className={`p-3.5 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${
                    selectedPaymentMethod === m.id
                      ? 'border-pasarku-500 bg-orange-50/50 ring-1 ring-pasarku-500'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={m.id}
                    checked={selectedPaymentMethod === m.id}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="mt-0.5 text-pasarku-500 focus:ring-pasarku-500"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-gray-900">
                      {m.icon} {m.title}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">{m.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Voucher & Ringkasan Pembayaran */}
        <div className="space-y-4">
          {/* Voucher Box */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Tag className="w-4 h-4 text-pasarku-500" /> Voucher Diskon
            </h3>
            <form onSubmit={handleApplyVoucher} className="flex gap-2">
              <input
                type="text"
                placeholder="Kode Voucher (PASARKUHEMAT)"
                value={voucherInput}
                onChange={(e) => setVoucherInput(e.target.value)}
                className="flex-1 uppercase text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-pasarku-500"
              />
              <Button type="submit" variant="secondary" size="sm">
                Terapkan
              </Button>
            </form>
            {summary.appliedVoucher && (
              <p className="text-[11px] text-emerald-600 font-semibold">
                ✓ Voucher "{summary.appliedVoucher.code}" aktif (-{formatRupiah(summary.appliedVoucher.discountAmount)})
              </p>
            )}
          </div>

          {/* Tagihan Summary Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4 sticky top-24">
            <h3 className="font-bold text-gray-900 text-sm">Ringkasan Tagihan</h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Total Belanja</span>
                <span className="font-semibold text-gray-900">{formatRupiah(summary.totalGoodsAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Ongkos Kirim</span>
                <span className="font-semibold text-gray-900">{formatRupiah(summary.totalShippingAmount)}</span>
              </div>
              {summary.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Potongan Voucher</span>
                  <span>-{formatRupiah(summary.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Biaya Layanan Platform</span>
                <span className="font-semibold text-gray-900">{formatRupiah(summary.platformFee)}</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
              <span className="font-bold text-sm text-gray-900">Total Pembayaran</span>
              <span className="text-xl font-black text-pasarku-600">{formatRupiah(summary.grandTotal)}</span>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full shadow-md"
              onClick={handlePlaceOrder}
              isLoading={isSubmitting}
            >
              Bayar Sekarang
            </Button>

            <div className="bg-orange-50/60 p-3 rounded-xl flex items-center gap-2 text-[11px] text-pasarku-700">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>Transaksi aman & terverifikasi otomatis dengan sistem anti-tamper.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
