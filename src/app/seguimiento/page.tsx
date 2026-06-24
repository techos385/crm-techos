// src/app/seguimiento/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { SeguimientoContenido } from '@/components/seguimiento/SeguimientoContenido'

export const metadata = {
  title: 'Seguimiento · Techos y Cubiertas',
  description: 'A quién toca contactar hoy',
}

export default async function SeguimientoPage() {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <AppLayout>
      <SeguimientoContenido />
    </AppLayout>
  )
}
