'use client'
// src/components/ai/AsistenteIACliente.tsx
// 5 funciones IA dentro del expediente del cliente

import { useState } from 'react'
import { Sparkles, MessageCircle, Thermometer, CheckSquare, FileText, Shield, Copy, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toaster'

interface Props {
  clienteId: string
  clienteNombre: string
}

type FuncionIA = 'mensaje' | 'temperatura' | 'proxima_accion' | 'resumen' | 'objecion'

const FUNCIONES: { key: FuncionIA; label: string; icon: any; descripcion: string }[] = [
  { key: 'mensaje', label: 'Redactar mensaje', icon: MessageCircle, descripcion: 'Borrador de WhatsApp o correo para mover al cliente a la siguiente etapa' },
  { key: 'temperatura', label: 'Temperatura', icon: Thermometer, descripcion: 'Clasificar quÃ© tan cerca estÃ¡ de comprar' },
  { key: 'proxima_accion', label: 'PrÃ³xima acciÃ³n', icon: CheckSquare, descripcion: 'Sugerir el siguiente paso concreto con fecha' },
  { key: 'resumen', label: 'Resumen', icon: FileText, descripcion: 'Resumen de 3â€“5 lÃ­neas de todo el expediente' },
  { key: 'objecion', label: 'Manejar objeciÃ³n', icon: Shield, descripcion: 'Respuesta concreta para vencer la objeciÃ³n del cliente' },
]

export function AsistenteIACliente({ clienteId, clienteNombre }: Props) {
  const { agregar } = useToast()
  const [funcion, setFuncion] = useState<FuncionIA | null>(null)
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [accionGuardada, setAccionGuardada] = useState(false)

  const ejecutar = async (fn: FuncionIA) => {
    setFuncion(fn)
    setCargando(true)
    setResultado(null)
    setAccionGuardada(false)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funcion: fn, clienteId }),
      })
      const data = await res.json()
      if (data.ok) {
        setResultado(data.resultado)
      } else {
        setResultado('No se pudo generar la respuesta. Intenta de nuevo.')
      }
    } catch {
      setResultado('Error de conexiÃ³n. Verifica tu internet e intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  const copiar = async () => {
    if (!resultado) return
    await navigator.clipboard.writeText(resultado)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
    agregar({ tipo: 'exito', titulo: 'Copiado âœ“', mensaje: '' })
  }

  const guardarComoAccion = async () => {
    if (!resultado || funcion !== 'proxima_accion') return
    // Extraer la primera lÃ­nea como acciÃ³n
    const lineas = resultado.split('\n').filter(l => l.trim())
    const accion = lineas[0]?.replace(/^[*-â€¢]\s*/, '').substring(0, 200) || resultado.substring(0, 200)
    
    try {
      const res = await fetch(`/api/clientes/${clienteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proximaAccion: accion }),
      })
      if ((await res.json()).ok) {
        setAccionGuardada(true)
        agregar({ tipo: 'exito', titulo: 'PrÃ³xima acciÃ³n guardada âœ“', mensaje: '' })
      }
    } catch {
      agregar({ tipo: 'error', titulo: 'No se pudo guardar', mensaje: '' })
    }
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Botones de funciÃ³n */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {FUNCIONES.map((f) => {
          const Icon = f.icon
          return (
            <button
              key={f.key}
              onClick={() => ejecutar(f.key)}
              disabled={cargando}
              title={f.descripcion}
              className={cn(
                'flex items-center gap-2 p-3 rounded-xl text-sm font-medium transition-all text-left',
                funcion === f.key
                  ? 'shadow-sm'
                  : 'hover:opacity-80'
              )}
              style={funcion === f.key
                ? { background: 'var(--color-marca)', color: 'white' }
                : { background: 'var(--bg-hover)', color: 'var(--text-primario)' }
              }
            >
              <Icon size={15} />
              <span className="truncate">{f.label}</span>
            </button>
          )
        })}
      </div>

      {/* Ãrea de resultado */}
      {(cargando || resultado) && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-hover)' }}>
          {cargando ? (
            <div className="flex items-center gap-3">
              <Loader2 size={18} className="animate-spin" style={{ color: 'var(--color-marca)' }} />
              <span className="text-sm" style={{ color: 'var(--text-secundario)' }}>
                Analizando expediente de {clienteNombre}â€¦
              </span>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={15} style={{ color: 'var(--color-marca)' }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--color-marca)' }}>
                    {FUNCIONES.find(f => f.key === funcion)?.label}
                  </span>
                </div>
                <button
                  onClick={copiar}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all hover:opacity-80"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-secundario)' }}
                >
                  {copiado ? <Check size={12} /> : <Copy size={12} />}
                  {copiado ? 'Copiado' : 'Copiar'}
                </button>
              </div>

              <p className="text-sm whitespace-pre-wrap leading-relaxed">{resultado}</p>

              {/* BotÃ³n guardar prÃ³xima acciÃ³n */}
              {funcion === 'proxima_accion' && !accionGuardada && (
                <button
                  onClick={guardarComoAccion}
                  className="btn-primario text-xs py-2 px-4 w-full"
                >
                  âœ“ Guardar como prÃ³xima acciÃ³n
                </button>
              )}
              {accionGuardada && (
                <p className="text-xs text-center" style={{ color: 'var(--color-marca)' }}>
                  âœ“ PrÃ³xima acciÃ³n guardada en el expediente
                </p>
              )}

              <button
                onClick={() => ejecutar(funcion!)}
                className="text-xs underline opacity-60 hover:opacity-100 transition-opacity"
                style={{ color: 'var(--text-secundario)' }}
              >
                Generar de nuevo
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
