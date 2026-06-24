// src/app/api/clientes/[id]/notas/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, apiError } from '@/lib/permisos'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { registrarAuditoria, ACCIONES } from '@/lib/auditoria'

const NotaSchema = z.object({
  contenido: z.string().min(1, 'La nota no puede estar vacía').max(5000),
  tipo: z.string().optional().default('nota'),
  fecha: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const datos = NotaSchema.parse(body)

    // Verificar acceso al cliente
    const cliente = await prisma.cliente.findFirst({
      where: { id: params.id, eliminadoEn: null },
    })
    if (!cliente) {
      return NextResponse.json({ ok: false, mensaje: 'Cliente no encontrado' }, { status: 404 })
    }
    if (session.user.rol !== 'ADMIN' && cliente.vendedorId !== session.user.id) {
      return NextResponse.json({ ok: false, mensaje: 'Sin acceso' }, { status: 403 })
    }

    const nota = await prisma.$transaction(async (tx) => {
      const nueva = await tx.nota.create({
        data: {
          clienteId: params.id,
          autorId: session.user.id,
          contenido: datos.contenido,
          tipo: datos.tipo,
          creadoEn: datos.fecha ? new Date(datos.fecha) : new Date(),
        },
        include: { autor: { select: { id: true, nombre: true } } },
      })

      // Actualizar último contacto
      await tx.cliente.update({
        where: { id: params.id },
        data: { ultimoContacto: nueva.creadoEn },
      })

      await registrarAuditoria(tx, {
        usuarioId: session.user.id,
        accion: ACCIONES.CREAR,
        entidad: 'Nota',
        entidadId: nueva.id,
        descripcion: `Agregó nota al cliente ${cliente.nombre}`,
      })

      return nueva
    })

    return NextResponse.json({ ok: true, data: nota }, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)
    const notaId = searchParams.get('notaId')
    if (!notaId) {
      return NextResponse.json({ ok: false, mensaje: 'Falta el ID de la nota' }, { status: 400 })
    }

    const nota = await prisma.nota.findFirst({
      where: { id: notaId, clienteId: params.id, eliminadoEn: null },
    })
    if (!nota) {
      return NextResponse.json({ ok: false, mensaje: 'Nota no encontrada' }, { status: 404 })
    }
    // Solo el autor o admin puede borrar
    if (session.user.rol !== 'ADMIN' && nota.autorId !== session.user.id) {
      return NextResponse.json({ ok: false, mensaje: 'Sin acceso' }, { status: 403 })
    }

    await prisma.nota.update({
      where: { id: notaId },
      data: { eliminadoEn: new Date() },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return apiError(error)
  }
}
