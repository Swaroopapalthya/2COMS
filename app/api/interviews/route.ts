import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

const interviewSchema = z.object({
  traineeId: z.string(),
  scheduledAt: z.string(),
  notes: z.string().optional(),
  status: z.enum(['INTERVIEW', 'SHORTLISTED', 'OFFER_LETTER', 'HIRED', 'REJECTED']).optional(),
})

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const traineeId = searchParams.get('traineeId')

  const interviews = await prisma.interview.findMany({
    where: traineeId ? { traineeId } : undefined,
    include: {
      trainee: { include: { project: { include: { client: true } } } },
    },
    orderBy: { scheduledAt: 'desc' },
  })

  return NextResponse.json(interviews)
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const data = interviewSchema.parse(body)

    const interview = await prisma.interview.create({
      data: {
        traineeId: data.traineeId,
        scheduledAt: new Date(data.scheduledAt),
        notes: data.notes,
        status: data.status || 'INTERVIEW',
      },
      include: { trainee: true },
    })

    // Update trainee status
    await prisma.trainee.update({
      where: { id: data.traineeId },
      data: { trainingStatus: 'INTERVIEWING' },
    })

    return NextResponse.json(interview, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
