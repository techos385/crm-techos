'use client'
// src/app/agenda/[slug]/AgendaPublica.tsx

import { useState } from 'react'
import { CheckCircle, Calendar, Phone, User, MessageCircle } from 'lucide-react'

interface Props { slug: string }

const HORARIOS = ['09:00', '10:00', '11:00', '12:00', '13:00', '15:00', '16:00', '17:00', '18:00']

function obtenerNombre(slug: string) {
  return slug.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
}

export function AgendaPublica({ slug }: Props) {
  const nombreVendedor = obtenerNombre(slug)
  const [paso, setPaso] = useState(1)
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [form, setForm] = useState({ nombre: '', telefono: '', tipoObra: '', notas: '' })
  const [enviando, setEnviando] = useState(false)
  const [confirmacion, setConfirmacion] = useState(false)
  const [error, setError] = useState('')

  const hoy = new Date().toISOString().slice(0, 10)

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const confirmar = async () => {
    if (!form.nombre || !form.telefono) {
      setError('Nombre y teléfono son obligatorios')
      return
    }
    setError('')
    setEnviando(true)
    try {
      // 1. Crear cliente
      const resCliente = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre,
          telefono: form.telefono,
          tipoObra: form.tipoObra,
          origen: 'Agenda pública',
          notas: `Agenda: ${fecha} ${hora}. Vendedor: ${nombreVendedor}. ${form.notas}`,
        }),
      })
      const clienteData = await resCliente.json()
      if (!clienteData.ok) throw new Error(clienteData.mensaje)

      // 2. Crear cita
      const fechaInicio = new Date(`${fecha}T${hora}:00`)
      const fechaFin = new Date(fechaInicio.getTime() + 60 * 60 * 1000)
      await fetch('/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: `Visita a ${form.nombre}`,
          descripcion: form.tipoObra ? `Tipo de obra: ${form.tipoObra}` : null,
          fechaInicio: fechaInicio.toISOString(),
          fechaFin: fechaFin.toISOString(),
          clienteId: clienteData.data.id,
          tipo: 'VISITA',
        }),
      })

      setConfirmacion(true)
    } catch {
      setError('Ocurrió un error. Por favor intenta de nuevo o escríbenos por WhatsApp.')
    } finally {
      setEnviando(false)
    }
  }

  if (confirmacion) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-primario)' }}>
        <div className="max-w-sm w-full text-center space-y-4">
          <CheckCircle size={64} className="mx-auto text-green-500" />
          <h1 className="text-2xl font-bold">¡Visita agendada!</h1>
          <div className="card p-4 text-left space-y-2">
            <p className="text-sm"><strong>Fecha:</strong> {new Date(fecha + 'T12:00').toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="text-sm"><strong>Hora:</strong> {hora}</p>
            <p className="text-sm"><strong>Asesor:</strong> {nombreVendedor}</p>
            <p className="text-sm"><strong>Cliente:</strong> {form.nombre}</p>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secundario)' }}>
            Te confirmaremos por WhatsApp al número {form.telefono}. ¡Hasta entonces!
          </p>
          <a
            href={`https://wa.me/527712345678?text=Hola%2C%20agendé%20una%20visita%20para%20el%20${encodeURIComponent(fecha)}%20a%20las%20${hora}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 py-3 px-6 rounded-xl text-white font-medium"
            style={{ background: 'var(--color-marca)' }}
          >
            <MessageCircle size={18} />
            Confirmar por WhatsApp
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primario)' }}>
      {/* Header */}
      <div className="text-center py-10 px-4" style={{ background: 'linear-gradient(135deg, #7cc2e8 0%, #5ba8d0 100%)' }}>
        <p className="text-white/80 text-sm mb-1">Agenda tu visita con</p>
        <h1 className="text-2xl font-bold text-white">{nombreVendedor}</h1>
        <p className="text-white/80 text-sm mt-1">Techos y Cubiertas · Cotización gratuita</p>
      </div>

      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        {/* Paso 1: Fecha y hora */}
        {paso === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar size={20} style={{ color: 'var(--color-marca)' }} />
              Elige fecha y hora
            </h2>
            <div>
              <label className="text-sm font-medium block mb-1">Fecha de la visita</label>
              <input
                type="date"
                className="campo w-full"
                min={hoy}
                value={fecha}
                onChange={e => setFecha(e.target.value)}
              />
            </div>
            {fecha && (
              <div>
                <label className="text-sm font-medium block mb-2">Hora disponible</label>
                <div className="grid grid-cols-3 gap-2">
                  {HORARIOS.map(h => (
                    <button
                      key={h}
                      onClick={() => setHora(h)}
                      className="py-3 rounded-xl text-sm font-medium transition-all border"
                      style={hora === h
                        ? { background: 'var(--color-marca)', color: 'white', borderColor: 'var(--color-marca)' }
                        : { borderColor: 'var(--border)' }
                      }
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {fecha && hora && (
              <button onClick={() => setPaso(2)} className="btn-primario w-full">
                Continuar →
              </button>
            )}
          </div>
        )}

        {/* Paso 2: Datos del cliente */}
        {paso === 2 && (
          <div className="space-y-4">
            <button onClick={() => setPaso(1)} className="text-sm opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1">
              ← Cambiar fecha/hora
            </button>
            <div className="card p-4">
              <p className="text-sm font-medium">📅 {new Date(fecha + 'T12:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })} a las {hora}</p>
            </div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <User size={20} style={{ color: 'var(--color-marca)' }} />
              Tus datos
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">Nombre completo <span className="text-red-500">*</span></label>
                <input className="campo w-full" placeholder="¿Cómo te llamas?" value={form.nombre} onChange={e => set('nombre', e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">WhatsApp <span className="text-red-500">*</span></label>
                <input className="campo w-full" type="tel" placeholder="55 1234 5678" value={form.telefono} onChange={e => set('telefono', e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">¿Qué necesitas?</label>
                <select className="campo w-full" value={form.tipoObra} onChange={e => set('tipoObra', e.target.value)}>
                  <option value="">Selecciona...</option>
                  <option value="Arcotecho">Arcotecho</option>
                  <option value="Techado metálico">Techado metálico</option>
                  <option value="Cochera">Cochera</option>
                  <option value="Pergola">Pérgola</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Notas adicionales</label>
                <textarea className="campo w-full h-20 resize-none text-sm" placeholder="Ej. medidas aproximadas, si tienes planos..." value={form.notas} onChange={e => set('notas', e.target.value)} />
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button onClick={confirmar} disabled={enviando} className="btn-primario w-full">
              {enviando ? 'Confirmando…' : '✓ Confirmar visita'}
            </button>
            <p className="text-center text-xs" style={{ color: 'var(--text-secundario)' }}>
              🔒 Tus datos son privados y solo se usan para confirmar tu cita.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
