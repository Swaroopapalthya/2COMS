import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

const clientSchema = z.object({
  companyName: z.string().min(2),
  contacts: z.array(z.object({
    contactName: z.string(),
    email: z.string().email(),
    role: z.string(),
  })).optional(),
})

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clients = await prisma.client.findMany({
    include: { contacts: true, _count: { select: { projects: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(clients)
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user || user.role !== 'ACCOUNT_MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { companyName, contacts } = clientSchema.parse(body)

    const client = await prisma.client.create({
      data: {
        companyName,
        contacts: contacts
          ? { create: contacts }
          : undefined,
      },
      include: { contacts: true },
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
