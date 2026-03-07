import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  trainingTypes: z.array(z.enum(['COMPUTER_SKILLS', 'BUSINESS_SKILLS', 'LOGIC_SKILLS'])).optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: { trainings: { include: { project: true } } },
  })

  if (!vendor) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(vendor)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request)
  if (!user || user.role !== 'ACCOUNT_MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const data = updateSchema.parse(body)
  const vendor = await prisma.vendor.update({ where: { id }, data })
  return NextResponse.json(vendor)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request)
  if (!user || user.role !== 'ACCOUNT_MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  await prisma.vendor.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
