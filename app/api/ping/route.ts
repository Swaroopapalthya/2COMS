import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const start = Date.now()
    const count = await prisma.user.count()
    return NextResponse.json({ 
      status: 'ok', 
      db: 'connected', 
      users: count,
      time: Date.now() - start
    })
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'error', 
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
