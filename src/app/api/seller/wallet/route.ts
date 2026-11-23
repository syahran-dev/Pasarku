import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { parseSessionToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const payoutSchema = z.object({
  amount: z.number().positive('Nominal penarikan harus lebih dari 0'),
  bankName: z.string().min(2, 'Nama bank wajib diisi'),
  accountNumber: z.string().min(5, 'Nomor rekening wajib diisi'),
  accountHolder: z.string().min(2, 'Nama pemilik rekening wajib diisi'),
});

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const session = token ? parseSessionToken(token) : null;

    if (!session || !session.storeId) {
      return NextResponse.json({ error: 'Khusus penjual terdaftar.' }, { status: 403 });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { storeId: session.storeId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 30,
        },
        payouts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return NextResponse.json({ wallet });
  } catch (error: any) {
    return NextResponse.json({ error: 'Gagal memuat informasi dompet toko.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const session = token ? parseSessionToken(token) : null;

    if (!session || !session.storeId) {
      return NextResponse.json({ error: 'Khusus penjual terdaftar.' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = payoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { amount, bankName, accountNumber, accountHolder } = parsed.data;

    // Check available balance
    const wallet = await prisma.wallet.findUnique({
      where: { storeId: session.storeId },
    });

    if (!wallet || wallet.availableBalance < amount) {
      return NextResponse.json(
        { error: `Saldo tersedia tidak mencukupi (Tersedia: Rp ${wallet?.availableBalance ?? 0})` },
        { status: 400 }
      );
    }

    // Freeze balance immediately to prevent double spending
    await prisma.$transaction(async (tx) => {
      const balanceBefore = wallet.availableBalance;
      const balanceAfter = balanceBefore - amount;

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { availableBalance: balanceAfter },
      });

      await tx.payoutRequest.create({
        data: {
          walletId: wallet.id,
          storeId: session.storeId!,
          amount,
          bankName,
          accountNumber,
          accountHolder,
          status: 'REQUESTED',
        },
      });

      // Immutable ledger entry
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          referenceType: 'PAYOUT_WITHDRAWAL',
          referenceId: `PO-${Date.now()}`,
          type: 'DEBIT',
          balanceType: 'AVAILABLE',
          amount,
          balanceBefore,
          balanceAfter,
          description: `Pengajuan pencairan saldo ke rekening ${bankName} (${accountNumber}) a.n ${accountHolder}`,
        },
      });
    });

    return NextResponse.json({ success: true, message: 'Pengajuan pencairan dana berhasil dikirim ke Admin!' });
  } catch (error: any) {
    console.error('Payout request error:', error);
    return NextResponse.json({ error: error.message || 'Gagal mengajukan pencairan dana.' }, { status: 500 });
  }
}
