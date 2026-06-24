'use client'
// src/app/perfil/PerfilContenido.tsx

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Eye, EyeOff, Save, User } from 'lucide-react'
import { useToast } from '@/components/ui/Toaster'

export function PerfilContenido() {
  const { data: session, update } = useSession()
  const { agregar } = useToast()
  const [nombre, setNombre] = useState(session?.user?.name || '')
  const [passActual, setPassActual] = useState('')
  const [passNueva, setPassNueva] = useState('')
  const [verPass, setVerPass] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const guardar = async () => {
    if (!nombre.trim()) {
      agregar({ tipo: 'error', titulo: 'El nombre no puede estar vacío', mensaje: '' })
      return
    }
    if (passNueva && passNueva.length < 8) {
      agregar({ tipo: 'error', titulo: 'La contraseña debe tener al menos 8 caracteres', mensaje: '' })
      return
    }
    setGuardando(true)
    try {
      const res = await fetch('/api/usuarios/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          ...(passNueva && { passActual, passNueva }),
        }),
      })
      const data = await res.json()
      if (data.ok) {
        await update({ name: nombre })
        agregar({ tipo: 'exito', titulo: 'Perfil actualizado ✓', mensaje: '' })
        setPassActual('')
        setPassNueva('')
      } else {
        agregar({ tipo: 'error', titulo: data.mensaje || 'Error al guardar', mensaje: '' })
      }
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="max-w-md space-y-6">
      {/* Avatar */}
      <div className="card p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold"
          style={{ background: 'var(--color-marca)' }}>
          {(nombre || session?.user?.name || 'U').charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-lg">{session?.user?.name}</p>
          <p className="text-sm" style={{ color: 'var(--text-secundario)' }}>{session?.user?.email}</p>
          <p className="text-xs mt-0.5 badge">{(session?.user as { rol?: string })?.rol || 'Vendedor'}</p>
        </div>
      </div>

      {/* Nombre */}
      <div className="card p-5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <User size={18} style={{ color: 'var(--color-marca)' }} />
          Datos personales
        </h3>
        <div>
          <label className="text-sm font-medium block mb-1">Nombre completo</label>
          <input
            className="campo w-full"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Tu nombre"
          />
        </div>
      </div>

      {/* Contraseña */}
      <div className="card p-5 space-y-4">
        <h3 className="font-semibold">Cambiar contraseña</h3>
        <p className="text-sm" style={{ color: 'var(--text-secundario)' }}>
          Deja en blanco si no quieres cambiarla.
        </p>
        <div>
          <label className="text-sm font-medium block mb-1">Contraseña actual</label>
          <input
            className="campo w-full"
            type="password"
            value={passActual}
            onChange={e => setPassActual(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Nueva contraseña</label>
          <div className="relative">
            <input
              className="campo w-full pr-10"
              type={verPass ? 'text' : 'password'}
              value={passNueva}
              onChange={e => setPassNueva(e.target.value)}
              placeholder="Mín. 8 caracteres"
            />
            <button onClick={() => setVerPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60">
              {verPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={guardar}
        disabled={guardando}
        className="btn-primario w-full flex items-center justify-center gap-2"
      >
        <Save size={18} />
        {guardando ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </div>
  )
}
