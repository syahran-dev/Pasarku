import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatRupiah } from '@/lib/formatters';
import {
  Sparkles,
  Flame,
  Star,
  MapPin,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Cpu,
  Shirt,
  Home,
  Utensils,
} from 'lucide-react';

export const revalidate = 60; // Revalidate every minute

export default async function HomePage() {
  // Fetch categories & top products
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  const featuredProducts = await prisma.product.findMany({
    where: { isPublished: true, status: 'ACTIVE' },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      store: true,
      variants: { take: 1 },
    },
    orderBy: { soldCount: 'desc' },
    take: 12,
  });

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'elektronik-gadget':
        return <Cpu className="w-6 h-6 text-blue-500" />;
      case 'fashion-pakaian':
        return <Shirt className="w-6 h-6 text-pink-500" />;
      case 'perlengkapan-rumah':
        return <Home className="w-6 h-6 text-emerald-500" />;
      default:
        return <Utensils className="w-6 h-6 text-amber-500" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* 1. Hero Promo Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Banner */}
        <div className="lg:col-span-2 relative rounded-2xl overflow-hidden bg-gradient-to-r from-pasarku-500 to-pasarku-600 text-white p-8 md:p-12 shadow-lg flex flex-col justify-between min-h-[260px]">
          <div className="max-w-md space-y-3 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Promo Peluncuran PasarKu
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
              Belanja Aneka Produk Nusantara Lebih Hemat & Terpercaya
            </h1>
            <p className="text-white/80 text-sm">
              Gunakan kode voucher <span className="font-bold underline text-yellow-300">PASARKUHEMAT</span> untuk potongan langsung Rp 20.000!
            </p>
          </div>
          <div className="pt-4 z-10">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-white text-pasarku-600 font-bold px-6 py-2.5 rounded-lg shadow-md hover:bg-orange-50 transition-all hover:translate-x-0.5"
            >
              Jelajahi Sekarang <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Side Highlights */}
        <div className="flex flex-col gap-4">
          <div className="flex-1 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl p-6 text-white shadow-md flex flex-col justify-between">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider opacity-90">Gratis Ongkir</span>
              <h3 className="text-xl font-bold mt-1">Ekspedisi Terlengkap</h3>
              <p className="text-xs text-white/80 mt-1">JNE, SiCepat & GoSend Instant siap kirim ke seluruh pelosok Indonesia.</p>
            </div>
            <Link href="/products" className="text-xs font-bold underline flex items-center gap-1 mt-3">
              Cek Produk &rarr;
            </Link>
          </div>

          <div className="flex-1 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-md flex flex-col justify-between">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider opacity-90">Jaminan Keamanan</span>
              <h3 className="text-xl font-bold mt-1">Sistem Escrow PasarKu</h3>
              <p className="text-xs text-white/80 mt-1">Uang Anda aman 100%. Dana hanya diserahkan ke penjual setelah paket Anda terima.</p>
            </div>
            <Link href="/seller/dashboard" className="text-xs font-bold underline flex items-center gap-1 mt-3">
              Pelajari &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Categories Grid */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-pasarku-500" /> Kategori Pilihan
          </h2>
          <Link href="/products" className="text-xs font-semibold text-pasarku-500 hover:underline">
            Lihat Semua
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="group flex flex-col items-center p-4 rounded-xl border border-gray-100 hover:border-pasarku-200 hover:bg-orange-50/30 transition-all text-center"
            >
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                {getCategoryIcon(cat.slug)}
              </div>
              <span className="text-xs font-semibold text-gray-700 group-hover:text-pasarku-600">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Flash Sale / Hot Products */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <Flame className="w-5 h-5 fill-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Produk Terpopuler & Paling Laris</h2>
              <p className="text-xs text-gray-500">Paling banyak dibeli minggu ini dengan garansi resmi dan ulasan bintang 5</p>
            </div>
          </div>
          <Link
            href="/products"
            className="text-xs font-semibold text-pasarku-500 hover:underline flex items-center gap-1"
          >
            Lihat Katalog Penuh <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {featuredProducts.map((prod) => {
            const primaryImage = prod.images[0]?.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';
            const price = prod.priceMin;

            return (
              <Link
                key={prod.id}
                href={`/products/${prod.slug}`}
                className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-pasarku-300 hover:shadow-lg transition-all flex flex-col"
              >
                {/* Image */}
                <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
                  <img
                    src={primaryImage}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {prod.soldCount > 50 && (
                    <span className="absolute top-2 left-2 bg-pasarku-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                      HOT
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3 className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug group-hover:text-pasarku-600 transition-colors">
                      {prod.name}
                    </h3>
                    <p className="text-sm font-bold text-pasarku-600 mt-1">
                      {formatRupiah(price)}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-gray-50 space-y-1 text-[11px] text-gray-500">
                    <div className="flex items-center gap-1 text-gray-400">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="truncate">{prod.store.cityName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span className="font-semibold text-gray-700">{prod.ratingAvg.toFixed(1)}</span>
                      </div>
                      <span>{prod.soldCount} terjual</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
