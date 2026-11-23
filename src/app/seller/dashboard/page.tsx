import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { parseSessionToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatRupiah } from '@/lib/formatters';
import Link from 'next/link';
import {
  TrendingUp,
  Package,
  Wallet,
  Clock,
  ArrowUpRight,
  Store,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui';

export default async function SellerDashboardPage() {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? parseSessionToken(token) : null;

  if (!session || session.role !== 'SELLER') {
    redirect('/login');
  }

  const store = await prisma.store.findUnique({
    where: { userId: session.userId },
    include: {
      wallet: true,
      subOrders: {
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!store) {
    redirect('/seller/register-store');
  }

  const wallet = store.wallet || { holdingBalance: 0, availableBalance: 0 };
  const totalSubOrders = store.subOrders.length;
  const pendingOrders = store.subOrders.filter((o) => o.status === 'PAID').length;
  const processingOrders = store.subOrders.filter((o) => o.status === 'PROCESSING').length;
  const completedOrders = store.subOrders.filter((o) => o.status === 'COMPLETED').length;

  const totalOmzet = store.subOrders
    .filter((o) => o.status === 'PAID' || o.status === 'PROCESSING' || o.status === 'SHIPPED' || o.status === 'COMPLETED')
    .reduce((sum, o) => sum + o.goodsAmount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Store Header Info */}
      <div className="bg-gradient-to-r from-pasarku-500 to-pasarku-600 rounded-2xl p-6 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white text-pasarku-600 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-inner">
            <Store className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black">{store.storeName}</h1>
            <p className="text-xs text-orange-100 mt-0.5">
              Kota: {store.cityName} • Rating Toko: {store.ratingAvg.toFixed(1)}/5.0
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Link href="/seller/orders">
            <Button variant="secondary" size="sm" className="bg-white text-pasarku-600 hover:bg-orange-50 font-bold">
              Manajemen Pesanan ({pendingOrders} Baru)
            </Button>
          </Link>
          <Link href="/seller/wallet">
            <Button variant="secondary" size="sm" className="bg-white/20 text-white hover:bg-white/30 border border-white/40">
              Kelola Saldo & Ledger
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Financial & Operation Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
            <span>Saldo Tersedia (Siap Cair)</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{formatRupiah(wallet.availableBalance)}</div>
          <Link href="/seller/wallet" className="text-[11px] font-bold text-pasarku-600 hover:underline flex items-center gap-1">
            Tarik Saldo Rekening <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
            <span>Dana Tertahan (Escrow)</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">{formatRupiah(wallet.holdingBalance)}</div>
          <p className="text-[11px] text-gray-400">Dirilis otomatis saat pembeli konfirmasi.</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
            <span>Total Omzet Penjualan</span>
            <TrendingUp className="w-4 h-4 text-pasarku-500" />
          </div>
          <div className="text-2xl font-black text-gray-900">{formatRupiah(totalOmzet)}</div>
          <p className="text-[11px] text-gray-400">Komisi platform 2.5% per pesanan.</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
            <span>Pesanan Siap Diproses</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-600">{pendingOrders}</div>
          <Link href="/seller/orders" className="text-[11px] font-bold text-blue-600 hover:underline">
            Proses Sekarang &rarr;
          </Link>
        </div>
      </div>

      {/* Recent Orders Overview */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Pesanan Masuk Terbaru</h2>
          <Link href="/seller/orders" className="text-xs font-bold text-pasarku-600 hover:underline">
            Lihat Semua Pesanan
          </Link>
        </div>

        {store.subOrders.length === 0 ? (
          <p className="text-xs text-gray-400 py-6 text-center">Belum ada pesanan masuk.</p>
        ) : (
          <div className="space-y-3">
            {store.subOrders.slice(0, 5).map((so) => (
              <div key={so.id} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl text-xs">
                <div>
                  <p className="font-mono font-bold text-gray-900">#{so.subOrderNumber}</p>
                  <span className="text-gray-400">{so.items.length} Barang • Nilai: {formatRupiah(so.goodsAmount)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold px-2.5 py-1 bg-white border border-gray-200 rounded-lg">
                    {so.status}
                  </span>
                  <Link href="/seller/orders">
                    <Button variant="secondary" size="sm">
                      Detail
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
