// src/lib/permisos.ts
// Función central de autorización — usada en TODAS las rutas de API

import { auth } from './auth'
import { redirect } from 'next/navigation'

export type Accion =
  | 'ver_todo'
  | 'editar_todo'
  | 'ver_cliente'
  | 'editar_cliente'
  | 'borrar_cliente'
  | 'ver_pago'
  | 'editar_pago'
  | 'ver_cita'
  | 'editar_cita'
  | 'gestionar_usuarios'
  | 'ver_auditoria'
  | 'exportar_todo'
  | 'respaldar'
  | 'vaciar_papelera'
  | 'ver_equipo'

/**
 * Verifica si el usuario actual puede realizar una acción sobre un recurso.
 * SIEMPRE se llama en el servidor, nunca se confía en el cliente.
 */
export async function puede(
  accion: Accion,
  opciones?: {
    recursoVendedorId?: string | null
    redirigirSiNoAuth?: boolean
  }
): Promise<{ autorizado: boolean; usuario: SessionUsuario | null; razon?: string }> {
  const session = await auth()

  if (!session?.user) {
    if (opciones?.redirigirSiNoAuth) {
      redirect('/login')
    }
    return { autorizado: false, usuario: null, razon: 'No autenticado' }
  }

  const usuario: SessionUsuario = {
    id: session.user.id,
    nombre: session.user.name ?? '',
    correo: session.user.email ?? '',
    rol: session.user.rol as 'ADMIN' | 'VENDEDOR' | 'SOLO_LECTURA',
    activo: session.user.activo,
  }

  if (!usuario.activo) {
    return { autorizado: false, usuario, razon: 'Cuenta desactivada' }
  }

  // ADMIN puede hacer todo
  if (usuario.rol === 'ADMIN') {
    return { autorizado: true, usuario }
  }

  // SOLO_LECTURA solo puede ver
  if (usuario.rol === 'SOLO_LECTURA') {
    const acciones_lectura: Accion[] = ['ver_cliente', 'ver_pago', 'ver_cita']
    const autorizado = acciones_lectura.includes(accion)
    return {
      autorizado,
      usuario,
      razon: autorizado ? undefined : 'Sin permiso (solo lectura)',
    }
  }

  // VENDEDOR
  const accionesVendedor: Record<Accion, boolean | 'propio'> = {
    'ver_todo': false,
    'editar_todo': false,
    'ver_cliente': 'propio',
    'editar_cliente': 'propio',
    'borrar_cliente': false,
    'ver_pago': 'propio',
    'editar_pago': 'propio',
    'ver_cita': 'propio',
    'editar_cita': 'propio',
    'gestionar_usuarios': false,
    'ver_auditoria': false,
    'exportar_todo': false,
    'respaldar': false,
    'vaciar_papelera': false,
    'ver_equipo': true,
  }

  const permiso = accionesVendedor[accion]

  if (permiso === true) {
    return { autorizado: true, usuario }
  }

  if (permiso === false) {
    return { autorizado: false, usuario, razon: 'Sin permiso para esta acción' }
  }

  if (permiso === 'propio') {
    // Si hay recurso con vendedorId, verificar que sea el dueño
    if (opciones?.recursoVendedorId !== undefined) {
      const esDueno = opciones.recursoVendedorId === usuario.id
      return {
        autorizado: esDueno,
        usuario,
        razon: esDueno ? undefined : 'Solo puedes acceder a tus propios datos',
      }
    }
    // Si no hay recursoVendedorId, se asume que la ruta manejará el filtro por vendedor
    return { autorizado: true, usuario }
  }

  return { autorizado: false, usuario, razon: 'Permiso denegado' }
}

export interface SessionUsuario {
  id: string
  nombre: string
  correo: string
  rol: 'ADMIN' | 'VENDEDOR' | 'SOLO_LECTURA'
  activo: boolean
}

/**
 * Helper para rutas de API — responde 401/403 si no está autorizado
 */
export async function requireAuth(
  accion: Accion,
  opciones?: { recursoVendedorId?: string | null }
): Promise<SessionUsuario> {
  const { autorizado, usuario, razon } = await puede(accion, opciones)

  if (!usuario) {
    throw new ApiError('No autenticado', 401)
  }

  if (!autorizado) {
    throw new ApiError(razon ?? 'Sin permiso', 403)
  }

  return usuario
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Envuelve un handler de API con manejo de errores estándar
 */
export function apiHandler(
  handler: (req: Request, ctx?: Record<string, unknown>) => Promise<Response>
) {
  return async (req: Request, ctx?: Record<string, unknown>) => {
    try {
      return await handler(req, ctx)
    } catch (error) {
      if (error instanceof ApiError) {
        return Response.json(
          { error: error.message },
          { status: error.statusCode }
        )
      }

      console.error('[API Error]', error)
      return Response.json(
        { error: 'Ocurrió un error interno. Por favor intenta de nuevo.' },
        { status: 500 }
      )
    }
  }
}export const apiError = (msg: string, status = 400) => { throw new Error(msg) }
