import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/permisos'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await requireAuth('ver_cliente')
    const filtro = session.rol === 'ADMIN' ? {} : { vendedorId: session.id }
    const [totalActivos, totalGanados, totalPerdidos] = await Promise.all([
      prisma.cliente.count({ where: { ...filtro, eliminadoEn: null, estadoCartera: 'ACTIVO' as any } }),
      prisma.cliente.count({ where: { ...filtro, eliminadoEn: null, estadoCartera: 'GANADO' as any } }),
      prisma.cliente.count({ where: { ...filtro, eliminadoEn: null, estadoCartera: 'PERDIDO' as any } }),
    ])
    return NextResponse.json({ ok: true, data: { totalActivos, totalGanados, totalPerdidos, ingresosMes: 0, citasHoy: 0, rankingEquipo: [], graficaMeses: [] } })
  } catch {
    return NextResponse.json({ ok: false, mensaje: 'Error interno' }, { status: 500 })
  }
}