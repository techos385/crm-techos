'use client'
// src/components/clientes/ClientesEstado.tsx
// Vista de clientes Ganados, Perdidos o Archivados

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trophy, XCircle, Archive, RefreshCw, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn, formatearFechaCorta, formatearMonto } from '@/lib/utils'
import { useToast } from '@/components/ui/Toaster'

const CONFIG = {
  GANADO: {
    titulo: 'Clientes Completados',
    subtitulo: 'Tu muro de victorias',
    icono: Trophy,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    badge: 'Completado âœ…',
    vacio: 'AÃºn no tienes clientes completados â€” cierra tu primera venta y aparecerÃ¡ aquÃ­ ðŸŽ‰',
  },
  PERDIDO: {
    titulo: 'Clientes Perdidos',
    subtitulo: 'Aprende por quÃ© y reactiva',
    icono: XCircle,
    color: 'text-gray-500',
    bg: 'bg-gray-500/10',
    badge: 'Perdido âœ—',
    vacio: 'No hay clientes perdidos â€” Â¡sigue asÃ­!',
  },
  ARCHIVADO: {
    titulo: 'Clientes Archivados',
    subtitulo: 'Guardados sin perder nada',
    icono: Archive,
    color: 'text-stone-500',
    bg: 'bg-stone-500/10',
    badge: 'Archivado ðŸ“',
    vacio: 'No hay nada archivado',
  },
}

interface Props {
  estado: 'GANADO' | 'PERDIDO' | 'ARCHIVADO'
}

export function ClientesEstado({ estado }: Props) {
  const cfg = CONFIG[estado]
  const Icono = cfg.icono
  const { agregar } = useToast()

  const [clientes, setClientes] = useState<Array<{
    id: string; nombre: string; empresa: string | null; valorEstimado: number | null
    origen: string | null; motivoPerdida: string | null; etapaEmbudo: string | null
    ganandoEn: string | null; perdiendoEn: string | null
  }>>([])
  const [cargando, setCargando] = useState(true)
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)

  const cargar = async () => {
    setCargando(true)
    try {
      const res = await fetch(`/api/clientes?estado=${estado}&pagina=${pagina}&porPagina=20`)
      const data = await res.json()
      if (data.ok) {
        setClientes(data.data.clientes)
        setTotal(data.data.total)
        setTotalPaginas(data.data.totalPaginas)
      }
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [pagina, estado])

  const reactivar = async (id: string, nombre: string) => {
    try {
      const res = await fetch(`/api/clientes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estadoCartera: 'ACTIVO',
          etapaEmbudo: 'Nuevo Prospecto',
          proximaAccion: 'Reactivar contacto',
          proximaAccionFecha: new Date(Date.now() + 86400000).toISOString(),
        }),
      })
      if ((await res.json()).ok) {
        agregar({ tipo: 'exito', titulo: `${nombre} reactivado`, mensaje: 'Aparece en el embudo como Nuevo.' })
        cargar()
      }
    } catch {
      agregar({ tipo: 'error', titulo: 'Error', mensaje: 'No se pudo reactivar' })
    }
  }

  const restaurar = async (id: string, nombre: string) => {
    try {
      const res = await fetch(`/api/clientes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estadoCartera: 'ACTIVO' }),
      })
      if ((await res.json()).ok) {
        agregar({ tipo: 'exito', titulo: `${nombre} restaurado`, mensaje: 'Aparece de nuevo como activo.' })
        cargar()
      }
    } catch {
      agregar({ tipo: 'error', titulo: 'Error', mensaje: 'No se pudo restaurar' })
    }
  }

  // Total de valor en este estado
  const totalValor = clientes.reduce((s, c) => s + (c.valorEstimado ?? 0), 0)

  return (
    <div className="space-y-6">
      <div className="seccion-header">
        <div className="flex items-center gap-3">
          <div className={cn('p-2.5 rounded-xl', cfg.bg, cfg.color)}>
            <Icono size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{cfg.titulo}</h1>
            <p className="text-sm" style={{ color: 'var(--text-secundario)' }}>{cfg.subtitulo}</p>
          </div>
        </div>
        <button onClick={cargar} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} style={{ color: 'var(--text-secundario)' }} />
        </button>
      </div>

      {/* Stats rÃ¡pidos */}
      {total > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4">
            <p className="text-sm" style={{ color: 'var(--text-secundario)' }}>Total</p>
            <p className="text-2xl font-bold">{total}</p>
          </div>
          {totalValor > 0 && (
            <div className="card p-4">
              <p className="text-sm" style={{ color: 'var(--text-secundario)' }}>Valor total</p>
              <p className="text-2xl font-bold">{formatearMonto(totalValor)}</p>
            </div>
          )}
        </div>
      )}

      {/* Lista */}
      {cargando ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
      ) : clientes.length === 0 ? (
        <div className="empty-state">
          <Icono size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">{cfg.vacio}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {clientes.map((c) => (
            <div key={c.id} className="card p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <Link href={`/clientes/${c.id}`} className="nombre-cliente font-semibold">
                    {c.nombre}
                  </Link>
                  {c.empresa && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secundario)' }}>{c.empresa}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-1">
                    {c.valorEstimado && (
                      <span className="text-sm font-medium text-green-600">${c.valorEstimado.toLocaleString('es-MX')}</span>
                    )}
                    {estado === 'PERDIDO' && c.motivoPerdida && (
                      <span className="badge text-xs">Motivo: {c.motivoPerdida}</span>
                    )}
                    {c.ganandoEn && estado === 'GANADO' && (
                      <span className="text-xs" style={{ color: 'var(--text-secundario)' }}>
                        Cerrado el {formatearFechaCorta(c.ganandoEn)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('badge text-xs', cfg.color)}>{cfg.badge}</span>
                  <button
                    onClick={() => estado === 'ARCHIVADO' ? restaurar(c.id, c.nombre) : reactivar(c.id, c.nombre)}
                    className="btn-secundario text-xs py-1.5 px-3 flex items-center gap-1.5"
                    title="Reactivar este cliente"
                  >
                    <RotateCcw size={13} />
                    Reactivar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina === 1} className="btn-secundario p-2 disabled:opacity-40">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm" style={{ color: 'var(--text-secundario)' }}>PÃ¡gina {pagina} de {totalPaginas}</span>
          <button onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas} className="btn-secundario p-2 disabled:opacity-40">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
