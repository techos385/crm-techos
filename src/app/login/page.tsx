// src/app/login/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

function FuerzaContrasena({ contrasena }: { contrasena: string }) {
  const puntos = [
    contrasena.length >= 8,
    /[A-Z]/.test(contrasena),
    /[0-9]/.test(contrasena),
    /[^A-Za-z0-9]/.test(contrasena),
  ].filter(Boolean).length

  if (!contrasena) return null

  const labels = ['Muy débil', 'Débil', 'Regular', 'Fuerte']
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500']

  return (
    <div className="mt-1.5">
      <div className="flex gap-1">
        {[0,1,2,3].map(i => (
          <div key={i} className={cn('h-1 flex-1 rounded-full', i < puntos ? colors[puntos - 1] : 'bg-slate-200 dark:bg-slate-700')} />
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-1">{labels[puntos - 1] || ''}</p>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [mostrarContrasena, setMostrarContrasena] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const errorParam = params.get('error')

  useEffect(() => {
    if (errorParam === 'CredentialsSignin') {
      setError('Correo o contraseña incorrectos. Verifica tus datos.')
    }
  }, [errorParam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!correo || !contrasena) {
      setError('Por favor llena todos los campos.')
      return
    }

    setCargando(true)
    setError(null)

    try {
      const result = await signIn('credentials', {
        correo,
        contrasena,
        redirect: false,
      })

      if (result?.error) {
        if (result.error.includes('Demasiados')) {
          setError('Demasiados intentos fallidos. Espera 15 minutos e intenta de nuevo.')
        } else if (result.error.includes('desactivada')) {
          setError('Esta cuenta está desactivada. Contacta al administrador.')
        } else {
          setError('Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.')
        }
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError('Ocurrió un error al conectar. Verifica tu conexión e intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-marca-100/20 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-marca-300 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-3xl">T</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Techos y Cubiertas
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Tu CRM de ventas
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-modal border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-5">
            Inicia sesión
          </h2>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-4"
            >
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Correo */}
            <div>
              <label htmlFor="correo" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="correo"
                  type="email"
                  value={correo}
                  onChange={e => setCorreo(e.target.value)}
                  placeholder="tu@correo.com"
                  className={cn('campo pl-10', error && 'campo-error')}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="contrasena" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="contrasena"
                  type={mostrarContrasena ? 'text' : 'password'}
                  value={contrasena}
                  onChange={e => setContrasena(e.target.value)}
                  placeholder="Tu contraseña"
                  className={cn('campo pl-10 pr-10', error && 'campo-error')}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarContrasena(!mostrarContrasena)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {mostrarContrasena ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="btn-primario w-full"
            >
              {cargando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Iniciando sesión…
                </>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          <p className="text-xs text-slate-400 text-center mt-5">
            ¿Olvidaste tu contraseña? Pídele al administrador que la restablezca.
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Techos y Cubiertas © {new Date().getFullYear()}
        </p>
      </motion.div>
    </div>
  )
}
