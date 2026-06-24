'use client'
// src/components/clientes/ListaClientes.tsx
// Lista completa de clientes con filtros, orden, paginación y acciones

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Users, Plus, Search, Filter, ChevronDown, Star, StarOff,
  Thermometer, ArrowUpDown, MoreHorizontal, Trash2, Archive,
  RefreshCw, ChevronLeft, ChevronRight, X, SlidersHorizontal
} from 'lucide-react'
import { cn, formatearFechaCorta, TEMPERATURA_CONFIG, ETAPAS_EMBUDO } from '@/lib/utils'
import { useToast } from '@/components/ui/Toaster'
import { FormularioCliente } from '@/components/clientes/FormularioCliente'

interface Cliente {
  id: string
  nombre: string
  telefono: string | null
  correo: string | null
  empresa: string | null
  empresaNombre: string | null
  etapaEmbudo: string | null
  estadoCartera: string
  temperatura: string
  valorEstimado: number | null
  proximaAccion: string | null
  proximaAccionFecha: string | null
  origen: string | null
  objecionPrincipal: string | null
  esFavorito: boolean
  vendedor?: { nombre: string }
  etiquetas?: Array<{ etiqueta: { id: string; nombre: string; color: string } }>
  _count?: { pagos: number; citas: number; archivos: number }
}

export function ListaClientes() {
  const router = useRouter()
  const { agregar } = useToast()

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [cargando, setCargando] = useState(true)

  // Filtros
  const [buscar, setBuscar] = useState('')
  const [etapa, setEtapa] = useState('')
  const [temperatura, setTemperatura] = useState('')
  const [estado, setEstado] = useState('ACTIVO')
  const [ordenar, setOrdenar] = useState('reciente')
  const [favoritos, setFavoritos] = useState(false)
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  // Modal nuevo cliente
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  // Selección múltiple
  const [seleccionados, setSeleccionados] = useState<string[]>([])

  const cargarClientes = useCallback(async () => {
    setCargando(true)
    try {
      const params = new URLSearchParams({
        pagina: pagina.toString(),
        buscar,
        ordenar,
        ...(etapa && { etapa }),
        ...(temperatura && { temperatura }),
        ...(estado && { estado }),
        ...(favoritos && { favoritos: 'true' }),
      })
      const res = await fetch(`/api/clientes?${params}`)
      const data = await res.json()
      if (data.ok) {
        setClientes(data.data.clientes)
        setTotal(data.data.total)
        setTotalPaginas(data.data.totalPaginas)
      }
    } catch {
      agregar({ tipo: 'error', titulo: 'Error al cargar clientes', mensaje: 'Revisa tu conexión e intenta de nuevo.' })
    } finally {
      setCargando(false)
    }
  }, [pagina, buscar, etapa, temperatura, estado, ordenar, favoritos, agregar])

  useEffect(() => {
    const t = setTimeout(cargarClientes, buscar ? 300 : 0)
    return () => clearTimeout(t)
  }, [cargarClientes])

  const toggleFavorito = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const res = await fetch(`/api/clientes/${id}/favorito`, { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        setClientes((prev) =>
          prev.map((c) => c.id === id ? { ...c, esFavorito: data.esFavorito } : c)
        )
      }
    } catch {
      agregar({ tipo: 'error', titulo: 'Error', mensaje: 'No se pudo actualizar el favorito' })
    }
  }

  const tempConfig = TEMPERATURA_CONFIG

  const filtrosActivos = [etapa, temperatura, favoritos ? 'Favoritos' : '', estado !== 'ACTIVO' ? estado : ''].filter(Boolean)

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="seccion-header">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
            <Users size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Clientes</h1>
            <p className="text-sm" style={{ color: 'var(--text-secundario)' }}>
              Todas tus personas en un solo lugar
            </p>
          </div>
        </div>
        <button
          onClick={() => setMostrarFormulario(true)}
          className="btn-primario flex items-center gap-2"
        >
          <Plus size={18} />
          <span>Nuevo cliente</span>
        </button>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="card p-4 space-y-3">
        <div className="flex gap-3 flex-wrap">
          {/* Buscador */}
          <div className="flex-1 min-w-[200px] relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secundario)' }} />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono, correo…"
              value={buscar}
              onChange={(e) => { setBuscar(e.target.value); setPagina(1) }}
              className="campo pl-9 w-full"
            />
          </div>

          {/* Filtros rápidos */}
          <select
            value={estado}
            onChange={(e) => { setEstado(e.target.value); setPagina(1) }}
            className="campo"
          >
            <option value="ACTIVO">Activos</option>
            <option value="GANADO">Completados</option>
            <option value="PERDIDO">Perdidos</option>
            <option value="ARCHIVADO">Archivados</option>
            <option value="">Todos</option>
          </select>

          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className={cn('btn-secundario flex items-center gap-2', mostrarFiltros && 'ring-2 ring-[var(--color-marca)]')}
          >
            <SlidersHorizontal size={16} />
            <span>Filtros</span>
            {filtrosActivos.length > 0 && (
              <span className="badge text-xs">{filtrosActivos.length}</span>
            )}
          </button>

          <select
            value={ordenar}
            onChange={(e) => setOrdenar(e.target.value)}
            className="campo"
          >
            <option value="reciente">Más reciente</option>
            <option value="nombre">Nombre A-Z</option>
            <option value="valor">Mayor valor</option>
            <option value="proxima">Próxima acción</option>
          </select>
        </div>

        {/* Panel de filtros avanzados */}
        {mostrarFiltros && (
          <div className="pt-3 border-t flex gap-3 flex-wrap" style={{ borderColor: 'var(--border)' }}>
            <select
              value={etapa}
              onChange={(e) => { setEtapa(e.target.value); setPagina(1) }}
              className="campo"
            >
              <option value="">Todas las etapas</option>
              {ETAPAS_EMBUDO.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>

            <select
              value={temperatura}
              onChange={(e) => { setTemperatura(e.target.value); setPagina(1) }}
              className="campo"
            >
              <option value="">Toda temperatura</option>
              <option value="CALIENTE">🔥 Caliente</option>
              <option value="TIBIO">🟡 Tibio</option>
              <option value="FRIO">🔵 Frío</option>
            </select>

            <button
              onClick={() => setFavoritos(!favoritos)}
              className={cn('btn-secundario flex items-center gap-2', favoritos && 'ring-2 ring-yellow-400')}
            >
              <Star size={15} className={favoritos ? 'fill-yellow-400 text-yellow-400' : ''} />
              Favoritos
            </button>

            {filtrosActivos.length > 0 && (
              <button
                onClick={() => { setEtapa(''); setTemperatura(''); setFavoritos(false); setEstado('ACTIVO') }}
                className="btn-secundario flex items-center gap-2 text-red-500"
              >
                <X size={14} /> Limpiar filtros
              </button>
            )}
          </div>
        )}

        {/* Chips de filtros activos */}
        {filtrosActivos.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {etapa && (
              <span className="badge flex items-center gap-1">
                Etapa: {etapa}
                <button onClick={() => setEtapa('')}><X size={12} /></button>
              </span>
            )}
            {temperatura && (
              <span className="badge flex items-center gap-1">
                {temperatura === 'CALIENTE' ? '🔥' : temperatura === 'TIBIO' ? '🟡' : '🔵'} {temperatura}
                <button onClick={() => setTemperatura('')}><X size={12} /></button>
              </span>
            )}
            {favoritos && (
              <span className="badge flex items-center gap-1">
                ⭐ Favoritos
                <button onClick={() => setFavoritos(false)}><X size={12} /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Contador */}
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--text-secundario)' }}>
          {cargando ? 'Cargando…' : `Mostrando ${clientes.length} de ${total} cliente${total !== 1 ? 's' : ''}`}
        </p>
        <button onClick={cargarClientes} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
          <RefreshCw size={15} className={cargando ? 'animate-spin' : ''} style={{ color: 'var(--text-secundario)' }} />
        </button>
      </div>

      {/* Lista de clientes */}
      {cargando ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
      ) : clientes.length === 0 ? (
        <div className="empty-state">
          <Users size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium mb-2">
            {buscar || filtrosActivos.length > 0
              ? `No encontré nada con "${buscar || 'estos filtros'}"`
              : 'Aún no tienes clientes'}
          </p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secundario)' }}>
            {buscar || filtrosActivos.length > 0
              ? 'Prueba quitar algún filtro o revisa cómo lo escribiste.'
              : 'Agrega tu primer cliente y empieza a vender.'}
          </p>
          {!buscar && filtrosActivos.length === 0 && (
            <button onClick={() => setMostrarFormulario(true)} className="btn-primario flex items-center gap-2 mx-auto">
              <Plus size={16} /> Agregar primer cliente
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {clientes.map((cliente) => {
            const temp = tempConfig[cliente.temperatura as keyof typeof tempConfig]
            const accionVencida = cliente.proximaAccionFecha && new Date(cliente.proximaAccionFecha) < new Date()

            return (
              <div
                key={cliente.id}
                className="card p-4 hover:border-[var(--color-marca)]/30 transition-all group"
              >
                <div className="flex items-start gap-3">
                  {/* Inicial */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm shrink-0"
                    style={{ background: 'var(--color-marca)', color: 'white' }}
                  >
                    {cliente.nombre.charAt(0).toUpperCase()}
                  </div>

                  {/* Info principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/clientes/${cliente.id}`}
                          className="nombre-cliente text-base font-semibold"
                        >
                          {cliente.nombre}
                        </Link>
                        {(cliente.empresa || cliente.empresaNombre) && (
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secundario)' }}>
                            {cliente.empresa || cliente.empresaNombre}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Temperatura */}
                        <span className="text-lg" title={temp?.label}>{temp?.emoji}</span>

                        {/* Valor */}
                        {cliente.valorEstimado && (
                          <span className="text-sm font-medium hidden sm:block">
                            ${cliente.valorEstimado.toLocaleString('es-MX')}
                          </span>
                        )}

                        {/* Favorito */}
                        <button
                          onClick={(e) => toggleFavorito(cliente.id, e)}
                          className="p-1 hover:text-yellow-400 transition-colors"
                          aria-label={cliente.esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                        >
                          <Star
                            size={16}
                            className={cn(
                              cliente.esFavorito ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
                            )}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Etapa y teléfono */}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {cliente.etapaEmbudo && (
                        <span className="badge text-xs">{cliente.etapaEmbudo}</span>
                      )}
                      {cliente.telefono && (
                        <span className="text-xs" style={{ color: 'var(--text-secundario)' }}>
                          {cliente.telefono}
                        </span>
                      )}
                    </div>

                    {/* Próxima acción */}
                    {cliente.proximaAccion && (
                      <p className={cn('text-xs mt-1.5 flex items-center gap-1', accionVencida ? 'text-red-500 font-medium' : '')} style={!accionVencida ? { color: 'var(--text-secundario)' } : {}}>
                        {accionVencida && '⚠️ '}
                        {cliente.proximaAccion}
                        {cliente.proximaAccionFecha && (
                          <span>— {formatearFechaCorta(cliente.proximaAccionFecha)}</span>
                        )}
                      </p>
                    )}

                    {/* Sin próxima acción */}
                    {!cliente.proximaAccion && cliente.estadoCartera === 'ACTIVO' && (
                      <p className="text-xs mt-1.5 text-orange-500">
                        🟠 Sin seguimiento — defínele una acción
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina === 1}
            className="btn-secundario p-2 disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm" style={{ color: 'var(--text-secundario)' }}>
            Página {pagina} de {totalPaginas}
          </span>
          <button
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
            className="btn-secundario p-2 disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Modal nuevo cliente */}
      {mostrarFormulario && (
        <FormularioCliente
          onCerrar={() => setMostrarFormulario(false)}
          onGuardado={() => {
            setMostrarFormulario(false)
            cargarClientes()
            agregar({ tipo: 'exito', titulo: '¡Cliente agregado!', mensaje: 'Ya aparece en tu lista.' })
          }}
        />
      )}
    </div>
  )
}
