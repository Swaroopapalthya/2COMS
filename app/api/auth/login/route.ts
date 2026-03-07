import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'
import { z } from 'zod'
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed. Use POST for login.' }, { status: 405 })
}

/**
 * PROPERLY STRUCTURED LOGIN API HANDLER
 * Features:
 * 1. Descriptive error logging
 * 2. Zod validation with friendly error messages
 * 3. Robust database interaction
 * 4. Secure JWT token generation and cookie setting
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Get and parse body safely
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error('❌ Login error: Could not parse request JSON body.')
      return NextResponse.json({ error: 'Malformed request body' }, { status: 400 })
    }

    // 2. Validate input and handle Zod errors specifically
    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || 'Invalid input'
      console.log(`❌ Validation failed: ${firstError}`)
      return NextResponse.json({ error: firstError }, { status: 400 })
    }
    
    const { email, password } = validation.data
    console.log(`🔑 Login attempt: ${email}`)

    // 3. Database query with error handling
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email },
        include: { client: { select: { id: true, companyName: true } } },
      })
    } catch (prismaError: any) {
      console.error('❌ Database connection error in login route:', prismaError.message)
      return NextResponse.json({ 
        error: 'Database connection failed. Please try again later.' 
      }, { status: 500 })
    }

    // 4. Verify user and password
    if (!user) {
      console.log(`❌ User not found: ${email}`)
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const matches = await bcrypt.compare(password, user.password)
    if (!matches) {
      console.log(`❌ Password mismatch for: ${email}`)
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    console.log(`✅ Login successful: ${email} (${user.role})`)

    // 5. Sign token (MUST BE ASYNC for jose)
    let token;
    try {
      token = await signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        clientId: user.clientId,
      })
    } catch (jwtError: any) {
      console.error('❌ JWT Signing failed:', jwtError.message)
      return NextResponse.json({ error: 'Failed to generate session' }, { status: 500 })
    }

    // 6. Return response with session information and set cookie
    const response = NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        clientId: user.clientId,
        client: user.client,
      },
    })

    try {
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      })
    } catch (cookieError: any) {
      console.error('⚠️ Cookie setting failed:', cookieError.message)
      // Still proceed, tokens are preferred in the body anyway
    }

    return response
    
  } catch (globalError: any) {
    // 7. Ultimate fallback for unexpected errors
    console.error('💣 UNHANDLED LOGIN BUG:', globalError)
    return NextResponse.json({ 
      error: 'An unexpected error occurred. Please contact support.',
      message: globalError.message,
      stack: globalError.stack,
      details: process.env.NODE_ENV === 'development' ? globalError.message : undefined 
    }, { status: 500 })
  }
}
