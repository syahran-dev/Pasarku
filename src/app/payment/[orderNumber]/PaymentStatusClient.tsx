'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatRupiah, formatTanggal } from '@/lib/formatters';
import {
  CheckCircle2,
  Clock,
  Copy,
  Check,
  ShieldAlert,
  PlayCircle,
  Truck,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui';

export function PaymentStatusClient({ order }: { order: any }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedSuccess, setSimulatedSuccess] = useState(order.paymentStatus === 'PAID');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const payment = order.payment;
  const isPaid = simulatedSuccess || order.paymentStatus === 'PAID';

  const handleCopyCode = () => {
    if (payment.paymentCode) {
      navigator.clipboard.writeText(payment.paymentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSimulatePayment = async () => {
    setIsSimulating(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/payments/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: order.orderNumber }),
      });
      const data = await res.json();
      if (res.ok) {
        setSimulatedSuccess(true);
        setStatusMsg('Simulasi Pembayaran Berhasil! Status telah diverifikasi via Webhook.');
      } else {
        setStatusMsg(data.error || 'Gagal simulasi');
      }
    } catch {
      setStatusMsg('Terjadi kesalahan koneksi.');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Notice Banner */}
      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-xs flex items-center gap-3 mb-6">
        <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-600" />
        <span>
          <strong>MODE DEMO DEVELOPMENT:</strong> Anda dapat menguji seluruh siklus pembayaran otomatis secara langsung tanpa kartu kredit/rekening sungguhan dengan menekan tombol simulasi di bawah.
        </span>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm text-center space-y-6">
        {/* Status Header */}
        <div>
          {isPaid ? (
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-10 h-10" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-orange-100 text-pasarku-500 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
              <Clock className="w-10 h-10" />
            </div>
          )}

          <h1 className="text-2xl font-black text-gray-900">
            {isPaid ? 'Pembayaran Berhasil Diverifikasi!' : 'Menunggu Pembayaran'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            No. Pesanan: <span className="font-mono font-bold text-gray-800">{order.orderNumber}</span>
          </p>
        </div>

        {/* Amount Box */}
        <div className="bg-orange-50/60 p-5 rounded-2xl max-w-md mx-auto">
          <span className="text-xs text-gray-500">Total Yang Harus Dibayar</span>
          <div className="text-3xl font-black text-pasarku-600 mt-1">
            {formatRupiah(order.grandTotal)}
          </div>
          <span className="text-[11px] text-gray-400 mt-1 block">
            Batas Pembayaran: {formatTanggal(payment.expiredAt)}
          </span>
        </div>

        {/* Payment Credentials */}
        {!isPaid ? (
          <div className="max-w-md mx-auto text-left bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Metode</span>
              <span className="font-bold text-gray-800">{payment.paymentChannel || payment.paymentMethod}</span>
            </div>

            {payment.paymentCode && (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Nomor Virtual Account / Kode Bayar:</label>
                <div className="flex items-center justify-between bg-white border border-gray-300 rounded-xl px-4 py-2.5">
                  <span className="font-mono text-base font-bold text-gray-900">{payment.paymentCode}</span>
                  <button
                    onClick={handleCopyCode}
                    className="text-xs font-semibold text-pasarku-600 hover:text-pasarku-700 flex items-center gap-1"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Tersalin' : 'Salin'}
                  </button>
                </div>
              </div>
            )}

            {payment.qrString && (
              <div className="text-center pt-2">
                <div className="inline-block p-4 bg-white rounded-xl border border-gray-200 shadow-inner">
                  <div className="w-48 h-48 bg-gray-900 flex items-center justify-center text-white text-xs text-center p-4 rounded-lg">
                    [QRIS CODE AKTIF: {order.orderNumber}]
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 mt-2">Scan kode QR di atas menggunakan aplikasi e-wallet apa saja.</p>
              </div>
            )}

            {/* Interactive DEMO Trigger Button */}
            <div className="pt-4 border-t border-gray-200">
              <Button
                variant="primary"
                size="md"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={handleSimulatePayment}
                isLoading={isSimulating}
              >
                <PlayCircle className="w-4 h-4 mr-2" /> Simulasikan Pembayaran Berhasil (DEMO)
              </Button>
              <p className="text-[11px] text-gray-400 text-center mt-2">
                Menstimulasi webhook payment gateway secara real-time.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-md mx-auto">
            <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-xs border border-emerald-200">
              {statusMsg || 'Dana telah diamankan di Rekening Penampung (Escrow). Penjual sedang memproses barang pesanan Anda.'}
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => router.push('/orders')}
            >
              Lihat Riwayat Pesanan & Lacak Resi <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
