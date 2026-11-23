import React from 'react';
import Link from 'next/link';
import { ShoppingBag, ShieldCheck, Truck, RefreshCcw, Headphones } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16 text-gray-600 text-sm">
      {/* Value Proposition Highlights */}
      <div className="border-b border-gray-100 bg-orange-50/50 py-8">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-pasarku-100 text-pasarku-600 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Garansi Aman 100%</h4>
              <p className="text-xs text-gray-500">Dana ditahan di Escrow hingga barang diterima pembeli.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-pasarku-100 text-pasarku-600 rounded-xl">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Jangkauan Ekspedisi</h4>
              <p className="text-xs text-gray-500">Didukung JNE, SiCepat, dan Kurir Instant.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-pasarku-100 text-pasarku-600 rounded-xl">
              <RefreshCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Kemudahan Retur</h4>
              <p className="text-xs text-gray-500">Proses pengembalian dana mudah dan transparan.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-pasarku-100 text-pasarku-600 rounded-xl">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Bantuan 24/7</h4>
              <p className="text-xs text-gray-500">Tim kami siap membantu Anda kapan pun.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 text-pasarku-500 mb-4">
            <div className="bg-pasarku-500 text-white p-1.5 rounded-lg">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-xl font-black">PasarKu</span>
          </div>
          <p className="text-xs leading-relaxed text-gray-500">
            Platform marketplace multi-vendor terpercaya di Indonesia yang mempertemukan penjual dan pembeli
            dalam satu ekosistem transaksi yang aman, nyaman, dan modern.
          </p>
        </div>

        <div>
          <h5 className="font-bold text-gray-900 mb-3">Layanan Pelanggan</h5>
          <ul className="space-y-2 text-xs">
            <li><Link href="/" className="hover:text-pasarku-500">Pusat Bantuan</Link></li>
            <li><Link href="/cart" className="hover:text-pasarku-500">Cara Berbelanja</Link></li>
            <li><Link href="/orders" className="hover:text-pasarku-500">Lacak Pengiriman</Link></li>
            <li><Link href="/" className="hover:text-pasarku-500">Pengembalian Barang & Dana</Link></li>
          </ul>
        </div>

        <div>
          <h5 className="font-bold text-gray-900 mb-3">Kemitraan Penjual</h5>
          <ul className="space-y-2 text-xs">
            <li><Link href="/seller/dashboard" className="hover:text-pasarku-500">Buka Toko Gratis</Link></li>
            <li><Link href="/seller/wallet" className="hover:text-pasarku-500">Pusat Edukasi Penjual</Link></li>
            <li><Link href="/seller/orders" className="hover:text-pasarku-500">Manajemen Pesanan Toko</Link></li>
          </ul>
        </div>

        <div>
          <h5 className="font-bold text-gray-900 mb-3">Metode Pembayaran & Logistik</h5>
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-gray-700">
            <span className="bg-gray-100 px-2.5 py-1 rounded">BCA VA</span>
            <span className="bg-gray-100 px-2.5 py-1 rounded">Mandiri VA</span>
            <span className="bg-gray-100 px-2.5 py-1 rounded">QRIS</span>
            <span className="bg-gray-100 px-2.5 py-1 rounded">GoPay</span>
            <span className="bg-gray-100 px-2.5 py-1 rounded">COD</span>
            <span className="bg-gray-100 px-2.5 py-1 rounded">JNE</span>
            <span className="bg-gray-100 px-2.5 py-1 rounded">SiCepat</span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 py-4 bg-gray-50 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} PasarKu Karya Nusantara. Seluruh hak cipta dilindungi.
      </div>
    </footer>
  );
}
