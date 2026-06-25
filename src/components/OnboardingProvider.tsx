'use client'

// src/components/OnboardingProvider.tsx
// Tour de bienvenida por usuario â€” adaptado al rol

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { ChevronRight, ChevronLeft, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Paso {
  titulo: string
  descripcion: string
  elemento?: string  // selector CSS del elemento a resaltar
  posicion?: 'top' | 'bottom' | 'left' | 'right'
  soloAdmin?: boolean
  soloVendedor?: boolean
}

const PASOS_ADMIN: Paso[] = [
  {
    titulo: 'ðŸ‘‹ Bienvenido a tu CRM de ventas',
    descripcion: 'Este sistema tiene un solo objetivo: que cierres mÃ¡s ventas y no se te caiga ningÃºn cliente. Te mostramos lo esencial en 6 pasos rÃ¡pidos.',
  },
  {
    titulo: 'ðŸ“‹ Tu menÃº â€” aquÃ­ estÃ¡ todo',
    descripcion: 'En la barra de la izquierda (o abajo en celular) tienes acceso a todo: clientes, embudo, citas, pagos, tareas y mÃ¡s. Cada secciÃ³n tiene su propio color para que sepas de un vistazo dÃ³nde estÃ¡s.',
    elemento: '[data-tour="nav"]',
  },
  {
    titulo: 'ðŸ”¥ "Hoy te toca" â€” Ã¡brelo cada maÃ±ana',
    descripcion: 'Esta es la pantalla mÃ¡s importante del dÃ­a. Te lista a quiÃ©n contactar hoy, ordenado por los mÃ¡s calientes primero. Si abres esto cada maÃ±ana y haces un seguimiento, las ventas llegan.',
    elemento: '[data-tour="seguimiento"]',
  },
  {
    titulo: 'ðŸ” El buscador â€” encuentra cualquier cliente al instante',
    descripcion: 'Presiona "/" o Ctrl+K desde cualquier pantalla para buscar por nombre, telÃ©fono, correo, nota o empresa. Lo que buscas, lo encuentra.',
    elemento: '[data-tour="buscador"]',
  },
  {
    titulo: 'âž• "+ Nuevo" â€” agrega un cliente en segundos',
    descripcion: 'Este botÃ³n siempre estÃ¡ a la mano. Crea un cliente, una cita o un pago sin ir a buscar en el menÃº.',
    elemento: '[data-tour="nuevo"]',
  },
  {
    titulo: 'ðŸ“ Expediente completo al hacer clic en el nombre',
    descripcion: 'En cualquier lista, al hacer clic en el nombre de un cliente abres su expediente completo: historial, pagos, citas, archivos y mÃ¡s. Â¡Todo en un solo lugar!',
  },
  {
    titulo: 'ðŸŽ‰ Â¡Listo para vender!',
    descripcion: 'Ya tienes todo lo que necesitas. Puedes volver a ver este tutorial en cualquier momento desde el botÃ³n "Ayuda" en la parte de arriba. Â¡A cerrar ventas! ðŸš€',
  },
]

const PASOS_VENDEDOR: Paso[] = [
  {
    titulo: 'ðŸ‘‹ Bienvenido a Techos y Cubiertas CRM',
    descripcion: 'Este sistema tiene un solo objetivo: que cierres mÃ¡s ventas. Te mostramos lo esencial en 5 pasos.',
  },
  {
    titulo: 'ðŸ”¥ "Hoy te toca" â€” tu rutina diaria',
    descripcion: 'Cada maÃ±ana empieza aquÃ­: te dice exactamente a quiÃ©n contactar hoy, ordenado por los mÃ¡s calientes (ðŸ”¥) primero. Empieza siempre por los calientes.',
    elemento: '[data-tour="seguimiento"]',
  },
  {
    titulo: 'ðŸ” Busca cualquier cliente al instante',
    descripcion: 'Presiona "/" o Ctrl+K para buscar por nombre, telÃ©fono, empresa o nota. Nunca mÃ¡s buscando en listas largas.',
    elemento: '[data-tour="buscador"]',
  },
  {
    titulo: 'âž• Agrega clientes y citas rÃ¡pido',
    descripcion: 'Con este botÃ³n creas clientes, citas o pagos en segundos. Siempre estÃ¡ visible.',
    elemento: '[data-tour="nuevo"]',
  },
  {
    titulo: 'ðŸ“± Los botones de WhatsApp y correo',
    descripcion: 'Dentro de cada expediente hay botones para mandar WhatsApp y correo con el mensaje ya armado segÃºn la etapa del cliente. Un clic y listo.',
  },
  {
    titulo: 'ðŸŽ¯ Â¡A vender!',
    descripcion: 'Ya sabes lo esencial. El botÃ³n "Ayuda" en la parte de arriba te trae de vuelta a este tutorial cuando quieras. Â¡Mucho Ã©xito! ðŸš€',
  },
]

interface OnboardingContextType {
  mostrarTour: () => void
  ocultarTour: () => void
  tourVisible: boolean
}

const OnboardingCtx = createContext<OnboardingContextType>({
  mostrarTour: () => {},
  ocultarTour: () => {},
  tourVisible: false,
})

export function useOnboarding() {
  return useContext(OnboardingCtx)
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [tourVisible, setTourVisible] = useState(false)
  const [pasoActual, setPasoActual] = useState(0)
  const [yaVisto, setYaVisto] = useState(true)

  const esAdmin = session?.user?.rol === 'ADMIN'
  const pasos = esAdmin ? PASOS_ADMIN : PASOS_VENDEDOR

  // Verificar si el usuario ya completÃ³ el onboarding
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return
    
    const key = `onboarding_${session.user.id}`
    const completado = localStorage.getItem(key)
    
    if (!completado) {
      setYaVisto(false)
      // Esperar un momento antes de mostrar el tour
      setTimeout(() => setTourVisible(true), 1000)
    }
  }, [status, session?.user?.id])

  const marcarCompletado = useCallback(async () => {
    if (!session?.user?.id) return
    const key = `onboarding_${session.user.id}`
    localStorage.setItem(key, 'true')
    
    // TambiÃ©n guardar en la base
    try {
      await fetch('/api/usuarios/onboarding', { method: 'POST' })
    } catch {
      // No crÃ­tico si falla
    }
  }, [session?.user?.id])

  const mostrarTour = useCallback(() => {
    setPasoActual(0)
    setTourVisible(true)
  }, [])

  const ocultarTour = useCallback(() => {
    setTourVisible(false)
    if (!yaVisto) {
      setYaVisto(true)
      marcarCompletado()
    }
  }, [yaVisto, marcarCompletado])

  const siguiente = useCallback(() => {
    if (pasoActual < pasos.length - 1) {
      setPasoActual(p => p + 1)
    } else {
      ocultarTour()
    }
  }, [pasoActual, pasos.length, ocultarTour])

  const anterior = useCallback(() => {
    if (pasoActual > 0) setPasoActual(p => p - 1)
  }, [pasoActual])

  const paso = pasos[pasoActual]

  return (
    <OnboardingCtx.Provider value={{ mostrarTour, ocultarTour, tourVisible }}>
      {children}

      <AnimatePresence>
        {tourVisible && paso && (
          <>
            {/* Overlay oscuro */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
              onClick={ocultarTour}
            />

            {/* Panel del tour */}
            <motion.div
              key={pasoActual}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed z-[101] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md"
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-modal p-6 border border-slate-200 dark:border-slate-700">
                {/* Cerrar */}
                <button
                  onClick={ocultarTour}
                  className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label="Saltar tutorial"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Progreso */}
                <div className="flex gap-1.5 mb-5">
                  {pasos.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-1 flex-1 rounded-full transition-all duration-300',
                        i <= pasoActual ? 'bg-marca-300' : 'bg-slate-200 dark:bg-slate-700'
                      )}
                    />
                  ))}
                </div>

                {/* Contenido */}
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {paso.titulo}
                </h3>
                <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                  {paso.descripcion}
                </p>

                {/* NavegaciÃ³n */}
                <div className="flex items-center justify-between mt-6 gap-3">
                  <button
                    onClick={ocultarTour}
                    className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    Saltar tutorial
                  </button>

                  <div className="flex gap-2">
                    {pasoActual > 0 && (
                      <button
                        onClick={anterior}
                        className="btn-secundario py-2 px-4 text-sm"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        AtrÃ¡s
                      </button>
                    )}
                    <button
                      onClick={siguiente}
                      className="btn-primario py-2 px-4 text-sm"
                    >
                      {pasoActual < pasos.length - 1 ? (
                        <>
                          Siguiente
                          <ChevronRight className="w-4 h-4" />
                        </>
                      ) : (
                        'Â¡Listo! ðŸš€'
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-center text-xs text-slate-400 mt-3">
                  Paso {pasoActual + 1} de {pasos.length}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </OnboardingCtx.Provider>
  )
}
