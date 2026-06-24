// src/app/clientes/[id]/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { ExpedienteCliente } from '@/components/clientes/ExpedienteCliente'

export const metadata = {
  title: 'Expediente · Techos y Cubiertas',
}

export default async function ExpedientePage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <AppLayout>
      <ExpedienteCliente id={params.id} />
    </AppLayout>
  )
}
