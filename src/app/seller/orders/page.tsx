'use client';

import React, { useState, useEffect } from 'react';
import { formatRupiah, formatTanggal } from '@/lib/formatters';
import { Package, Truck, Check, Play, AlertCircle } from 'lucide-react';
import { Button, Badge } from '@/components/ui';

export default function SellerOrdersPage() {
  const [subOrders, setSubOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [customResi, setCustomResi] = useState<Record<string, string>>({});

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/seller/orders');
      const data = await res.json();
      setSubOrders(data.subOrders || []);
    } catch {
      //
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleProcess = async (subOrderId: string) => {
    setActionLoading(subOrderId);
    try {
      const res = await fetch('/api/seller/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subOrderId, action: 'PROCESS' }),
      });
      if (res.ok) {
        fetchOrders();
      }
    } catch {
      alert('Gagal memproses pesanan.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleShip = async (subOrderId: string) => {
    setActionLoading(subOrderId);
    const trackingNumber = customResi[subOrderId];
    try {
      const res = await fetch('/api/seller/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subOrderId, action: 'SHIP', trackingNumber }),
      });
      if (res.ok) {
        fetchOrders();
      }
    } catch {
      alert('Gagal mengirim pesanan.');
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center text-gray-400">
        <p className="animate-pulse">Memuat data pesanan toko...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
        <Package className="w-6 h-6 text-pasarku-500" /> Manajemen Pesanan Toko
      </h1>

      {subOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
          <p className="text-sm text-gray-400">Belum ada pesanan masuk untuk toko Anda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {subOrders.map((so) => (
            <div key={so.id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-3 gap-2 text-xs">
                <div>
                  <span className="font-mono font-bold text-gray-900 text-sm">#{so.subOrderNumber}</span>
                  <span className="text-gray-400 ml-2">Pembeli: {so.parentOrder.buyer.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">{formatTanggal(so.createdAt)}</span>
                  <Badge color={so.status === 'PAID' ? 'blue' : so.status === 'COMPLETED' ? 'green' : 'orange'}>
                    {so.status}
                  </Badge>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                {so.items.map((it: any) => (
                  <div key={it.id} className="flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold text-gray-800">{it.productNameSnapshot}</p>
                      <span className="text-gray-400">Varian: {it.variantTitleSnapshot} (x{it.quantity})</span>
                    </div>
                    <span className="font-bold text-gray-700">{formatRupiah(it.subtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Actions & Resi Input */}
              <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs text-gray-500">
                  <span>Kurir: <strong>{so.shipment?.courierCode} - {so.shipment?.courierService}</strong></span>
                  {so.shipment?.trackingNumber && (
                    <span className="ml-3 font-mono font-bold text-gray-800">
                      Resi: {so.shipment.trackingNumber}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {so.status === 'PAID' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleProcess(so.id)}
                      isLoading={actionLoading === so.id}
                    >
                      <Play className="w-3.5 h-3.5 mr-1" /> Proses Pesanan
                    </Button>
                  )}

                  {so.status === 'PROCESSING' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="No. Resi (Opsional)"
                        value={customResi[so.id] || ''}
                        onChange={(e) => setCustomResi({ ...customResi, [so.id]: e.target.value })}
                        className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-pasarku-500 font-mono"
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleShip(so.id)}
                        isLoading={actionLoading === so.id}
                      >
                        <Truck className="w-3.5 h-3.5 mr-1" /> Kirim Barang
                      </Button>
                    </div>
                  )}

                  {so.status === 'COMPLETED' && (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Dana Sudah Masuk Saldo
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
