import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProductDetailClient } from './ProductDetailClient';

interface Props {
  params: { slug: string };
}

export default async function ProductDetailPage({ params }: Props) {
  const product = await prisma.product.findFirst({
    where: { slug: params.slug },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      variants: {
        include: { inventory: true },
        where: { isActive: true },
      },
      store: true,
      category: true,
      reviews: {
        include: { user: { select: { name: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
