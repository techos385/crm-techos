// src/app/pagos/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { PagosContenido } from '@/components/pagos/PagosContenido'

export const metadata = {
  title: 'Pagos · Techos y Cubiertas',
  description: 'Lo que cobraste y lo que falta',
}

export default async function PagosPage() {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <AppLayout>
      <PagosContenido />
    </AppLayout>
  )
}
