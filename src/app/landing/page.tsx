// src/app/landing/page.tsx
// Landing pública de captura de leads — sin autenticación

import { Suspense } from 'react'
import { LandingCliente } from './LandingCliente'

export const metadata = {
  title: 'Techos y Cubiertas — Cotización Gratis',
  description: 'Arcotechos y estructuras metálicas en Ecatepec. Más de 20 años de experiencia. Solicita tu cotización sin costo.',
}

export default function LandingPage() {
  return (
    <Suspense>
      <LandingCliente />
    </Suspense>
  )
}
