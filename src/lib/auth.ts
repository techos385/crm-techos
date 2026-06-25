// src/lib/auth.ts
// ConfiguraciÃ³n de autenticaciÃ³n con NextAuth v5

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { z } from 'zod'

const LoginSchema = z.object({
  correo: z.string().email('Correo invÃ¡lido'),
  contrasena: z.string().min(1, 'La contraseÃ±a es requerida'),
})

// LÃ­mite de intentos de login (5 intentos en 15 minutos)
async function verificarRateLimit(correo: string, ip: string | null): Promise<boolean> {
  const hace15min = new Date(Date.now() - 15 * 60 * 1000)
  const intentos = await prisma.intentoLogin.count({
    where: {
      correo,
      exitoso: false,
      creadoEn: { gte: hace15min },
    },
  })
  return intentos < 5
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        correo: { label: 'Correo', type: 'email' },
        contrasena: { label: 'ContraseÃ±a', type: 'password' },
      },
      async authorize(credentials, request) {
        const ip = request?.headers?.get('x-forwarded-for') ?? null

        // Validar formato
        const parsed = LoginSchema.safeParse({
          correo: credentials?.correo,
          contrasena: credentials?.contrasena,
        })
        if (!parsed.success) return null

        const { correo, contrasena } = parsed.data

        // Rate limiting
        const permitido = await verificarRateLimit(correo, ip)
        if (!permitido) {
          // Registrar intento bloqueado
          await prisma.intentoLogin.create({
            data: { correo, ip, exitoso: false }
          })
          throw new Error('Demasiados intentos. Espera 15 minutos.')
        }

        // Buscar usuario
        const usuario = await prisma.usuario.findUnique({
          where: { correo }
        })

        // IMPORTANTE: siempre hacer la comparaciÃ³n aunque no exista el usuario
        // para no revelar si el correo existe o no
        const contrasenaDummy = '$2b$12$dummy.hash.that.never.matches.anything.real'
        const hashComparar = usuario?.contrasenaHash ?? contrasenaDummy
        const esValida = await bcrypt.compare(contrasena, hashComparar)

        if (!usuario || !esValida) {
          await prisma.intentoLogin.create({
            data: { correo, ip, exitoso: false }
          })
          return null
        }

        if (!usuario.activo) {
          throw new Error('Esta cuenta estÃ¡ desactivada. Contacta al administrador.')
        }

        // Login exitoso
        await prisma.intentoLogin.create({
          data: { correo, ip, exitoso: true }
        })

        // Registrar en auditorÃ­a
        await prisma.registroAuditoria.create({
          data: {
            usuarioId: usuario.id,
            accion: 'inicio_sesion',
            detalle: `${usuario.nombre} iniciÃ³ sesiÃ³n`,
            ip,
          }
        })

        return {
          id: usuario.id,
          name: usuario.nombre,
          email: usuario.correo,
          // Campos extra que necesitamos en el token
          rol: usuario.rol,
          activo: usuario.activo,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.rol = (user as { rol: string }).rol
        token.activo = (user as { activo: boolean }).activo
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.rol = token.rol as string
        session.user.activo = token.activo as boolean
      }
      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  secret: process.env.AUTH_SECRET,
})

// ExtensiÃ³n de tipos para TypeScript
declare module 'next-auth' {
  interface User {
    rol?: string
    activo?: boolean
  }
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      rol: string
      activo: boolean
    }
  }
}
