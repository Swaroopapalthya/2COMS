import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/jwt'

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/register', '/api/ping', '/favicon.ico', '/_next']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip public paths quickly
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const authHeader = request.headers.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const cookieToken = request.cookies.get('auth_token')?.value
  
  const token = bearerToken || cookieToken

  if (!token) {
    console.log(`🔒 Middleware (Blocked): No token for ${pathname}`)
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const payload = await verifyToken(token)
  
  if (!payload) {
    console.log(`❌ Middleware (Invalid Token): ${pathname}`)
    const response = pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', request.url))
    
    // Clear potentially corrupted cookie
    response.cookies.delete('auth_token')
    return response
  }

  console.log(`✅ Middleware (Allow): ${pathname} [${payload.role}]`)
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}
