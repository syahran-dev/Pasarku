import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { parseSessionToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { releaseEscrowToAvailable } from '@/lib/ledger';

/**
 * Buyer confirms order delivery -> Triggers Escrow release to seller's available balance!
 */
export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const session = token ? parseSessionToken(token) : null;

    if (!session) {
      return NextResponse.json({ error: 'Silakan login terlebih dahulu.' }, { status: 401 });
    }

    const { subOrderId } = await request.json();

    const subOrder = await prisma.subOrder.findUnique({
      where: { id: subOrderId },
      include: {
        parentOrder: true,
        shipment: true,
      },
    });

    if (!subOrder) {
      return NextResponse.json({ error: 'Sub-order tidak ditemukan' }, { status: 404 });
    }

    if (subOrder.parentOrder.buyerId !== session.userId) {
      return NextResponse.json({ error: 'Akses ditolak: Ini bukan pesanan Anda.' }, { status: 403 });
    }

    if (subOrder.status === 'COMPLETED') {
      return NextResponse.json({ message: 'Pesanan ini sudah selesai.' });
    }

    // Atomic transaction: Complete SubOrder & Release Escrow
    await prisma.$transaction(async (tx) => {
      await tx.subOrder.update({
        where: { id: subOrderId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      if (subOrder.shipment) {
        await tx.shipment.update({
          where: { id: subOrder.shipment.id },
          data: { deliveredAt: new Date() },
        });

        await tx.shipmentEvent.create({
          data: {
            shipmentId: subOrder.shipment.id,
            statusCode: 'DELIVERED',
            description: 'Pesanan telah diterima dan dikonfirmasi oleh pembeli.',
            location: subOrder.shipment.destinationCity,
          },
        });
      }

      // Release Escrow funds to store's available balance
      await releaseEscrowToAvailable(tx as any, subOrder.id, subOrder.storeId);
    });

    return NextResponse.json({
      success: true,
      message: 'Terima kasih! Pesanan selesai dan dana telah diteruskan ke saldo penjual.',
    });
  } catch (error: any) {
    console.error('Confirm order error:', error);
    return NextResponse.json({ error: error.message || 'Gagal menyelesaikan pesanan.' }, { status: 500 });
  }
}
