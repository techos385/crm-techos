'use client'
// src/components/clientes/FormularioCliente.tsx

import { useState } from 'react'
import { X, User, Phone, Mail, MapPin, Building2, ChevronDown } from 'lucide-react'
import { cn, ETAPAS_EMBUDO, ORIGENES } from '@/lib/utils'
import { useToast } from '@/components/ui/Toaster'

interface Props {
  clienteInicial?: Partial<{
    nombre: string; telefono: string; correo: string; origen: string
    etapaEmbudo: string; temperatura: string; objecionPrincipal: string
    notas: string; proximaAccion: string; proximaAccionFecha: string
    valorEstimado: number; empresa: string; zonaUbicacion: string
  }>
  onCerrar: () => void
  onGuardado: (cliente: { id: string; nombre: string }) => void
}

export function FormularioCliente({ clienteInicial, onCerrar, onGuardado }: Props) {
  const { agregar } = useToast()
  const [guardando, setGuardando] = useState(false)
  const [duplicado, setDuplicado] = useState<{ id: string; nombre: string } | null>(null)

  const [form, setForm] = useState({
    nombre: clienteInicial?.nombre ?? '',
    telefono: clienteInicial?.telefono ?? '',
    correo: clienteInicial?.correo ?? '',
    origen: clienteInicial?.origen ?? '',
    etapaEmbudo: clienteInicial?.etapaEmbudo ?? 'Nuevo Prospecto',
    temperatura: clienteInicial?.temperatura ?? 'TIBIO',
    objecionPrincipal: clienteInicial?.objecionPrincipal ?? '',
    notas: clienteInicial?.notas ?? '',
    proximaAccion: clienteInicial?.proximaAccion ?? 'Contactar en menos de 24h',
    proximaAccionFecha: clienteInicial?.proximaAccionFecha ?? new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    valorEstimado: clienteInicial?.valorEstimado?.toString() ?? '',
    empresa: clienteInicial?.empresa ?? '',
    zonaUbicacion: clienteInicial?.zonaUbicacion ?? '',
  })

  const set = (campo: string, valor: string) => setForm((prev) => ({ ...prev, [campo]: valor }))

  const guardar = async () => {
    if (!form.nombre.trim()) {
      agregar({ tipo: 'error', titulo: 'El nombre es obligatorio', mensaje: '' })
      return
    }

    setGuardando(true)
    setDuplicado(null)
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          valorEstimado: form.valorEstimado ? parseFloat(form.valorEstimado) : null,
          correo: form.correo || null,
          telefono: form.telefono || null,
        }),
      })
      const data = await res.json()

      if (res.status === 409 && data.duplicado) {
        setDuplicado(data.clienteExistente)
        return
      }

      if (!data.ok) {
        agregar({ tipo: 'error', titulo: 'Error al guardar', mensaje: data.mensaje ?? 'Intenta de nuevo' })
        return
      }

      onGuardado(data.data)
    } catch {
      agregar({ tipo: 'error', titulo: 'Sin conexiÃƒÂ³n', mensaje: 'Revisa tu internet e intenta de nuevo.' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCerrar} />

      <div className="relative w-full sm:max-w-lg max-h-[95vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"
        style={{ background: 'var(--bg-base)' }}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b"
          style={{ background: 'var(--bg-base)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <User size={18} />
            </div>
            <h2 className="text-lg font-semibold">Nuevo cliente</h2>
          </div>
          <button onClick={onCerrar} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Alerta de duplicado */}
        {duplicado && (
          <div className="mx-5 mt-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
            <p className="font-medium text-yellow-600 dark:text-yellow-400">
              Ã¢Å¡Â Ã¯Â¸Â Ya tienes a {duplicado.nombre} con ese telÃƒÂ©fono o correo.
            </p>
            <div className="flex gap-2 mt-2">
              <a href={`/clientes/${duplicado.id}`} className="btn-primario text-sm py-1.5 px-3">
                Abrir su ficha
              </a>
              <button
                onClick={() => { setDuplicado(null); guardar() }}
                className="btn-secundario text-sm py-1.5 px-3"
              >
                Crear de todas formas
              </button>
            </div>
          </div>
        )}

        {/* Formulario */}
        <div className="p-5 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Nombre completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Nombre del cliente o contacto"
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              className="campo w-full"
              autoFocus
            />
          </div>

          {/* TelÃƒÂ©fono y correo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">WhatsApp / TelÃƒÂ©fono</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secundario)' }} />
                <input
                  type="tel"
                  placeholder="55 1234 5678"
                  value={form.telefono}
                  onChange={(e) => set('telefono', e.target.value)}
                  className="campo pl-8 w-full"
                />
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secundario)' }}>Con lada, ej. 55 1234 5678</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Correo</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secundario)' }} />
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={form.correo}
                  onChange={(e) => set('correo', e.target.value)}
                  className="campo pl-8 w-full"
                />
              </div>
            </div>
          </div>

          {/* Empresa y zona */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Empresa / InstituciÃƒÂ³n</label>
              <div className="relative">
                <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secundario)' }} />
                <input
                  type="text"
                  placeholder="Nombre de la empresa"
                  value={form.empresa}
                  onChange={(e) => set('empresa', e.target.value)}
                  className="campo pl-8 w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Zona / UbicaciÃƒÂ³n</label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secundario)' }} />
                <input
                  type="text"
                  placeholder="Ecatepec, Estado de MÃƒÂ©xico"
                  value={form.zonaUbicacion}
                  onChange={(e) => set('zonaUbicacion', e.target.value)}
                  className="campo pl-8 w-full"
                />
              </div>
            </div>
          </div>

          {/* Origen y Temperatura */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Ã‚Â¿De dÃƒÂ³nde llegÃƒÂ³?</label>
              <select value={form.origen} onChange={(e) => set('origen', e.target.value)} className="campo w-full">
                <option value="">Ã¢â‚¬â€ Sin especificar Ã¢â‚¬â€</option>
                {ORIGENES.map((o) => <option key={o.utm} value={o.label}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Temperatura
                <span className="ml-1 text-xs font-normal" style={{ color: 'var(--text-secundario)' }}>Ã‚Â¿QuÃƒÂ© tan cerca estÃƒÂ¡ de comprar?</span>
              </label>
              <select value={form.temperatura} onChange={(e) => set('temperatura', e.target.value)} className="campo w-full">
                <option value="CALIENTE">Ã°Å¸â€Â¥ Caliente Ã¢â‚¬â€ quiere hoy</option>
                <option value="TIBIO">Ã°Å¸Å¸Â¡ Tibio Ã¢â‚¬â€ estÃƒÂ¡ viendo</option>
                <option value="FRIO">Ã°Å¸â€Âµ FrÃƒÂ­o Ã¢â‚¬â€ a futuro</option>
              </select>
            </div>
          </div>

          {/* Etapa y valor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Etapa del embudo</label>
              <select value={form.etapaEmbudo} onChange={(e) => set('etapaEmbudo', e.target.value)} className="campo w-full">
                {ETAPAS_EMBUDO.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Valor estimado (MXN)</label>
              <input
                type="number"
                placeholder="0"
                value={form.valorEstimado}
                onChange={(e) => set('valorEstimado', e.target.value)}
                className="campo w-full"
                min="0"
              />
            </div>
          </div>

          {/* ObjeciÃƒÂ³n */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              ObjeciÃƒÂ³n principal
              <span className="ml-1 text-xs font-normal" style={{ color: 'var(--text-secundario)' }}>Ã‚Â¿QuÃƒÂ© lo frena para comprar?</span>
            </label>
            <input
              type="text"
              placeholder='Ej. "EstÃƒÂ¡ caro", "Lo voy a pensar"'
              value={form.objecionPrincipal}
              onChange={(e) => set('objecionPrincipal', e.target.value)}
              className="campo w-full"
            />
          </div>

          {/* PrÃƒÂ³xima acciÃƒÂ³n */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                PrÃƒÂ³xima acciÃƒÂ³n
                <span className="ml-1 text-xs font-normal" style={{ color: 'var(--text-secundario)' }}>No lo dejes sin una</span>
              </label>
              <input
                type="text"
                placeholder='Ej. "Llamar para seguimiento"'
                value={form.proximaAccion}
                onChange={(e) => set('proximaAccion', e.target.value)}
                className="campo w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Para cuÃƒÂ¡ndo</label>
              <input
                type="datetime-local"
                value={form.proximaAccionFecha}
                onChange={(e) => set('proximaAccionFecha', e.target.value)}
                className="campo w-full"
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Notas iniciales</label>
            <textarea
              placeholder="QuÃƒÂ© sabes de este cliente, su proyecto, sus necesidadesÃ¢â‚¬Â¦"
              value={form.notas}
              onChange={(e) => set('notas', e.target.value)}
              className="campo w-full h-24 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-5 border-t flex gap-3"
          style={{ background: 'var(--bg-base)', borderColor: 'var(--border)' }}>
          <button onClick={onCerrar} className="btn-secundario flex-1">Cancelar</button>
          <button
            onClick={guardar}
            disabled={guardando || !form.nombre}
            className="btn-primario flex-1 disabled:opacity-50"
          >
            {guardando ? 'GuardandoÃ¢â‚¬Â¦' : 'Agregar cliente'}
          </button>
        </div>
      </div>
    </div>
  )
}
