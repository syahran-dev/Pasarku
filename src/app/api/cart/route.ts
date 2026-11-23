import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { parseSessionToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const addToCartSchema = z.object({
  productId: z.string().uuid(),
  productVariantId: z.string().uuid(),
  quantity: z.number().int().min(1).default(1),
});

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? parseSessionToken(token) : null;

  if (!session) {
    return NextResponse.json({ items: [], totalItems: 0 });
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: session.userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
              store: true,
            },
          },
          variant: {
            include: { inventory: true },
          },
        },
      },
    },
  });

  if (!cart) {
    return NextResponse.json({ items: [], totalItems: 0 });
  }

  // Format cart items
  const items = cart.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    productVariantId: item.productVariantId,
    productName: item.product.name,
    variantTitle: item.variant.title,
    price: item.variant.price,
    weightGram: item.variant.weightGram,
    quantity: item.quantity,
    stockQty: item.variant.inventory?.stockQty ?? 0,
    imageUrl: item.product.images[0]?.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200',
    storeId: item.storeId,
    storeName: item.product.store.storeName,
    storeCity: item.product.store.cityName,
  }));

  const totalItems = items.reduce((sum, it) => sum + it.quantity, 0);

  return NextResponse.json({ items, totalItems });
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const session = token ? parseSessionToken(token) : null;

    if (!session) {
      return NextResponse.json(
        { error: 'Silakan login terlebih dahulu untuk menambah ke keranjang.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = addToCartSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { productId, productVariantId, quantity } = parsed.data;

    // Verify product and store
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          where: { id: productVariantId },
          include: { inventory: true },
        },
      },
    });

    if (!product || product.variants.length === 0) {
      return NextResponse.json({ error: 'Produk atau varian tidak ditemukan.' }, { status: 404 });
    }

    const variant = product.variants[0];
    const availableStock = (variant.inventory?.stockQty ?? 0) - (variant.inventory?.reservedQty ?? 0);

    if (availableStock < quantity) {
      return NextResponse.json({ error: `Stok tidak mencukupi (Tersedia: ${availableStock})` }, { status: 400 });
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId: session.userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: session.userId },
      });
    }

    // Upsert cart item
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productVariantId,
      },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          productVariantId,
          storeId: product.storeId,
          quantity,
        },
      });
    }

    return NextResponse.json({ success: true, message: 'Berhasil ditambahkan ke keranjang' });
  } catch (error: any) {
    console.error('Cart POST error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui keranjang.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const session = token ? parseSessionToken(token) : null;

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cartItemId = searchParams.get('id');

    if (!cartItemId) {
      return NextResponse.json({ error: 'ID item diperlukan' }, { status: 400 });
    }

    await prisma.cartItem.deleteMany({
      where: {
        id: cartItemId,
        cart: { userId: session.userId },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menghapus item dari keranjang.' }, { status: 500 });
  }
}
