'use client'
import AppLayout from '@/components/AppLayout'
import ProjectDetailPage from '@/components/pages/ProjectDetail'
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <AppLayout><ProjectDetailPage params={params} /></AppLayout>
}
