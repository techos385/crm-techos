// src/app/api/citas/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, apiError } from '@/lib/permisos'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { registrarAuditoria, ACCIONES } from '@/lib/auditoria'

const CitaSchema = z.object({
  clienteId: z.string(),
  titulo: z.string().min(2).max(200),
  inicio: z.string(),
  fin: z.string().optional(),
  notas: z.string().optional().nullable(),
  vendedorId: z.string().optional().nullable(),
  lugar: z.string().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth('ver_cita')
    const esAdmin = session.rol === 'ADMIN'
    const { searchParams } = new URL(request.url)

    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')
    const vendedorId = searchParams.get('vendedorId')

    const where: Record<string, unknown> = {
      eliminadoEn: null,
    }

    if (!esAdmin) {
      where.vendedorId = session.id
    } else if (vendedorId) {
      where.vendedorId = vendedorId
    }

    if (desde) where.inicio = { gte: new Date(desde) }
    if (hasta) {
      where.inicio = {
        ...(where.inicio as object ?? {}),
        lte: new Date(hasta),
      }
    }

    const citas = await prisma.cita.findMany({
      where,
      include: {
        cliente: { select: { id: true, nombre: true, telefono: true } },
        vendedor: { select: { id: true, nombre: true } },
      },
      orderBy: { inicio: 'asc' },
    })

    return NextResponse.json({ ok: true, data: citas })
  } catch (error) {
    return NextResponse.json({ ok: false, mensaje: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth('ver_cita')
    const body = await request.json()
    const datos = CitaSchema.parse(body)

    // Verificar acceso al cliente
    const cliente = await prisma.cliente.findFirst({
      where: { id: datos.clienteId, eliminadoEn: null },
    })
    if (!cliente) {
      return NextResponse.json({ ok: false, mensaje: 'Cliente no encontrado' }, { status: 404 })
    }
    if (session.rol !== 'ADMIN' && cliente.vendedorId !== session.id) {
      return NextResponse.json({ ok: false, mensaje: 'Sin acceso' }, { status: 403 })
    }

    const vendedorId = session.rol === 'ADMIN' && datos.vendedorId
      ? datos.vendedorId
      : session.id

    const inicio = new Date(datos.inicio)
    const fin = datos.fin
      ? new Date(datos.fin)
      : new Date(inicio.getTime() + 30 * 60 * 1000) // +30 min default

    // Verificar disponibilidad (no traslapar)
    const traslape = await prisma.cita.findFirst({
      where: {
        vendedorId,
        eliminadoEn: null,
        OR: [
          { inicio: { gte: inicio, lt: fin } },
          { fin: { gt: inicio, lte: fin } },
          { inicio: { lte: inicio }, fin: { gte: fin } },
        ],
      },
    })
    if (traslape) {
      return NextResponse.json({
        ok: false,
        mensaje: 'Ya hay una cita en ese horario. Elige otro.',
      }, { status: 409 })
    }

    const cita = await prisma.$transaction(async (tx) => {
      const nueva = await tx.cita.create({
        data: {
          clienteId: datos.clienteId,
          titulo: datos.titulo,
          inicio,
          fin,
          descripcion: datos.notas,
          vendedorId,
          
        },
        include: {
          cliente: { select: { id: true, nombre: true } },
          vendedor: { select: { id: true, nombre: true } },
        },
      })

      // Actualizar etapa del cliente si estÃ¡ en etapas iniciales
      if (['Nuevo Prospecto', 'Contactado', 'InformaciÃ³n Recibida'].includes(cliente.etapa ?? '')) {
        await tx.cliente.update({
          where: { id: datos.clienteId },
          data: { etapa: 'CITA_AGENDADA' },
        })
      }

     

      return nueva
    })

    return NextResponse.json({ ok: true, data: cita }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ ok: false, mensaje: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth('ver_cita')
    const body = await request.json()
    const { id, ...datos } = body

    if (!id) return NextResponse.json({ ok: false, mensaje: 'Falta el ID' }, { status: 400 })

    const cita = await prisma.cita.findFirst({
      where: { id, eliminadoEn: null },
    })
    if (!cita) return NextResponse.json({ ok: false, mensaje: 'No encontrada' }, { status: 404 })
    if (session.rol !== 'ADMIN' && cita.vendedorId !== session.id) {
      return NextResponse.json({ ok: false, mensaje: 'Sin acceso' }, { status: 403 })
    }

    const actualizada = await prisma.cita.update({
      where: { id },
      data: {
        ...datos,
        inicio: datos.inicio ? new Date(datos.inicio) : undefined,
        fin: datos.fin ? new Date(datos.fin) : undefined,
      },
    })

    return NextResponse.json({ ok: true, data: actualizada })
  } catch (error) {
    return NextResponse.json({ ok: false, mensaje: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth('ver_cita')
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ ok: false, mensaje: 'Falta el ID' }, { status: 400 })

    const cita = await prisma.cita.findFirst({ where: { id, eliminadoEn: null } })
    if (!cita) return NextResponse.json({ ok: false, mensaje: 'No encontrada' }, { status: 404 })
    if (session.rol !== 'ADMIN' && cita.vendedorId !== session.id) {
      return NextResponse.json({ ok: false, mensaje: 'Sin acceso' }, { status: 403 })
    }

    await prisma.cita.update({ where: { id }, data: { eliminadoEn: new Date() } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ ok: false, mensaje: "Error interno" }, { status: 500 })
  }
}
