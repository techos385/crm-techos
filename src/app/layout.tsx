// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Techos y Cubiertas CRM',
    template: '%s · Techos y Cubiertas',
  },
  description: 'Sistema de gestión de clientes para Techos y Cubiertas — arcotechos y estructuras metálicas en el Estado de México',
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? 'http://localhost:3000'),
  
  // Open Graph (para WhatsApp y redes sociales)
  openGraph: {
    title: 'Techos y Cubiertas — Arcotechos y Estructuras Metálicas',
    description: 'Especialistas en techos para escuelas, bodegas, canchas, albercas y naves industriales. +20 años de experiencia en el Estado de México.',
    type: 'website',
    locale: 'es_MX',
  },
  
  // PWA
  manifest: '/manifest.json',
  
  // Favicon
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#7cc2e8',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Script para aplicar tema ANTES de pintar (evita parpadeo) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var tema = localStorage.getItem('tema') || 'auto';
                var eOscuro = tema === 'oscuro' || (tema === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (eOscuro) document.documentElement.classList.add('dark');
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
