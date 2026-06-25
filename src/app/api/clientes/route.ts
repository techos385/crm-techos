import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/permisos'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth('ver_cliente')
    const { searchParams } = new URL(request.url)
    const buscar = searchParams.get('buscar') || ''
    const pagina = Number(searchParams.get('pagina') || 1)
    const limite = Number(searchParams.get('limite') || 20)
    const estado = searchParams.get('estado') || 'ACTIVO'
    const skip = (pagina - 1) * limite

    const filtroVendedor = session.rol === 'ADMIN' ? {} : { vendedorId: session.id }

    const where = {
      ...filtroVendedor,
      eliminadoEn: null,
      estadoCartera: estado as any,
      ...(buscar ? {
        OR: [
          { nombre: { contains: buscar, mode: 'insensitive' as const } },
          { telefono: { contains: buscar, mode: 'insensitive' as const } },
          { correo: { contains: buscar, mode: 'insensitive' as const } },
        ]
      } : {})
    }

    const [total, clientes] = await Promise.all([
      prisma.cliente.count({ where }),
      prisma.cliente.findMany({
        where,
        skip,
        take: limite,
        orderBy: { creadoEn: 'desc' },
        select: {
          id: true,
          nombre: true,
          telefono: true,
          correo: true,
          etapa: true,
          estadoCartera: true,
          temperatura: true,
          valorEstimado: true,
          proximaAccion: true,
          proximaAccionFecha: true,
          ultimoContacto: true,
          creadoEn: true,
          vendedor: { select: { nombre: true } },
        },
      })
    ])

    return NextResponse.json({ ok: true, data: clientes, total, pagina, limite })
  } catch {
    return NextResponse.json({ ok: false, mensaje: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth('ver_cliente')
    const body = await request.json()

    const cliente = await prisma.cliente.create({
      data: {
        ...body,
        vendedorId: session.rol === 'ADMIN' && body.vendedorId ? body.vendedorId : session.id,
      },
    })

    return NextResponse.json({ ok: true, data: cliente }, { status: 201 })
  } catch {
    return NextResponse.json({ ok: false, mensaje: 'Error interno' }, { status: 500 })
  }
}
