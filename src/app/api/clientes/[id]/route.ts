import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/permisos'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth('ver_cliente')
    const where = session.rol === 'ADMIN' ? { id: params.id } : { id: params.id, vendedorId: session.id }
    const cliente = await prisma.cliente.findFirst({
      where: { ...where, eliminadoEn: null },
      include: {
        pagos: { orderBy: { creadoEn: 'desc' } },
        archivos: { where: { eliminadoEn: null }, include: { subidoPor: { select: { nombre: true } } } },
        vendedor: { select: { nombre: true } },
      },
    })
    if (!cliente) return NextResponse.json({ ok: false, mensaje: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ ok: true, data: { ...cliente, resumenPagos: { totalPagado: 0, totalPendiente: 0, totalValor: cliente.valorEstimado ?? 0 }, timeline: [] } })
  } catch {
    return NextResponse.json({ ok: false, mensaje: 'Error interno' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth('ver_cliente')
    const body = await request.json()
    const where = session.rol === 'ADMIN' ? { id: params.id } : { id: params.id, vendedorId: session.id }
    const cliente = await prisma.cliente.update({ where, data: body })
    return NextResponse.json({ ok: true, data: cliente })
  } catch {
    return NextResponse.json({ ok: false, mensaje: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth('borrar_cliente')
    await prisma.cliente.update({ where: { id: params.id }, data: { eliminadoEn: new Date() } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, mensaje: 'Error interno' }, { status: 500 })
  }
}