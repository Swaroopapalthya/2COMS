'use client'
import AppLayout from '@/components/AppLayout'
import WorkflowBuilderPage from '@/components/pages/WorkflowBuilder'
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <AppLayout><WorkflowBuilderPage params={params} /></AppLayout>
}
