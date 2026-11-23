import { prisma } from './prisma';

export interface CommissionCalculation {
  goodsAmount: number;
  ratePercent: number;
  commissionAmount: number;
  netSellerAmount: number;
}

/**
 * Calculate marketplace platform commission (Server-authoritative)
 */
export function calculateCommission(
  goodsAmount: number,
  ratePercent = 2.5
): CommissionCalculation {
  const commissionAmount = Math.round((goodsAmount * ratePercent) / 100);
  const netSellerAmount = goodsAmount - commissionAmount;
  return {
    goodsAmount,
    ratePercent,
    commissionAmount,
    netSellerAmount,
  };
}

/**
 * Record escrow allocation when buyer pays:
 * Credit holding balance of the store wallet
 */
export async function allocateToEscrow(
  tx: typeof prisma,
  subOrderId: string,
  storeId: string,
  goodsAmount: number,
  shippingAmount: number
) {
  const comm = calculateCommission(goodsAmount);
  const totalSellerCredit = comm.netSellerAmount + shippingAmount;

  // Find or create store wallet
  let wallet = await tx.wallet.findUnique({
    where: { storeId },
  });

  if (!wallet) {
    wallet = await tx.wallet.create({
      data: {
        storeId,
        holdingBalance: 0,
        availableBalance: 0,
        totalWithdrawn: 0,
      },
    });
  }

  const balanceBefore = wallet.holdingBalance;
  const balanceAfter = balanceBefore + totalSellerCredit;

  // Update wallet holding balance
  await tx.wallet.update({
    where: { id: wallet.id },
    data: { holdingBalance: balanceAfter },
  });

  // Create immutable ledger record
  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      referenceType: 'SUB_ORDER_SETTLEMENT',
      referenceId: subOrderId,
      type: 'CREDIT',
      balanceType: 'HOLDING',
      amount: totalSellerCredit,
      balanceBefore,
      balanceAfter,
      description: `Dana tertahan escrow sub-order #${subOrderId} (Net Barang: Rp ${comm.netSellerAmount}, Ongkir: Rp ${shippingAmount})`,
    },
  });

  // Record commission table
  await tx.commission.create({
    data: {
      subOrderId,
      storeId,
      ratePercent: comm.ratePercent,
      commissionAmount: comm.commissionAmount,
      netSellerAmount: comm.netSellerAmount,
      status: 'PENDING',
    },
  });
}

/**
 * Release escrow into available balance when order is COMPLETED
 */
export async function releaseEscrowToAvailable(
  tx: typeof prisma,
  subOrderId: string,
  storeId: string
) {
  const commission = await tx.commission.findUnique({
    where: { subOrderId },
  });

  const subOrder = await tx.subOrder.findUnique({
    where: { id: subOrderId },
  });

  if (!commission || !subOrder) {
    throw new Error('Data sub-order atau komisi tidak ditemukan.');
  }

  const totalReleaseAmount = commission.netSellerAmount + subOrder.shippingAmount;

  const wallet = await tx.wallet.findUnique({
    where: { storeId },
  });

  if (!wallet) {
    throw new Error('Dompet toko tidak ditemukan.');
  }

  // Deduct from holding, Add to available
  const newHolding = Math.max(0, wallet.holdingBalance - totalReleaseAmount);
  const newAvailable = wallet.availableBalance + totalReleaseAmount;

  await tx.wallet.update({
    where: { id: wallet.id },
    data: {
      holdingBalance: newHolding,
      availableBalance: newAvailable,
    },
  });

  // Double-entry ledger entries
  await tx.walletTransaction.createMany({
    data: [
      {
        walletId: wallet.id,
        referenceType: 'SUB_ORDER_SETTLEMENT',
        referenceId: subOrderId,
        type: 'DEBIT',
        balanceType: 'HOLDING',
        amount: totalReleaseAmount,
        balanceBefore: wallet.holdingBalance,
        balanceAfter: newHolding,
        description: `Pelepasan dana escrow sub-order #${subOrder.subOrderNumber} ke saldo aktif`,
      },
      {
        walletId: wallet.id,
        referenceType: 'SUB_ORDER_SETTLEMENT',
        referenceId: subOrderId,
        type: 'CREDIT',
        balanceType: 'AVAILABLE',
        amount: totalReleaseAmount,
        balanceBefore: wallet.availableBalance,
        balanceAfter: newAvailable,
        description: `Penerimaan dana penjualan bersih sub-order #${subOrder.subOrderNumber}`,
      },
    ],
  });

  // Update commission status to COLLECTED
  await tx.commission.update({
    where: { subOrderId },
    data: { status: 'COLLECTED' },
  });
}
