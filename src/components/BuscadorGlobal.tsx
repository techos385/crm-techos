'use client'

// src/components/BuscadorGlobal.tsx
// Buscador global que encuentra clientes, pagos, citas, notas

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Users, CalendarDays, Wallet, FileText, Loader2 } from 'lucide-react'
import { cn, debounce } from '@/lib/utils'

interface ResultadoBusqueda {
  tipo: 'cliente' | 'cita' | 'pago' | 'nota'
  id: string
  titulo: string
  subtitulo?: string
  href: string
  resaltado?: string
}

const TIPO_CONFIG = {
  cliente: { label: 'Clientes',  icon: Users,       color: 'text-blue-400' },
  cita:    { label: 'Citas',     icon: CalendarDays, color: 'text-emerald-400' },
  pago:    { label: 'Pagos',     icon: Wallet,       color: 'text-amber-400' },
  nota:    { label: 'Notas',     icon: FileText,     color: 'text-slate-400' },
}

const BUSQUEDAS_RECIENTES_KEY = 'busquedas_recientes'

function guardarBusquedaReciente(termino: string) {
  try {
    const recientes: string[] = JSON.parse(localStorage.getItem(BUSQUEDAS_RECIENTES_KEY) ?? '[]')
    const nuevas = [termino, ...recientes.filter(r => r !== termino)].slice(0, 5)
    localStorage.setItem(BUSQUEDAS_RECIENTES_KEY, JSON.stringify(nuevas))
  } catch { /* no crítico */ }
}

function obtenerBusquedasRecientes(): string[] {
  try {
    return JSON.parse(localStorage.getItem(BUSQUEDAS_RECIENTES_KEY) ?? '[]')
  } catch { return [] }
}

export function BuscadorGlobal({
  abierto,
  onCerrar,
}: {
  abierto: boolean
  onCerrar: () => void
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [termino, setTermino] = useState('')
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([])
  const [cargando, setCargando] = useState(false)
  const [seleccionado, setSeleccionado] = useState(0)
  const [recientes, setRecientes] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // Foco automático al abrir
  useEffect(() => {
    if (abierto) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setRecientes(obtenerBusquedasRecientes())
    } else {
      setTermino('')
      setResultados([])
      setSeleccionado(0)
      setError(null)
    }
  }, [abierto])

  // Búsqueda con debounce
  const buscar = useCallback(
    debounce(async (q: string) => {
      if (q.length < 2) {
        setResultados([])
        setCargando(false)
        return
      }

      setCargando(true)
      setError(null)

      try {
        const resp = await fetch(`/api/buscar?q=${encodeURIComponent(q)}&limit=10`)
        if (!resp.ok) throw new Error('Error al buscar')
        const data = await resp.json()
        setResultados(data.data ?? [])
        setSeleccionado(0)
      } catch {
        setError('No se pudo conectar. Revisa tu conexión.')
        setResultados([])
      } finally {
        setCargando(false)
      }
    }, 250),
    []
  )

  useEffect(() => {
    if (termino) {
      setCargando(true)
      buscar(termino)
    } else {
      setResultados([])
      setCargando(false)
    }
  }, [termino, buscar])

  // Navegación por teclado
  useEffect(() => {
    if (!abierto) return

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCerrar()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSeleccionado(s => Math.min(s + 1, resultados.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSeleccionado(s => Math.max(s - 1, 0))
      }
      if (e.key === 'Enter' && resultados[seleccionado]) {
        navegarA(resultados[seleccionado])
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [abierto, resultados, seleccionado, onCerrar])

  const navegarA = (resultado: ResultadoBusqueda) => {
    guardarBusquedaReciente(termino)
    onCerrar()
    router.push(resultado.href)
  }

  // Agrupar resultados por tipo
  const grupos = resultados.reduce<Record<string, ResultadoBusqueda[]>>((acc, r) => {
    acc[r.tipo] = acc[r.tipo] ?? []
    acc[r.tipo].push(r)
    return acc
  }, {})

  const tieneResultados = resultados.length > 0

  return (
    <AnimatePresence>
      {abierto && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onCerrar}
          />

          {/* Panel del buscador */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 top-[10vh] left-1/2 -translate-x-1/2 w-[92vw] max-w-xl"
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-modal border border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                {cargando
                  ? <Loader2 className="w-5 h-5 text-slate-400 flex-shrink-0 animate-spin" />
                  : <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
                }
                <input
                  ref={inputRef}
                  type="text"
                  value={termino}
                  onChange={e => setTermino(e.target.value)}
                  placeholder="Buscar clientes, teléfonos, correos, notas…"
                  className="flex-1 bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 text-base outline-none"
                  aria-label="Buscador global"
                  aria-autocomplete="list"
                  role="combobox"
                  aria-expanded={tieneResultados}
                />
                <button
                  onClick={onCerrar}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors"
                  aria-label="Cerrar buscador"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Resultados */}
              <div className="max-h-[60vh] overflow-y-auto" role="listbox">
                {error && (
                  <div className="px-4 py-6 text-center text-sm text-red-500">{error}</div>
                )}

                {!error && !cargando && termino.length >= 2 && !tieneResultados && (
                  <div className="px-4 py-8 text-center">
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      No encontré nada con &quot;{termino}&quot;.
                    </p>
                    <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                      Revisa cómo lo escribiste o crea un cliente nuevo.
                    </p>
                    <a
                      href="/clientes/nuevo"
                      onClick={onCerrar}
                      className="inline-block mt-3 btn-primario text-sm py-1.5 px-4"
                    >
                      + Nuevo cliente
                    </a>
                  </div>
                )}

                {!termino && recientes.length > 0 && (
                  <div className="px-4 py-3">
                    <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Búsquedas recientes</p>
                    {recientes.map(r => (
                      <button
                        key={r}
                        onClick={() => setTermino(r)}
                        className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-sm text-slate-600 dark:text-slate-400 transition-colors"
                      >
                        <Search className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
                        {r}
                      </button>
                    ))}
                  </div>
                )}

                {tieneResultados && (
                  <div className="py-2">
                    {Object.entries(grupos).map(([tipo, items]) => {
                      const cfg = TIPO_CONFIG[tipo as keyof typeof TIPO_CONFIG]
                      const Icon = cfg.icon

                      return (
                        <div key={tipo}>
                          <div className="px-4 py-1.5 flex items-center gap-2">
                            <Icon className={cn('w-3.5 h-3.5', cfg.color)} />
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{cfg.label}</span>
                          </div>

                          {items.map((resultado, i) => {
                            const globalI = resultados.indexOf(resultado)
                            return (
                              <button
                                key={resultado.id}
                                role="option"
                                aria-selected={seleccionado === globalI}
                                onClick={() => navegarA(resultado)}
                                onMouseEnter={() => setSeleccionado(globalI)}
                                className={cn(
                                  'w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors',
                                  seleccionado === globalI
                                    ? 'bg-marca-300/10 dark:bg-marca-300/10'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                )}
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                    {resultado.titulo}
                                  </p>
                                  {resultado.subtitulo && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                      {resultado.subtitulo}
                                    </p>
                                  )}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Footer con atajos */}
                <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-700 flex items-center gap-4 text-xs text-slate-400">
                  <span><kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">↑↓</kbd> navegar</span>
                  <span><kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">↵</kbd> abrir</span>
                  <span><kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">Esc</kbd> cerrar</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
