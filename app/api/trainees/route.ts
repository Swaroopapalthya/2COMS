import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

const traineeSchema = z.object({
  projectId: z.string(),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  skills: z.array(z.string()).default([]),
  trainingStatus: z.enum(['ACTIVE', 'TRAINING', 'CERTIFIED', 'INTERVIEWING', 'HIRED']).optional(),
  certificationStatus: z.boolean().default(false),
})

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  const trainees = await prisma.trainee.findMany({
    where: projectId ? { projectId } : undefined,
    include: {
      interviews: { orderBy: { scheduledAt: 'desc' } },
      offer: true,
      project: { include: { client: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(trainees)
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user || user.role !== 'ACCOUNT_MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const data = traineeSchema.parse(body)
    const trainee = await prisma.trainee.create({
      data,
      include: { interviews: true, offer: true },
    })
    return NextResponse.json(trainee, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
