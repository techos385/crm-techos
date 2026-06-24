// src/app/archivados/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { ClientesEstado } from '@/components/clientes/ClientesEstado'

export const metadata = { title: 'Archivados · Techos y Cubiertas' }

export default async function ArchivadosPage() {
  const session = await auth()
  if (!session) redirect('/login')
  return (
    <AppLayout>
      <ClientesEstado estado="ARCHIVADO" />
    </AppLayout>
  )
}
