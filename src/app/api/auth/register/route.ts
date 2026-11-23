import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createSessionToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  phone: z.string().optional(),
  role: z.enum(['BUYER', 'SELLER']).default('BUYER'),
  storeName: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, phone, role, storeName } = parsed.data;

    // Check existing email
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar. Silakan gunakan email lain atau login.' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Create user & optional store
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone,
        role,
        ...(role === 'SELLER' && storeName
          ? {
              store: {
                create: {
                  storeName,
                  slug: storeName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4),
                  cityId: 'JKT',
                  cityName: 'Jakarta',
                  wallet: {
                    create: {
                      holdingBalance: 0,
                      availableBalance: 0,
                    },
                  },
                },
              },
            }
          : {}),
      },
      include: { store: true },
    });

    // Create default cart for user
    await prisma.cart.create({
      data: { userId: user.id },
    });

    const token = createSessionToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role as 'BUYER' | 'SELLER' | 'ADMIN',
      storeId: user.store?.id,
      storeName: user.store?.storeName,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        store: user.store ? { id: user.store.id, name: user.store.storeName } : null,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Gagal melakukan pendaftaran akun.' },
      { status: 500 }
    );
  }
}
