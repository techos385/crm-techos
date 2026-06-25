'use client'
// src/components/marketing/CompartirContenido.tsx

import { useState, useEffect, useRef } from 'react'
import { Copy, Check, ExternalLink, QrCode, Link2, Share2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toaster'

interface Vendedor {
  id: string
  nombre: string
  slug: string
}

const BASES_UTM = [
  { canal: 'WhatsApp', utm: 'whatsapp', icono: 'Ã°Å¸â€™Â¬', color: '#25D366' },
  { canal: 'Facebook', utm: 'facebook', icono: 'Ã°Å¸â€œËœ', color: '#1877F2' },
  { canal: 'Instagram', utm: 'instagram', icono: 'Ã°Å¸â€œÂ¸', color: '#E4405F' },
  { canal: 'Google', utm: 'google_ads', icono: 'Ã°Å¸â€Â', color: '#4285F4' },
  { canal: 'Volante / QR', utm: 'impreso', icono: 'Ã°Å¸â€œâ€ž', color: '#6B7280' },
  { canal: 'Referido', utm: 'referido', icono: 'Ã°Å¸Â¤Â', color: '#7cc2e8' },
]

export function CompartirContenido() {
  const { agregar } = useToast()
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [vendedorSel, setVendedorSel] = useState<Vendedor | null>(null)
  const [cargando, setCargando] = useState(true)
  const [copiados, setCopiados] = useState<Record<string, boolean>>({})
  const [qrUrl, setQrUrl] = useState('')
  const [generandoQr, setGenerandoQr] = useState(false)

  useEffect(() => {
    fetch('/api/usuarios')
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          const vs = (d.data || []).map((u: { id: string; nombre: string }) => ({
            id: u.id,
            nombre: u.nombre,
            slug: u.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          }))
          setVendedores(vs)
          if (vs.length > 0) setVendedorSel(vs[0])
        }
      })
      .finally(() => setCargando(false))
  }, [])

  const base = typeof window !== 'undefined' ? window.location.origin : 'https://tu-dominio.com'

  const urlAgenda = (v: Vendedor) => `${base}/agenda/${v.slug}`

  const urlConUtm = (v: Vendedor, utm: string) =>
    `${base}/landing?vendedor=${v.slug}&utm_source=${utm}&utm_medium=crm&utm_campaign=captacion`

  const copiar = async (texto: string, key: string) => {
    await navigator.clipboard.writeText(texto)
    setCopiados(prev => ({ ...prev, [key]: true }))
    setTimeout(() => setCopiados(prev => ({ ...prev, [key]: false })), 2000)
    agregar({ tipo: 'exito', titulo: 'Enlace copiado Ã¢Å“â€œ', mensaje: '' })
  }

  const generarQr = async (url: string) => {
    setGenerandoQr(true)
    // Usamos la API gratuita de QR Code
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}&color=7cc2e8&bgcolor=FFFFFF`
    setQrUrl(qrApiUrl)
    setGenerandoQr(false)
  }

  useEffect(() => {
    if (vendedorSel) generarQr(urlAgenda(vendedorSel))
  }, [vendedorSel])

  if (cargando) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={28} className="animate-spin" style={{ color: 'var(--color-marca)' }} />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Selector de vendedor */}
      <div className="card p-4 space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Share2 size={18} style={{ color: 'var(--color-marca)' }} />
          Links de captura por vendedor
        </h3>
        <div className="flex flex-wrap gap-2">
          {vendedores.map(v => (
            <button
              key={v.id}
              onClick={() => setVendedorSel(v)}
              className={cn('px-4 py-2 rounded-xl text-sm font-medium transition-all border')}
              style={vendedorSel?.id === v.id
                ? { background: 'var(--color-marca)', color: 'white', borderColor: 'var(--color-marca)' }
                : { borderColor: 'var(--border)' }
              }
            >
              {v.nombre}
            </button>
          ))}
        </div>
      </div>

      {vendedorSel && (
        <>
          {/* Link de agenda personal */}
          <div className="card p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Link2 size={18} style={{ color: 'var(--color-marca)' }} />
              Agenda de {vendedorSel.nombre}
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secundario)' }}>
              Comparte este link para que los clientes agenden directamente con {vendedorSel.nombre.split(' ')[0]}.
            </p>
            <div className="flex items-center gap-2 p-3 rounded-xl font-mono text-sm" style={{ background: 'var(--bg-hover)' }}>
              <span className="flex-1 truncate">{urlAgenda(vendedorSel)}</span>
              <button onClick={() => copiar(urlAgenda(vendedorSel), 'agenda')} className="shrink-0">
                {copiados['agenda'] ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              </button>
              <a href={urlAgenda(vendedorSel)} target="_blank" rel="noopener noreferrer" className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
                <ExternalLink size={16} />
              </a>
            </div>
          </div>

          {/* QR Code */}
          <div className="card p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <QrCode size={18} style={{ color: 'var(--color-marca)' }} />
              CÃƒÂ³digo QR para imprimir
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secundario)' }}>
              Imprime o comparte este QR en volantes, tarjetas o WhatsApp.
            </p>
            <div className="flex items-center gap-4">
              {generandoQr ? (
                <div className="w-32 h-32 flex items-center justify-center rounded-xl" style={{ background: 'var(--bg-hover)' }}>
                  <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-marca)' }} />
                </div>
              ) : qrUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrUrl} alt="QR Code" className="w-32 h-32 rounded-xl" />
              ) : null}
              <div className="space-y-2">
                <p className="text-sm font-medium">{vendedorSel.nombre}</p>
                <p className="text-xs" style={{ color: 'var(--text-secundario)' }}>Escanea para agendar</p>
                {qrUrl && (
                  <a href={qrUrl} download={`qr-${vendedorSel.slug}.png`}
                    className="btn-primario text-xs py-2 px-4 inline-flex items-center gap-1.5">
                    Ã¢â€ â€œ Descargar QR
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Links con UTM por canal */}
          <div className="card p-4 space-y-3">
            <h3 className="font-semibold">Links por canal de captaciÃƒÂ³n</h3>
            <p className="text-sm" style={{ color: 'var(--text-secundario)' }}>
              Usa links diferentes por canal para saber de dÃƒÂ³nde vienen tus leads.
            </p>
            <div className="space-y-2">
              {BASES_UTM.map(canal => {
                const url = urlConUtm(vendedorSel, canal.utm)
                const key = `utm-${canal.utm}`
                return (
                  <div key={canal.utm} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-hover)' }}>
                    <span className="text-xl">{canal.icono}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{canal.canal}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-secundario)' }}>{url}</p>
                    </div>
                    <button onClick={() => copiar(url, key)} className="shrink-0 p-2 rounded-lg hover:opacity-70 transition-opacity">
                      {copiados[key] ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Mensaje de WhatsApp listo */}
          <div className="card p-4 space-y-3">
            <h3 className="font-semibold">Ã°Å¸â€™Â¬ Mensaje de WhatsApp listo</h3>
            <p className="text-sm" style={{ color: 'var(--text-secundario)' }}>
              Copia este mensaje y mÃƒÂ¡ndalo a tus grupos o contactos:
            </p>
            <div className="p-3 rounded-xl text-sm whitespace-pre-wrap" style={{ background: 'var(--bg-hover)' }}>
              {`Ã‚Â¡Hola! Ã°Å¸â€˜â€¹ Soy ${vendedorSel.nombre} de Techos y Cubiertas.

Instalamos arcotechos y estructuras metÃƒÂ¡licas en Ecatepec y zona norte del EdoMex. Ã¢Å“â€¦

Si quieres una cotizaciÃƒÂ³n gratis o tienes dudas, agenda una visita aquÃƒÂ­:
${urlAgenda(vendedorSel)}

Ã‚Â¡Respondemos rÃƒÂ¡pido! Ã°Å¸Å¡â‚¬`}
            </div>
            <button
              onClick={() => copiar(
                `Ã‚Â¡Hola! Ã°Å¸â€˜â€¹ Soy ${vendedorSel.nombre} de Techos y Cubiertas.\n\nInstalamos arcotechos y estructuras metÃƒÂ¡licas en Ecatepec y zona norte del EdoMex. Ã¢Å“â€¦\n\nSi quieres una cotizaciÃƒÂ³n gratis o tienes dudas, agenda una visita aquÃƒÂ­:\n${urlAgenda(vendedorSel)}\n\nÃ‚Â¡Respondemos rÃƒÂ¡pido! Ã°Å¸Å¡â‚¬`,
                'mensaje-wa'
              )}
              className="btn-primario w-full flex items-center justify-center gap-2"
            >
              {copiados['mensaje-wa'] ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar mensaje</>}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
