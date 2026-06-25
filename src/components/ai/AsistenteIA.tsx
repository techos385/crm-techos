'use client'
// src/components/ai/AsistenteIA.tsx
// PÃ¡gina completa del asistente IA con chat y funciones rÃ¡pidas

import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, Loader2, MessageCircle, Thermometer, CheckSquare, FileText, Shield, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Mensaje {
  rol: 'usuario' | 'asistente'
  contenido: string
  timestamp: Date
}

const ACCIONES_RAPIDAS = [
  { label: 'Â¿CÃ³mo vencer "estÃ¡ caro"?', icon: Shield },
  { label: 'Â¿CÃ³mo seguir a un cliente que no responde?', icon: MessageCircle },
  { label: 'Â¿CÃ³mo cerrar esta semana?', icon: CheckSquare },
  { label: 'Â¿CÃ³mo pedir referidos a un cliente ganado?', icon: Sparkles },
  { label: 'Â¿CÃ³mo manejar "lo voy a pensar"?', icon: FileText },
  { label: 'Â¿CÃ³mo reactivar un lead frÃ­o?', icon: Thermometer },
]

export function AsistenteIA() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      rol: 'asistente',
      contenido: 'Â¡Hola! Soy tu copiloto de ventas para Techos y Cubiertas. Puedo ayudarte a redactar mensajes, manejar objeciones, planear tu semana de ventas o resolver cualquier duda comercial. Â¿En quÃ© te ayudo hoy?',
      timestamp: new Date(),
    },
  ])
  const [entrada, setEntrada] = useState('')
  const [cargando, setCargando] = useState(false)
  const [sinLlave, setSinLlave] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const enviar = async (texto?: string) => {
    const msg = texto || entrada.trim()
    if (!msg || cargando) return
    setEntrada('')

    const nuevo: Mensaje = { rol: 'usuario', contenido: msg, timestamp: new Date() }
    setMensajes(prev => [...prev, nuevo])
    setCargando(true)

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funcion: 'chat', mensaje: msg }),
      })
      const data = await res.json()
      if (data.sinLlave) setSinLlave(true)
      setMensajes(prev => [...prev, {
        rol: 'asistente',
        contenido: data.resultado || 'No pude generar una respuesta. Intenta de nuevo.',
        timestamp: new Date(),
      }])
    } catch {
      setMensajes(prev => [...prev, {
        rol: 'asistente',
        contenido: 'Error de conexiÃ³n. Verifica tu internet e intenta de nuevo.',
        timestamp: new Date(),
      }])
    } finally {
      setCargando(false)
    }
  }

  const reiniciar = () => {
    setMensajes([{
      rol: 'asistente',
      contenido: 'Â¡Hola de nuevo! Â¿En quÃ© te ayudo?',
      timestamp: new Date(),
    }])
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="card p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-marca)' }}>
            <Sparkles size={20} color="white" />
          </div>
          <div>
            <h2 className="font-semibold">Asistente de ventas IA</h2>
            <p className="text-xs" style={{ color: 'var(--text-secundario)' }}>Tu copiloto para vender mÃ¡s</p>
          </div>
        </div>
        <button onClick={reiniciar} title="Nueva conversaciÃ³n" className="p-2 rounded-lg hover:opacity-70 transition-opacity">
          <RefreshCw size={16} style={{ color: 'var(--text-secundario)' }} />
        </button>
      </div>

      {/* Aviso sin llave */}
      {sinLlave && (
        <div className="mb-3 p-3 rounded-xl text-sm" style={{ background: 'var(--bg-hover)' }}>
          <span className="font-medium">ðŸ’¡ Modo plantillas:</span>
          <span style={{ color: 'var(--text-secundario)' }}> Activa el asistente IA real poniendo tu <code>ANTHROPIC_API_KEY</code> en Vercel para respuestas mÃ¡s personalizadas.</span>
        </div>
      )}

      {/* Acciones rÃ¡pidas (solo si hay 1 mensaje) */}
      {mensajes.length === 1 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {ACCIONES_RAPIDAS.map((a) => {
            const Icon = a.icon
            return (
              <button
                key={a.label}
                onClick={() => enviar(a.label)}
                className="card p-3 text-sm text-left flex items-start gap-2 hover:opacity-80 transition-opacity"
              >
                <Icon size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--color-marca)' }} />
                <span>{a.label}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {mensajes.map((m, i) => (
          <div
            key={i}
            className={cn('flex', m.rol === 'usuario' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn('max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed')}
              style={m.rol === 'usuario'
                ? { background: 'var(--color-marca)', color: 'white' }
                : { background: 'var(--bg-card)', border: '1px solid var(--border)' }
              }
            >
              <p className="whitespace-pre-wrap">{m.contenido}</p>
              <p className="text-xs mt-1 opacity-60">
                {m.timestamp.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {cargando && (
          <div className="flex justify-start">
            <div className="card px-4 py-3 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" style={{ color: 'var(--color-marca)' }} />
              <span className="text-sm" style={{ color: 'var(--text-secundario)' }}>Pensandoâ€¦</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="card p-3 flex gap-2">
        <input
          type="text"
          value={entrada}
          onChange={e => setEntrada(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }}
          placeholder="Pregunta algoâ€¦ ej. Â¿CÃ³mo cierro a Juan esta semana?"
          className="campo flex-1 text-sm"
          disabled={cargando}
        />
        <button
          onClick={() => enviar()}
          disabled={!entrada.trim() || cargando}
          className="btn-primario px-4 disabled:opacity-40 flex items-center gap-1.5"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  )
}
