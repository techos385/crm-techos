// src/app/agenda-publica/page.tsx
// Lista de links del equipo — sin autenticación

export const metadata = {
  title: 'Equipo · Techos y Cubiertas',
  description: 'Agenda con uno de nuestros asesores.',
}

async function getVendedores() {
  // Esta página se renderiza server-side pero necesitamos los vendedores
  // En producción esto haría una query directa
  return []
}

export default async function AgendaPublicaPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'var(--bg-primario)' }}>
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="text-4xl">🏗️</div>
        <h1 className="text-2xl font-bold">Techos y Cubiertas</h1>
        <p style={{ color: 'var(--text-secundario)' }}>Elige a tu asesor para agendar una visita gratuita:</p>

        <div className="space-y-3">
          {/* Los slugs reales se generan en /compartir */}
          <a
            href="/agenda/maria-garcia"
            className="block card p-4 hover:opacity-80 transition-opacity"
          >
            <p className="font-semibold">María García</p>
            <p className="text-sm" style={{ color: 'var(--text-secundario)' }}>Asesora de ventas</p>
          </a>
          <a
            href="/agenda/carlos-lopez"
            className="block card p-4 hover:opacity-80 transition-opacity"
          >
            <p className="font-semibold">Carlos López</p>
            <p className="text-sm" style={{ color: 'var(--text-secundario)' }}>Asesor de ventas</p>
          </a>
        </div>

        <a href="/landing" className="text-sm underline" style={{ color: 'var(--text-secundario)' }}>
          O solicita cotización directa →
        </a>
      </div>
    </div>
  )
}
