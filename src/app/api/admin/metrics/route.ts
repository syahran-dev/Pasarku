import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { parseSessionToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertRole } from '@/lib/security';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const session = token ? parseSessionToken(token) : null;

    assertRole(session, ['ADMIN']);

    const [
      totalUsers,
      totalStores,
      totalOrders,
      totalProducts,
      orders,
      commissions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.store.count(),
      prisma.order.count(),
      prisma.product.count(),
      prisma.order.findMany({
        where: { paymentStatus: 'PAID' },
        select: { grandTotal: true },
      }),
      prisma.commission.findMany({
        select: { commissionAmount: true, status: true },
      }),
    ]);

    const totalGMV = orders.reduce((acc, curr) => acc + curr.grandTotal, 0);
    const totalCommissionEarned = commissions.reduce((acc, curr) => acc + curr.commissionAmount, 0);

    return NextResponse.json({
      metrics: {
        totalGMV,
        totalCommissionEarned,
        totalUsers,
        totalStores,
        totalOrders,
        totalProducts,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal memuat metrik admin.' }, { status: 403 });
  }
}
