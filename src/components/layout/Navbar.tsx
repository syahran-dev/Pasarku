'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  ShoppingCart,
  Search,
  User,
  Store,
  ShieldCheck,
  LogOut,
  ChevronDown,
} from 'lucide-react';

export function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    // Check current session
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});

    // Fetch cart count
    fetch('/api/cart')
      .then((res) => res.json())
      .then((data) => {
        if (data.totalItems !== undefined) setCartCount(data.totalItems);
      })
      .catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-50 bg-pasarku-500 text-white shadow-md">
      {/* Top Banner Navigation */}
      <div className="bg-pasarku-700 text-xs text-white/90 py-1 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/seller/dashboard" className="hover:text-white flex items-center gap-1">
              <Store className="w-3.5 h-3.5" /> Mitra Penjual (Seller Center)
            </Link>
            <span>|</span>
            <Link href="/admin/dashboard" className="hover:text-white flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Super Admin Panel
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <span>Bantuan Pelanggan 24/7</span>
            <span>|</span>
            <span>Mode Demo Aktif</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-2 text-white group flex-shrink-0">
          <div className="bg-white text-pasarku-500 p-2 rounded-xl shadow-inner group-hover:scale-105 transition-transform">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight">PasarKu</span>
            <span className="text-[10px] block font-light tracking-widest text-orange-200">
              INDONESIAN MARKETPLACE
            </span>
          </div>
        </Link>

        {/* Global Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative">
          <div className="flex bg-white rounded-lg overflow-hidden shadow-sm p-1">
            <input
              type="text"
              placeholder="Cari produk impianmu (Batik, Gadget, Kopi Gayo, dll)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-pasarku-500 hover:bg-pasarku-600 text-white px-5 py-2 rounded-md flex items-center transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Action Buttons & Profile */}
        <div className="flex items-center space-x-5 flex-shrink-0">
          {/* Cart Icon */}
          <Link href="/cart" className="relative p-2 hover:bg-white/10 rounded-full transition-colors">
            <ShoppingCart className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-white text-pasarku-500 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                {cartCount}
              </span>
            )}
          </Link>

          {/* User Auth Menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors text-sm"
              >
                <div className="w-7 h-7 bg-white text-pasarku-500 rounded-full flex items-center justify-center font-bold text-xs uppercase">
                  {user.name.charAt(0)}
                </div>
                <span className="font-medium max-w-[120px] truncate">{user.name}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 text-gray-800 z-50 text-sm border border-gray-100">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="font-bold truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] uppercase font-bold px-1.5 py-0.5 bg-orange-100 text-pasarku-600 rounded">
                      Role: {user.role}
                    </span>
                  </div>
                  <Link
                    href="/orders"
                    className="block px-4 py-2 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Pesanan Saya
                  </Link>
                  {user.role === 'SELLER' && (
                    <Link
                      href="/seller/dashboard"
                      className="block px-4 py-2 hover:bg-gray-50 text-pasarku-600 font-semibold"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Dashboard Penjual
                    </Link>
                  )}
                  {user.role === 'ADMIN' && (
                    <Link
                      href="/admin/dashboard"
                      className="block px-4 py-2 hover:bg-gray-50 text-purple-600 font-semibold"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Super Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-1.5 border-t border-gray-100 mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Keluar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-sm font-medium">
              <Link
                href="/login"
                className="hover:text-orange-100 px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="bg-white text-pasarku-500 px-4 py-1.5 rounded-md shadow-sm hover:bg-orange-50 transition-colors font-semibold"
              >
                Daftar
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
