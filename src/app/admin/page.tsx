// src/app/admin/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { AdminContenido } from '@/components/admin/AdminContenido'

export const metadata = { title: 'Administración · Techos y Cubiertas' }

export default async function AdminPage() {
  const session = await auth()
  if (!session) redirect('/login')
  if (session.user.rol !== 'ADMIN') redirect('/dashboard')

  return (
    <AppLayout>
      <AdminContenido />
    </AppLayout>
  )
}
