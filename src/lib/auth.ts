import bcrypt from 'bcryptjs';

export interface UserSessionPayload {
  userId: string;
  name: string;
  email: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  storeId?: string;
  storeName?: string;
}

export const AUTH_COOKIE_NAME = 'pasarku_session_token';

// Hash password with bcrypt salt round 10
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Compare password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Simple signed token generator & parser for session cookie
export function createSessionToken(payload: UserSessionPayload): string {
  const jsonStr = JSON.stringify({
    ...payload,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  return Buffer.from(jsonStr).toString('base64url');
}

export function parseSessionToken(token: string): UserSessionPayload | null {
  try {
    const jsonStr = Buffer.from(token, 'base64url').toString('utf-8');
    const data = JSON.parse(jsonStr);
    if (!data.exp || data.exp < Date.now()) {
      return null;
    }
    return {
      userId: data.userId,
      name: data.name,
      email: data.email,
      role: data.role,
      storeId: data.storeId,
      storeName: data.storeName,
    };
  } catch {
    return null;
  }
}
