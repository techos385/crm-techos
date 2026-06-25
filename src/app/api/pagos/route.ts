// src/app/api/pagos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, apiError } from '@/lib/permisos'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { registrarAuditoria, ACCIONES } from '@/lib/auditoria'

const PagoSchema = z.object({
  clienteId: z.string(),
  monto: z.number().positive('El monto debe ser positivo'),
  metodo: z.enum(['TRANSFERENCIA', 'TARJETA', 'EFECTIVO', 'DEPOSITO']),
  estado: z.enum(['PENDIENTE', 'PAGADO', 'VENCIDO']).default('PENDIENTE'),
  concepto: z.string().optional().nullable(),
  fechaPago: z.string().optional().nullable(),
  fechaVencimiento: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth('ver_cliente')
    const esAdmin = session.rol === 'ADMIN'
    const { searchParams } = new URL(request.url)

    const clienteId = searchParams.get('clienteId')
    const estatus = searchParams.get('estatus')
    const pagina = parseInt(searchParams.get('pagina') ?? '1')
    const porPagina = parseInt(searchParams.get('porPagina') ?? '25')

    const where: Record<string, unknown> = { eliminadoEn: null }
    if (!esAdmin) where.vendedorId = session.id
    if (clienteId) where.clienteId = clienteId
    if (estatus) where.estatus = estatus

    const [total, pagos] = await Promise.all([
      prisma.pago.count({ where }),
      prisma.pago.findMany({
        where,
        include: {
          cliente: { select: { id: true, nombre: true } },
        },
        orderBy: { creadoEn: 'desc' },
        skip: (pagina - 1) * porPagina,
        take: porPagina,
      }),
    ])

    return NextResponse.json({
      ok: true,
      data: { pagos, total, pagina, porPagina, totalPaginas: Math.ceil(total / porPagina) },
    })
  } catch (error) {
    return NextResponse.json({ ok: false, mensaje: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth('ver_cliente')
    const body = await request.json()
    const datos = PagoSchema.parse(body)

    // Verificar acceso
    const cliente = await prisma.cliente.findFirst({
      where: { id: datos.clienteId, eliminadoEn: null },
    })
    if (!cliente) return NextResponse.json({ ok: false, mensaje: 'Cliente no encontrado' }, { status: 404 })
    if (session.rol !== 'ADMIN' && cliente.vendedorId !== session.id) {
      return NextResponse.json({ ok: false, mensaje: 'Sin acceso' }, { status: 403 })
    }

    const pago = await prisma.$transaction(async (tx) => {
      const nuevo = await tx.pago.create({
        data: {
          clienteId: datos.clienteId,
          
          monto: datos.monto,
          metodo: datos.metodo as any,
          estado: datos.estado as any,
          concepto: datos.concepto ?? '',
          fechaPago: datos.fechaPago ? new Date(datos.fechaPago) : null,
          fechaVencimiento: datos.fechaVencimiento ? new Date(datos.fechaVencimiento) : null,
          notas: datos.notas,
        },
      })

      await registrarAuditoria(tx, {
        usuarioId: session.id,
        accion: ACCIONES.CREAR,
        entidad: 'Pago',
        entidadId: nuevo.id,
        descripcion: `RegistrÃ³ pago de $${datos.monto} para ${cliente.nombre}`,
      })

      return nuevo
    })

    return NextResponse.json({ ok: true, data: pago }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ ok: false, mensaje: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth('ver_cliente')
    const body = await request.json()
    const { id, ...datos } = body

    if (!id) return NextResponse.json({ ok: false, mensaje: 'Falta el ID' }, { status: 400 })

    const pago = await prisma.pago.findFirst({ where: { id, eliminadoEn: null } })
    if (!pago) return NextResponse.json({ ok: false, mensaje: 'No encontrado' }, { status: 404 })

    // Verificar acceso
    const cliente = await prisma.cliente.findFirst({ where: { id: pago.clienteId } })
    if (session.rol !== 'ADMIN' && cliente?.vendedorId !== session.id) {
      return NextResponse.json({ ok: false, mensaje: 'Sin acceso' }, { status: 403 })
    }

    const actualizado = await prisma.pago.update({
      where: { id },
      data: {
        ...datos,
        fechaPago: datos.fechaPago ? new Date(datos.fechaPago) : undefined,
        fechaVencimiento: datos.fechaVencimiento ? new Date(datos.fechaVencimiento) : undefined,
      },
    })

    return NextResponse.json({ ok: true, data: actualizado })
  } catch (error) {
    return NextResponse.json({ ok: false, mensaje: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth('ver_cliente')
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ ok: false, mensaje: 'Falta el ID' }, { status: 400 })

    const pago = await prisma.pago.findFirst({ where: { id, eliminadoEn: null } })
    if (!pago) return NextResponse.json({ ok: false, mensaje: 'No encontrado' }, { status: 404 })

    const cliente = await prisma.cliente.findFirst({ where: { id: pago.clienteId } })
    if (session.rol !== 'ADMIN' && cliente?.vendedorId !== session.id) {
      return NextResponse.json({ ok: false, mensaje: 'Sin acceso' }, { status: 403 })
    }

    await prisma.pago.update({ where: { id }, data: { eliminadoEn: new Date() } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ ok: false, mensaje: "Error interno" }, { status: 500 })
  }
}
