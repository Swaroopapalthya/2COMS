import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

const projectSchema = z.object({
  clientId: z.string(),
  projectName: z.string().min(2),
  projectType: z.enum(['ON_SITE', 'OFF_SITE']),
  trainingRequired: z.boolean().default(false),
  description: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const where = user.role === 'CLIENT' && user.clientId
    ? { clientId: user.clientId }
    : {}

  const projects = await prisma.project.findMany({
    where,
    include: {
      client: { select: { id: true, companyName: true } },
      trainings: { include: { vendor: true } },
      _count: { select: { trainees: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(projects)
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user || user.role !== 'ACCOUNT_MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const data = projectSchema.parse(body)

    // Business rule: ON_SITE must have trainingRequired
    if (data.projectType === 'ON_SITE') {
      data.trainingRequired = true
    }

    const project = await prisma.project.create({
      data,
      include: { client: true, trainings: true },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
