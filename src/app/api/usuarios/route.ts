// src/app/api/usuarios/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, apiError } from '@/lib/permisos'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { registrarAuditoria, ACCIONES } from '@/lib/auditoria'

const UsuarioSchema = z.object({
  nombre: z.string().min(2).max(100),
  correo: z.string().email(),
  contrasena: z.string().min(8, 'Mínimo 8 caracteres'),
  rol: z.enum(['ADMIN', 'VENDEDOR', 'SOLO_LECTURA']).default('VENDEDOR'),
  metaMensual: z.number().optional().nullable(),
  comision: z.number().min(0).max(100).optional().nullable(),
})

export async function GET(_req: NextRequest) {
  try {
    const session = await requireAuth()
    if (session.rol !== 'ADMIN') {
      return NextResponse.json({ ok: false, mensaje: 'Solo administradores' }, { status: 403 })
    }

    const usuarios = await prisma.usuario.findMany({
      where: { eliminadoEn: null },
      select: {
        id: true,
        nombre: true,
        correo: true,
        rol: true,
        activo: true,
        metaMensual: true,
        comision: true,
        creadoEn: true,
        onboardingCompletado: true,
        slugAgenda: true,
        _count: {
          select: { clientes: true },
        },
      },
      orderBy: { creadoEn: 'asc' },
    })

    return NextResponse.json({ ok: true, data: usuarios })
  } catch (error) {
    return apiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (session.rol !== 'ADMIN') {
      return NextResponse.json({ ok: false, mensaje: 'Solo administradores' }, { status: 403 })
    }

    const body = await request.json()
    const datos = UsuarioSchema.parse(body)

    // Verificar correo único
    const existe = await prisma.usuario.findFirst({ where: { correo: datos.correo, eliminadoEn: null } })
    if (existe) {
      return NextResponse.json({ ok: false, mensaje: 'Ya existe un usuario con ese correo' }, { status: 409 })
    }

    const hash = await bcrypt.hash(datos.contrasena, 12)
    const slug = datos.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    const usuario = await prisma.$transaction(async (tx) => {
      const nuevo = await tx.usuario.create({
        data: {
          nombre: datos.nombre,
          correo: datos.correo,
          contrasena: hash,
          rol: datos.rol as 'ADMIN' | 'VENDEDOR' | 'SOLO_LECTURA',
          metaMensual: datos.metaMensual,
          comision: datos.comision,
          slugAgenda: slug,
        },
        select: {
          id: true, nombre: true, correo: true, rol: true, activo: true,
          metaMensual: true, comision: true, slugAgenda: true,
        },
      })

      await registrarAuditoria(tx, {
        usuarioId: session.id,
        accion: ACCIONES.CREAR,
        entidad: 'Usuario',
        entidadId: nuevo.id,
        descripcion: `Creó al usuario ${nuevo.nombre} con rol ${nuevo.rol}`,
      })

      return nuevo
    })

    return NextResponse.json({ ok: true, data: usuario }, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const { id, contrasena, activo, rol, metaMensual, comision, nombre } = body

    // Solo admin puede editar otros usuarios
    if (id !== session.id && session.rol !== 'ADMIN') {
      return NextResponse.json({ ok: false, mensaje: 'Sin acceso' }, { status: 403 })
    }

    // Solo admin puede cambiar rol y activo
    if ((rol !== undefined || activo !== undefined) && session.rol !== 'ADMIN') {
      return NextResponse.json({ ok: false, mensaje: 'Solo administradores pueden cambiar el rol' }, { status: 403 })
    }

    const datos: Record<string, unknown> = {}
    if (nombre) datos.nombre = nombre
    if (activo !== undefined) datos.activo = activo
    if (rol) datos.rol = rol
    if (metaMensual !== undefined) datos.metaMensual = metaMensual
    if (comision !== undefined) datos.comision = comision
    if (contrasena) {
      if (contrasena.length < 8) {
        return NextResponse.json({ ok: false, mensaje: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
      }
      datos.contrasena = await bcrypt.hash(contrasena, 12)
    }

    const actualizado = await prisma.usuario.update({
      where: { id },
      data: datos,
      select: { id: true, nombre: true, correo: true, rol: true, activo: true, metaMensual: true },
    })

    return NextResponse.json({ ok: true, data: actualizado })
  } catch (error) {
    return apiError(error)
  }
}
