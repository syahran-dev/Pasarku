import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const metadata = {
  title: 'PasarKu - Marketplace Jual Beli Online Terpercaya di Indonesia',
  description: 'Jual beli online mudah, aman, dan nyaman dengan jutaan produk berkualitas dari ribuan toko terpercaya.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col bg-[#F8F8F8] text-[#222222]">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
