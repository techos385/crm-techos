'use client'
// src/components/clientes/ExpedienteCliente.tsx
// Ficha completa del cliente con timeline, pagos, archivos y acciones

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Phone, Mail, MessageCircle, Edit3, Trash2, Archive, Trophy,
  XCircle, Star, Clock, AlertTriangle, Sparkles, FileUp, DollarSign,
  Calendar, StickyNote, Building2, MapPin, Thermometer, Target, Upload,
  CheckCircle, ExternalLink, X, Save
} from 'lucide-react'
import { cn, formatearFecha, formatearFechaCorta, formatearMonto, TEMPERATURA_CONFIG, generarUrlWhatsApp } from '@/lib/utils'
import { useToast } from '@/components/ui/Toaster'
import { AsistenteIACliente } from '@/components/ai/AsistenteIACliente'
import { PagoFormModal } from '@/components/pagos/PagoFormModal'
import { CelebracionGanado } from '@/components/ui/CelebracionGanado'

interface Props { id: string }

export function ExpedienteCliente({ id }: Props) {
  const router = useRouter()
  const { agregar } = useToast()
  const [cliente, setCliente] = useState<Record<string, unknown> | null>(null)
  const [cargando, setCargando] = useState(true)
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [nuevaNota, setNuevaNota] = useState('')
  const [enviandoNota, setEnviandoNota] = useState(false)
  const [mostrarIA, setMostrarIA] = useState(false)
  const [mostrarPago, setMostrarPago] = useState(false)
  const [celebrar, setCelebrar] = useState(false)
  const [tab, setTab] = useState<'info' | 'timeline' | 'pagos' | 'archivos'>('info')

  // Campos editables
  const [form, setForm] = useState<Record<string, string | number | boolean | null>>({})

  const cargar = async () => {
    setCargando(true)
    try {
      const res = await fetch(`/api/clientes/${id}`)
      const data = await res.json()
      if (data.ok) {
        setCliente(data.data)
        setForm({
          nombre: data.data.nombre,
          telefono: data.data.telefono ?? '',
          correo: data.data.correo ?? '',
          etapaEmbudo: data.data.etapaEmbudo ?? '',
          temperatura: data.data.temperatura,
          objecionPrincipal: data.data.objecionPrincipal ?? '',
          proximaAccion: data.data.proximaAccion ?? '',
          proximaAccionFecha: data.data.proximaAccionFecha
            ? new Date(data.data.proximaAccionFecha).toISOString().slice(0, 16)
            : '',
          valorEstimado: data.data.valorEstimado ?? '',
          notas: data.data.notas ?? '',
          empresa: data.data.empresa ?? '',
          zonaUbicacion: data.data.zonaUbicacion ?? '',
          tipoObra: data.data.tipoObra ?? '',
          medidasProyecto: data.data.medidasProyecto ?? '',
        })
      } else {
        agregar({ tipo: 'error', titulo: 'Cliente no encontrado', mensaje: '' })
        router.push('/clientes')
      }
    } catch {
      agregar({ tipo: 'error', titulo: 'Error al cargar', mensaje: 'Revisa tu conexión' })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [id])

  const guardarCambios = async () => {
    setGuardando(true)
    try {
      const res = await fetch(`/api/clientes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          valorEstimado: form.valorEstimado ? Number(form.valorEstimado) : null,
          proximaAccionFecha: form.proximaAccionFecha || null,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setEditando(false)
        cargar()
        agregar({ tipo: 'exito', titulo: 'Guardado ✓', mensaje: '' })
      }
    } catch {
      agregar({ tipo: 'error', titulo: 'Error al guardar', mensaje: '' })
    } finally {
      setGuardando(false)
    }
  }

  const cambiarEstado = async (nuevoEstado: string, motivoPerdida?: string) => {
    if (nuevoEstado === 'GANADO') {
      setCelebrar(true)
      setTimeout(() => setCelebrar(false), 3000)
    }
    await fetch(`/api/clientes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estadoCartera: nuevoEstado, motivoPerdida }),
    })
    cargar()
  }

  const agregarNota = async () => {
    if (!nuevaNota.trim()) return
    setEnviandoNota(true)
    try {
      const res = await fetch(`/api/clientes/${id}/notas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenido: nuevaNota }),
      })
      if ((await res.json()).ok) {
        setNuevaNota('')
        cargar()
        agregar({ tipo: 'exito', titulo: 'Nota agregada ✓', mensaje: '' })
      }
    } finally {
      setEnviandoNota(false)
    }
  }

  if (cargando) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-12 w-48 rounded-xl" />
        <div className="skeleton h-32 rounded-2xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    )
  }

  if (!cliente) return null

  const c = cliente as Record<string, unknown>
  const temp = TEMPERATURA_CONFIG[c.temperatura as keyof typeof TEMPERATURA_CONFIG]
  const timeline = (c.timeline as Array<{ tipo: string; fecha: string; descripcion: string; autor?: string }>) ?? []
  const pagos = (c.pagos as Array<{ id: string; monto: number; estatus: string; metodo: string; concepto: string | null; fechaPago: string | null }>) ?? []
  const archivos = (c.archivos as Array<{ id: string; nombre: string; tipo: string; etiqueta: string; creadoEn: string; subidoPor: { nombre: string }; tieneArchivo: boolean }>) ?? []
  const resumenPagos = c.resumenPagos as { totalPagado: number; totalPendiente: number; totalValor: number }

  const diasSinContacto = c.ultimoContacto
    ? Math.floor((Date.now() - new Date(c.ultimoContacto as string).getTime()) / (1000 * 60 * 60 * 24))
    : null

  const telefonoWhatsApp = (c.telefono as string)?.replace(/\D/g, '')
  const whatsappUrl = telefonoWhatsApp ? generarUrlWhatsApp(telefonoWhatsApp, `Hola ${c.nombre}, soy de Techos y Cubiertas. `) : null

  const set = (campo: string, valor: string) => setForm((prev) => ({ ...prev, [campo]: valor }))

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {celebrar && <CelebracionGanado nombre={c.nombre as string} valor={c.valorEstimado as number} />}

      {/* Navegación */}
      <div className="flex items-center justify-between">
        <Link href="/clientes" className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity" style={{ color: 'var(--text-secundario)' }}>
          <ArrowLeft size={16} />
          Volver a clientes
        </Link>
        <div className="flex items-center gap-2">
          {editando ? (
            <>
              <button onClick={() => setEditando(false)} className="btn-secundario py-1.5 px-3 text-sm">Cancelar</button>
              <button onClick={guardarCambios} disabled={guardando} className="btn-primario py-1.5 px-3 text-sm flex items-center gap-1.5">
                <Save size={14} />
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </>
          ) : (
            <button onClick={() => setEditando(true)} className="btn-secundario py-1.5 px-3 text-sm flex items-center gap-1.5">
              <Edit3 size={14} /> Editar
            </button>
          )}
        </div>
      </div>

      {/* Encabezado de venta */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
              style={{ background: 'var(--color-marca)', color: 'white' }}>
              {(c.nombre as string).charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{c.nombre as string}</h1>
              {c.empresa && <p className="text-sm mt-0.5" style={{ color: 'var(--text-secundario)' }}>{c.empresa as string}</p>}

              <div className="flex flex-wrap gap-2 mt-2">
                {/* Temperatura */}
                <span className="badge flex items-center gap-1 font-medium">
                  {temp?.emoji} {temp?.label}
                </span>

                {/* Estado */}
                <span className={cn('badge', c.estadoCartera === 'GANADO' ? 'text-green-600' : c.estadoCartera === 'PERDIDO' ? 'text-gray-600' : '')}>
                  {c.estadoCartera === 'ACTIVO' ? '● Activo' : c.estadoCartera === 'GANADO' ? '✅ Completado' : c.estadoCartera === 'PERDIDO' ? '✗ Perdido' : '📁 Archivado'}
                </span>

                {/* Etapa */}
                {c.etapaEmbudo && <span className="badge">{c.etapaEmbudo as string}</span>}
              </div>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="flex flex-col gap-2 shrink-0">
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-primario flex items-center gap-2 py-2 px-3 text-sm">
                <MessageCircle size={14} />
                WhatsApp
              </a>
            )}
            {c.correo && (
              <a href={`mailto:${c.correo}?subject=Seguimiento%20de%20tu%20proyecto&body=Hola%20${c.nombre}%2C`}
                className="btn-secundario flex items-center gap-2 py-2 px-3 text-sm">
                <Mail size={14} />
                Correo
              </a>
            )}
          </div>
        </div>

        {/* Alertas de venta */}
        <div className="mt-4 space-y-2">
          {/* Último contacto */}
          {diasSinContacto !== null && diasSinContacto > 7 && (
            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 rounded-xl p-3">
              <AlertTriangle size={14} />
              <span>Llevas <strong>{diasSinContacto} días</strong> sin contactarlo — ponlo al frente hoy</span>
            </div>
          )}

          {/* Próxima acción vencida */}
          {c.proximaAccionFecha && new Date(c.proximaAccionFecha as string) < new Date() && (
            <div className="flex items-center gap-2 text-sm text-orange-500 bg-orange-500/10 rounded-xl p-3">
              <Clock size={14} />
              <span>Acción vencida: <strong>{c.proximaAccion as string}</strong> — {formatearFechaCorta(c.proximaAccionFecha as string)}</span>
            </div>
          )}

          {/* Objeción */}
          {c.objecionPrincipal && (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secundario)' }}>
              <Target size={14} />
              <span>Objeción: <strong>{c.objecionPrincipal as string}</strong></span>
            </div>
          )}

          {/* Próxima acción */}
          {c.proximaAccion && !(c.proximaAccionFecha && new Date(c.proximaAccionFecha as string) < new Date()) && (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secundario)' }}>
              <CheckCircle size={14} />
              <span>Próxima acción: <strong>{c.proximaAccion as string}</strong>
                {c.proximaAccionFecha && ` — ${formatearFechaCorta(c.proximaAccionFecha as string)}`}
              </span>
            </div>
          )}
        </div>

        {/* Cambios de estado */}
        {c.estadoCartera === 'ACTIVO' && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={() => { if (confirm('¿Marcar como GANADO? Se moverá a Clientes completados.')) cambiarEstado('GANADO') }}
              className="btn-secundario flex items-center gap-1.5 text-sm text-green-600 border-green-600/30"
            >
              <Trophy size={14} /> Marcar como ganado 🎉
            </button>
            <button
              onClick={() => {
                const motivo = prompt('¿Por qué se perdió? (precio / competencia / sin presupuesto / no respondió / otro)')
                if (motivo !== null) cambiarEstado('PERDIDO', motivo)
              }}
              className="btn-secundario flex items-center gap-1.5 text-sm"
            >
              <XCircle size={14} /> Perdido
            </button>
            <button
              onClick={() => { if (confirm(`¿Archivar a ${c.nombre}? Podrás restaurarlo cuando quieras.`)) cambiarEstado('ARCHIVADO') }}
              className="btn-secundario flex items-center gap-1.5 text-sm"
            >
              <Archive size={14} /> Archivar
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-card)' }}>
        {[
          { key: 'info', label: 'Información' },
          { key: 'timeline', label: `Historial (${timeline.length})` },
          { key: 'pagos', label: `Pagos (${pagos.length})` },
          { key: 'archivos', label: `Archivos (${archivos.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={cn(
              'flex-1 text-sm py-2 px-3 rounded-lg transition-all',
              tab === t.key ? 'font-medium shadow-sm' : 'hover:opacity-80'
            )}
            style={tab === t.key ? { background: 'var(--color-marca)', color: 'white' } : { color: 'var(--text-secundario)' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Información */}
      {tab === 'info' && (
        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold">Datos de contacto</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secundario)' }}>Teléfono / WhatsApp</label>
                {editando
                  ? <input className="campo w-full" value={form.telefono as string} onChange={(e) => set('telefono', e.target.value)} />
                  : <p className="font-medium">{c.telefono as string || '—'}</p>
                }
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secundario)' }}>Correo</label>
                {editando
                  ? <input className="campo w-full" type="email" value={form.correo as string} onChange={(e) => set('correo', e.target.value)} />
                  : <p className="font-medium">{c.correo as string || '—'}</p>
                }
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secundario)' }}>Empresa</label>
                {editando
                  ? <input className="campo w-full" value={form.empresa as string} onChange={(e) => set('empresa', e.target.value)} />
                  : <p className="font-medium">{c.empresa as string || '—'}</p>
                }
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secundario)' }}>Zona / Ubicación</label>
                {editando
                  ? <input className="campo w-full" value={form.zonaUbicacion as string} onChange={(e) => set('zonaUbicacion', e.target.value)} />
                  : <p className="font-medium">{c.zonaUbicacion as string || '—'}</p>
                }
              </div>
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <h3 className="font-semibold">Datos del proyecto</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secundario)' }}>Tipo de obra</label>
                {editando
                  ? <input className="campo w-full" value={form.tipoObra as string} onChange={(e) => set('tipoObra', e.target.value)} />
                  : <p className="font-medium">{c.tipoObra as string || '—'}</p>
                }
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secundario)' }}>Medidas del proyecto</label>
                {editando
                  ? <input className="campo w-full" value={form.medidasProyecto as string} onChange={(e) => set('medidasProyecto', e.target.value)} />
                  : <p className="font-medium">{c.medidasProyecto as string || '—'}</p>
                }
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secundario)' }}>Valor estimado (MXN)</label>
                {editando
                  ? <input className="campo w-full" type="number" value={form.valorEstimado as string} onChange={(e) => set('valorEstimado', e.target.value)} />
                  : <p className="font-medium">{c.valorEstimado ? `$${(c.valorEstimado as number).toLocaleString('es-MX')}` : '—'}</p>
                }
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secundario)' }}>Objeción principal</label>
                {editando
                  ? <input className="campo w-full" value={form.objecionPrincipal as string} onChange={(e) => set('objecionPrincipal', e.target.value)} />
                  : <p className="font-medium">{c.objecionPrincipal as string || '—'}</p>
                }
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="card p-5">
            <h3 className="font-semibold mb-3">Notas</h3>
            {editando ? (
              <textarea
                className="campo w-full h-28 resize-none"
                value={form.notas as string}
                onChange={(e) => set('notas', e.target.value)}
              />
            ) : (
              <p className="text-sm whitespace-pre-wrap" style={{ color: c.notas ? undefined : 'var(--text-secundario)' }}>
                {c.notas as string || 'Sin notas'}
              </p>
            )}

            {!editando && (
              <div className="mt-4 flex gap-2">
                <textarea
                  placeholder="Agregar nota de interacción…"
                  value={nuevaNota}
                  onChange={(e) => setNuevaNota(e.target.value)}
                  className="campo flex-1 h-20 resize-none text-sm"
                  onKeyDown={(e) => { if (e.ctrlKey && e.key === 'Enter') agregarNota() }}
                />
                <button
                  onClick={agregarNota}
                  disabled={!nuevaNota.trim() || enviandoNota}
                  className="btn-primario self-end disabled:opacity-40 px-4"
                >
                  {enviandoNota ? '…' : 'Agregar'}
                </button>
              </div>
            )}
          </div>

          {/* Asistente IA */}
          <div className="card p-4">
            <button
              onClick={() => setMostrarIA(!mostrarIA)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={18} style={{ color: 'var(--color-marca)' }} />
                <span className="font-medium">Asistente IA</span>
                <span className="text-xs badge">Tu copiloto de ventas</span>
              </div>
              <span className="text-xs" style={{ color: 'var(--text-secundario)' }}>{mostrarIA ? '▲ Cerrar' : '▼ Abrir'}</span>
            </button>
            {mostrarIA && <AsistenteIACliente clienteId={id} clienteNombre={c.nombre as string} />}
          </div>
        </div>
      )}

      {/* Tab: Timeline */}
      {tab === 'timeline' && (
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold">Historial de interacciones</h3>
          {timeline.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-secundario)' }}>Sin historial aún</p>
          ) : (
            <div className="space-y-3">
              {timeline.map((evento, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: 'var(--color-marca)' }} />
                  <div>
                    <p>{evento.descripcion}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secundario)' }}>
                      {formatearFecha(evento.fecha)}
                      {evento.autor && ` — ${evento.autor}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Pagos */}
      {tab === 'pagos' && (
        <div className="space-y-4">
          {resumenPagos && resumenPagos.totalValor > 0 && (
            <div className="card p-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm">Cobrado</span>
                <span className="font-semibold text-green-600">{formatearMonto(resumenPagos.totalPagado)}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                <div
                  className="h-2 rounded-full bg-green-500 transition-all"
                  style={{ width: `${Math.min(100, (resumenPagos.totalPagado / resumenPagos.totalValor) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs" style={{ color: 'var(--text-secundario)' }}>
                <span>Total: {formatearMonto(resumenPagos.totalValor)}</span>
                <span>Falta: {formatearMonto(resumenPagos.totalPendiente)}</span>
              </div>
            </div>
          )}

          <button onClick={() => setMostrarPago(true)} className="btn-primario w-full flex items-center justify-center gap-2">
            <DollarSign size={16} /> Registrar pago
          </button>

          {pagos.length === 0 ? (
            <p className="text-center text-sm py-8" style={{ color: 'var(--text-secundario)' }}>Sin pagos registrados</p>
          ) : (
            <div className="space-y-2">
              {pagos.map((pago) => (
                <div key={pago.id} className="card p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{formatearMonto(pago.monto)}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secundario)' }}>
                      {pago.metodo} · {pago.concepto ?? 'Sin concepto'}
                      {pago.fechaPago && ` · ${formatearFechaCorta(pago.fechaPago)}`}
                    </p>
                  </div>
                  <span className={cn('badge text-xs', pago.estatus === 'PAGADO' ? 'text-green-600' : pago.estatus === 'VENCIDO' ? 'text-red-600' : '')}>
                    {pago.estatus === 'PAGADO' ? '✅ Pagado' : pago.estatus === 'VENCIDO' ? '⚠️ Vencido' : '⏳ Pendiente'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Archivos */}
      {tab === 'archivos' && (
        <div className="space-y-4">
          <SubidaArchivos clienteId={id} onSubido={cargar} />
          {archivos.length === 0 ? (
            <p className="text-center text-sm py-8" style={{ color: 'var(--text-secundario)' }}>Sin archivos subidos</p>
          ) : (
            <div className="space-y-2">
              {archivos.map((a) => (
                <div key={a.id} className="card p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{a.nombre}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secundario)' }}>
                      {a.etiqueta} · {formatearFechaCorta(a.creadoEn)} · por {a.subidoPor.nombre}
                    </p>
                  </div>
                  {a.tieneArchivo && (
                    <a href={`/api/archivos?id=${a.id}`} target="_blank" className="btn-secundario text-xs py-1.5 px-3">
                      Descargar
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal pago */}
      {mostrarPago && (
        <PagoFormModal
          clienteId={id}
          onCerrar={() => setMostrarPago(false)}
          onGuardado={() => { setMostrarPago(false); cargar() }}
        />
      )}
    </div>
  )
}

// Sub-componente de subida de archivos
function SubidaArchivos({ clienteId, onSubido }: { clienteId: string; onSubido: () => void }) {
  const { agregar } = useToast()
  const [subiendo, setSubiendo] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const [etiqueta, setEtiqueta] = useState('Otro')

  const subir = async (archivo: File) => {
    if (!archivo) return
    setSubiendo(true)
    setProgreso(10)
    try {
      const fd = new FormData()
      fd.append('archivo', archivo)
      fd.append('clienteId', clienteId)
      fd.append('etiqueta', etiqueta)
      setProgreso(40)
      const res = await fetch('/api/archivos', { method: 'POST', body: fd })
      setProgreso(90)
      const data = await res.json()
      if (data.ok) {
        agregar({ tipo: 'exito', titulo: 'Archivo guardado ✓', mensaje: archivo.name })
        onSubido()
      } else {
        agregar({ tipo: 'error', titulo: 'Error al subir', mensaje: data.mensaje })
      }
    } catch {
      agregar({ tipo: 'error', titulo: 'Error de conexión', mensaje: 'No se pudo subir el archivo' })
    } finally {
      setSubiendo(false)
      setProgreso(0)
    }
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Subir archivo</h4>
        <select value={etiqueta} onChange={(e) => setEtiqueta(e.target.value)} className="campo text-sm py-1.5">
          <option value="Comprobante">Comprobante</option>
          <option value="Contrato">Contrato</option>
          <option value="Cotización">Cotización</option>
          <option value="Identificación">Identificación</option>
          <option value="Otro">Otro</option>
        </select>
      </div>
      <label className={cn(
        'flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all',
        subiendo ? 'border-[var(--color-marca)] bg-[var(--color-marca)]/5' : 'border-white/20 hover:border-[var(--color-marca)]/50'
      )}>
        <Upload size={24} className="mb-2 opacity-60" />
        <p className="text-sm font-medium">{subiendo ? 'Subiendo…' : 'Toca o arrastra un archivo'}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-secundario)' }}>PDF, JPG, PNG — máx. 5MB</p>
        {!subiendo && (
          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) subir(e.target.files[0]) }} />
        )}
      </label>
      {subiendo && (
        <div className="w-full bg-white/10 rounded-full h-2">
          <div className="h-2 rounded-full bg-[var(--color-marca)] transition-all" style={{ width: `${progreso}%` }} />
        </div>
      )}
    </div>
  )
}
