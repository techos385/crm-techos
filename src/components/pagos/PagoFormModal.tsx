'use client'
// src/components/pagos/PagoFormModal.tsx
// Modal para registrar un pago, usado en PagosContenido y ExpedienteCliente

import { useState, useEffect } from 'react'
import { X, DollarSign } from 'lucide-react'
import { useToast } from '@/components/ui/Toaster'

interface Props {
  clienteId?: string
  onCerrar: () => void
  onGuardado: () => void
}

export function PagoFormModal({ clienteId, onCerrar, onGuardado }: Props) {
  const { agregar } = useToast()
  const [guardando, setGuardando] = useState(false)
  const [clientes, setClientes] = useState<{ id: string; nombre: string }[]>([])
  const [form, setForm] = useState({
    clienteId: clienteId || '',
    monto: '',
    metodo: 'Transferencia',
    estatus: 'PAGADO',
    concepto: '',
    fechaPago: new Date().toISOString().slice(0, 10),
    fechaVencimiento: '',
  })

  useEffect(() => {
    if (!clienteId) {
      fetch('/api/clientes?limite=200')
        .then(r => r.json())
        .then(d => { if (d.ok) setClientes(d.data || []) })
    }
  }, [clienteId])

  const set = (campo: string, valor: string) => setForm(prev => ({ ...prev, [campo]: valor }))

  const guardar = async () => {
    if (!form.monto || !form.clienteId) {
      agregar({ tipo: 'error', titulo: 'Faltan datos', mensaje: 'Selecciona cliente y monto' })
      return
    }
    if (isNaN(Number(form.monto)) || Number(form.monto) <= 0) {
      agregar({ tipo: 'error', titulo: 'Monto invÃƒÂ¡lido', mensaje: 'Escribe un nÃƒÂºmero mayor a 0' })
      return
    }
    setGuardando(true)
    try {
      const res = await fetch('/api/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          monto: Number(form.monto),
          fechaVencimiento: form.fechaVencimiento || null,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        agregar({ tipo: 'exito', titulo: 'Pago registrado Ã¢Å“â€œ', mensaje: `$${Number(form.monto).toLocaleString('es-MX')}` })
        onGuardado()
      } else {
        agregar({ tipo: 'error', titulo: data.mensaje || 'Error al guardar', mensaje: '' })
      }
    } catch {
      agregar({ tipo: 'error', titulo: 'Error de conexiÃƒÂ³n', mensaje: '' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="card p-6 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign size={20} style={{ color: 'var(--color-marca)' }} />
            <h3 className="text-lg font-bold">Registrar pago</h3>
          </div>
          <button onClick={onCerrar} className="p-2 rounded-lg hover:opacity-70 transition-opacity">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          {/* Cliente (solo si no viene fijo) */}
          {!clienteId && (
            <div>
              <label className="text-sm font-medium block mb-1">Cliente <span className="text-red-500">*</span></label>
              <select className="campo w-full" value={form.clienteId} onChange={e => set('clienteId', e.target.value)}>
                <option value="">Selecciona un cliente...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          )}

          {/* Monto */}
          <div>
            <label className="text-sm font-medium block mb-1">Monto (MXN) <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-secundario)' }}>$</span>
              <input
                type="number"
                className="campo w-full pl-7"
                placeholder="0.00"
                value={form.monto}
                onChange={e => set('monto', e.target.value)}
                min="1"
              />
            </div>
          </div>

          {/* MÃƒÂ©todo */}
          <div>
            <label className="text-sm font-medium block mb-1">MÃƒÂ©todo de pago</label>
            <div className="grid grid-cols-2 gap-2">
              {['Transferencia', 'Tarjeta', 'Efectivo', 'DepÃƒÂ³sito'].map(m => (
                <button
                  key={m}
                  onClick={() => set('metodo', m)}
                  className="py-2 px-3 rounded-xl text-sm font-medium transition-all border"
                  style={form.metodo === m
                    ? { background: 'var(--color-marca)', color: 'white', borderColor: 'var(--color-marca)' }
                    : { borderColor: 'var(--border)' }
                  }
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Estatus */}
          <div>
            <label className="text-sm font-medium block mb-1">Estatus</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'PAGADO', label: 'Ã¢Å“â€¦ Pagado' },
                { val: 'PENDIENTE', label: 'Ã¢ÂÂ³ Pendiente' },
                { val: 'VENCIDO', label: 'Ã¢Å¡Â Ã¯Â¸Â Vencido' },
              ].map(s => (
                <button
                  key={s.val}
                  onClick={() => set('estatus', s.val)}
                  className="py-2 px-2 rounded-xl text-xs font-medium transition-all border"
                  style={form.estatus === s.val
                    ? { background: 'var(--color-marca)', color: 'white', borderColor: 'var(--color-marca)' }
                    : { borderColor: 'var(--border)' }
                  }
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Concepto */}
          <div>
            <label className="text-sm font-medium block mb-1">Concepto</label>
            <input
              className="campo w-full"
              placeholder="Ej. Anticipo, Pago final, 1er parcialidad..."
              value={form.concepto}
              onChange={e => set('concepto', e.target.value)}
            />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Fecha de pago</label>
              <input type="date" className="campo w-full" value={form.fechaPago} onChange={e => set('fechaPago', e.target.value)} />
            </div>
            {form.estatus === 'PENDIENTE' && (
              <div>
                <label className="text-sm font-medium block mb-1">Fecha de vencimiento</label>
                <input type="date" className="campo w-full" value={form.fechaVencimiento} onChange={e => set('fechaVencimiento', e.target.value)} />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onCerrar} className="btn-secundario flex-1">Cancelar</button>
          <button onClick={guardar} disabled={guardando} className="btn-primario flex-1">
            {guardando ? 'GuardandoÃ¢â‚¬Â¦' : 'Registrar pago'}
          </button>
        </div>
      </div>
    </div>
  )
}
