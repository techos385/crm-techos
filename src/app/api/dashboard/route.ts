// src/app/api/dashboard/route.ts
// Datos del tablero principal

import { NextResponse } from 'next/server'
import { requireAuth, apiError } from '@/lib/permisos'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns'

export async function GET() {
  try {
    const session = await requireAuth('ver_cliente')
    const esAdmin = session.rol === 'ADMIN'
    const vendedorId = esAdmin ? undefined : session.id

    const ahora = new Date()
    const inicioMes = startOfMonth(ahora)
    const finMes = endOfMonth(ahora)

    // Filtro base por vendedor si no es admin
    const filtroVendedor = vendedorId ? { vendedorId } : {}
    const filtroActivo = { estadoCartera: 'ACTIVO' as any, eliminadoEn: null }
    const filtroActivoVendedor = { ...filtroActivo, ...filtroVendedor }

    // Clientes activos totales
    const totalActivos = await prisma.cliente.count({
      where: filtroActivoVendedor,
    })

    // Nuevos este mes
    const nuevosEsteMes = await prisma.cliente.count({
      where: {
        ...filtroVendedor,
        eliminadoEn: null,
        creadoEn: { gte: inicioMes, lte: finMes },
      },
    })

    // Clientes ganados este mes
    const ganadosEsteMes = await prisma.cliente.count({
      where: {
        ...filtroVendedor,
        estadoCartera: 'GANADO',
        eliminadoEn: null,
        ganandoEn: { gte: inicioMes, lte: finMes },
      },
    })

    // Ingresos cobrados este mes
    const pagosEsteMes = await prisma.pago.aggregate({
      where: {
        ...filtroVendedor,
        estado: 'PAGADO' as any,
        eliminadoEn: null,
        fechaPago: { gte: inicioMes, lte: finMes },
      },
      _sum: { monto: true },
    })

    // Pagos vencidos
    const pagosVencidos = await prisma.pago.aggregate({
      where: {
        ...filtroVendedor,
        estatus: 'VENCIDO',
        eliminadoEn: null,
      },
      _sum: { monto: true },
      _count: true,
    })

    // Citas de hoy
    const citasHoy = await prisma.cita.count({
      where: {
        ...filtroVendedor,
        eliminadoEn: null,
        fechaInicio: {
          gte: startOfDay(ahora),
          lte: endOfDay(ahora),
        },
      },
    })

    // Valor del embudo activo
    const valorEmbudo = await prisma.cliente.aggregate({
      where: {
        ...filtroActivoVendedor,
        valorEstimado: { not: null },
      },
      _sum: { valorEstimado: true },
    })

    // Tasa de cierre (este mes)
    const totalProspectosEsteMes = await prisma.cliente.count({
      where: {
        ...filtroVendedor,
        eliminadoEn: null,
        creadoEn: { gte: inicioMes, lte: finMes },
      },
    })
    const tasaCierre = totalProspectosEsteMes > 0
      ? Math.round((ganadosEsteMes / totalProspectosEsteMes) * 100)
      : 0

    // Acciones vencidas
    const accionesVencidas = await prisma.cliente.count({
      where: {
        ...filtroActivoVendedor,
        proximaAccionFecha: { lt: ahora },
      },
    })

    // Leads sin contactar >24h
    const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000)
    const leadsFrios = await prisma.cliente.count({
      where: {
        ...filtroVendedor,
        eliminadoEn: null,
        etapa: 'Nuevo Prospecto',
        creadoEn: { lt: hace24h },
        ultimoContacto: null,
      },
    })

    // GrÃ¡fica Ãºltimos 6 meses
    const meses6 = Array.from({ length: 6 }, (_, i) => {
      const fecha = subMonths(ahora, 5 - i)
      return {
        inicio: startOfMonth(fecha),
        fin: endOfMonth(fecha),
        label: fecha.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }),
      }
    })

    const graficaMeses = await Promise.all(
      meses6.map(async (mes) => {
        const ganados = await prisma.cliente.count({
          where: {
            ...filtroVendedor,
            estadoCartera: 'GANADO',
            eliminadoEn: null,
            ganandoEn: { gte: mes.inicio, lte: mes.fin },
          },
        })
        const ingresos = await prisma.pago.aggregate({
          where: {
            ...filtroVendedor,
            estado: 'PAGADO' as any,
            eliminadoEn: null,
            fechaPago: { gte: mes.inicio, lte: mes.fin },
          },
          _sum: { monto: true },
        })
        return {
          mes: mes.label,
          ganados,
          ingresos: ingresos._sum.monto ?? 0,
        }
      })
    )

    // Mes anterior para comparaciÃ³n
    const inicioMesAnterior = startOfMonth(subMonths(ahora, 1))
    const finMesAnterior = endOfMonth(subMonths(ahora, 1))

    const ganadosMesAnterior = await prisma.cliente.count({
      where: {
        ...filtroVendedor,
        estadoCartera: 'GANADO',
        eliminadoEn: null,
        ganandoEn: { gte: inicioMesAnterior, lte: finMesAnterior },
      },
    })

    const ingresosMesAnterior = await prisma.pago.aggregate({
      where: {
        ...filtroVendedor,
        estado: 'PAGADO' as any,
        eliminadoEn: null,
        fechaPago: { gte: inicioMesAnterior, lte: finMesAnterior },
      },
      _sum: { monto: true },
    })

    // Origen de clientes (este mes)
    const porOrigen = await prisma.cliente.groupBy({
      by: ['origen'],
      where: {
        ...filtroVendedor,
        eliminadoEn: null,
        creadoEn: { gte: inicioMes },
      },
      _count: true,
    })

    // Motivos de pÃ©rdida
    const motivosPerdida = await prisma.cliente.groupBy({
      by: ['motivoPerdida'],
      where: {
        ...filtroVendedor,
        estadoCartera: 'PERDIDO',
        eliminadoEn: null,
        motivoPerdida: { not: null },
      },
      _count: true,
    })

    // Ranking del equipo (solo admin)
    let rankingEquipo: Array<{
      id: string; nombre: string; ganados: number; ingresos: number; meta: number | null
    }> = []
    if (esAdmin) {
      const vendedores = await prisma.usuario.findMany({
        where: { activo: true, eliminadoEn: null },
        select: { id: true, nombre: true, metaMensual: true },
      })
      rankingEquipo = await Promise.all(
        vendedores.map(async (v) => {
          const gV = await prisma.cliente.count({
            where: {
              vendedorId: v.id,
              estadoCartera: 'GANADO',
              eliminadoEn: null,
              ganandoEn: { gte: inicioMes, lte: finMes },
            },
          })
          const iV = await prisma.pago.aggregate({
            where: {
              vendedorId: v.id,
              estado: 'PAGADO' as any,
              eliminadoEn: null,
              fechaPago: { gte: inicioMes, lte: finMes },
            },
            _sum: { monto: true },
          })
          return {
            id: v.id,
            nombre: v.nombre,
            ganados: gV,
            ingresos: iV._sum.monto ?? 0,
            meta: v.metaMensual,
          }
        })
      )
      rankingEquipo.sort((a, b) => b.ingresos - a.ingresos)
    }

    // Config del negocio para meta
    const config = await prisma.configNegocio.findFirst()
    const metaMes = config?.metaMensual ?? 5

    // Clientes sin prÃ³xima acciÃ³n
    const sinSeguimiento = await prisma.cliente.count({
      where: {
        ...filtroActivoVendedor,
        proximaAccion: null,
      },
    })

    const ingresosEsteMes = pagosEsteMes._sum.monto ?? 0
    const ingresosAnterior = ingresosMesAnterior._sum.monto ?? 0
    const crecimientoIngresos = ingresosAnterior > 0
      ? Math.round(((ingresosEsteMes - ingresosAnterior) / ingresosAnterior) * 100)
      : 0
    const crecimientoGanados = ganadosMesAnterior > 0
      ? Math.round(((ganadosEsteMes - ganadosMesAnterior) / ganadosMesAnterior) * 100)
      : 0

    return NextResponse.json({
      ok: true,
      data: {
        totalActivos,
        nuevosEsteMes,
        ganadosEsteMes,
        ingresosEsteMes,
        pagosVencidos: {
          monto: pagosVencidos._sum.monto ?? 0,
          cantidad: pagosVencidos._count,
        },
        citasHoy,
        valorEmbudo: valorEmbudo._sum.valorEstimado ?? 0,
        tasaCierre,
        accionesVencidas,
        leadsFrios,
        sinSeguimiento,
        graficaMeses,
        porOrigen,
        motivosPerdida,
        rankingEquipo,
        metaMes,
        comparacion: {
          ganadosAnterior: ganadosMesAnterior,
          ingresosAnterior,
          crecimientoIngresos,
          crecimientoGanados,
        },
      },
    })
  } catch (error) {
    return NextResponse.json({ ok: false, mensaje: "Error interno" }, { status: 500 })
  }
}
