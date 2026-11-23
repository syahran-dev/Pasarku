'use client';

import React, { useState } from 'react';
import { formatRupiah, formatTanggal } from '@/lib/formatters';
import {
  Package,
  Store,
  Truck,
  CheckCircle2,
  Clock,
  ChevronRight,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Button, Badge } from '@/components/ui';

export function OrdersClient({ orders }: { orders: any[] }) {
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedTracking, setSelectedTracking] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleConfirmReceived = async (subOrderId: string) => {
    if (!confirm('Apakah paket Anda benar-benar sudah tiba dalam kondisi baik?')) return;
    setActionLoading(subOrderId);
    try {
      const res = await fetch('/api/orders/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subOrderId }),
      });
      if (res.ok) {
        alert('Terima kasih! Pesanan selesai dan dana diteruskan ke saldo penjual.');
        window.location.reload();
      }
    } catch {
      alert('Terjadi kesalahan koneksi');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return <Badge color="orange">Menunggu Pembayaran</Badge>;
      case 'PAID':
        return <Badge color="blue">Sudah Dibayar</Badge>;
      case 'PROCESSING':
        return <Badge color="orange">Sedang Diproses Toko</Badge>;
      case 'SHIPPED':
        return <Badge color="blue">Dalam Pengiriman</Badge>;
      case 'DELIVERED':
        return <Badge color="green">Paket Tiba</Badge>;
      case 'COMPLETED':
        return <Badge color="green">Selesai</Badge>;
      default:
        return <Badge color="gray">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
        <Package className="w-6 h-6 text-pasarku-500" /> Riwayat & Pelacakan Pesanan
      </h1>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 space-y-3">
          <p className="text-sm text-gray-500">Anda belum memiliki riwayat pesanan.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
              {/* Order Header */}
              <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-3 gap-2 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-gray-900">{order.orderNumber}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">{formatTanggal(order.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Status Pembayaran:</span>
                  {order.paymentStatus === 'PAID' ? (
                    <Badge color="green">Lunas</Badge>
                  ) : (
                    <Badge color="orange">Belum Lunas</Badge>
                  )}
                </div>
              </div>

              {/* Sub-Orders List */}
              <div className="space-y-4">
                {order.subOrders.map((so: any) => (
                  <div key={so.id} className="bg-gray-50/70 p-4 rounded-xl border border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                        <Store className="w-4 h-4 text-pasarku-500" />
                        <span>{so.store.storeName}</span>
                      </div>
                      {getStatusBadge(so.status)}
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

                    {/* Actions and Logistics */}
                    <div className="pt-2 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                      {so.shipment && (
                        <div className="text-gray-500 flex items-center gap-2">
                          <Truck className="w-4 h-4 text-pasarku-600" />
                          <span>{so.shipment.courierCode} - Resi: <strong className="font-mono text-gray-800">{so.shipment.trackingNumber || 'Menunggu Resi'}</strong></span>
                          {so.shipment.events?.length > 0 && (
                            <button
                              onClick={() => setSelectedTracking(so.shipment)}
                              className="text-pasarku-600 font-bold hover:underline flex items-center"
                            >
                              Lacak Paket <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Complete order button */}
                      {(so.status === 'SHIPPED' || so.status === 'DELIVERED') && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleConfirmReceived(so.id)}
                          isLoading={actionLoading === so.id}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Konfirmasi Pesanan Diterima
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div className="pt-2 flex justify-between items-center text-xs border-t border-gray-100">
                <span className="text-gray-500">Total Pembayaran ({order.subOrders.length} Toko):</span>
                <span className="text-base font-black text-pasarku-600">{formatRupiah(order.grandTotal)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tracking Modal */}
      {selectedTracking && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-pasarku-500" /> Riwayat Ekspedisi ({selectedTracking.courierCode})
              </h3>
              <button onClick={() => setSelectedTracking(null)} className="text-gray-400 hover:text-gray-600 font-bold">
                ✕
              </button>
            </div>
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
              {selectedTracking.events.map((ev: any, idx: number) => (
                <div key={ev.id} className="relative pl-6 border-l-2 border-pasarku-500 space-y-1">
                  <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-pasarku-500"></div>
                  <p className="text-xs font-bold text-gray-800">{ev.statusCode}</p>
                  <p className="text-xs text-gray-600">{ev.description}</p>
                  <span className="text-[10px] text-gray-400 block">{formatTanggal(ev.timestamp)}</span>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={() => setSelectedTracking(null)}>
              Tutup
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
