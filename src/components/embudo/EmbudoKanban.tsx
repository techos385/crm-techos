'use client'
// src/components/embudo/EmbudoKanban.tsx
// Tablero Kanban drag & drop con dnd-kit

import { useState, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDroppable } from '@dnd-kit/core'
import Link from 'next/link'
import { AlertTriangle, Clock, Flame, Loader2, Trophy, XCircle, Archive } from 'lucide-react'
import { cn, formatearMonto, TEMPERATURA_CONFIG, ETAPAS_EMBUDO } from '@/lib/utils'
import { useToast } from '@/components/ui/Toaster'

interface ClienteKanban {
  id: string
  nombre: string
  etapaEmbudo: string
  temperatura: string
  valorEstimado: number | null
  proximaAccion: string | null
  proximaAccionFecha: string | null
  estadoCartera: string
  diasEnEtapa: number
}

// Columna droppable
function Columna({
  etapa,
  clientes,
  total,
}: {
  etapa: string
  clientes: ClienteKanban[]
  total: number
}) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col rounded-2xl min-h-[200px] min-w-[260px] transition-all',
        isOver ? 'ring-2' : ''
      )}
      style={{
        background: isOver ? 'var(--color-marca)10' : 'var(--bg-card)',
        border: '1px solid var(--border)',
        ringColor: 'var(--color-marca)',
      }}
    >
      {/* Header de columna */}
      <div className="px-3 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm truncate">{etapa}</h3>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-hover)' }}>
            {clientes.length}
          </span>
        </div>
        {total > 0 && (
          <p className="text-xs mt-1" style={{ color: 'var(--color-marca)' }}>
            {formatearMonto(total)}
          </p>
        )}
      </div>

      {/* Tarjetas */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[60vh]">
        <SortableContext items={clientes.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {clientes.map(c => (
            <TarjetaCliente key={c.id} cliente={c} />
          ))}
        </SortableContext>
        {clientes.length === 0 && (
          <p className="text-xs text-center py-4 opacity-40">Arrastra aquÃƒÂ­</p>
        )}
      </div>
    </div>
  )
}

// Tarjeta de cliente sortable
function TarjetaCliente({ cliente: c, overlay = false }: { cliente: ClienteKanban; overlay?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: c.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const temp = TEMPERATURA_CONFIG[c.temperatura as keyof typeof TEMPERATURA_CONFIG]
  const accionVencida = c.proximaAccionFecha && new Date(c.proximaAccionFecha) < new Date()
  const estancado = c.diasEnEtapa >= 7

  return (
    <div
      ref={setNodeRef}
      style={overlay ? undefined : style}
      {...attributes}
      {...listeners}
      className={cn(
        'rounded-xl p-3 cursor-grab active:cursor-grabbing select-none transition-all',
        'hover:shadow-md hover:-translate-y-0.5',
        isDragging ? 'shadow-xl' : ''
      )}
      style={{ background: 'var(--bg-primario)', border: '1px solid var(--border)', ...(!overlay ? style : {}) }}
    >
      {/* Nombre clicable */}
      <Link
        href={`/clientes/${c.id}`}
        onClick={e => e.stopPropagation()}
        className="font-medium text-sm hover:underline block truncate"
        style={{ cursor: 'pointer' }}
      >
        {c.nombre}
      </Link>

      {/* Temperatura + valor */}
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-xs">{temp?.emoji} {temp?.label}</span>
        {c.valorEstimado && (
          <span className="text-xs font-medium" style={{ color: 'var(--color-marca)' }}>
            {formatearMonto(c.valorEstimado)}
          </span>
        )}
      </div>

      {/* Badges de alerta */}
      <div className="flex flex-wrap gap-1 mt-2">
        {accionVencida && (
          <span className="text-xs flex items-center gap-1 text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full">
            <AlertTriangle size={10} /> Vencida
          </span>
        )}
        {estancado && (
          <span className="text-xs flex items-center gap-1 bg-orange-500/10 text-orange-500 px-1.5 py-0.5 rounded-full">
            <Clock size={10} /> {c.diasEnEtapa}d sin avanzar
          </span>
        )}
      </div>
    </div>
  )
}

export function EmbudoKanban() {
  const { agregar } = useToast()
  const [clientes, setClientes] = useState<ClienteKanban[]>([])
  const [cargando, setCargando] = useState(true)
  const [activo, setActivo] = useState<ClienteKanban | null>(null)
  const [contadores, setContadores] = useState({ completados: 0, perdidos: 0, archivados: 0 })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  const cargar = async () => {
    setCargando(true)
    try {
      const [embRes, cntRes] = await Promise.all([
        fetch('/api/clientes?estado=ACTIVO&limite=200'),
        fetch('/api/clientes?contadores=true'),
      ])
      const embData = await embRes.json()
      const cntData = await cntRes.json()
      if (embData.ok) setClientes(embData.data || [])
      if (cntData.ok) setContadores(cntData.contadores || { completados: 0, perdidos: 0, archivados: 0 })
    } catch {
      agregar({ tipo: 'error', titulo: 'Error al cargar embudo', mensaje: '' })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const clientesPorEtapa = (etapa: string) =>
    clientes.filter(c => c.etapaEmbudo === etapa)

  const totalPorEtapa = (etapa: string) =>
    clientesPorEtapa(etapa).reduce((s, c) => s + (c.valorEstimado || 0), 0)

  const onDragStart = ({ active }: DragStartEvent) => {
    setActivo(clientes.find(c => c.id === active.id) || null)
  }

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    setActivo(null)
    if (!over) return
    const clienteId = active.id as string
    const cliente = clientes.find(c => c.id === clienteId)
    if (!cliente) return

    // Determinar la nueva etapa: si over es un cliente, tomar su etapa; si es la columna, usar su id
    let nuevaEtapa: string
    const overCliente = clientes.find(c => c.id === over.id)
    if (overCliente) {
      nuevaEtapa = overCliente.etapaEmbudo
    } else {
      nuevaEtapa = over.id as string
    }

    if (nuevaEtapa === cliente.etapaEmbudo) return

    // Optimistic update
    setClientes(prev =>
      prev.map(c => c.id === clienteId ? { ...c, etapaEmbudo: nuevaEtapa, diasEnEtapa: 0 } : c)
    )

    try {
      const res = await fetch(`/api/clientes/${clienteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etapaEmbudo: nuevaEtapa }),
      })
      if (!(await res.json()).ok) throw new Error()
      agregar({ tipo: 'exito', titulo: `Movido a ${nuevaEtapa} Ã¢Å“â€œ`, mensaje: '' })
    } catch {
      agregar({ tipo: 'error', titulo: 'Error al mover cliente', mensaje: '' })
      cargar() // revertir
    }
  }

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return
    const overCliente = clientes.find(c => c.id === over.id)
    if (!overCliente) return
    const activeCliente = clientes.find(c => c.id === active.id)
    if (!activeCliente || activeCliente.etapaEmbudo === overCliente.etapaEmbudo) return
    setClientes(prev =>
      prev.map(c => c.id === active.id ? { ...c, etapaEmbudo: overCliente.etapaEmbudo } : c)
    )
  }

  // Solo etapas activas (no ganado/perdido)
  const ETAPAS_ACTIVAS = ETAPAS_EMBUDO.filter(e =>
    !['Proyecto Ganado', 'Perdido', 'Precio alto', 'CancelÃƒÂ³ proyecto', 'EligiÃƒÂ³ a la competencia', 'Sin presupuesto', 'No respondiÃƒÂ³'].includes(e)
  )

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-marca)' }} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Accesos a otras secciones */}
      <div className="flex flex-wrap gap-3">
        <Link href="/completados" className="card px-4 py-2.5 flex items-center gap-2 hover:opacity-80 transition-opacity text-sm font-medium">
          <Trophy size={16} className="text-green-500" />
          <span>Completados</span>
          <span className="badge">{contadores.completados}</span>
        </Link>
        <Link href="/perdidos" className="card px-4 py-2.5 flex items-center gap-2 hover:opacity-80 transition-opacity text-sm font-medium">
          <XCircle size={16} style={{ color: 'var(--text-secundario)' }} />
          <span>Perdidos</span>
          <span className="badge">{contadores.perdidos}</span>
        </Link>
        <Link href="/archivados" className="card px-4 py-2.5 flex items-center gap-2 hover:opacity-80 transition-opacity text-sm font-medium">
          <Archive size={16} style={{ color: 'var(--text-secundario)' }} />
          <span>Archivados</span>
          <span className="badge">{contadores.archivados}</span>
        </Link>
        <div className="card px-4 py-2.5 flex items-center gap-2 text-sm">
          <Flame size={16} style={{ color: 'var(--color-marca)' }} />
          <span>Total activos: <strong>{clientes.length}</strong></span>
          <span style={{ color: 'var(--text-secundario)' }}>Ã‚Â·</span>
          <span style={{ color: 'var(--color-marca)' }}>{formatearMonto(clientes.reduce((s, c) => s + (c.valorEstimado || 0), 0))}</span>
        </div>
      </div>

      {/* Tablero */}
      <div className="overflow-x-auto pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragOver={onDragOver}
        >
          <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
            {ETAPAS_ACTIVAS.map(etapa => (
              <Columna
                key={etapa}
                etapa={etapa}
                clientes={clientesPorEtapa(etapa)}
                total={totalPorEtapa(etapa)}
              />
            ))}
          </div>

          <DragOverlay>
            {activo && <TarjetaCliente cliente={activo} overlay />}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
