'use client'
import AppLayout from '@/components/AppLayout'
import ClientDetailPage from '@/components/pages/ClientDetail'
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <AppLayout><ClientDetailPage params={params} /></AppLayout>
}
