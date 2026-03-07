'use client'

import { useCallback, useEffect, useState, use } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
  NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import api from '@/lib/api-client'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'

type NodeData = { label: string; description?: string; [key: string]: unknown }

const NODE_TYPES_CONFIG = [
  { type: 'projectType', label: 'Project Type', icon: '🏗️', color: '#6366f1', bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.4)' },
  { type: 'trainingRequired', label: 'Training Required?', icon: '❓', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)' },
  { type: 'trainingType', label: 'Training Type', icon: '🎓', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.4)' },
  { type: 'vendorSelection', label: 'Vendor Selection', icon: '🤝', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)', border: 'rgba(6,182,212,0.4)' },
  { type: 'paymentSource', label: 'Payment Source', icon: '💳', color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)' },
  { type: 'certification', label: 'Certification', icon: '🏆', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)' },
  { type: 'interview', label: 'Interview', icon: '💼', color: '#ec4899', bg: 'rgba(236,72,153,0.15)', border: 'rgba(236,72,153,0.4)' },
  { type: 'shortlist', label: 'Shortlist', icon: '✅', color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)' },
  { type: 'offerLetter', label: 'Offer Letter', icon: '📄', color: '#6366f1', bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.4)' },
  { type: 'hired', label: 'Hired', icon: '🎉', color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)' },
  { type: 'decision', label: 'Decision / Condition', icon: '🔀', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)' },
  { type: 'start', label: 'Start', icon: '▶️', color: '#10b981', bg: 'rgba(16,185,129,0.2)', border: 'rgba(16,185,129,0.5)' },
  { type: 'end', label: 'End', icon: '⏹️', color: '#ef4444', bg: 'rgba(239,68,68,0.2)', border: 'rgba(239,68,68,0.5)' },
]

function getNodeConfig(type: string) {
  return NODE_TYPES_CONFIG.find(n => n.type === type) || NODE_TYPES_CONFIG[0]
}

function WorkflowNode({ data, type, selected }: NodeProps) {
  const config = getNodeConfig(type as string)
  const nodeData = data as NodeData

  return (
    <div style={{
      background: config.bg,
      border: `2px solid ${selected ? config.color : config.border}`,
      borderRadius: 14,
      padding: '12px 18px',
      minWidth: 160,
      maxWidth: 220,
      boxShadow: selected ? `0 0 0 3px ${config.color}33, 0 8px 24px rgba(0,0,0,0.3)` : '0 4px 16px rgba(0,0,0,0.2)',
      transition: 'all 0.2s ease',
      cursor: 'grab',
    }}>
      <Handle type="target" position={Position.Top} style={{ background: config.color, width: 10, height: 10, border: '2px solid var(--bg-primary)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 18 }}>{config.icon}</span>
        <div>
          <div style={{ fontSize: 11, color: config.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
            {config.label}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f0ff' }}>{nodeData.label}</div>
        </div>
      </div>
      {nodeData.description && (
        <div style={{ fontSize: 11, color: 'rgba(144,144,170,0.8)', marginTop: 4, lineHeight: 1.4 }}>
          {nodeData.description as string}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: config.color, width: 10, height: 10, border: '2px solid var(--bg-primary)' }} />
    </div>
  )
}

const nodeTypesMap = Object.fromEntries(
  NODE_TYPES_CONFIG.map(n => [n.type, WorkflowNode])
) as Record<string, React.ComponentType<NodeProps>>

export default function WorkflowBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params)
  const router = useRouter()
  const { user } = useAuthStore()
  const isManager = user?.role === 'ACCOUNT_MANAGER'

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [project, setProject] = useState<{ projectName: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedNodeType, setSelectedNodeType] = useState(NODE_TYPES_CONFIG[0])
  const [nodeLabel, setNodeLabel] = useState('')
  const [nodeDesc, setNodeDesc] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectRes, workflowRes] = await Promise.all([
          api.get(`/api/projects/${projectId}`),
          api.get(`/api/projects/${projectId}/workflow`),
        ])
        setProject(projectRes.data)

        const wfNodes = workflowRes.data.nodes
        const wfEdges = workflowRes.data.edges

        if (wfNodes.length > 0) {
          setNodes(wfNodes.map((n: { nodeId: string; type: string; positionX: number; positionY: number; data: NodeData }) => ({
            id: n.nodeId,
            type: n.type,
            position: { x: n.positionX, y: n.positionY },
            data: n.data as NodeData,
          })))
          setEdges(wfEdges.map((e: { edgeId: string; source: string; target: string; sourceHandle?: string; targetHandle?: string; label?: string }) => ({
            id: e.edgeId,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
            targetHandle: e.targetHandle,
            label: e.label,
            animated: true,
            style: { stroke: '#6366f1', strokeWidth: 2 },
          })))
        } else {
          // Default starter nodes
          setNodes([
            { id: 'start-1', type: 'start', position: { x: 300, y: 50 }, data: { label: 'Project Start' } },
            { id: 'type-1', type: 'projectType', position: { x: 300, y: 180 }, data: { label: 'Determine Type', description: 'On-site or Off-site?' } },
          ])
          setEdges([
            { id: 'e-start-type', source: 'start-1', target: 'type-1', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } },
          ])
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [projectId])

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges(eds => addEdge({ ...params, animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } }, eds)),
    [setEdges]
  )

  const addNode = () => {
    if (!nodeLabel.trim()) return
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: selectedNodeType.type,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: { label: nodeLabel, description: nodeDesc },
    }
    setNodes(nds => [...nds, newNode])
    setNodeLabel('')
    setNodeDesc('')
  }

  const saveWorkflow = async () => {
    setSaving(true)
    try {
      await api.post(`/api/projects/${projectId}/workflow`, {
        nodes: nodes.map(n => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: n.data,
        })),
        edges: edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
          label: e.label,
        })),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      alert('Failed to save workflow')
    } finally {
      setSaving(false)
    }
  }

  const clearWorkflow = () => {
    if (!confirm('Clear all nodes and edges?')) return
    setNodes([])
    setEdges([])
  }

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%' }} className="animate-spin" />
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Top bar */}
      <div style={{
        padding: '14px 24px', background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <button onClick={() => router.push(`/projects/${projectId}`)} style={{
          background: 'none', border: '1px solid var(--border)', borderRadius: 8,
          color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px 12px', fontSize: 13,
        }}>
          ← Back
        </button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>
            🔧 Workflow Builder
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{project?.projectName}</div>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', alignSelf: 'center' }}>
            {nodes.length} nodes · {edges.length} connections
          </span>
          {isManager && (
            <>
              <button className="btn-secondary" onClick={clearWorkflow}>Clear</button>
              <button className="btn-primary" onClick={saveWorkflow} disabled={saving}>
                {saving ? '⏳ Saving...' : saved ? '✅ Saved!' : '💾 Save Workflow'}
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar */}
        {isManager && (
          <div style={{
            width: 280, background: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column',
            overflowY: 'auto',
          }}>
            {/* Add node form */}
            <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                Add Node
              </p>

              <div style={{ marginBottom: 10 }}>
                <label className="form-label">Node Type</label>
                <select
                  className="form-select"
                  style={{ fontSize: 13 }}
                  value={selectedNodeType.type}
                  onChange={e => {
                    const found = NODE_TYPES_CONFIG.find(n => n.type === e.target.value)
                    if (found) setSelectedNodeType(found)
                  }}
                >
                  {NODE_TYPES_CONFIG.map(n => (
                    <option key={n.type} value={n.type}>{n.icon} {n.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label className="form-label">Label</label>
                <input className="form-input" style={{ fontSize: 13 }} placeholder="Node label..." value={nodeLabel} onChange={e => setNodeLabel(e.target.value)} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label className="form-label">Description (optional)</label>
                <input className="form-input" style={{ fontSize: 13 }} placeholder="Short description..." value={nodeDesc} onChange={e => setNodeDesc(e.target.value)} />
              </div>

              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 13 }} onClick={addNode} disabled={!nodeLabel.trim()}>
                + Add to Canvas
              </button>
            </div>

            {/* Node palette */}
            <div style={{ padding: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                Node Types
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {NODE_TYPES_CONFIG.map(n => (
                  <div key={n.type}
                    onClick={() => setSelectedNodeType(n)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                      background: selectedNodeType.type === n.type ? n.bg : 'transparent',
                      border: `1px solid ${selectedNodeType.type === n.type ? n.border : 'transparent'}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{n.icon}</span>
                    <span style={{ fontSize: 12, color: selectedNodeType.type === n.type ? n.color : 'var(--text-secondary)', fontWeight: selectedNodeType.type === n.type ? 600 : 400 }}>
                      {n.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div style={{ padding: '12px 16px', margin: '0 12px 12px', background: 'rgba(99,102,241,0.07)', borderRadius: 10, border: '1px solid rgba(99,102,241,0.15)' }}>
              <p style={{ fontSize: 11, color: 'var(--accent-blue-light)', fontWeight: 600, marginBottom: 6 }}>💡 Tips</p>
              <ul style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 14, lineHeight: 1.8 }}>
                <li>Drag nodes to reposition</li>
                <li>Connect nodes by dragging handles</li>
                <li>Click node to select/delete</li>
                <li>Use Ctrl+Z to undo</li>
              </ul>
            </div>
          </div>
        )}

        {/* React Flow Canvas */}
        <div style={{ flex: 1 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypesMap}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            deleteKeyCode="Delete"
            style={{ background: 'var(--bg-primary)' }}
          >
            <Controls />
            <MiniMap
              nodeColor={n => {
                const config = getNodeConfig(n.type || '')
                return config.color
              }}
              style={{ background: 'var(--bg-card)' }}
            />
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(90,90,122,0.3)" />
          </ReactFlow>
        </div>
      </div>
    </div>
  )
}
