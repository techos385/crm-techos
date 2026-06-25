import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/permisos'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth('exportar_todo')
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') || 'json'

    const filtro = session.rol === 'ADMIN' ? {} : { vendedorId: session.id }

    const clientes = await prisma.cliente.findMany({
      where: { ...filtro, eliminadoEn: null },
      include: {
        pagos: true,
        vendedor: { select: { nombre: true } },
      },
      orderBy: { creadoEn: 'desc' },
    })

    if (tipo === 'json') {
      return new NextResponse(JSON.stringify({ ok: true, data: clientes }, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="crm-export.json"',
        },
      })
    }

    if (tipo === 'clientes') {
      const encabezados = ['Nombre', 'Teléfono', 'Correo', 'Etapa', 'Temperatura', 'Valor', 'Estado', 'Vendedor']
      const filas = clientes.map(c => [
        c.nombre,
        c.telefono ?? '',
        c.correo ?? '',
        c.etapa ?? '',
        c.temperatura,
        c.valorEstimado ?? '',
        c.estadoCartera,
        c.vendedor?.nombre ?? '',
      ])
      const csv = [encabezados, ...filas].map(r => r.join(',')).join('\n')
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="clientes.csv"',
        },
      })
    }

    if (tipo === 'pagos') {
      const pagos = await prisma.pago.findMany({
        where: { eliminadoEn: null },
        include: { cliente: { select: { nombre: true } } },
        orderBy: { creadoEn: 'desc' },
      })
      const encabezados = ['Cliente', 'Monto', 'Estado', 'Método', 'Concepto', 'Fecha']
      const filas = pagos.map(p => [
        p.cliente?.nombre ?? '',
        p.monto,
        p.estado,
        p.metodo,
        p.concepto ?? '',
        p.fechaPago ?? '',
      ])
      const csv = [encabezados, ...filas].map(r => r.join(',')).join('\n')
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="pagos.csv"',
        },
      })
    }

    return NextResponse.json({ ok: false, mensaje: 'Tipo no válido' }, { status: 400 })
  } catch {
    return NextResponse.json({ ok: false, mensaje: 'Error interno' }, { status: 500 })
  }
}