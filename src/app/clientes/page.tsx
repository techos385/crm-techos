// src/app/clientes/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { ListaClientes } from '@/components/clientes/ListaClientes'

export const metadata = {
  title: 'Clientes · Techos y Cubiertas',
  description: 'Todas tus personas en un solo lugar',
}

export default async function ClientesPage() {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <AppLayout>
      <ListaClientes />
    </AppLayout>
  )
}
