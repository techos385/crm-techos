'use client'
// src/components/pagos/PagosContenido.tsx
// Lista de todos los pagos con filtros, vencidos resaltados y estadísticas

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DollarSign, AlertTriangle, CheckCircle, Clock, Filter, Loader2, FileText } from 'lucide-react'
import { cn, formatearMonto, formatearFechaCorta } from '@/lib/utils'
import { useToast } from '@/components/ui/Toaster'
import { PagoFormModal } from './PagoFormModal'

interface Pago {
  id: string
  monto: number
  metodo: string
  estatus: string
  concepto: string | null
  fechaPago: string | null
  fechaVencimiento: string | null
  cliente: { id: string; nombre: string } | null
  vendedor: { nombre: string } | null
}

interface Resumen {
  totalCobrado: number
  totalPendiente: number
  totalVencido: number
  countVencidos: number
}

export function PagosContenido() {
  const { agregar } = useToast()
  const [pagos, setPagos] = useState<Pago[]>([])
  const [resumen, setResumen] = useState<Resumen>({ totalCobrado: 0, totalPendiente: 0, totalVencido: 0, countVencidos: 0 })
  const [cargando, setCargando] = useState(true)
  const [filtroEstatus, setFiltroEstatus] = useState('')
  const [filtroMetodo, setFiltroMetodo] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const POR_PAGINA = 20

  const cargar = async () => {
    setCargando(true)
    try {
      const params = new URLSearchParams({
        pagina: String(pagina),
        limite: String(POR_PAGINA),
        ...(filtroEstatus && { estatus: filtroEstatus }),
        ...(filtroMetodo && { metodo: filtroMetodo }),
      })
      const res = await fetch(`/api/pagos?${params}`)
      const data = await res.json()
      if (data.ok) {
        setPagos(data.data || [])
        setTotal(data.total || 0)
        setResumen(data.resumen || resumen)
      }
    } catch {
      agregar({ tipo: 'error', titulo: 'Error al cargar pagos', mensaje: '' })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [pagina, filtroEstatus, filtroMetodo])

  const generarRecibo = (pago: Pago) => {
    const ventana = window.open('', '_blank')
    if (!ventana) return
    ventana.document.write(`
      <!DOCTYPE html>
      <html>
      <head><title>Recibo - Techos y Cubiertas</title>
      <style>
        body { font-family: system-ui; max-width: 600px; margin: 40px auto; padding: 20px; }
        h1 { color: #7cc2e8; } table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        td { padding: 8px 12px; border-bottom: 1px solid #eee; }
        .total { font-size: 1.4em; font-weight: bold; color: #7cc2e8; }
        @media print { .no-print { display: none; } }
      </style>
      </head>
      <body>
        <h1>Techos y Cubiertas</h1>
        <h2>Recibo de Pago</h2>
        <table>
          <tr><td><strong>Folio</strong></td><td>${pago.id.slice(-8).toUpperCase()}</td></tr>
          <tr><td><strong>Cliente</strong></td><td>${pago.cliente?.nombre || 'N/A'}</td></tr>
          <tr><td><strong>Concepto</strong></td><td>${pago.concepto || 'Pago de proyecto'}</td></tr>
          <tr><td><strong>Método</strong></td><td>${pago.metodo}</td></tr>
          <tr><td><strong>Fecha</strong></td><td>${pago.fechaPago ? new Date(pago.fechaPago).toLocaleDateString('es-MX') : 'N/A'}</td></tr>
          <tr><td><strong>Monto</strong></td><td class="total">$${pago.monto.toLocaleString('es-MX')}</td></tr>
        </table>
        <p>Gracias por su preferencia. Techos y Cubiertas — Más de 20 años de experiencia.</p>
        <button class="no-print" onclick="window.print()">Imprimir / Guardar PDF</button>
      </body>
      </html>
    `)
    ventana.document.close()
  }

  const ESTATUSES = ['', 'PAGADO', 'PENDIENTE', 'VENCIDO']
  const METODOS = ['', 'Transferencia', 'Tarjeta', 'Efectivo', 'Depósito']

  const iconEstatus = (e: string) => {
    if (e === 'PAGADO') return <CheckCircle size={14} className="text-green-500" />
    if (e === 'VENCIDO') return <AlertTriangle size={14} className="text-red-500" />
    return <Clock size={14} className="text-yellow-500" />
  }

  return (
    <div className="space-y-4">
      {/* Resumen del mes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4">
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secundario)' }}>Cobrado</p>
          <p className="text-xl font-bold text-green-500">{formatearMonto(resumen.totalCobrado)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secundario)' }}>Pendiente</p>
          <p className="text-xl font-bold text-yellow-500">{formatearMonto(resumen.totalPendiente)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secundario)' }}>Vencido</p>
          <p className="text-xl font-bold text-red-500">{formatearMonto(resumen.totalVencido)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secundario)' }}>Pagos vencidos</p>
          <p className="text-xl font-bold text-red-500">{resumen.countVencidos}</p>
        </div>
      </div>

      {/* Alerta vencidos */}
      {resumen.countVencidos > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl text-sm bg-red-500/10 text-red-500">
          <AlertTriangle size={16} />
          <span><strong>{resumen.countVencidos} cobros vencidos</strong> — Cobrar esto es la venta más fácil. Hazlo hoy.</span>
        </div>
      )}

      {/* Controles */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <select
            className="campo text-sm py-2"
            value={filtroEstatus}
            onChange={e => { setFiltroEstatus(e.target.value); setPagina(1) }}
          >
            <option value="">Todos los estatus</option>
            <option value="PAGADO">✅ Pagados</option>
            <option value="PENDIENTE">⏳ Pendientes</option>
            <option value="VENCIDO">⚠️ Vencidos</option>
          </select>
          <select
            className="campo text-sm py-2"
            value={filtroMetodo}
            onChange={e => { setFiltroMetodo(e.target.value); setPagina(1) }}
          >
            <option value="">Todos los métodos</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Tarjeta">Tarjeta</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Depósito">Depósito</option>
          </select>
          {(filtroEstatus || filtroMetodo) && (
            <button onClick={() => { setFiltroEstatus(''); setFiltroMetodo(''); setPagina(1) }}
              className="text-sm px-3 py-2 rounded-xl hover:opacity-70 transition-opacity" style={{ color: 'var(--text-secundario)' }}>
              ✕ Limpiar
            </button>
          )}
        </div>
        <button onClick={() => setMostrarForm(true)} className="btn-primario flex items-center gap-2">
          <DollarSign size={16} />
          Registrar pago
        </button>
      </div>

      {/* Lista */}
      {cargando ? (
        <div className="flex justify-center py-12">
          <Loader2 size={28} className="animate-spin" style={{ color: 'var(--color-marca)' }} />
        </div>
      ) : pagos.length === 0 ? (
        <div className="card p-8 text-center">
          <DollarSign size={32} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Sin pagos con estos filtros</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secundario)' }}>Prueba quitar algún filtro o registra un pago nuevo.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pagos.map(pago => (
            <div
              key={pago.id}
              className={cn('card p-4 flex items-center gap-4', pago.estatus === 'VENCIDO' && 'border-red-500/30')}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-lg">{formatearMonto(pago.monto)}</span>
                  <span className="flex items-center gap-1 text-xs badge">
                    {iconEstatus(pago.estatus)}
                    {pago.estatus === 'PAGADO' ? 'Pagado' : pago.estatus === 'VENCIDO' ? 'Vencido' : 'Pendiente'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 mt-1 text-xs" style={{ color: 'var(--text-secundario)' }}>
                  {pago.cliente && (
                    <Link href={`/clientes/${pago.cliente.id}`} className="hover:underline font-medium" style={{ color: 'var(--color-marca)' }}>
                      {pago.cliente.nombre}
                    </Link>
                  )}
                  <span>{pago.metodo}</span>
                  {pago.concepto && <span>{pago.concepto}</span>}
                  {pago.fechaPago && <span>{formatearFechaCorta(pago.fechaPago)}</span>}
                  {pago.estatus === 'VENCIDO' && pago.fechaVencimiento && (
                    <span className="text-red-500">Venció: {formatearFechaCorta(pago.fechaVencimiento)}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => generarRecibo(pago)}
                title="Generar recibo"
                className="p-2 rounded-lg hover:opacity-70 transition-opacity"
              >
                <FileText size={16} style={{ color: 'var(--text-secundario)' }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Paginación */}
      {total > POR_PAGINA && (
        <div className="flex items-center justify-between text-sm">
          <span style={{ color: 'var(--text-secundario)' }}>Mostrando {Math.min((pagina - 1) * POR_PAGINA + 1, total)}–{Math.min(pagina * POR_PAGINA, total)} de {total}</span>
          <div className="flex gap-2">
            <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1} className="btn-secundario py-1.5 px-3 disabled:opacity-40">← Anterior</button>
            <button onClick={() => setPagina(p => p + 1)} disabled={pagina * POR_PAGINA >= total} className="btn-secundario py-1.5 px-3 disabled:opacity-40">Siguiente →</button>
          </div>
        </div>
      )}

      {/* Modal nuevo pago */}
      {mostrarForm && (
        <PagoFormModal
          onCerrar={() => setMostrarForm(false)}
          onGuardado={() => { setMostrarForm(false); cargar() }}
        />
      )}
    </div>
  )
}
