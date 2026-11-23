import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { parseSessionToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { OrdersClient } from './OrdersClient';

export default async function OrdersPage() {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? parseSessionToken(token) : null;

  if (!session) {
    redirect('/login');
  }

  const orders = await prisma.order.findMany({
    where: { buyerId: session.userId },
    include: {
      payment: true,
      subOrders: {
        include: {
          store: true,
          items: true,
          shipment: {
            include: {
              events: { orderBy: { timestamp: 'desc' } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return <OrdersClient orders={orders} />;
}
