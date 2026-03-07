import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/jwt'
import { z } from 'zod'
import fs from 'fs'
import path from 'path'

const LOG_FILE = path.join(process.cwd(), 'next-server.log')

function fileLog(msg: string) {
  const time = new Date().toISOString()
  try {
    fs.appendFileSync(LOG_FILE, `[${time}] [REAL] ${msg}\n`)
  } catch(e) {}
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed. Use POST for login.' }, { status: 405 })
}

/**
 * PRODUCTION LOGIN API HANDLER
 */
export async function POST(request: NextRequest) {
  try {
    fileLog('--- REAL LOGIN INITIATED ---')
    // 1. Safe JSON parsing
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error('❌ Login error: Could not parse request JSON body.')
      return NextResponse.json({ error: 'Malformed request body' }, { status: 400 })
    }

    // 2. Validate input
    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || 'Invalid input'
      return NextResponse.json({ error: firstError }, { status: 400 })
    }
    
    const { email, password } = validation.data
    console.log(`🔑 Login attempt: ${email}`)

    // 3. Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { client: { select: { id: true, companyName: true } } },
    })

    if (!user) {
      console.log(`❌ User not found: ${email}`)
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // 4. Verify password
    const matches = await bcrypt.compare(password, user.password)
    if (!matches) {
      console.log(`❌ Password mismatch for: ${email}`)
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    console.log(`✅ Login successful: ${email} (${user.role})`)

    // 5. Sign token
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      clientId: user.clientId,
    })

    // 6. Return response and set cookie
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
    }

    return response
    
  } catch (globalError: any) {
    console.error('💣 LOGIN API ERROR:', globalError)
    return NextResponse.json({ 
      error: 'An unexpected error occurred.',
      message: globalError.message,
      details: process.env.NODE_ENV === 'development' ? globalError.stack : undefined 
    }, { status: 500 })
  }
}
