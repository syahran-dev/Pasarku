import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding PasarKu Marketplace database...');

  // 1. Password Hashes
  const passwordHash = await bcrypt.hash('password123', 10);
  const adminHash = await bcrypt.hash('admin123', 10);

  // 2. Clear old data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.voucherRedemption.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.review.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.shipmentEvent.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.payoutRequest.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.paymentEvent.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.subOrder.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.storeVerification.deleteMany();
  await prisma.store.deleteMany();
  await prisma.address.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // 3. Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin PasarKu',
      email: 'admin@pasarku.id',
      passwordHash: adminHash,
      role: 'ADMIN',
      phone: '081100000001',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  const seller1User = await prisma.user.create({
    data: {
      name: 'Budi Hartono (Official Store)',
      email: 'seller@pasarku.id',
      passwordHash,
      role: 'SELLER',
      phone: '081234567890',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  const seller2User = await prisma.user.create({
    data: {
      name: 'Siti Rahma (Gadget Hub)',
      email: 'gadget@pasarku.id',
      passwordHash,
      role: 'SELLER',
      phone: '081398765432',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  });

  const buyerUser = await prisma.user.create({
    data: {
      name: 'Ahmad Dani (Pembeli)',
      email: 'buyer@pasarku.id',
      passwordHash,
      role: 'BUYER',
      phone: '081299887766',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
  });

  // 4. Create Addresses
  await prisma.address.create({
    data: {
      userId: buyerUser.id,
      recipientName: 'Ahmad Dani',
      phoneNumber: '081299887766',
      addressLine: 'Jl. Jenderal Sudirman Kav. 52-53, SCBD, Senayan',
      cityId: 'JKT',
      cityName: 'Jakarta Selatan',
      postalCode: '12190',
      isDefault: true,
    },
  });

  // 5. Create Stores
  const store1 = await prisma.store.create({
    data: {
      userId: seller1User.id,
      storeName: 'Nusantara Official Store',
      slug: 'nusantara-official',
      description: 'Pusat produk lokal, fashion etnik, dan peralatan rumah tangga terbaik asli karya anak bangsa.',
      logoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200',
      isVerified: true,
      cityId: 'JKT',
      cityName: 'Jakarta Pusat',
      ratingAvg: 4.9,
      ratingCount: 128,
    },
  });

  const store2 = await prisma.store.create({
    data: {
      userId: seller2User.id,
      storeName: 'Bintang Gadget Indonesia',
      slug: 'bintang-gadget',
      description: 'Pusat audio, aksesoris smartphone, dan teknologi terkini bergaransi resmi.',
      logoUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200',
      isVerified: true,
      cityId: 'BDG',
      cityName: 'Bandung',
      ratingAvg: 4.8,
      ratingCount: 95,
    },
  });

  // 6. Wallets for Stores
  await prisma.wallet.create({
    data: {
      storeId: store1.id,
      holdingBalance: 1250000,
      availableBalance: 4850000,
      totalWithdrawn: 15000000,
    },
  });

  await prisma.wallet.create({
    data: {
      storeId: store2.id,
      holdingBalance: 650000,
      availableBalance: 2300000,
      totalWithdrawn: 8200000,
    },
  });

  // 7. Categories
  const catElektronik = await prisma.category.create({
    data: { name: 'Elektronik & Gadget', slug: 'elektronik-gadget', icon: 'Cpu' },
  });
  const catFashion = await prisma.category.create({
    data: { name: 'Fashion & Pakaian', slug: 'fashion-pakaian', icon: 'Shirt' },
  });
  const catRumah = await prisma.category.create({
    data: { name: 'Perlengkapan Rumah', slug: 'perlengkapan-rumah', icon: 'Home' },
  });
  const catKuliner = await prisma.category.create({
    data: { name: 'Makanan & Minuman', slug: 'makanan-minuman', icon: 'Utensils' },
  });

  // 8. Products Store 1
  const p1 = await prisma.product.create({
    data: {
      storeId: store1.id,
      categoryId: catFashion.id,
      name: 'Kemeja Batik Pria Motif Megamendung Premium Slim Fit',
      slug: 'kemeja-batik-megamendung-premium',
      description: 'Batik katun primisima halus dengan furing tebal tidak panas, jahitan rapi berstandar butik.',
      priceMin: 185000,
      priceMax: 195000,
      weightGram: 350,
      soldCount: 84,
      ratingAvg: 4.9,
      images: {
        create: [
          { imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600', isPrimary: true, sortOrder: 0 },
        ],
      },
      variants: {
        create: [
          { sku: 'BTK-MGM-L', title: 'Ukuran L - Navy', price: 185000, weightGram: 350 },
          { sku: 'BTK-MGM-XL', title: 'Ukuran XL - Navy', price: 195000, weightGram: 360 },
        ],
      },
    },
    include: { variants: true },
  });

  for (const v of p1.variants) {
    await prisma.inventory.create({
      data: { productVariantId: v.id, stockQty: 45, reservedQty: 2 },
    });
  }

  const p2 = await prisma.product.create({
    data: {
      storeId: store1.id,
      categoryId: catKuliner.id,
      name: 'Kopi Arabika Gayo Aceh Single Origin Roasted Beans 250gr',
      slug: 'kopi-arabika-gayo-aceh-250gr',
      description: '100% Arabika murni pegunungan Gayo Aceh dengan tasting notes cokelat, karamel dan jeruk.',
      priceMin: 75000,
      priceMax: 75000,
      weightGram: 300,
      soldCount: 142,
      ratingAvg: 5.0,
      images: {
        create: [
          { imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600', isPrimary: true, sortOrder: 0 },
        ],
      },
      variants: {
        create: [
          { sku: 'KOP-GYO-WHL', title: 'Biji Utuh (Whole Bean)', price: 75000, weightGram: 300 },
          { sku: 'KOP-GYO-GRD', title: 'Bubuk Halus (Fine Grind)', price: 75000, weightGram: 300 },
        ],
      },
    },
    include: { variants: true },
  });

  for (const v of p2.variants) {
    await prisma.inventory.create({
      data: { productVariantId: v.id, stockQty: 90, reservedQty: 0 },
    });
  }

  // 9. Products Store 2 (Gadget)
  const p3 = await prisma.product.create({
    data: {
      storeId: store2.id,
      categoryId: catElektronik.id,
      name: 'TWS Earphone Bluetooth 5.3 Active Noise Cancelling Pasir Putih',
      slug: 'tws-bluetooth-53-anc-white',
      description: 'Audio Hi-Res jernih, latensi rendah 38ms untuk gaming, baterai tahan hingga 30 jam.',
      priceMin: 299000,
      priceMax: 329000,
      weightGram: 250,
      soldCount: 210,
      ratingAvg: 4.8,
      images: {
        create: [
          { imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600', isPrimary: true, sortOrder: 0 },
        ],
      },
      variants: {
        create: [
          { sku: 'TWS-ANC-WHT', title: 'Warna Putih Gading', price: 299000, weightGram: 250 },
          { sku: 'TWS-ANC-BLK', title: 'Warna Hitam Matte', price: 329000, weightGram: 250 },
        ],
      },
    },
    include: { variants: true },
  });

  for (const v of p3.variants) {
    await prisma.inventory.create({
      data: { productVariantId: v.id, stockQty: 60, reservedQty: 5 },
    });
  }

  // 10. Vouchers
  await prisma.voucher.create({
    data: {
      code: 'PASARKUHEMAT',
      title: 'Diskon Belanja PasarKu Rp 20.000',
      discountType: 'FIXED',
      discountValue: 20000,
      minOrderAmount: 100000,
      quotaTotal: 500,
      quotaUsed: 12,
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // 11. Initial Cart for Demo Buyer
  const buyerCart = await prisma.cart.create({
    data: { userId: buyerUser.id },
  });

  await prisma.cartItem.create({
    data: {
      cartId: buyerCart.id,
      productId: p1.id,
      productVariantId: p1.variants[0].id,
      storeId: store1.id,
      quantity: 1,
    },
  });

  await prisma.cartItem.create({
    data: {
      cartId: buyerCart.id,
      productId: p3.id,
      productVariantId: p3.variants[0].id,
      storeId: store2.id,
      quantity: 1,
    },
  });

  console.log('Seeding completed successfully!');
  console.log('Demo Credentials:');
  console.log('  Admin : admin@pasarku.id / admin123');
  console.log('  Seller: seller@pasarku.id / password123');
  console.log('  Gadget: gadget@pasarku.id / password123');
  console.log('  Buyer : buyer@pasarku.id  / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
