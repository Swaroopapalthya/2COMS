import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    console.log(`🔑 Login attempt for: ${email}`)
    const user = await prisma.user.findUnique({
      where: { email },
      include: { client: { select: { id: true, companyName: true } } },
    })

    if (!user) {
      console.log(`❌ User not found: ${email}`)
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const matches = await bcrypt.compare(password, user.password)
    if (!matches) {
      console.log(`❌ Password mismatch for: ${email}`)
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    console.log(`✅ Login successful for: ${email} (${user.role})`)

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      clientId: user.clientId,
    })

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

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
