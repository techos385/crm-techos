// src/app/embudo/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { EmbudoKanban } from '@/components/embudo/EmbudoKanban'

export const metadata = {
  title: 'Embudo · Techos y Cubiertas',
  description: 'Mueve a cada cliente hacia la venta',
}

export default async function EmbudoPage() {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <AppLayout>
      <EmbudoKanban />
    </AppLayout>
  )
}
