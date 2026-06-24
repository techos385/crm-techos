// src/app/perfil/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { PerfilContenido } from './PerfilContenido'

export const metadata = { title: 'Mi perfil · Techos y Cubiertas' }

export default async function PerfilPage() {
  const session = await auth()
  if (!session) redirect('/login')
  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Mi perfil</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secundario)' }}>Cambia tu nombre o contraseña</p>
      </div>
      <PerfilContenido />
    </AppLayout>
  )
}
