import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/permisos'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const PagoSchema = z.object({
  clienteId: z.string(),
  monto: z.number().positive(),
  metodo: z.string(),
  estado: z.string().optional().default('PENDIENTE'),
  concepto: z.string().optional().nullable(),
  fechaPago: z.string().optional().nullable(),
  fechaVencimiento: z.string().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth('ver_pago')
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get('clienteId')
    const pagina = parseInt(searchParams.get('pagina') ?? '1')
    const limite = parseInt(searchParams.get('limite') ?? '20')

    const filtroVendedor = session.rol === 'ADMIN' ? {} : { cliente: { vendedorId: session.id } }
    const where = { eliminadoEn: null, ...filtroVendedor, ...(clienteId ? { clienteId } : {}) }

    const [total, pagos] = await Promise.all([
      prisma.pago.count({ where }),
      prisma.pago.findMany({
        where,
        include: { cliente: { select: { id: true, nombre: true } } },
        orderBy: { creadoEn: 'desc' },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
    ])

    const resumen = {
      totalCobrado: pagos.filter(p => p.estado === 'PAGADO').reduce((s, p) => s + Number(p.monto), 0),
      totalPendiente: pagos.filter(p => p.estado === 'PENDIENTE').reduce((s, p) => s + Number(p.monto), 0),
      totalVencido: pagos.filter(p => p.estado === 'VENCIDO').reduce((s, p) => s + Number(p.monto), 0),
      countVencidos: pagos.filter(p => p.estado === 'VENCIDO').length,
    }

    return NextResponse.json({ ok: true, data: pagos, total, resumen })
  } catch {
    return NextResponse.json({ ok: false, mensaje: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth('editar_pago')
    const body = await request.json()
    const datos = PagoSchema.parse(body)

    const pago = await prisma.pago.create({
      data: {
        clienteId: datos.clienteId,
        monto: datos.monto,
        metodo: datos.metodo as any,
        estado: datos.estado as any,
        concepto: datos.concepto ?? '',
        fechaPago: datos.fechaPago ? new Date(datos.fechaPago) : null,
        fechaVencimiento: datos.fechaVencimiento ? new Date(datos.fechaVencimiento) : null,
      },
    })

    return NextResponse.json({ ok: true, data: pago }, { status: 201 })
  } catch {
    return NextResponse.json({ ok: false, mensaje: 'Error interno' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAuth('editar_pago')
    const body = await request.json()
    const { id, ...datos } = body
    if (!id) return NextResponse.json({ ok: false, mensaje: 'Falta ID' }, { status: 400 })
    const pago = await prisma.pago.update({ where: { id }, data: datos })
    return NextResponse.json({ ok: true, data: pago })
  } catch {
    return NextResponse.json({ ok: false, mensaje: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAuth('editar_pago')
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ ok: false, mensaje: 'Falta ID' }, { status: 400 })
    await prisma.pago.update({ where: { id }, data: { eliminadoEn: new Date() } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, mensaje: 'Error interno' }, { status: 500 })
  }
}