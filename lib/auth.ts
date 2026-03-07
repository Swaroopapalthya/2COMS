import { NextRequest } from 'next/server'
import { prisma } from './prisma'
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

export async function signToken(payload: any): Promise<string> {
  const key = getSecretKey()
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || '7d')
    .sign(key)
}

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

export async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : request.cookies.get('auth_token')?.value

  if (!token) {
    console.log('⚠️ No token found in header or cookie')
    return null
  }

  const payload = await verifyToken(token)
  if (!payload) {
    console.log('❌ Invalid payload')
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, role: true, name: true, clientId: true },
  })

  if (!user) console.log('❌ User not found in DB for token')
  return user
}

export function requireAuth(roles?: string[]) {
  return async (request: NextRequest) => {
    const user = await getAuthUser(request)
    if (!user) {
      return { error: 'Unauthorized', status: 401 }
    }
    if (roles && !roles.includes(user.role)) {
      return { error: 'Forbidden', status: 403 }
    }
    return { user }
  }
}
