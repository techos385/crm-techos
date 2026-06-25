// src/app/api/seguimiento/route.ts
// Seguimiento, recordatorios y "Hoy te toca"

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, apiError } from '@/lib/permisos'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay } from 'date-fns'
import { z } from 'zod'

const RecordatorioSchema = z.object({
  clienteId: z.string().optional(),
  texto: z.string().min(2).max(500),
  fechaVencimiento: z.string(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth('ver_cliente')
    const esAdmin = session.rol === 'ADMIN'
    const { searchParams } = new URL(request.url)
    const vista = searchParams.get('vista') ?? 'hoy'

    const filtroVendedor = esAdmin && searchParams.get('vendedorId')
      ? { vendedorId: searchParams.get('vendedorId') as string }
      : esAdmin ? {} : { vendedorId: session.id }

    const ahora = new Date()
    const hoyInicio = startOfDay(ahora)
    const hoyFin = endOfDay(ahora)

    if (vista === 'hoy') {
      // "Hoy te toca" — clientes con próxima acción hoy o vencida
      const clientesHoy = await prisma.cliente.findMany({
        where: {
          ...filtroVendedor,
          eliminadoEn: null,
          estadoCartera: 'ACTIVO',
          OR: [
            { proximaAccionFecha: { lte: hoyFin } },
          ],
        },
        include: {
          vendedor: { select: { id: true, nombre: true } },
        },
        orderBy: [
          { temperatura: 'asc' }, // CALIENTE primero (C < F < T ordenado)
          { proximaAccionFecha: 'asc' },
        ],
      })

      // Citas de hoy
      const citasHoy = await prisma.cita.findMany({
        where: {
          ...filtroVendedor,
          eliminadoEn: null,
          fechaInicio: { gte: hoyInicio, lte: hoyFin },
        },
        include: {
          cliente: { select: { id: true, nombre: true } },
        },
        orderBy: { fechaInicio: 'asc' },
      })

      // Recordatorios vencidos o de hoy
      const recordatoriosHoy = await prisma.recordatorio.findMany({
        where: {
          eliminadoEn: null,
          completado: false,
          OR: [
            { clienteId: { not: null }, cliente: { ...filtroVendedor, eliminadoEn: null } },
            { clienteId: null },
          ],
          fechaVencimiento: { lte: hoyFin },
        },
        include: {
          cliente: { select: { id: true, nombre: true } },
        },
        orderBy: { fechaVencimiento: 'asc' },
      })

      // Leads fríos (más de 24h en Nuevo Prospecto sin contacto)
      const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000)
      const leadsFrios = await prisma.cliente.findMany({
        where: {
          ...filtroVendedor,
          eliminadoEn: null,
          estadoCartera: 'ACTIVO',
          etapa: 'Nuevo Prospecto',
          creadoEn: { lt: hace24h },
          ultimoContacto: null,
        },
        select: { id: true, nombre: true, creadoEn: true, telefono: true },
      })

      // Sin próxima acción
      const sinSeguimiento = await prisma.cliente.count({
        where: {
          ...filtroVendedor,
          eliminadoEn: null,
          estadoCartera: 'ACTIVO',
          proximaAccion: null,
        },
      })

      // Configuración del negocio para meta
      const config = await prisma.configNegocio.findFirst()
      const usuario = await prisma.usuario.findUnique({
        where: { id: session.id },
        select: { metaMensual: true },
      })

      return NextResponse.json({
        ok: true,
        data: {
          clientesHoy: clientesHoy.sort((a, b) => {
            const orden = { CALIENTE: 0, TIBIO: 1, FRIO: 2 }
            return (orden[a.temperatura as keyof typeof orden] ?? 1) - (orden[b.temperatura as keyof typeof orden] ?? 1)
          }),
          citasHoy,
          recordatoriosHoy,
          leadsFrios,
          sinSeguimiento,
          metaMes: usuario?.metaMensual ?? config?.metaMensual ?? 5,
        },
      })
    }

    if (vista === 'recordatorios') {
      const recordatorios = await prisma.recordatorio.findMany({
        where: {
          eliminadoEn: null,
          completado: false,
          OR: [
            { clienteId: { not: null }, cliente: { ...filtroVendedor, eliminadoEn: null } },
            { clienteId: null },
          ],
        },
        include: {
          cliente: { select: { id: true, nombre: true } },
        },
        orderBy: { fechaVencimiento: 'asc' },
      })

      return NextResponse.json({ ok: true, data: recordatorios })
    }

    return NextResponse.json({ ok: false, mensaje: 'Vista no válida' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ ok: false, mensaje: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth('ver_cliente')
    const body = await request.json()
    const datos = RecordatorioSchema.parse(body)

    const recordatorio = await prisma.recordatorio.create({
      data: {
        clienteId: datos.clienteId ?? null,
        texto: datos.texto,
        fechaVencimiento: new Date(datos.fechaVencimiento),
      },
    })

    return NextResponse.json({ ok: true, data: recordatorio }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ ok: false, mensaje: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth('ver_cliente')
    const body = await request.json()
    const { id, completado, posponer } = body

    if (!id) return NextResponse.json({ ok: false, mensaje: 'Falta el ID' }, { status: 400 })

    const datos: Record<string, unknown> = {}
    if (completado !== undefined) datos.completado = completado
    if (posponer) {
      const recordatorio = await prisma.recordatorio.findUnique({ where: { id } })
      if (recordatorio) {
        const nuevaFecha = new Date(recordatorio.fechaVencimiento)
        nuevaFecha.setDate(nuevaFecha.getDate() + 1)
        datos.fechaVencimiento = nuevaFecha
      }
    }

    const actualizado = await prisma.recordatorio.update({ where: { id }, data: datos })
    return NextResponse.json({ ok: true, data: actualizado })
  } catch (error) {
    return NextResponse.json({ ok: false, mensaje: "Error interno" }, { status: 500 })
  }
}
