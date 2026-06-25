'use client'
// src/components/agenda/AgendaContenido.tsx
// Calendario mensual/semanal + lista de citas

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Plus, Loader2, Calendar, Clock, User } from 'lucide-react'
import { cn, formatearMonto } from '@/lib/utils'
import { useToast } from '@/components/ui/Toaster'

interface Cita {
  id: string
  titulo: string
  descripcion: string | null
  fechaInicio: string
  fechaFin: string | null
  clienteId: string | null
  cliente: { id: string; nombre: string } | null
  vendedor: { nombre: string } | null
  meetUrl: string | null
  tipo: string
}

interface FormCita {
  titulo: string
  descripcion: string
  fechaInicio: string
  fechaFin: string
  clienteId: string
  tipo: string
}

const HORAS = Array.from({ length: 9 }, (_, i) => `${9 + i}:00`)

export function AgendaContenido() {
  const { agregar } = useToast()
  const [citas, setCitas] = useState<Cita[]>([])
  const [cargando, setCargando] = useState(true)
  const [vista, setVista] = useState<'mes' | 'semana' | 'lista'>('mes')
  const [fechaBase, setFechaBase] = useState(new Date())
  const [mostrarForm, setMostrarForm] = useState(false)
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState<FormCita>({
    titulo: 'Visita a cliente',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    clienteId: '',
    tipo: 'VISITA',
  })
  const [clientes, setClientes] = useState<{ id: string; nombre: string }[]>([])

  const cargar = async () => {
    setCargando(true)
    try {
      const mes = fechaBase.getMonth() + 1
      const anio = fechaBase.getFullYear()
      const res = await fetch(`/api/citas?mes=${mes}&anio=${anio}`)
      const data = await res.json()
      if (data.ok) setCitas(data.data || [])
    } catch {
      agregar({ tipo: 'error', titulo: 'Error al cargar citas', mensaje: '' })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [fechaBase])

  useEffect(() => {
    fetch('/api/clientes?limite=100')
      .then(r => r.json())
      .then(d => { if (d.ok) setClientes(d.data || []) })
  }, [])

  const abrirForm = (fecha?: string) => {
    const hoy = fecha || new Date().toISOString().slice(0, 16)
    setForm(prev => ({
      ...prev,
      fechaInicio: hoy,
      fechaFin: hoy.slice(0, 11) + '09:30',
    }))
    setFechaSeleccionada(fecha || null)
    setMostrarForm(true)
  }

  const guardarCita = async () => {
    if (!form.titulo || !form.fechaInicio) {
      agregar({ tipo: 'error', titulo: 'Faltan datos', mensaje: 'Pon tÃƒÂ­tulo y fecha' })
      return
    }
    setGuardando(true)
    try {
      const res = await fetch('/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.ok) {
        setMostrarForm(false)
        cargar()
        agregar({ tipo: 'exito', titulo: 'Cita agendada Ã¢Å“â€œ', mensaje: '' })
        if (data.data?.meetUrl) {
          agregar({ tipo: 'exito', titulo: 'Ã°Å¸Å½Â¥ Google Meet creado', mensaje: data.data.meetUrl })
        }
      } else {
        agregar({ tipo: 'error', titulo: data.mensaje || 'Error al guardar', mensaje: '' })
      }
    } finally {
      setGuardando(false)
    }
  }

  // GeneraciÃƒÂ³n del calendario mensual
  const diasDelMes = () => {
    const anio = fechaBase.getFullYear()
    const mes = fechaBase.getMonth()
    const primerDia = new Date(anio, mes, 1).getDay()
    const diasEnMes = new Date(anio, mes + 1, 0).getDate()
    const dias: (Date | null)[] = Array(primerDia === 0 ? 6 : primerDia - 1).fill(null)
    for (let i = 1; i <= diasEnMes; i++) dias.push(new Date(anio, mes, i))
    return dias
  }

  const citasEnDia = (fecha: Date) =>
    citas.filter(c => {
      const d = new Date(c.fechaInicio)
      return d.getDate() === fecha.getDate() &&
        d.getMonth() === fecha.getMonth() &&
        d.getFullYear() === fecha.getFullYear()
    })

  const hoy = new Date()
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  const irMesAnterior = () => setFechaBase(new Date(fechaBase.getFullYear(), fechaBase.getMonth() - 1, 1))
  const irMesSiguiente = () => setFechaBase(new Date(fechaBase.getFullYear(), fechaBase.getMonth() + 1, 1))

  const set = (campo: keyof FormCita, valor: string) => setForm(prev => ({ ...prev, [campo]: valor }))

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={irMesAnterior} className="p-2 rounded-xl hover:opacity-70 transition-opacity card">
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-lg font-bold px-2">
            {meses[fechaBase.getMonth()]} {fechaBase.getFullYear()}
          </h2>
          <button onClick={irMesSiguiente} className="p-2 rounded-xl hover:opacity-70 transition-opacity card">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {(['mes', 'lista'] as const).map(v => (
            <button
              key={v}
              onClick={() => setVista(v)}
              className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize', vista === v ? '' : 'hover:opacity-70')}
              style={vista === v ? { background: 'var(--color-marca)', color: 'white' } : { background: 'var(--bg-hover)' }}
            >
              {v === 'mes' ? 'Mes' : 'Lista'}
            </button>
          ))}
          <button onClick={() => abrirForm()} className="btn-primario flex items-center gap-2 py-2 px-4">
            <Plus size={16} />
            Nueva cita
          </button>
        </div>
      </div>

      {cargando ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin" style={{ color: 'var(--color-marca)' }} />
        </div>
      ) : vista === 'mes' ? (
        // Vista mensual
        <div className="card overflow-hidden">
          {/* DÃƒÂ­as de la semana */}
          <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--border)' }}>
            {['Lun', 'Mar', 'MiÃƒÂ©', 'Jue', 'Vie', 'SÃƒÂ¡b', 'Dom'].map(d => (
              <div key={d} className="py-2 text-center text-xs font-semibold" style={{ color: 'var(--text-secundario)' }}>
                {d}
              </div>
            ))}
          </div>

          {/* DÃƒÂ­as */}
          <div className="grid grid-cols-7">
            {diasDelMes().map((dia, i) => {
              if (!dia) return <div key={i} className="border-r border-b min-h-[80px]" style={{ borderColor: 'var(--border)', background: 'var(--bg-primario)' }} />
              const esHoy = dia.toDateString() === hoy.toDateString()
              const citasDia = citasEnDia(dia)
              const fechaStr = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}-${String(dia.getDate()).padStart(2, '0')}T09:00`

              return (
                <div
                  key={i}
                  className="border-r border-b min-h-[80px] p-1 cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ borderColor: 'var(--border)', background: esHoy ? 'var(--color-marca)10' : undefined }}
                  onClick={() => abrirForm(fechaStr)}
                >
                  <span
                    className={cn('text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full')}
                    style={esHoy ? { background: 'var(--color-marca)', color: 'white' } : { color: 'var(--text-secundario)' }}
                  >
                    {dia.getDate()}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {citasDia.slice(0, 2).map(c => (
                      <div
                        key={c.id}
                        className="text-xs truncate rounded px-1 py-0.5 font-medium"
                        style={{ background: 'var(--color-marca)', color: 'white', opacity: 0.9 }}
                        onClick={e => { e.stopPropagation() }}
                      >
                        {new Date(c.fechaInicio).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} {c.titulo}
                      </div>
                    ))}
                    {citasDia.length > 2 && (
                      <p className="text-xs" style={{ color: 'var(--text-secundario)' }}>+{citasDia.length - 2} mÃƒÂ¡s</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        // Vista lista
        <div className="space-y-2">
          {citas.length === 0 ? (
            <div className="card p-8 text-center">
              <Calendar size={32} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold">Sin citas este mes</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secundario)' }}>Agenda la primera con el botÃƒÂ³n de arriba.</p>
            </div>
          ) : (
            citas
              .sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime())
              .map(c => {
                const fecha = new Date(c.fechaInicio)
                const pasada = fecha < new Date()
                return (
                  <div key={c.id} className={cn('card p-4 flex items-center gap-4', pasada && 'opacity-60')}>
                    <div className="text-center shrink-0 w-14">
                      <p className="text-xs font-medium" style={{ color: 'var(--color-marca)' }}>
                        {fecha.toLocaleDateString('es-MX', { weekday: 'short' }).toUpperCase()}
                      </p>
                      <p className="text-2xl font-bold">{fecha.getDate()}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{c.titulo}</p>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs" style={{ color: 'var(--text-secundario)' }}>
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {c.cliente && (
                          <Link href={`/clientes/${c.cliente.id}`} className="flex items-center gap-1 hover:underline" style={{ color: 'var(--color-marca)' }}>
                            <User size={11} />
                            {c.cliente.nombre}
                          </Link>
                        )}
                      </div>
                    </div>
                    {c.meetUrl && (
                      <a href={c.meetUrl} target="_blank" rel="noopener noreferrer"
                        className="btn-secundario text-xs py-1.5 px-3 whitespace-nowrap">
                        Ã°Å¸Å½Â¥ Meet
                      </a>
                    )}
                  </div>
                )
              })
          )}
        </div>
      )}

      {/* Modal nueva cita */}
      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold">Nueva cita</h3>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">TÃƒÂ­tulo</label>
                <input className="campo w-full" value={form.titulo} onChange={e => set('titulo', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Inicio</label>
                  <input type="datetime-local" className="campo w-full" value={form.fechaInicio} onChange={e => set('fechaInicio', e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Fin</label>
                  <input type="datetime-local" className="campo w-full" value={form.fechaFin} onChange={e => set('fechaFin', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Cliente (opcional)</label>
                <select className="campo w-full" value={form.clienteId} onChange={e => set('clienteId', e.target.value)}>
                  <option value="">Sin cliente asignado</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Tipo</label>
                <select className="campo w-full" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                  <option value="VISITA">Visita presencial</option>
                  <option value="LLAMADA">Llamada</option>
                  <option value="VIDEO">Videollamada</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Notas</label>
                <textarea className="campo w-full h-20 resize-none" value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Detalles de la cita..." />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setMostrarForm(false)} className="btn-secundario flex-1">Cancelar</button>
              <button onClick={guardarCita} disabled={guardando} className="btn-primario flex-1">
                {guardando ? 'GuardandoÃ¢â‚¬Â¦' : 'Agendar cita'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
