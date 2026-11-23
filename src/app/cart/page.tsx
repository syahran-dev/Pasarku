'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatRupiah } from '@/lib/formatters';
import { ShoppingCart, Trash2, ArrowRight, Store, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui';

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCart = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/cart');
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      //
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleDelete = async (cartItemId: string) => {
    await fetch(`/api/cart?id=${cartItemId}`, { method: 'DELETE' });
    fetchCart();
  };

  // Group items by store (Multi-Vendor concept)
  const storeGroups = items.reduce((acc: any, it) => {
    if (!acc[it.storeId]) {
      acc[it.storeId] = {
        storeId: it.storeId,
        storeName: it.storeName,
        storeCity: it.storeCity,
        items: [],
      };
    }
    acc[it.storeId].items.push(it);
    return acc;
  }, {});

  const totalGoods = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center text-gray-400">
        <p className="animate-pulse">Memuat keranjang belanjamu...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-20 h-20 bg-orange-100 text-pasarku-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <ShoppingCart className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Keranjang Belanjamu Masih Kosong</h2>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          Yuk, jelajahi ribuan produk berkualitas dari berbagai toko nusantara dan penuhi kebutuhanmu!
        </p>
        <Link
          href="/products"
          className="inline-block bg-pasarku-500 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md hover:bg-pasarku-600 transition-colors"
        >
          Mulai Belanja Sekarang
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
        <ShoppingCart className="w-6 h-6 text-pasarku-500" /> Keranjang Belanja ({items.length} Barang)
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items Grouped By Store */}
        <div className="lg:col-span-2 space-y-6">
          {Object.values(storeGroups).map((group: any) => (
            <div key={group.storeId} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
              {/* Store Title */}
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <Store className="w-4 h-4 text-pasarku-500" />
                <span className="font-bold text-sm text-gray-900">{group.storeName}</span>
                <span className="text-xs text-gray-400">({group.storeCity})</span>
              </div>

              {/* Items in Store */}
              <div className="space-y-4">
                {group.items.map((item: any) => (
                  <div key={item.id} className="flex gap-4 items-center justify-between">
                    <div className="flex gap-3 items-center">
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="w-16 h-16 rounded-xl object-cover bg-gray-50 border border-gray-100"
                      />
                      <div>
                        <h4 className="text-xs font-semibold text-gray-800 line-clamp-1">{item.productName}</h4>
                        <span className="text-[11px] text-gray-400">Varian: {item.variantTitle}</span>
                        <div className="text-sm font-bold text-pasarku-600 mt-1">
                          {formatRupiah(item.price)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-xs font-semibold text-gray-600">x{item.quantity}</span>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Checkout Card */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4 sticky top-24">
            <h3 className="font-bold text-gray-900 text-sm">Ringkasan Belanja</h3>

            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Total Harga ({items.length} barang)</span>
                <span className="font-semibold text-gray-900">{formatRupiah(totalGoods)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimasi Ongkir</span>
                <span className="text-gray-400">Dihitung di Checkout</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
              <span className="font-bold text-sm text-gray-900">Total Tagihan</span>
              <span className="text-xl font-black text-pasarku-600">{formatRupiah(totalGoods)}</span>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full shadow-md"
              onClick={() => router.push('/checkout')}
            >
              Lanjut ke Checkout <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <div className="bg-orange-50/60 p-3 rounded-xl flex items-center gap-2 text-[11px] text-pasarku-700">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>Belanja di PasarKu dijamin aman dengan rekening penampung Escrow.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
