'use client'

// src/components/OnboardingProvider.tsx
// Tour de bienvenida por usuario Ã¢â‚¬â€ adaptado al rol

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
    titulo: 'Ã°Å¸â€˜â€¹ Bienvenido a tu CRM de ventas',
    descripcion: 'Este sistema tiene un solo objetivo: que cierres mÃƒÂ¡s ventas y no se te caiga ningÃƒÂºn cliente. Te mostramos lo esencial en 6 pasos rÃƒÂ¡pidos.',
  },
  {
    titulo: 'Ã°Å¸â€œâ€¹ Tu menÃƒÂº Ã¢â‚¬â€ aquÃƒÂ­ estÃƒÂ¡ todo',
    descripcion: 'En la barra de la izquierda (o abajo en celular) tienes acceso a todo: clientes, embudo, citas, pagos, tareas y mÃƒÂ¡s. Cada secciÃƒÂ³n tiene su propio color para que sepas de un vistazo dÃƒÂ³nde estÃƒÂ¡s.',
    elemento: '[data-tour="nav"]',
  },
  {
    titulo: 'Ã°Å¸â€Â¥ "Hoy te toca" Ã¢â‚¬â€ ÃƒÂ¡brelo cada maÃƒÂ±ana',
    descripcion: 'Esta es la pantalla mÃƒÂ¡s importante del dÃƒÂ­a. Te lista a quiÃƒÂ©n contactar hoy, ordenado por los mÃƒÂ¡s calientes primero. Si abres esto cada maÃƒÂ±ana y haces un seguimiento, las ventas llegan.',
    elemento: '[data-tour="seguimiento"]',
  },
  {
    titulo: 'Ã°Å¸â€Â El buscador Ã¢â‚¬â€ encuentra cualquier cliente al instante',
    descripcion: 'Presiona "/" o Ctrl+K desde cualquier pantalla para buscar por nombre, telÃƒÂ©fono, correo, nota o empresa. Lo que buscas, lo encuentra.',
    elemento: '[data-tour="buscador"]',
  },
  {
    titulo: 'Ã¢Å¾â€¢ "+ Nuevo" Ã¢â‚¬â€ agrega un cliente en segundos',
    descripcion: 'Este botÃƒÂ³n siempre estÃƒÂ¡ a la mano. Crea un cliente, una cita o un pago sin ir a buscar en el menÃƒÂº.',
    elemento: '[data-tour="nuevo"]',
  },
  {
    titulo: 'Ã°Å¸â€œÂ Expediente completo al hacer clic en el nombre',
    descripcion: 'En cualquier lista, al hacer clic en el nombre de un cliente abres su expediente completo: historial, pagos, citas, archivos y mÃƒÂ¡s. Ã‚Â¡Todo en un solo lugar!',
  },
  {
    titulo: 'Ã°Å¸Å½â€° Ã‚Â¡Listo para vender!',
    descripcion: 'Ya tienes todo lo que necesitas. Puedes volver a ver este tutorial en cualquier momento desde el botÃƒÂ³n "Ayuda" en la parte de arriba. Ã‚Â¡A cerrar ventas! Ã°Å¸Å¡â‚¬',
  },
]

const PASOS_VENDEDOR: Paso[] = [
  {
    titulo: 'Ã°Å¸â€˜â€¹ Bienvenido a Techos y Cubiertas CRM',
    descripcion: 'Este sistema tiene un solo objetivo: que cierres mÃƒÂ¡s ventas. Te mostramos lo esencial en 5 pasos.',
  },
  {
    titulo: 'Ã°Å¸â€Â¥ "Hoy te toca" Ã¢â‚¬â€ tu rutina diaria',
    descripcion: 'Cada maÃƒÂ±ana empieza aquÃƒÂ­: te dice exactamente a quiÃƒÂ©n contactar hoy, ordenado por los mÃƒÂ¡s calientes (Ã°Å¸â€Â¥) primero. Empieza siempre por los calientes.',
    elemento: '[data-tour="seguimiento"]',
  },
  {
    titulo: 'Ã°Å¸â€Â Busca cualquier cliente al instante',
    descripcion: 'Presiona "/" o Ctrl+K para buscar por nombre, telÃƒÂ©fono, empresa o nota. Nunca mÃƒÂ¡s buscando en listas largas.',
    elemento: '[data-tour="buscador"]',
  },
  {
    titulo: 'Ã¢Å¾â€¢ Agrega clientes y citas rÃƒÂ¡pido',
    descripcion: 'Con este botÃƒÂ³n creas clientes, citas o pagos en segundos. Siempre estÃƒÂ¡ visible.',
    elemento: '[data-tour="nuevo"]',
  },
  {
    titulo: 'Ã°Å¸â€œÂ± Los botones de WhatsApp y correo',
    descripcion: 'Dentro de cada expediente hay botones para mandar WhatsApp y correo con el mensaje ya armado segÃƒÂºn la etapa del cliente. Un clic y listo.',
  },
  {
    titulo: 'Ã°Å¸Å½Â¯ Ã‚Â¡A vender!',
    descripcion: 'Ya sabes lo esencial. El botÃƒÂ³n "Ayuda" en la parte de arriba te trae de vuelta a este tutorial cuando quieras. Ã‚Â¡Mucho ÃƒÂ©xito! Ã°Å¸Å¡â‚¬',
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

  // Verificar si el usuario ya completÃƒÂ³ el onboarding
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
    
    // TambiÃƒÂ©n guardar en la base
    try {
      await fetch('/api/usuarios/onboarding', { method: 'POST' })
    } catch {
      // No crÃƒÂ­tico si falla
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

                {/* NavegaciÃƒÂ³n */}
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
                        AtrÃƒÂ¡s
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
                        'Ã‚Â¡Listo! Ã°Å¸Å¡â‚¬'
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
