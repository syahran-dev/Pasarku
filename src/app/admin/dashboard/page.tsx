import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { parseSessionToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatRupiah, formatTanggal } from '@/lib/formatters';
import { ShieldCheck, DollarSign, Users, Store, Package, Activity } from 'lucide-react';

export default async function AdminDashboardPage() {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? parseSessionToken(token) : null;

  if (!session || session.role !== 'ADMIN') {
    redirect('/login');
  }

  const [
    totalUsers,
    totalStores,
    totalOrders,
    totalProducts,
    orders,
    commissions,
    recentUsers,
    recentPayouts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.store.count(),
    prisma.order.count(),
    prisma.product.count(),
    prisma.order.findMany({ where: { paymentStatus: 'PAID' }, select: { grandTotal: true } }),
    prisma.commission.findMany({ select: { commissionAmount: true } }),
    prisma.user.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
    prisma.payoutRequest.findMany({
      take: 5,
      include: { store: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const totalGMV = orders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalCommission = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Admin Title */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-800 rounded-2xl p-6 text-white shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-xl">
            <ShieldCheck className="w-8 h-8 text-yellow-300" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Super Admin Control Center</h1>
            <p className="text-xs text-purple-200">Pengawasan Makro Ekosistem Multi-Vendor PasarKu</p>
          </div>
        </div>
      </div>

      {/* Macro Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-2">
          <span className="text-xs text-gray-500 font-semibold">Total GMV (Gross Merchandise Value)</span>
          <div className="text-2xl font-black text-gray-900">{formatRupiah(totalGMV)}</div>
          <span className="text-[11px] text-emerald-600 font-bold">100% Tercatat Otomatis</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-2">
          <span className="text-xs text-gray-500 font-semibold">Pendapatan Komisi Marketplace (2.5%)</span>
          <div className="text-2xl font-black text-purple-600">{formatRupiah(totalCommission)}</div>
          <span className="text-[11px] text-gray-400">Biaya admin terpotong otomatis</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-2">
          <span className="text-xs text-gray-500 font-semibold">Toko Aktif & Terverifikasi</span>
          <div className="text-2xl font-black text-blue-600">{totalStores} Toko</div>
          <span className="text-[11px] text-gray-400">Total {totalProducts} Produk Terkatalog</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-2">
          <span className="text-xs text-gray-500 font-semibold">Total Pengguna Terdaftar</span>
          <div className="text-2xl font-black text-pasarku-600">{totalUsers} User</div>
          <span className="text-[11px] text-gray-400">Pembeli & Mitra Toko</span>
        </div>
      </div>

      {/* Payout Approval & User Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payout Requests */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900">Pengajuan Pencairan Saldo (Payout)</h2>
          {recentPayouts.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">Tidak ada permohonan penarikan dana tertunda.</p>
          ) : (
            <div className="space-y-3">
              {recentPayouts.map((p) => (
                <div key={p.id} className="p-3.5 bg-gray-50 rounded-xl text-xs flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-800">{p.store.storeName}</p>
                    <span className="text-gray-500">{p.bankName} - {p.accountNumber} ({p.accountHolder})</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900 block">{formatRupiah(p.amount)}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-orange-100 text-pasarku-600 rounded">
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Management */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900">Pengguna Terbaru</h2>
          <div className="space-y-3">
            {recentUsers.map((u) => (
              <div key={u.id} className="p-3.5 bg-gray-50 rounded-xl text-xs flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-800">{u.name}</p>
                  <span className="text-gray-400">{u.email}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-gray-200">
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
