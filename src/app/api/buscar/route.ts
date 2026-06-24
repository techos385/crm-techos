// src/app/api/buscar/route.ts
// Buscador global indexado

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, apiError } from '@/lib/permisos'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth('ver_cliente')
    const esAdmin = session.user.rol === 'ADMIN'
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim() ?? ''

    if (q.length < 2) {
      return NextResponse.json({ ok: true, data: { clientes: [], citas: [], pagos: [] } })
    }

    const filtroVendedor = esAdmin ? {} : { vendedorId: session.user.id }

    const [clientes, citas, pagos] = await Promise.all([
      prisma.cliente.findMany({
        where: {
          ...filtroVendedor,
          eliminadoEn: null,
          OR: [
            { nombre: { contains: q, mode: 'insensitive' } },
            { telefono: { contains: q } },
            { correo: { contains: q, mode: 'insensitive' } },
            { empresa: { contains: q, mode: 'insensitive' } },
            { empresaNombre: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 8,
        select: {
          id: true,
          nombre: true,
          telefono: true,
          correo: true,
          empresa: true,
          etapaEmbudo: true,
          estadoCartera: true,
          temperatura: true,
        },
      }),
      prisma.cita.findMany({
        where: {
          ...filtroVendedor,
          eliminadoEn: null,
          OR: [
            { titulo: { contains: q, mode: 'insensitive' } },
            { notas: { contains: q, mode: 'insensitive' } },
            { cliente: { nombre: { contains: q, mode: 'insensitive' } } },
          ],
        },
        take: 5,
        select: {
          id: true,
          titulo: true,
          fechaInicio: true,
          cliente: { select: { id: true, nombre: true } },
        },
      }),
      prisma.pago.findMany({
        where: {
          ...filtroVendedor,
          eliminadoEn: null,
          OR: [
            { concepto: { contains: q, mode: 'insensitive' } },
            { cliente: { nombre: { contains: q, mode: 'insensitive' } } },
          ],
        },
        take: 5,
        select: {
          id: true,
          monto: true,
          estatus: true,
          concepto: true,
          fechaPago: true,
          cliente: { select: { id: true, nombre: true } },
        },
      }),
    ])

    return NextResponse.json({
      ok: true,
      data: { clientes, citas, pagos },
    })
  } catch (error) {
    return apiError(error)
  }
}
