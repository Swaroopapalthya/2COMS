import { jwtVerify, SignJWT } from 'jose'

function getSecretKey() {
  const secret = process.env.JWT_SECRET || 'your-fallback-secret-at-least-thirty-two-characters'
  return new TextEncoder().encode(secret)
}

export interface JWTPayload {
  userId: string
  email: string
  role: string
  clientId?: string | null
}

/**
 * Edge-compatible signing function
 */
export async function signToken(payload: any): Promise<string> {
  const key = getSecretKey()
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || '7d')
    .sign(key)
}

/**
 * Edge-compatible verification function
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const key = getSecretKey()
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    })
    return payload as unknown as JWTPayload
  } catch (err: any) {
    console.error('❌ Token verification failed:', err.message)
    return null
  }
}
