import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

const vendorSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  trainingTypes: z.array(z.enum(['COMPUTER_SKILLS', 'BUSINESS_SKILLS', 'LOGIC_SKILLS'])),
})

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const vendors = await prisma.vendor.findMany({
    include: { _count: { select: { trainings: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(vendors)
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user || user.role !== 'ACCOUNT_MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const data = vendorSchema.parse(body)
    const vendor = await prisma.vendor.create({ data })
    return NextResponse.json(vendor, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
