import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateTestWebhookSignature } from '@/lib/payment-gateway';

/**
 * Trigger simulated payment settlement (Explicitly labeled DEMO / Development Sandbox)
 */
export async function POST(request: Request) {
  try {
    const { orderNumber } = await request.json();

    if (!orderNumber) {
      return NextResponse.json({ error: 'Nomor pesanan diperlukan' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { payment: true },
    });

    if (!order || !order.payment) {
      return NextResponse.json({ error: 'Pesanan atau data pembayaran tidak ditemukan' }, { status: 404 });
    }

    if (order.payment.status === 'SETTLED') {
      return NextResponse.json({ message: 'Pembayaran pesanan ini sudah berstatus SETTLED sebelumnya.' });
    }

    const serverKey = process.env.PAYMENT_SERVER_KEY || 'demo_server_key_pasarku_sandbox_secret';
    const signature = generateTestWebhookSignature(orderNumber, '200', order.grandTotal, serverKey);

    // Call webhook receiver internally
    const webhookPayload = {
      order_id: orderNumber,
      status_code: '200',
      gross_amount: order.grandTotal,
      signature_key: signature,
      transaction_status: 'settlement',
      idempotency_key: `sim-${orderNumber}-${Date.now()}`,
    };

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const whResponse = await fetch(`${baseUrl}/api/webhooks/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload),
    });

    const data = await whResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Simulasi pembayaran DEMO berhasil!',
      details: data,
    });
  } catch (error: any) {
    console.error('Simulation error:', error);
    return NextResponse.json({ error: error.message || 'Gagal menjalankan simulasi pembayaran.' }, { status: 500 });
  }
}
