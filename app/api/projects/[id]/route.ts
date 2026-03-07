import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

const updateSchema = z.object({
  projectName: z.string().min(2).optional(),
  projectType: z.enum(['ON_SITE', 'OFF_SITE']).optional(),
  trainingRequired: z.boolean().optional(),
  description: z.string().optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: { include: { contacts: true } },
      trainings: { include: { vendor: true } },
      trainees: { include: { interviews: true, offer: true } },
      workflowNodes: true,
      workflowEdges: true,
    },
  })

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(project)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request)
  if (!user || user.role !== 'ACCOUNT_MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const data = updateSchema.parse(body)

  if (data.projectType === 'ON_SITE') {
    data.trainingRequired = true
  }

  const project = await prisma.project.update({
    where: { id },
    data,
    include: { client: true, trainings: true },
  })
  return NextResponse.json(project)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request)
  if (!user || user.role !== 'ACCOUNT_MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  await prisma.project.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
