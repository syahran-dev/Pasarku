import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { parseSessionToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertStoreOwnership } from '@/lib/security';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const session = token ? parseSessionToken(token) : null;

    if (!session || !session.storeId) {
      return NextResponse.json({ error: 'Akses khusus penjual terdaftar.' }, { status: 403 });
    }

    // Tenant-isolated query: strictly scoped to session.storeId
    const subOrders = await prisma.subOrder.findMany({
      where: { storeId: session.storeId },
      include: {
        items: true,
        shipment: true,
        parentOrder: {
          include: {
            buyer: { select: { name: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ subOrders });
  } catch (error: any) {
    console.error('Seller orders GET error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data pesanan penjual.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const session = token ? parseSessionToken(token) : null;

    if (!session || !session.storeId) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const body = await request.json();
    const { subOrderId, action, trackingNumber } = body;

    const subOrder = await prisma.subOrder.findUnique({
      where: { id: subOrderId },
      include: { shipment: true },
    });

    if (!subOrder) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 });
    }

    // Verify multi-tenant isolation
    assertStoreOwnership(session, subOrder.storeId);

    if (action === 'PROCESS') {
      await prisma.subOrder.update({
        where: { id: subOrderId },
        data: { status: 'PROCESSING' },
      });
      return NextResponse.json({ success: true, message: 'Pesanan sedang diproses.' });
    }

    if (action === 'SHIP') {
      const finalTrackingNumber = trackingNumber || subOrder.shipment?.trackingNumber;
      await prisma.$transaction([
        prisma.subOrder.update({
          where: { id: subOrderId },
          data: { status: 'SHIPPED' },
        }),
        prisma.shipment.update({
          where: { subOrderId },
          data: {
            trackingNumber: finalTrackingNumber,
            shippedAt: new Date(),
          },
        }),
        prisma.shipmentEvent.create({
          data: {
            shipmentId: subOrder.shipment!.id,
            statusCode: 'MANIFESTED',
            description: `Paket telah diserahkan ke gerai kurir dengan no resi ${finalTrackingNumber}.`,
            location: 'Drop Point Penjual',
          },
        }),
      ]);
      return NextResponse.json({ success: true, message: 'Pesanan berhasil dikirim!' });
    }

    return NextResponse.json({ error: 'Aksi tidak dikenali.' }, { status: 400 });
  } catch (error: any) {
    console.error('Seller orders PUT error:', error);
    return NextResponse.json({ error: error.message || 'Gagal memperbarui pesanan.' }, { status: 500 });
  }
}
