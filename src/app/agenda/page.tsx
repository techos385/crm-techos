// src/app/agenda/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { AgendaContenido } from '@/components/agenda/AgendaContenido'

export const metadata = {
  title: 'Agenda · Techos y Cubiertas',
  description: 'Tus citas, organizadas solas',
}

export default async function AgendaPage() {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <AppLayout>
      <AgendaContenido />
    </AppLayout>
  )
}
