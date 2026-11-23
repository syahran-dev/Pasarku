import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatRupiah } from '@/lib/formatters';
import { Star, MapPin, Filter, Search } from 'lucide-react';

interface Props {
  searchParams: {
    search?: string;
    category?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  };
}

export default async function ProductsCatalogPage({ searchParams }: Props) {
  const { search, category, sort, minPrice, maxPrice } = searchParams;

  // Build where filter
  const where: any = {
    isPublished: true,
    status: 'ACTIVE',
  };

  if (search) {
    where.name = { contains: search };
  }

  if (category) {
    where.category = { slug: category };
  }

  if (minPrice || maxPrice) {
    where.priceMin = {};
    if (minPrice) where.priceMin.gte = parseFloat(minPrice);
    if (maxPrice) where.priceMin.lte = parseFloat(maxPrice);
  }

  // Sorting
  let orderBy: any = { soldCount: 'desc' };
  if (sort === 'price_asc') orderBy = { priceMin: 'asc' };
  if (sort === 'price_desc') orderBy = { priceMin: 'desc' };
  if (sort === 'latest') orderBy = { createdAt: 'desc' };

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        store: true,
        category: true,
      },
      orderBy,
    }),
    prisma.category.findMany({ where: { isActive: true } }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-200 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            {search ? `Hasil Pencarian: "${search}"` : 'Katalog Produk PasarKu'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Menampilkan <span className="font-bold text-gray-800">{products.length}</span> produk terbaik
          </p>
        </div>

        {/* Sort Filter Tabs */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400">Urutkan:</span>
          <Link
            href={`/products?${new URLSearchParams({ ...searchParams, sort: 'popular' }).toString()}`}
            className={`px-3 py-1.5 rounded-lg border font-medium ${
              !sort || sort === 'popular'
                ? 'bg-pasarku-500 text-white border-pasarku-500'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Terpopuler
          </Link>
          <Link
            href={`/products?${new URLSearchParams({ ...searchParams, sort: 'latest' }).toString()}`}
            className={`px-3 py-1.5 rounded-lg border font-medium ${
              sort === 'latest'
                ? 'bg-pasarku-500 text-white border-pasarku-500'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Terbaru
          </Link>
          <Link
            href={`/products?${new URLSearchParams({ ...searchParams, sort: 'price_asc' }).toString()}`}
            className={`px-3 py-1.5 rounded-lg border font-medium ${
              sort === 'price_asc'
                ? 'bg-pasarku-500 text-white border-pasarku-500'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Harga Terendah
          </Link>
          <Link
            href={`/products?${new URLSearchParams({ ...searchParams, sort: 'price_desc' }).toString()}`}
            className={`px-3 py-1.5 rounded-lg border font-medium ${
              sort === 'price_desc'
                ? 'bg-pasarku-500 text-white border-pasarku-500'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Harga Tertinggi
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-6">
        {/* Sidebar Filter */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Filter className="w-4 h-4 text-pasarku-500" /> Filter Kategori
            </h3>
            <div className="space-y-2 text-xs">
              <Link
                href="/products"
                className={`block px-2.5 py-1.5 rounded-md ${
                  !category ? 'bg-orange-50 font-bold text-pasarku-600' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Semua Kategori
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/products?category=${c.slug}`}
                  className={`block px-2.5 py-1.5 rounded-md ${
                    category === c.slug ? 'bg-orange-50 font-bold text-pasarku-600' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="md:col-span-3">
          {products.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 space-y-3">
              <div className="w-16 h-16 bg-orange-100 text-pasarku-500 rounded-full flex items-center justify-center mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Tidak ada produk ditemukan</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Coba gunakan kata kunci lain atau hapus filter untuk melihat semua produk yang tersedia.
              </p>
              <Link
                href="/products"
                className="inline-block mt-2 bg-pasarku-500 text-white text-xs font-bold px-4 py-2 rounded-lg"
              >
                Reset Pencarian
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((prod) => (
                <Link
                  key={prod.id}
                  href={`/products/${prod.slug}`}
                  className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-pasarku-300 hover:shadow-lg transition-all flex flex-col"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
                    <img
                      src={prod.images[0]?.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h3 className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug group-hover:text-pasarku-600">
                        {prod.name}
                      </h3>
                      <p className="text-sm font-bold text-pasarku-600 mt-1">
                        {formatRupiah(prod.priceMin)}
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
