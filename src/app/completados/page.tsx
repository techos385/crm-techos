// src/app/completados/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { ClientesEstado } from '@/components/clientes/ClientesEstado'

export const metadata = { title: 'Completados · Techos y Cubiertas' }

export default async function CompletadosPage() {
  const session = await auth()
  if (!session) redirect('/login')
  return (
    <AppLayout>
      <ClientesEstado estado="GANADO" />
    </AppLayout>
  )
}
