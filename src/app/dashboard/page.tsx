// src/app/dashboard/page.tsx
import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardContenido } from '@/components/dashboard/DashboardContenido'

export const metadata: Metadata = {
  title: 'Tablero',
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <AppLayout>
      <DashboardContenido />
    </AppLayout>
  )
}
