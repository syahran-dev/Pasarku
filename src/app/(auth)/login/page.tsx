'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Lock, Mail, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Email atau password salah');
        setIsLoading(false);
        return;
      }

      if (data.user.role === 'ADMIN') {
        window.location.href = '/admin/dashboard';
      } else if (data.user.role === 'SELLER') {
        window.location.href = '/seller/dashboard';
      } else {
        window.location.href = '/';
      }
    } catch {
      setErrorMsg('Terjadi kesalahan jaringan.');
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (role: 'BUYER' | 'SELLER' | 'ADMIN') => {
    if (role === 'BUYER') {
      setEmail('buyer@pasarku.id');
      setPassword('password123');
    } else if (role === 'SELLER') {
      setEmail('seller@pasarku.id');
      setPassword('password123');
    } else {
      setEmail('admin@pasarku.id');
      setPassword('admin123');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-pasarku-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Masuk ke PasarKu</h1>
          <p className="text-xs text-gray-500">Nikmati kemudahan transaksi jual beli di PasarKu</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-700 font-bold mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="email"
                placeholder="email@anda.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-pasarku-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Kata Sandi</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-pasarku-500 text-sm"
              />
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full shadow-md" isLoading={isLoading}>
            Masuk Sekarang
          </Button>
        </form>

        {/* Demo Quick Login Buttons */}
        <div className="pt-4 border-t border-gray-100 space-y-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block text-center">
            Pilih Cepat Akun Demo (1-Click Fill)
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin('BUYER')}
              className="py-1.5 px-2 bg-gray-50 hover:bg-orange-50 hover:text-pasarku-600 border border-gray-200 rounded-lg text-[11px] font-bold transition-colors"
            >
              Pembeli
            </button>
            <button
              onClick={() => handleQuickLogin('SELLER')}
              className="py-1.5 px-2 bg-gray-50 hover:bg-orange-50 hover:text-pasarku-600 border border-gray-200 rounded-lg text-[11px] font-bold transition-colors"
            >
              Penjual
            </button>
            <button
              onClick={() => handleQuickLogin('ADMIN')}
              className="py-1.5 px-2 bg-gray-50 hover:bg-purple-50 hover:text-purple-600 border border-gray-200 rounded-lg text-[11px] font-bold transition-colors"
            >
              Admin
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500">
          Belum punya akun?{' '}
          <Link href="/register" className="text-pasarku-600 font-bold hover:underline">
            Daftar di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
