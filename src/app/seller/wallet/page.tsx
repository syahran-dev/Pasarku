'use client';

import React, { useState, useEffect } from 'react';
import { formatRupiah, formatTanggal } from '@/lib/formatters';
import { Wallet, ArrowUpRight, Clock, ShieldCheck, History } from 'lucide-react';
import { Button } from '@/components/ui';

export default function SellerWalletPage() {
  const [walletData, setWalletData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankName, setBankName] = useState('BCA');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchWallet = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/seller/wallet');
      const data = await res.json();
      setWalletData(data.wallet || null);
    } catch {
      //
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMsg(null);
    try {
      const res = await fetch('/api/seller/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(withdrawAmount),
          bankName,
          accountNumber,
          accountHolder,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        setWithdrawAmount('');
        setAccountNumber('');
        setAccountHolder('');
        fetchWallet();
        alert('Pengajuan pencairan saldo berhasil dikirim!');
      } else {
        setMsg(data.error || 'Gagal mengajukan pencairan');
      }
    } catch {
      setMsg('Terjadi kesalahan koneksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center text-gray-400">
        <p className="animate-pulse">Memuat buku besar & mutasi saldo...</p>
      </div>
    );
  }

  const { holdingBalance = 0, availableBalance = 0, transactions = [], payouts = [] } = walletData || {};

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Wallet className="w-6 h-6 text-pasarku-500" /> Dompet Toko & Double-Entry Ledger
        </h1>
        <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
          <ArrowUpRight className="w-4 h-4 mr-1.5" /> Tarik Saldo (Payout)
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
            <span>Saldo Aktif (Siap Dicairkan ke Rekening)</span>
            <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg font-bold">READY</span>
          </div>
          <div className="text-3xl font-black text-emerald-600">{formatRupiah(availableBalance)}</div>
          <p className="text-xs text-gray-400">Dana dari pesanan yang telah dikonfirmasi selesai oleh pembeli.</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-amber-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
            <span>Dana Tertahan (Escrow PasarKu)</span>
            <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg font-bold">ESCROW</span>
          </div>
          <div className="text-3xl font-black text-amber-600">{formatRupiah(holdingBalance)}</div>
          <p className="text-xs text-gray-400">Dana diamankan hingga paket tiba dan dikonfirmasi pembeli.</p>
        </div>
      </div>

      {/* Immutable Ledger Transactions */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <History className="w-5 h-5 text-pasarku-500" /> Mutasi Transaksi Buku Besar (Immutable Ledger)
        </h2>

        {transactions.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">Belum ada mutasi keuangan tercatat.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Tipe Saldo</th>
                  <th className="py-2.5 px-3">Keterangan</th>
                  <th className="py-2.5 px-3">Nominal</th>
                  <th className="py-2.5 px-3">Saldo Setelahnya</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50">
                    <td className="py-2.5 px-3 text-gray-400">{formatTanggal(tx.createdAt)}</td>
                    <td className="py-2.5 px-3 font-semibold">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${tx.balanceType === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {tx.balanceType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-700">{tx.description}</td>
                    <td className={`py-2.5 px-3 font-bold ${tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {tx.type === 'CREDIT' ? '+' : '-'}{formatRupiah(tx.amount)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-gray-800">{formatRupiah(tx.balanceAfter)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payout Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-sm">Pengajuan Tarik Saldo</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold">
                ✕
              </button>
            </div>

            {msg && <p className="text-xs text-red-500 font-semibold">{msg}</p>}

            <form onSubmit={handleWithdraw} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Nominal Penarikan (Rp)</label>
                <input
                  type="number"
                  placeholder="Contoh: 500000"
                  max={availableBalance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-pasarku-500 text-sm font-bold"
                />
                <span className="text-[11px] text-gray-400">Maksimal: {formatRupiah(availableBalance)}</span>
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-1">Bank Tujuan</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5"
                >
                  <option value="BCA">Bank BCA</option>
                  <option value="Mandiri">Bank Mandiri</option>
                  <option value="BRI">Bank BRI</option>
                  <option value="BNI">Bank BNI</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-1">Nomor Rekening</label>
                <input
                  type="text"
                  placeholder="Nomor rekening bank Anda"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-1">Nama Pemilik Rekening</label>
                <input
                  type="text"
                  placeholder="Nama sesuai buku tabungan"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg p-2.5"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <Button variant="outline" size="sm" type="button" className="flex-1" onClick={() => setIsModalOpen(false)}>
                  Batal
                </Button>
                <Button variant="primary" size="sm" type="submit" className="flex-1" isLoading={isSubmitting}>
                  Kirim Pengajuan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
