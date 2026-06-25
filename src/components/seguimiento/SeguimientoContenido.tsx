'use client'
// src/components/seguimiento/SeguimientoContenido.tsx
// "Hoy te toca" + acciones vencidas + leads frÃ­os + recordatorios

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, Clock, Flame, Snowflake, CheckCircle, Loader2, Bell, ChevronRight } from 'lucide-react'
import { cn, formatearFechaCorta, formatearMonto, TEMPERATURA_CONFIG } from '@/lib/utils'
import { useToast } from '@/components/ui/Toaster'

interface ClienteSeguimiento {
  id: string
  nombre: string
  telefono: string | null
  temperatura: string
  etapaEmbudo: string
  proximaAccion: string | null
  proximaAccionFecha: string | null
  valorEstimado: number | null
  diasSinContacto: number | null
  esNuevo: boolean
  horasDesdeCreacion: number | null
}

interface Recordatorio {
  id: string
  texto: string
  fecha: string
  hora: string | null
  clienteId: string
  clienteNombre: string
}

export function SeguimientoContenido() {
  const { agregar } = useToast()
  const [datos, setDatos] = useState<{
    hoyToca: ClienteSeguimiento[]
    vencidos: ClienteSeguimiento[]
    leadsFrios: ClienteSeguimiento[]
    recordatorios: Recordatorio[]
    sinAccion: number
    enRiesgo: number
  } | null>(null)
  const [cargando, setCargando] = useState(true)
  const [tab, setTab] = useState<'hoy' | 'vencidos' | 'frios' | 'recordatorios'>('hoy')

  const cargar = async () => {
    setCargando(true)
    try {
      const res = await fetch('/api/seguimiento')
      const data = await res.json()
      if (data.ok) setDatos(data.data)
    } catch {
      agregar({ tipo: 'error', titulo: 'Error al cargar', mensaje: '' })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const completarRecordatorio = async (id: string) => {
    await fetch(`/api/seguimiento?recordatorioId=${id}`, { method: 'PATCH' })
    cargar()
    agregar({ tipo: 'exito', titulo: 'Recordatorio completado âœ“', mensaje: '' })
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-marca)' }} />
      </div>
    )
  }

  if (!datos) return null

  const TABS = [
    { key: 'hoy', label: 'Hoy te toca', count: datos.hoyToca.length, icon: Flame, color: 'text-orange-500' },
    { key: 'vencidos', label: 'Vencidos', count: datos.vencidos.length, icon: AlertTriangle, color: 'text-red-500' },
    { key: 'frios', label: 'Leads frÃ­os', count: datos.leadsFrios.length, icon: Snowflake, color: 'text-blue-400' },
    { key: 'recordatorios', label: 'Recordatorios', count: datos.recordatorios.length, icon: Bell, color: '' },
  ] as const

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold" style={{ color: 'var(--color-marca)' }}>{datos.hoyToca.length}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secundario)' }}>Para contactar hoy</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-red-500">{datos.vencidos.length}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secundario)' }}>Acciones vencidas</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-blue-400">{datos.leadsFrios.length}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secundario)' }}>Leads frÃ­os</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-orange-500">{datos.enRiesgo}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secundario)' }}>En riesgo</p>
        </div>
      </div>

      {/* Alerta sin acciÃ³n */}
      {datos.sinAccion > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl text-sm bg-orange-500/10 text-orange-600">
          <AlertTriangle size={16} />
          <span><strong>{datos.sinAccion} clientes activos</strong> no tienen prÃ³xima acciÃ³n â€” ponles una para que no se enfrÃ­en.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-card)' }}>
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all',
                tab === t.key ? 'shadow-sm' : 'hover:opacity-80'
              )}
              style={tab === t.key ? { background: 'var(--color-marca)', color: 'white' } : { color: 'var(--text-secundario)' }}
            >
              <Icon size={13} className={tab === t.key ? '' : t.color} />
              <span className="hidden sm:inline">{t.label}</span>
              {t.count > 0 && (
                <span className={cn('rounded-full w-5 h-5 flex items-center justify-center text-xs', tab === t.key ? 'bg-white/20' : 'bg-white/10')}>
                  {t.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Contenido del tab */}
      {tab === 'hoy' && (
        <div className="space-y-2">
          {datos.hoyToca.length === 0 ? (
            <div className="card p-8 text-center">
              <CheckCircle size={32} className="mx-auto mb-3 text-green-500" />
              <p className="font-semibold">Â¡Hoy no tienes pendientes! ðŸŽ‰</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secundario)' }}>Excelente trabajo de seguimiento.</p>
            </div>
          ) : (
            datos.hoyToca.map(c => <TarjetaSeguimiento key={c.id} cliente={c} />)
          )}
        </div>
      )}

      {tab === 'vencidos' && (
        <div className="space-y-2">
          {datos.vencidos.length === 0 ? (
            <EmptyState mensaje="Sin acciones vencidas" sub="Â¡Vas al dÃ­a!" />
          ) : (
            datos.vencidos.map(c => <TarjetaSeguimiento key={c.id} cliente={c} vencido />)
          )}
        </div>
      )}

      {tab === 'frios' && (
        <div className="space-y-2">
          {datos.leadsFrios.length === 0 ? (
            <EmptyState mensaje="Sin leads frÃ­os" sub="Todos tus prospectos estÃ¡n activos." />
          ) : (
            datos.leadsFrios.map(c => <TarjetaSeguimiento key={c.id} cliente={c} frio />)
          )}
        </div>
      )}

      {tab === 'recordatorios' && (
        <div className="space-y-2">
          {datos.recordatorios.length === 0 ? (
            <EmptyState mensaje="Sin recordatorios" sub="Cuando agregues recordatorios a tus clientes aparecerÃ¡n aquÃ­." />
          ) : (
            datos.recordatorios.map(r => (
              <div key={r.id} className="card p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">{r.texto}</p>
                  <Link href={`/clientes/${r.clienteId}`} className="text-xs hover:underline" style={{ color: 'var(--color-marca)' }}>
                    {r.clienteNombre}
                  </Link>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secundario)' }}>
                    {formatearFechaCorta(r.fecha)} {r.hora && `a las ${r.hora}`}
                  </p>
                </div>
                <button
                  onClick={() => completarRecordatorio(r.id)}
                  className="btn-secundario text-xs py-1.5 px-3 whitespace-nowrap"
                >
                  âœ“ Hecho
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function TarjetaSeguimiento({
  cliente: c,
  vencido = false,
  frio = false,
}: {
  cliente: ClienteSeguimiento
  vencido?: boolean
  frio?: boolean
}) {
  const temp = TEMPERATURA_CONFIG[c.temperatura as keyof typeof TEMPERATURA_CONFIG]
  const tel = c.telefono?.replace(/\D/g, '')
  const whatsapp = tel ? `https://wa.me/52${tel}?text=Hola%20${encodeURIComponent(c.nombre)}%2C%20soy%20de%20Techos%20y%20Cubiertas.%20` : null

  return (
    <div className={cn('card p-4 flex items-center justify-between gap-3', vencido && 'border-red-500/30')}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/clientes/${c.id}`} className="font-semibold hover:underline truncate" style={{ cursor: 'pointer' }}>
            {c.nombre}
          </Link>
          <span className="text-xs">{temp?.emoji}</span>
          {c.esNuevo && c.horasDesdeCreacion && c.horasDesdeCreacion > 24 && (
            <span className="text-xs text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
              <AlertTriangle size={10} /> Lead frÃ­o por demora
            </span>
          )}
        </div>
        <p className="text-sm mt-1 truncate" style={{ color: 'var(--text-secundario)' }}>
          {vencido && <span className="text-red-500 font-medium">Vencida: </span>}
          {frio && <span className="text-blue-400 font-medium">Sin contacto {c.diasSinContacto}d: </span>}
          {c.proximaAccion || c.etapaEmbudo}
          {c.proximaAccionFecha && ` Â· ${formatearFechaCorta(c.proximaAccionFecha)}`}
        </p>
        {c.valorEstimado && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-marca)' }}>{formatearMonto(c.valorEstimado)}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primario text-xs py-2 px-3"
          >
            WhatsApp
          </a>
        )}
        <Link href={`/clientes/${c.id}`} className="p-2 rounded-lg hover:opacity-70 transition-opacity">
          <ChevronRight size={16} style={{ color: 'var(--text-secundario)' }} />
        </Link>
      </div>
    </div>
  )
}

function EmptyState({ mensaje, sub }: { mensaje: string; sub: string }) {
  return (
    <div className="card p-8 text-center">
      <CheckCircle size={32} className="mx-auto mb-3 text-green-500" />
      <p className="font-semibold">{mensaje}</p>
      <p className="text-sm mt-1" style={{ color: 'var(--text-secundario)' }}>{sub}</p>
    </div>
  )
}
