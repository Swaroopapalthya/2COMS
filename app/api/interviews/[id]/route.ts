import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

const updateSchema = z.object({
  status: z.enum(['INTERVIEW', 'SHORTLISTED', 'OFFER_LETTER', 'HIRED', 'REJECTED']),
  notes: z.string().optional(),
  scheduledAt: z.string().optional(),
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { status, notes, scheduledAt } = updateSchema.parse(body)

  const interview = await prisma.interview.update({
    where: { id },
    data: {
      status,
      notes,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
    },
    include: { trainee: true },
  })

  // If hired, update trainee status
  if (status === 'HIRED') {
    await prisma.trainee.update({
      where: { id: interview.traineeId },
      data: { trainingStatus: 'HIRED' },
    })
  }

  return NextResponse.json(interview)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request)
  if (!user || user.role !== 'ACCOUNT_MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  await prisma.interview.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
