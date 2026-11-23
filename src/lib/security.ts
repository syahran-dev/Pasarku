import { UserSessionPayload } from './auth';

export class UnauthorizedError extends Error {
  constructor(message = 'Akses tidak diizinkan. Silakan login terlebih dahulu.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Anda tidak memiliki hak akses untuk halaman atau aksi ini.') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

// Require authenticated session
export function assertAuthenticated(session: UserSessionPayload | null): asserts session is UserSessionPayload {
  if (!session) {
    throw new UnauthorizedError();
  }
}

// Require specific role
export function assertRole(
  session: UserSessionPayload | null,
  allowedRoles: Array<'BUYER' | 'SELLER' | 'ADMIN'>
): asserts session is UserSessionPayload {
  assertAuthenticated(session);
  if (!allowedRoles.includes(session.role)) {
    throw new ForbiddenError(`Aksi ini memerlukan peran: ${allowedRoles.join(' atau ')}`);
  }
}

// Assert seller owns the target store
export function assertStoreOwnership(session: UserSessionPayload | null, storeId: string): void {
  assertRole(session, ['SELLER', 'ADMIN']);
  if (session.role === 'ADMIN') return; // Admin has super-privilege
  if (session.storeId !== storeId) {
    throw new ForbiddenError('Akses ditolak: Anda tidak memiliki akses ke toko ini.');
  }
}
