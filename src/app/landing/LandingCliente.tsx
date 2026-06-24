'use client'
// src/app/landing/LandingCliente.tsx

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Phone, Star, ChevronDown, Send } from 'lucide-react'

const BENEFICIOS = [
  { icono: '🏗️', titulo: 'Más de 20 años de experiencia', desc: 'Cientos de proyectos en la zona norte del EdoMex' },
  { icono: '📐', titulo: 'Visita y cotización sin costo', desc: 'Medimos, diseñamos y te damos precio sin compromiso' },
  { icono: '🔩', titulo: 'Material de primera calidad', desc: 'Acero galvanizado y policarbonato con garantía' },
  { icono: '⚡', titulo: 'Instalación rápida', desc: 'La mayoría de proyectos listos en 3–5 días' },
]

const FAQS = [
  { p: '¿Cuánto cuesta un arcotecho?', r: 'El precio depende del tamaño y material. Un arcotecho de 4×6 m empieza desde $18,000 MXN instalado. Pide tu cotización gratis y te damos el precio exacto para tu espacio.' },
  { p: '¿Hacen trabajo en toda la zona metropolitana?', r: 'Sí, atendemos Ecatepec, Tlalnepantla, Nezahualcóyotl, Tultitlán, Zumpango y toda la zona norte del Estado de México.' },
  { p: '¿Cuánto tarda la instalación?', r: 'Proyectos sencillos: 1–2 días. Estructuras grandes o techados completos: 3–7 días, según el tamaño.' },
  { p: '¿Tienen garantía?', r: 'Sí. Garantizamos la mano de obra y materiales. Si algo falla por instalación, lo reparamos sin costo.' },
]

export function LandingCliente() {
  const params = useSearchParams()
  const vendedor = params.get('vendedor') || ''
  const utmSource = params.get('utm_source') || 'directo'

  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    tipoObra: '',
    zona: '',
  })
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')
  const [faqAbierto, setFaqAbierto] = useState<number | null>(null)

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const enviar = async () => {
    if (!form.nombre.trim() || !form.telefono.trim()) {
      setError('Nombre y teléfono son requeridos')
      return
    }
    setError('')
    setEnviando(true)
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre,
          telefono: form.telefono,
          zonaUbicacion: form.zona,
          tipoObra: form.tipoObra,
          origen: utmSource || 'Landing',
          notas: `Lead desde landing. Vendedor: ${vendedor || 'sin asignar'}. Canal: ${utmSource}`,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setEnviado(true)
      } else {
        setError(data.mensaje || 'Error al enviar. Intenta de nuevo.')
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primario)', color: 'var(--text-primario)' }}>
      {/* Hero */}
      <div className="text-center px-4 py-16" style={{ background: 'linear-gradient(135deg, #7cc2e8 0%, #5ba8d0 100%)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-5xl mb-4">🏗️</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Techos y Cubiertas
          </h1>
          <p className="text-white/90 text-lg mb-2">
            Arcotechos · Estructuras metálicas · Techados industriales
          </p>
          <p className="text-white/80 text-sm mb-8">
            📍 Ecatepec y zona norte del Estado de México
          </p>

          {/* Estrellas */}
          <div className="flex justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => <Star key={i} size={20} fill="white" color="white" />)}
            <span className="text-white ml-2">+200 proyectos completados</span>
          </div>

          {/* CTA rápida */}
          <a
            href="https://wa.me/527712345678?text=Hola%2C%20quiero%20una%20cotizaci%C3%B3n%20gratis"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-[#7cc2e8] font-bold py-4 px-8 rounded-2xl text-lg shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5"
          >
            💬 Cotiza por WhatsApp
          </a>
          <p className="text-white/70 text-sm mt-3">Respondemos en menos de 1 hora</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12 space-y-12">
        {/* Beneficios */}
        <div>
          <h2 className="text-2xl font-bold text-center mb-6">¿Por qué elegirnos?</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {BENEFICIOS.map(b => (
              <div key={b.titulo} className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <span className="text-2xl">{b.icono}</span>
                <div>
                  <p className="font-semibold">{b.titulo}</p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-secundario)' }}>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Formulario de contacto */}
        <div id="contacto" className="rounded-3xl p-6 sm:p-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {enviado ? (
            <div className="text-center py-8">
              <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
              <h3 className="text-2xl font-bold mb-2">¡Recibimos tu solicitud!</h3>
              <p style={{ color: 'var(--text-secundario)' }}>
                Te contactaremos en menos de 1 hora por WhatsApp o teléfono para coordinar tu visita gratuita.
              </p>
              <a
                href="https://wa.me/527712345678?text=Hola%2C%20acabo%20de%20llenar%20el%20formulario"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-6 font-semibold py-3 px-6 rounded-xl"
                style={{ background: 'var(--color-marca)', color: 'white' }}
              >
                💬 También escríbenos por WhatsApp
              </a>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-2">Solicita tu cotización gratis</h2>
              <p className="mb-6" style={{ color: 'var(--text-secundario)' }}>
                Sin compromiso. Te visitamos, medimos y te damos el precio exacto.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Tu nombre <span className="text-red-500">*</span></label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border text-base"
                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                    placeholder="¿Cómo te llamas?"
                    value={form.nombre}
                    onChange={e => set('nombre', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">WhatsApp o teléfono <span className="text-red-500">*</span></label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border text-base"
                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                    placeholder="55 1234 5678"
                    type="tel"
                    value={form.telefono}
                    onChange={e => set('telefono', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">¿Qué necesitas?</label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border text-base"
                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                    value={form.tipoObra}
                    onChange={e => set('tipoObra', e.target.value)}
                  >
                    <option value="">Selecciona...</option>
                    <option value="Arcotecho">Arcotecho</option>
                    <option value="Techado metálico">Techado metálico</option>
                    <option value="Estructura industrial">Estructura industrial</option>
                    <option value="Cochera">Cochera</option>
                    <option value="Pérgola">Pérgola</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">¿En qué municipio o colonia?</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border text-base"
                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                    placeholder="Ej. Ecatepec, Col. Las Américas"
                    value={form.zona}
                    onChange={e => set('zona', e.target.value)}
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}

                <button
                  onClick={enviar}
                  disabled={enviando}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold text-lg transition-all hover:-translate-y-0.5 disabled:opacity-60"
                  style={{ background: 'var(--color-marca)' }}
                >
                  {enviando ? 'Enviando…' : <><Send size={20} /> Quiero mi cotización gratis</>}
                </button>

                <p className="text-center text-xs" style={{ color: 'var(--text-secundario)' }}>
                  🔒 Tu información es privada. Solo la usamos para contactarte.
                </p>
              </div>
            </>
          )}
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-2xl font-bold mb-4 text-center">Preguntas frecuentes</h2>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <button
                  onClick={() => setFaqAbierto(faqAbierto === i ? null : i)}
                  className="w-full text-left p-4 flex items-center justify-between font-medium"
                >
                  {faq.p}
                  <ChevronDown
                    size={18}
                    className="shrink-0 transition-transform"
                    style={{ transform: faqAbierto === i ? 'rotate(180deg)' : 'rotate(0)' }}
                  />
                </button>
                {faqAbierto === i && (
                  <div className="px-4 pb-4 text-sm" style={{ color: 'var(--text-secundario)' }}>
                    {faq.r}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA final */}
        <div className="rounded-3xl p-8 text-center" style={{ background: 'var(--color-marca)' }}>
          <h2 className="text-2xl font-bold text-white mb-2">¿Listo para empezar?</h2>
          <p className="text-white/80 mb-6">Visita sin costo · Presupuesto en el día · Sin letras chiquitas</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://wa.me/527712345678?text=Hola%2C%20quiero%20una%20cotizaci%C3%B3n"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-white font-bold py-3 px-6 rounded-xl"
              style={{ color: 'var(--color-marca)' }}
            >
              💬 WhatsApp
            </a>
            <a
              href="tel:+527712345678"
              className="flex items-center justify-center gap-2 bg-white/20 text-white font-bold py-3 px-6 rounded-xl"
            >
              <Phone size={18} /> Llamar ahora
            </a>
          </div>
        </div>

        {/* Footer mínimo */}
        <div className="text-center text-sm pb-8" style={{ color: 'var(--text-secundario)' }}>
          <p>Techos y Cubiertas · Ecatepec, Estado de México</p>
          <p className="mt-1">© {new Date().getFullYear()} · Todos los derechos reservados</p>
        </div>
      </div>
    </div>
  )
}
