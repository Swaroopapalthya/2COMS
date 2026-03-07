import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  skills: z.array(z.string()).optional(),
  trainingStatus: z.enum(['ACTIVE', 'TRAINING', 'CERTIFIED', 'INTERVIEWING', 'HIRED']).optional(),
  certificationStatus: z.boolean().optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const trainee = await prisma.trainee.findUnique({
    where: { id },
    include: { interviews: true, offer: true, project: { include: { client: true } } },
  })

  if (!trainee) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(trainee)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const data = updateSchema.parse(body)

  const trainee = await prisma.trainee.update({
    where: { id },
    data,
    include: { interviews: true, offer: true },
  })
  return NextResponse.json(trainee)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request)
  if (!user || user.role !== 'ACCOUNT_MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  await prisma.trainee.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
