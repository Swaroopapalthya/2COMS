import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

const trainingSchema = z.object({
  projectId: z.string(),
  vendorId: z.string(),
  trainingType: z.enum(['COMPUTER_SKILLS', 'BUSINESS_SKILLS', 'LOGIC_SKILLS']),
  paymentSource: z.enum(['ABC_CORP', 'CLIENT', 'TRAINEE']),
  certificationRequired: z.boolean().default(false),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  const trainings = await prisma.training.findMany({
    where: projectId ? { projectId } : undefined,
    include: { vendor: true, project: { include: { client: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(trainings)
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user || user.role !== 'ACCOUNT_MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const data = trainingSchema.parse(body)

    // Business rule: ON_SITE projects must have at least 2 trainings
    const project = await prisma.project.findUnique({ where: { id: data.projectId } })
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const training = await prisma.training.create({
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
      include: { vendor: true },
    })

    return NextResponse.json(training, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
