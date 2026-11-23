'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Lock, Mail, User, Store, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'BUYER' | 'SELLER'>('BUYER');
  const [storeName, setStoreName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          storeName: role === 'SELLER' ? storeName : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Pendaftaran gagal');
        setIsLoading(false);
        return;
      }

      if (role === 'SELLER') {
        window.location.href = '/seller/dashboard';
      } else {
        window.location.href = '/';
      }
    } catch {
      setErrorMsg('Terjadi kesalahan jaringan.');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-pasarku-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Daftar Akun PasarKu</h1>
          <p className="text-xs text-gray-500">Mulai transaksi jual beli online aman & mudah</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Role Selection */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <button
            type="button"
            onClick={() => setRole('BUYER')}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1 font-bold transition-all ${
              role === 'BUYER'
                ? 'border-pasarku-500 bg-orange-50 text-pasarku-600 ring-1 ring-pasarku-500'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <User className="w-5 h-5" />
            <span>Sebagai Pembeli</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('SELLER')}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1 font-bold transition-all ${
              role === 'SELLER'
                ? 'border-pasarku-500 bg-orange-50 text-pasarku-600 ring-1 ring-pasarku-500'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Store className="w-5 h-5" />
            <span>Buka Toko (Penjual)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-700 font-bold mb-1">Nama Lengkap</label>
            <input
              type="text"
              placeholder="Nama Anda"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-pasarku-500 text-sm"
            />
          </div>

          {role === 'SELLER' && (
            <div>
              <label className="block text-gray-700 font-bold mb-1">Nama Toko Online</label>
              <input
                type="text"
                placeholder="Contoh: Toko Nusantara Berkah"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-pasarku-500 text-sm font-bold text-pasarku-700"
              />
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-bold mb-1">Email</label>
            <input
              type="email"
              placeholder="email@anda.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-pasarku-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Kata Sandi</label>
            <input
              type="password"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-pasarku-500 text-sm"
            />
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full shadow-md" isLoading={isLoading}>
            Daftar Sekarang
          </Button>
        </form>

        <p className="text-center text-xs text-gray-500">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-pasarku-600 font-bold hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
