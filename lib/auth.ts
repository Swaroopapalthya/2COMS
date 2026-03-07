import { NextRequest } from 'next/server'
import { prisma } from './prisma'
import { signToken, verifyToken } from './jwt'
export * from './jwt'

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
