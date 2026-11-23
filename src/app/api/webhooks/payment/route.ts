import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyWebhookSignature } from '@/lib/payment-gateway';
import { allocateToEscrow } from '@/lib/ledger';

/**
 * Enterprise Payment Gateway Webhook Receiver (Midtrans / Xendit architecture)
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const payload = JSON.parse(rawBody);

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      idempotency_key,
    } = payload;

    const serverKey = process.env.PAYMENT_SERVER_KEY || 'demo_server_key_pasarku_sandbox_secret';
    const isSimulationMode = process.env.PAYMENT_MODE === 'DEMO';

    // 1. Signature Verification
    if (!isSimulationMode) {
      const isValid = verifyWebhookSignature(order_id, status_code, Number(gross_amount), serverKey, signature_key);
      if (!isValid) {
        return NextResponse.json({ error: 'Signature verifikasi tidak valid' }, { status: 400 });
      }
    }

    // 2. Locate Parent Order & Payment
    const order = await prisma.order.findUnique({
      where: { orderNumber: order_id },
      include: {
        payment: true,
        subOrders: true,
      },
    });

    if (!order || !order.payment) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    // 3. Idempotency Check (Prevent duplicate handling)
    const effectiveIdempotencyKey = idempotency_key || `wh-${order.id}-${transaction_status}-${Date.now()}`;
    const existingEvent = await prisma.paymentEvent.findUnique({
      where: { idempotencyKey: effectiveIdempotencyKey },
    });

    if (existingEvent) {
      return NextResponse.json({ message: 'Event webhook sudah pernah diproses (Idempotent)' }, { status: 200 });
    }

    // 4. Record Event
    await prisma.paymentEvent.create({
      data: {
        paymentId: order.payment.id,
        eventType: transaction_status,
        idempotencyKey: effectiveIdempotencyKey,
        rawPayload: rawBody,
        signatureVerified: true,
      },
    });

    // 5. Handle settlement
    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      await prisma.$transaction(async (tx) => {
        // Update payment status
        await tx.payment.update({
          where: { id: order.payment!.id },
          data: {
            status: 'SETTLED',
            settledAt: new Date(),
          },
        });

        // Update Parent Order
        await tx.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'PAID' },
        });

        // Update SubOrders and allocate escrow funds into store wallets
        for (const subOrder of order.subOrders) {
          await tx.subOrder.update({
            where: { id: subOrder.id },
            data: { status: 'PAID' },
          });

          // Allocate to Escrow (Dana Tertahan)
          await allocateToEscrow(
            tx as any,
            subOrder.id,
            subOrder.storeId,
            subOrder.goodsAmount,
            subOrder.shippingAmount
          );

          // Notify Seller
          await tx.notification.create({
            data: {
              userId: (await tx.store.findUnique({ where: { id: subOrder.storeId } }))!.userId,
              title: 'Pesanan Baru Telah Dibayar!',
              body: `Pesanan #${subOrder.subOrderNumber} siap Anda proses.`,
              actionUrl: `/seller/orders`,
              type: 'TRANSACTION',
            },
          });
        }

        // Notify Buyer
        await tx.notification.create({
          data: {
            userId: order.buyerId,
            title: 'Pembayaran Berhasil Diterima',
            body: `Pembayaran pesanan #${order.orderNumber} berhasil diverifikasi. Penjual akan segera memproses barang.`,
            actionUrl: `/orders/${order.orderNumber}`,
            type: 'TRANSACTION',
          },
        });
      });
    }

    return NextResponse.json({ success: true, message: 'Webhook berhasil diproses' });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message || 'Gagal memproses webhook' }, { status: 500 });
  }
}
