import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { parseSessionToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateShippingOptions, generateTrackingNumber } from '@/lib/shipping-engine';
import { generatePaymentDetails } from '@/lib/payment-gateway';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const session = token ? parseSessionToken(token) : null;

    if (!session) {
      return NextResponse.json({ error: 'Silakan login terlebih dahulu.' }, { status: 401 });
    }

    const body = await request.json();
    const { addressId, paymentMethod, courierSelections, voucherCode } = body;

    // 1. Fetch destination address
    const address = await prisma.address.findUnique({
      where: { id: addressId, userId: session.userId },
    });

    if (!address) {
      return NextResponse.json({ error: 'Alamat pengiriman wajib dipilih.' }, { status: 400 });
    }

    // 2. Fetch cart items
    const cart = await prisma.cart.findUnique({
      where: { userId: session.userId },
      include: {
        items: {
          include: {
            product: { include: { store: true } },
            variant: { include: { inventory: true } },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: 'Keranjang belanja kosong.' }, { status: 400 });
    }

    // 3. Multi-Vendor Grouping & Stock Validation
    const storeMap: Record<string, { store: any; items: typeof cart.items; totalWeight: number }> = {};

    for (const item of cart.items) {
      const stockAvailable = (item.variant.inventory?.stockQty ?? 0) - (item.variant.inventory?.reservedQty ?? 0);
      if (stockAvailable < item.quantity) {
        return NextResponse.json(
          { error: `Stok produk "${item.product.name}" varian "${item.variant.title}" tidak mencukupi.` },
          { status: 400 }
        );
      }

      if (!storeMap[item.storeId]) {
        storeMap[item.storeId] = { store: item.product.store, items: [], totalWeight: 0 };
      }
      storeMap[item.storeId].items.push(item);
      storeMap[item.storeId].totalWeight += item.variant.weightGram * item.quantity;
    }

    // 4. Calculate totals on server
    let totalGoods = 0;
    let totalShipping = 0;
    const subOrderCalculations: any[] = [];

    for (const storeId of Object.keys(storeMap)) {
      const group = storeMap[storeId];
      let storeGoods = 0;

      for (const it of group.items) {
        storeGoods += it.variant.price * it.quantity;
      }

      // Courier selection for this store
      const userSelected = courierSelections?.[storeId] || { code: 'JNE', service: 'REG (Reguler)' };
      const options = calculateShippingOptions(group.store.cityName || 'Jakarta', address.cityName, group.totalWeight);
      const matched = options.find((o) => o.code === userSelected.code && o.service === userSelected.service) || options[0];

      totalGoods += storeGoods;
      totalShipping += matched.cost;

      subOrderCalculations.push({
        storeId,
        storeName: group.store.storeName,
        originCity: group.store.cityName || 'Jakarta',
        goodsAmount: storeGoods,
        shippingAmount: matched.cost,
        courierCode: matched.code,
        courierService: matched.service,
        items: group.items,
      });
    }

    // 5. Discount calculation
    let discountAmount = 0;
    let voucherIdToRedeem: string | null = null;

    if (voucherCode) {
      const voucher = await prisma.voucher.findUnique({
        where: { code: voucherCode.toUpperCase(), isActive: true },
      });
      if (voucher && voucher.quotaUsed < voucher.quotaTotal && totalGoods >= voucher.minOrderAmount) {
        voucherIdToRedeem = voucher.id;
        discountAmount =
          voucher.discountType === 'FIXED'
            ? voucher.discountValue
            : Math.round((totalGoods * voucher.discountValue) / 100);
        if (voucher.maxDiscountAmount && discountAmount > voucher.maxDiscountAmount) {
          discountAmount = voucher.maxDiscountAmount;
        }
      }
    }

    const platformFee = 1000;
    const grandTotal = Math.max(0, totalGoods + totalShipping - discountAmount + platformFee);

    const timestamp = Date.now().toString();
    const orderNumber = `PKU-${timestamp.slice(-8)}`;

    // 6. Prisma Single Transaction: Create Order, SubOrders, OrderItems, Shipments, Payment & Reserve Inventory
    const result = await prisma.$transaction(async (tx) => {
      // Create Parent Order
      const parentOrder = await tx.order.create({
        data: {
          orderNumber,
          buyerId: session.userId,
          totalGoodsAmount: totalGoods,
          totalShippingAmount: totalShipping,
          totalDiscountAmount: discountAmount,
          platformFee,
          grandTotal,
          paymentStatus: 'UNPAID',
        },
      });

      // Create SubOrders per store
      let storeIndex = 1;
      for (const sub of subOrderCalculations) {
        const subOrderNumber = `${orderNumber}-${storeIndex++}`;
        const subOrder = await tx.subOrder.create({
          data: {
            subOrderNumber,
            parentOrderId: parentOrder.id,
            storeId: sub.storeId,
            goodsAmount: sub.goodsAmount,
            shippingAmount: sub.shippingAmount,
            subTotal: sub.goodsAmount + sub.shippingAmount,
            status: 'PENDING_PAYMENT',
          },
        });

        // Create Order Items & Reserve Inventory
        for (const item of sub.items) {
          await tx.orderItem.create({
            data: {
              subOrderId: subOrder.id,
              productId: item.productId,
              productVariantId: item.productVariantId,
              productNameSnapshot: item.product.name,
              variantTitleSnapshot: item.variant.title,
              priceSnapshot: item.variant.price,
              weightSnapshot: item.variant.weightGram,
              quantity: item.quantity,
              subtotal: item.variant.price * item.quantity,
            },
          });

          // Reserve inventory
          await tx.inventory.update({
            where: { productVariantId: item.productVariantId },
            data: { reservedQty: { increment: item.quantity } },
          });
        }

        // Create Shipment entry
        await tx.shipment.create({
          data: {
            subOrderId: subOrder.id,
            courierCode: sub.courierCode,
            courierService: sub.courierService,
            trackingNumber: generateTrackingNumber(sub.courierCode),
            shippingCost: sub.shippingAmount,
            originCity: sub.originCity,
            destinationCity: address.cityName,
            recipientAddressSnapshot: `${address.recipientName} (${address.phoneNumber}) - ${address.addressLine}, ${address.cityName} ${address.postalCode}`,
          },
        });
      }

      // Generate payment details
      const paymentDetails = generatePaymentDetails(paymentMethod || 'QRIS', grandTotal, orderNumber);
      const payment = await tx.payment.create({
        data: {
          parentOrderId: parentOrder.id,
          transactionNumber: `TX-${orderNumber}`,
          paymentMethod: paymentMethod || 'QRIS',
          paymentChannel: paymentDetails.channelName,
          paymentCode: paymentDetails.paymentCode,
          qrString: paymentDetails.qrString,
          grossAmount: grandTotal,
          status: 'PENDING',
          expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      // Voucher redemption
      if (voucherIdToRedeem) {
        await tx.voucherRedemption.create({
          data: {
            voucherId: voucherIdToRedeem,
            orderId: parentOrder.id,
            userId: session.userId,
            discountAmount,
          },
        });
        await tx.voucher.update({
          where: { id: voucherIdToRedeem },
          data: { quotaUsed: { increment: 1 } },
        });
      }

      // Empty user's cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return { parentOrder, payment };
    });

    return NextResponse.json({
      success: true,
      orderNumber: result.parentOrder.orderNumber,
      paymentId: result.payment.id,
      grandTotal: result.parentOrder.grandTotal,
      redirectUrl: `/payment/${result.parentOrder.orderNumber}`,
    });
  } catch (error: any) {
    console.error('Checkout submit error:', error);
    return NextResponse.json({ error: error.message || 'Gagal memproses pesanan.' }, { status: 500 });
  }
}
