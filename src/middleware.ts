// src/middleware.ts
// ProtecciÃ³n de rutas â€” redirige a login si no hay sesiÃ³n

import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

// Rutas pÃºblicas que no requieren sesiÃ³n
const RUTAS_PUBLICAS = [
  '/login',
  '/landing',
  '/agenda/', // pÃ¡ginas pÃºblicas de agendamiento
  '/api/auth',
  '/api/citas/publica', // endpoint pÃºblico para agendar
  '/_next',
  '/favicon.ico',
  '/manifest.json',
]

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Verificar si es ruta pÃºblica
  const esPublica = RUTAS_PUBLICAS.some((ruta) => pathname.startsWith(ruta))

  if (esPublica) {
    return NextResponse.next()
  }

  // Si no hay sesiÃ³n, redirigir al login
  if (!req.auth) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Proteger rutas de admin
  if (pathname.startsWith('/admin') && req.auth.user?.rol !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/).*)',
  ],
}
