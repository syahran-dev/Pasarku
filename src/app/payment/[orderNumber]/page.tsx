import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PaymentStatusClient } from './PaymentStatusClient';

interface Props {
  params: { orderNumber: string };
}

export default async function PaymentPage({ params }: Props) {
  const order = await prisma.order.findUnique({
    where: { orderNumber: params.orderNumber },
    include: {
      payment: true,
      subOrders: {
        include: { store: true },
      },
    },
  });

  if (!order || !order.payment) {
    notFound();
  }

  return <PaymentStatusClient order={order} />;
}
