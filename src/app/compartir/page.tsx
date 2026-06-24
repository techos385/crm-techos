// src/app/compartir/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { CompartirContenido } from '@/components/marketing/CompartirContenido'

export const metadata = { title: 'Comparte y crece · Techos y Cubiertas' }

export default async function CompartirPage() {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <AppLayout>
      <CompartirContenido />
    </AppLayout>
  )
}
