// src/app/asistente/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { AsistenteIA } from '@/components/ai/AsistenteIA'

export const metadata = { title: 'Asistente IA · Techos y Cubiertas' }

export default async function AsistentePage() {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <AppLayout>
      <AsistenteIA />
    </AppLayout>
  )
}
