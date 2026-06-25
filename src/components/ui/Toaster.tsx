'use client'

// src/components/ui/Toaster.tsx
// Sistema de notificaciones toast

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastTipo = 'exito' | 'error' | 'aviso' | 'info'

export interface Toast {
  id: string
  tipo: ToastTipo
  mensaje: string
  duracion?: number
  accion?: { label: string; fn: () => void }
}

// Store global simple (sin Zustand para mantener dependencias mÃ­nimas)
type Listener = (toasts: Toast[]) => void
const listeners: Set<Listener> = new Set()
let toastsActivos: Toast[] = []

function emitir(toasts: Toast[]) {
  toastsActivos = toasts
  listeners.forEach(l => l(toasts))
}

export function toast(
  mensaje: string,
  opciones?: {
    tipo?: ToastTipo
    duracion?: number
    accion?: { label: string; fn: () => void }
  }
) {
  const id = Math.random().toString(36).slice(2)
  const nuevoToast: Toast = {
    id,
    tipo: opciones?.tipo ?? 'exito',
    mensaje,
    duracion: opciones?.duracion ?? 4000,
    accion: opciones?.accion,
  }
  emitir([...toastsActivos, nuevoToast])

  // Auto-remover
  if (nuevoToast.duracion && nuevoToast.duracion > 0) {
    setTimeout(() => {
      emitir(toastsActivos.filter(t => t.id !== id))
    }, nuevoToast.duracion)
  }

  return id
}

export function cerrarToast(id: string) {
  emitir(toastsActivos.filter(t => t.id !== id))
}

const ICONOS: Record<ToastTipo, React.ReactNode> = {
  exito:  <CheckCircle  className="w-5 h-5 text-green-500 flex-shrink-0" />,
  error:  <XCircle     className="w-5 h-5 text-red-500 flex-shrink-0" />,
  aviso:  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
  info:   <Info        className="w-5 h-5 text-blue-400 flex-shrink-0" />,
}

const ESTILOS: Record<ToastTipo, string> = {
  exito:  'border-l-green-500',
  error:  'border-l-red-500',
  aviso:  'border-l-amber-500',
  info:   'border-l-blue-400',
}

function ToastItem({ t }: { t: Toast }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex items-start gap-3 rounded-xl border-l-4 bg-white dark:bg-slate-800 shadow-modal p-4 pr-3 max-w-sm w-full pointer-events-auto',
        ESTILOS[t.tipo]
      )}
    >
      {ICONOS[t.tipo]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{t.mensaje}</p>
        {t.accion && (
          <button
            onClick={() => { t.accion!.fn(); cerrarToast(t.id) }}
            className="mt-1 text-sm font-semibold text-marca-500 hover:text-marca-600 underline"
          >
            {t.accion.label}
          </button>
        )}
      </div>
      <button
        onClick={() => cerrarToast(t.id)}
        className="ml-1 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors"
        aria-label="Cerrar"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const listener: Listener = (t) => setToasts([...t])
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, [])

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map(t => (
          <ToastItem key={t.id} t={t} />
        ))}
      </AnimatePresence>
    </div>
  )
}export function useToast() {
  const agregar = ({ tipo, titulo, mensaje }: { tipo: ToastTipo; titulo: string; mensaje: string }) => {
    toast(titulo + (mensaje ? ': ' + mensaje : ''), { tipo })
  }
  return { agregar }
}
