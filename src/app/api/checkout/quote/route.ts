import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { parseSessionToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateShippingOptions } from '@/lib/shipping-engine';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const session = token ? parseSessionToken(token) : null;

    if (!session) {
      return NextResponse.json({ error: 'Silakan login terlebih dahulu.' }, { status: 401 });
    }

    const body = await request.json();
    const { addressId, voucherCode } = body;

    // 1. Fetch user's address
    const address = addressId
      ? await prisma.address.findUnique({ where: { id: addressId, userId: session.userId } })
      : await prisma.address.findFirst({ where: { userId: session.userId, isDefault: true } });

    const destCity = address?.cityName || 'Jakarta Selatan';

    // 2. Fetch cart items with authoritative database prices
    const cart = await prisma.cart.findUnique({
      where: { userId: session.userId },
      include: {
        items: {
          include: {
            product: { include: { store: true, images: { take: 1 } } },
            variant: { include: { inventory: true } },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: 'Keranjang belanja kosong.' }, { status: 400 });
    }

    // 3. Group items by Store (Multi-Vendor Architecture)
    const storeGroups: Record<
      string,
      {
        storeId: string;
        storeName: string;
        storeCity: string;
        items: any[];
        totalGoodsAmount: number;
        totalWeightGram: number;
        shippingOptions: any[];
        selectedCourier: any;
      }
    > = {};

    for (const item of cart.items) {
      const storeId = item.storeId;
      if (!storeGroups[storeId]) {
        const storeCity = item.product.store.cityName || 'Jakarta';
        storeGroups[storeId] = {
          storeId,
          storeName: item.product.store.storeName,
          storeCity,
          items: [],
          totalGoodsAmount: 0,
          totalWeightGram: 0,
          shippingOptions: [],
          selectedCourier: null,
        };
      }

      const itemPrice = item.variant.price; // Pure server price
      const itemWeight = item.variant.weightGram;
      const subtotal = itemPrice * item.quantity;

      storeGroups[storeId].items.push({
        cartItemId: item.id,
        productId: item.productId,
        productVariantId: item.productVariantId,
        name: item.product.name,
        variantTitle: item.variant.title,
        price: itemPrice,
        quantity: item.quantity,
        subtotal,
        weightGram: itemWeight,
        imageUrl: item.product.images[0]?.imageUrl,
      });

      storeGroups[storeId].totalGoodsAmount += subtotal;
      storeGroups[storeId].totalWeightGram += itemWeight * item.quantity;
    }

    // 4. Calculate shipping options per store
    let totalShippingCost = 0;
    let totalGoods = 0;

    const subOrdersList = Object.values(storeGroups).map((group) => {
      const options = calculateShippingOptions(group.storeCity, destCity, group.totalWeightGram);
      const defaultOption = options[0]; // JNE REG
      group.shippingOptions = options;
      group.selectedCourier = defaultOption;

      totalShippingCost += defaultOption.cost;
      totalGoods += group.totalGoodsAmount;

      return group;
    });

    // 5. Evaluate Voucher if provided
    let discountAmount = 0;
    let appliedVoucher = null;

    if (voucherCode) {
      const voucher = await prisma.voucher.findUnique({
        where: { code: voucherCode.toUpperCase(), isActive: true },
      });

      if (voucher && voucher.quotaUsed < voucher.quotaTotal && totalGoods >= voucher.minOrderAmount) {
        if (voucher.discountType === 'FIXED') {
          discountAmount = voucher.discountValue;
        } else {
          discountAmount = Math.round((totalGoods * voucher.discountValue) / 100);
          if (voucher.maxDiscountAmount && discountAmount > voucher.maxDiscountAmount) {
            discountAmount = voucher.maxDiscountAmount;
          }
        }
        appliedVoucher = {
          code: voucher.code,
          title: voucher.title,
          discountAmount,
        };
      }
    }

    const platformFee = 1000;
    const grandTotal = Math.max(0, totalGoods + totalShippingCost - discountAmount + platformFee);

    return NextResponse.json({
      address: address || null,
      subOrders: subOrdersList,
      summary: {
        totalGoodsAmount: totalGoods,
        totalShippingAmount: totalShippingCost,
        discountAmount,
        platformFee,
        grandTotal,
        appliedVoucher,
      },
    });
  } catch (error: any) {
    console.error('Quote error:', error);
    return NextResponse.json({ error: 'Gagal menghitung rincian pesanan.' }, { status: 500 });
  }
}
