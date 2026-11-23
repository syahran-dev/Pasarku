# 🛍️ PASARKU: Modern Multi-Vendor Indonesian Marketplace Platform

**PasarKu** adalah platform marketplace e-commerce modern, responsif, dan berskala enterprise berkonsep *Multi-Vendor C2C & B2C* (serupa dengan Shopee dan Tokopedia).

Aplikasi ini dibangun menggunakan arsitektur mutakhir:
- **Framework:** Next.js 14+ (App Router) dengan TypeScript
- **Styling:** Tailwind CSS (Palet Oranye Ikonik PasarKu `#EE4D2D` dan Putih Bersih)
- **Database & ORM:** Prisma ORM dengan SQLite (Pengembangan Lokal) dan siap beralih ke PostgreSQL/Supabase (Produksi)
- **Komponen & Visualisasi:** Lucide React & Recharts
- **Keamanan & Otorisasi:** Password Hashing bcrypt, HTTP-Only Cookie Session, dan Zero-Trust Server Calculations

---

## 🚀 Fitur Unggulan

### 1. Multi-Vendor Sub-Orders Architecture
- Satu pembeli dapat memasukkan produk dari beberapa toko yang berbeda ke dalam satu keranjang belanja.
- Saat checkout, sistem secara otomatis membagi pesanan menjadi beberapa **Sub-Order independen per Toko**, masing-masing memiliki opsi kurir, tarif ongkir, dan pelacakan nomor resi sendiri.

### 2. Double-Entry Immutable Ledger & Escrow Keuangan
- **Dana Tertahan (Holding Balance):** Pembayaran pembeli ditahan secara aman di rekening penampung (*escrow*) platform saat pesanan diproses dan dikirim.
- **Dana Siap Cair (Available Balance):** Saldo baru dilepaskan ke dompet toko setelah pembeli mengonfirmasi pesanan diterima atau batas auto-accept terlewati.
- **Komisi Marketplace:** Potongan komisi platform (2.5%) dihitung secara matematis di server.
- **Tarik Saldo (Payout):** Alur permohonan pencairan saldo oleh penjual dengan audit persetujuan oleh Administrator.

### 3. Payment Gateway Real-Ready & Simulator DEMO
- Mendukung metode pembayaran populer Indonesia: **QRIS Dinamis, BCA Virtual Account, Mandiri VA, BRI VA, GoPay, dan COD**.
- Verifikasi tanda tangan kriptografis webhook berbasis **SHA-512** dan pencegahan transaksi ganda (*idempotency replay protection*).
- Dilengkapi tombol interaktif **"Simulasikan Pembayaran Berhasil (DEMO)"** untuk pengujian langsung tanpa kartu kredit atau rekening bank nyata.

### 4. Sistem Logistik & Pelacakan Resi
- Matriks kalkulasi ongkos kirim berbasis bobot gram dan kota tujuan untuk ekspedisi **JNE, SiCepat, dan GoSend Instant**.
- State machine pelacakan pengiriman bertingkat (`MANIFESTED` ➔ `IN_TRANSIT` ➔ `OUT_FOR_DELIVERY` ➔ `DELIVERED`).

### 5. Multi-Role Management
- **Buyer Panel:** Katalog, multi-filter, detail produk, keranjang, checkout, riwayat pesanan, pelacakan kurir, dan tombol konfirmasi terima barang.
- **Seller Center:** Dashboard omzet & profit, manajemen pesanan, pemrosesan barang, input nomor resi, dompet toko, dan mutasi buku besar.
- **Super Admin Dashboard:** Ringkasan makro GMV, akumulasi komisi platform, statistik toko & pengguna, serta moderasi pencairan dana.

---

## 🔑 Kredensial Akun Uji Coba (Demo Accounts)

Untuk kemudahan evaluasi, sistem telah dilengkapi akun bawaan pada halaman Login:

| Peran (Role) | Email | Password | Keterangan |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@pasarku.id` | `admin123` | Akses Super Panel GMV & Payout |
| **Mitra Penjual 1** | `seller@pasarku.id` | `password123` | Toko: Nusantara Official Store |
| **Mitra Penjual 2** | `gadget@pasarku.id` | `password123` | Toko: Bintang Gadget Indonesia |
| **Pembeli (Buyer)** | `buyer@pasarku.id` | `password123` | Keranjang belanja terisi produk demo |

---

## 📦 Struktur Folder Aplikasi

```text
app_build/
├── prisma/
│   ├── schema.prisma                  # Skema 32 tabel relasional, enum, indeks & FK
│   └── seed.ts                        # Seeding akun, kategori, produk, varian & stok
├── scripts/
│   └── test-runner.js                 # Automated unit & integration test runner
├── src/
│   ├── app/
│   │   ├── (auth)/                    # Login & Register dengan 1-click Quick Login
│   │   ├── cart/                      # Keranjang belanja multi-vendor
│   │   ├── checkout/                  # Alamat, kurir per toko & pembayaran
│   │   ├── payment/[orderNumber]/     # Status bayar, QRIS & simulator DEMO
│   │   ├── orders/                    # Riwayat belanja, resi & konfirmasi penerimaan
│   │   ├── products/                  # Katalog pencarian multi-filter & detail produk
│   │   ├── seller/                    # Dashboard omzet, pesanan masuk & dompet toko
│   │   ├── admin/                     # Super dashboard GMV, komisi & audit
│   │   └── api/                       # API routes (Auth, Cart, Checkout, Webhooks, Ledger)
│   ├── components/
│   │   ├── layout/                    # Navbar oranye PasarKu, Footer informasi
│   │   └── ui/                        # Reusable Button, Badge, Skeleton, Card
│   ├── lib/
│   │   ├── prisma.ts                  # Prisma Client singleton
│   │   ├── auth.ts                    # Password hashing bcrypt & cookie sessions
│   │   ├── security.ts                # RBAC guards & tenant isolation assertions
│   │   ├── ledger.ts                  # Double-entry ledger & escrow release engine
│   │   ├── payment-gateway.ts         # Adapter Midtrans/Xendit & signature verification
│   │   ├── shipping-engine.ts         # Matriks ongkir & generator resi kurir
│   │   └── formatters.ts              # Format mata uang Rupiah & tanggal lokal
│   └── types/                         # Definisi tipe TypeScript
├── package.json
├── tailwind.config.js
└── README.md
```

---

## 🛠️ Panduan Instalasi & Menjalankan Aplikasi

### 1. Prasyarat
- Pastikan **Node.js (versi 18.x atau 20.x LTS)** dan **npm** sudah terpasang.

### 2. Instalasi Dependensi
```bash
cd app_build
npm install
```

### 3. Generate & Inisialisasi Database
```bash
# Generate Prisma Client
npx prisma generate

# Sinkronisasi skema database SQLite
npx prisma db push

# Isi data awal (seed) katalog & akun demo
npm run prisma:seed
```

### 4. Menjalankan Server Pengembangan
```bash
npm run dev
```
Buka browser di `http://localhost:3000` untuk mulai menjelajah platform PasarKu!

---

## 🧪 Menjalankan Pengujian (Automated Test Suite)

Untuk memvalidasi 10 modul logika inti (keamanan, komisi, multi-vendor splitting, signature SHA-512, dan isolasi tenant):
```bash
npm test
```
