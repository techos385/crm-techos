import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/permisos'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth('ver_cliente')
    const filtroVendedor = session.rol === 'ADMIN' ? {} : { vendedorId: session.id }
    const ahora = new Date()
    const hoy = new Date(ahora); hoy.setHours(0,0,0,0)
    const manana = new Date(hoy); manana.setDate(manana.getDate() + 1)

    const clientesActivos = await prisma.cliente.findMany({
      where: { estadoCartera: 'ACTIVO' as any, eliminadoEn: null, ...filtroVendedor },
      select: { id: true, nombre: true, telefono: true, temperatura: true, etapa: true, proximaAccion: true, proximaAccionFecha: true, valorEstimado: true, ultimoContacto: true, creadoEn: true },
    })

    const hoyToca = clientesActivos.filter(c => {
      if (!c.proximaAccionFecha) return false
      const f = new Date(c.proximaAccionFecha)
      return f >= hoy && f < manana
    }).map(c => ({ ...c, etapaEmbudo: c.etapa, diasSinContacto: null, esNuevo: false, horasDesdeCreacion: null }))

    const vencidos = clientesActivos
      .filter(c => c.proximaAccionFecha && new Date(c.proximaAccionFecha) < hoy)
      .map(c => ({ ...c, etapaEmbudo: c.etapa, diasSinContacto: null, esNuevo: false, horasDesdeCreacion: null }))

    const leadsFrios = clientesActivos.filter(c => {
      const dias = c.ultimoContacto ? Math.floor((ahora.getTime() - new Date(c.ultimoContacto).getTime()) / 86400000) : 999
      return dias >= 7
    }).map(c => ({ ...c, etapaEmbudo: c.etapa, diasSinContacto: c.ultimoContacto ? Math.floor((ahora.getTime() - new Date(c.ultimoContacto).getTime()) / 86400000) : null, esNuevo: false, horasDesdeCreacion: null }))

    const recordatorios = await prisma.recordatorio.findMany({
      where: { completado: false, fecha: { lte: manana }, cliente: { eliminadoEn: null, ...filtroVendedor } },
      include: { cliente: { select: { id: true, nombre: true } } },
      orderBy: { fecha: 'asc' },
      take: 20,
    })

    return NextResponse.json({
      ok: true,
      data: {
        hoyToca, vencidos, leadsFrios,
        sinAccion: clientesActivos.filter(c => !c.proximaAccion).length,
        enRiesgo: clientesActivos.filter(c => {
          const dias = c.ultimoContacto ? Math.floor((ahora.getTime() - new Date(c.ultimoContacto).getTime()) / 86400000) : 999
          return dias >= 14 || (c.proximaAccionFecha && new Date(c.proximaAccionFecha) < hoy)
        }).length,
        recordatorios: recordatorios.map(r => ({ id: r.id, texto: r.titulo, fecha: r.fecha.toISOString(),  clienteId: r.clienteId, clienteNombre: r.cliente.nombre })),
      },
    })
  } catch {
    return NextResponse.json({ ok: false, mensaje: 'Error interno' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAuth('ver_cliente')
    const { searchParams } = new URL(request.url)
    const recordatorioId = searchParams.get('recordatorioId')
    if (recordatorioId) {
      await prisma.recordatorio.update({ where: { id: recordatorioId }, data: { completado: true } })
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ ok: false, mensaje: 'Accion no reconocida' }, { status: 400 })
  } catch {
    return NextResponse.json({ ok: false, mensaje: 'Error interno' }, { status: 500 })
  }
}
