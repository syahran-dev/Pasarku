'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatRupiah, formatBerat } from '@/lib/formatters';
import {
  Star,
  ShieldCheck,
  Truck,
  Store,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui';

export function ProductDetailClient({ product }: { product: any }) {
  const router = useRouter();
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0] || null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [activeImage, setActiveImage] = useState(
    product.images[0]?.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'
  );

  const availableStock = selectedVariant?.inventory?.stockQty ?? 0;

  const handleAddToCart = async (redirectCheckout = false) => {
    if (!selectedVariant) return;
    setIsAdding(true);
    setToastMessage(null);

    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          productVariantId: selectedVariant.id,
          quantity,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setToastType('error');
        setToastMessage(data.error || 'Gagal menambahkan ke keranjang');
        setIsAdding(false);
        return;
      }

      setToastType('success');
      setToastMessage('Produk berhasil masuk ke keranjang belanja!');
      setIsAdding(false);

      if (redirectCheckout) {
        router.push('/checkout');
      } else {
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch {
      setToastType('error');
      setToastMessage('Terjadi kesalahan koneksi');
      setIsAdding(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-20 right-5 z-50 p-4 rounded-xl shadow-xl flex items-center gap-3 text-sm text-white ${
            toastType === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toastType === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Gallery */}
        <div className="space-y-4">
          <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
            <img src={activeImage} alt={product.name} className="w-full h-full object-cover" />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((img: any) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(img.imageUrl)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                    activeImage === img.imageUrl ? 'border-pasarku-500' : 'border-transparent'
                  }`}
                >
                  <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Actions */}
        <div className="space-y-6">
          <div>
            <span className="text-xs font-semibold text-pasarku-600 uppercase tracking-wider">
              {product.category.name}
            </span>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">{product.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{product.ratingAvg.toFixed(1)}</span>
              </div>
              <span>|</span>
              <span>{product.soldCount} Terjual</span>
              <span>|</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Stok Tersedia
              </span>
            </div>
          </div>

          {/* Price Box */}
          <div className="bg-orange-50/60 p-4 rounded-xl">
            <span className="text-xs text-gray-500">Harga Spesial</span>
            <div className="text-3xl font-black text-pasarku-600 mt-0.5">
              {formatRupiah(selectedVariant ? selectedVariant.price : product.priceMin)}
            </div>
          </div>

          {/* Variants */}
          {product.variants.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block">Pilih Varian Produk:</label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v: any) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setSelectedVariant(v);
                      setQuantity(1);
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all ${
                      selectedVariant?.id === v.id
                        ? 'border-pasarku-500 bg-orange-50 text-pasarku-700 font-bold ring-1 ring-pasarku-500'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {v.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Stock */}
          <div className="flex items-center gap-4 text-xs">
            <span className="font-bold text-gray-700">Kuantitas:</span>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-1 bg-gray-50 hover:bg-gray-100 font-bold text-sm"
              >
                -
              </button>
              <span className="px-4 py-1 font-semibold text-center w-12">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                className="px-3 py-1 bg-gray-50 hover:bg-gray-100 font-bold text-sm"
              >
                +
              </button>
            </div>
            <span className="text-gray-500">Tersisa {availableStock} buah ({formatBerat(product.weightGram)})</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-2">
            <Button
              variant="secondary"
              size="lg"
              className="flex-1 border border-pasarku-300"
              onClick={() => handleAddToCart(false)}
              isLoading={isAdding}
            >
              <ShoppingCart className="w-5 h-5 mr-2" /> Masukkan Keranjang
            </Button>
            <Button
              variant="primary"
              size="lg"
              className="flex-1 shadow-md"
              onClick={() => handleAddToCart(true)}
              isLoading={isAdding}
            >
              Beli Sekarang
            </Button>
          </div>

          {/* Store Info Card */}
          <div className="border-t border-gray-100 pt-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-pasarku-600 font-bold">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  {product.store.storeName}
                  {product.store.isVerified && (
                    <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded">
                      Verified
                    </span>
                  )}
                </h4>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gray-400" /> {product.store.cityName}
                  </span>
                  <span>•</span>
                  <span>Rating {product.store.ratingAvg.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Reviews */}
      <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-6">
        <div>
          <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
            Deskripsi Lengkap Produk
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed mt-4 whitespace-pre-line">
            {product.description}
          </p>
        </div>
      </div>
    </div>
  );
}
