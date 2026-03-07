import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

const workflowSchema = z.object({
  nodes: z.array(z.object({
    id: z.string(),
    type: z.string(),
    position: z.object({ x: z.number(), y: z.number() }),
    data: z.object({ label: z.string() }).passthrough(),
  })),
  edges: z.array(z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    sourceHandle: z.string().optional().nullable(),
    targetHandle: z.string().optional().nullable(),
    label: z.string().optional(),
  })),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const [nodes, edges] = await Promise.all([
    prisma.workflowNode.findMany({ where: { projectId: id } }),
    prisma.workflowEdge.findMany({ where: { projectId: id } }),
  ])

  return NextResponse.json({ nodes, edges })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request)
  if (!user || user.role !== 'ACCOUNT_MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { nodes, edges } = workflowSchema.parse(body)

  // Delete existing and recreate
  await prisma.$transaction([
    prisma.workflowNode.deleteMany({ where: { projectId: id } }),
    prisma.workflowEdge.deleteMany({ where: { projectId: id } }),
    prisma.workflowNode.createMany({
      data: nodes.map(n => ({
        projectId: id,
        nodeId: n.id,
        type: n.type,
        label: n.data.label,
        positionX: n.position.x,
        positionY: n.position.y,
        data: n.data as Prisma.InputJsonValue,
      })),
    }),
    prisma.workflowEdge.createMany({
      data: edges.map(e => ({
        projectId: id,
        edgeId: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        label: e.label,
      })),
    }),
  ])

  return NextResponse.json({ success: true, nodeCount: nodes.length, edgeCount: edges.length })
}
