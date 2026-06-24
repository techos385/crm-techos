// src/app/agenda/[slug]/page.tsx
// Página pública de agendamiento por vendedor

import { Suspense } from 'react'
import { AgendaPublica } from './AgendaPublica'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  return {
    title: `Agenda tu visita · Techos y Cubiertas`,
    description: 'Agenda una visita gratuita con nuestros asesores. Sin compromiso.',
  }
}

export default function AgendaVendedorPage({ params }: { params: { slug: string } }) {
  return (
    <Suspense>
      <AgendaPublica slug={params.slug} />
    </Suspense>
  )
}
