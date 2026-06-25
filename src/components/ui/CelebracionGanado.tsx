'use client'
// src/components/ui/CelebracionGanado.tsx

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  nombre: string
  valor?: number | null
}

export function CelebracionGanado({ nombre, valor }: Props) {
  const [visible, setVisible] = useState(true)
  const [prefersMenos, setPrefersMenos] = useState(false)

  useEffect(() => {
    setPrefersMenos(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    const t = setTimeout(() => setVisible(false), 3000)
    return () => clearTimeout(t)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          {/* Confetti (solo si no prefiere menos movimiento) */}
          {!prefersMenos && (
            <div className="absolute inset-0 overflow-hidden">
              {Array.from({ length: 30 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 rounded-sm"
                  style={{
                    background: ['#7cc2e8', '#fbbf24', '#34d399', '#f87171', '#a78bfa'][i % 5],
                    left: `${Math.random() * 100}%`,
                    top: '-10px',
                  }}
                  animate={{
                    y: ['0vh', '110vh'],
                    rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                    x: [`${(Math.random() - 0.5) * 200}px`],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 1,
                    delay: Math.random() * 0.5,
                    ease: 'easeIn',
                  }}
                />
              ))}
            </div>
          )}

          {/* Mensaje de celebraciÃƒÂ³n */}
          <motion.div
            initial={prefersMenos ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
            animate={prefersMenos ? { opacity: 1 } : { scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 12 }}
            className="card p-8 text-center max-w-sm mx-4 shadow-2xl"
          >
            <div className="text-5xl mb-3">Ã°Å¸Å½â€°</div>
            <h2 className="text-2xl font-bold mb-1">Ã‚Â¡Cerraste a {nombre}!</h2>
            {valor && (
              <p className="text-xl font-semibold" style={{ color: 'var(--color-marca)' }}>
                +${valor.toLocaleString('es-MX')}
              </p>
            )}
            <p className="text-sm mt-2" style={{ color: 'var(--text-secundario)' }}>
              Excelente trabajo. Ã‚Â¡Sigue asÃƒÂ­! Ã°Å¸Å¡â‚¬
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
