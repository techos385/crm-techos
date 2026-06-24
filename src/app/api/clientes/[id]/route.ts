// src/app/api/clientes/[id]/route.ts
// GET: expediente | PATCH: actualizar | DELETE: papelera

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, puede, apiError } from '@/lib/permisos'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { registrarAuditoria, ACCIONES } from '@/lib/auditoria'

const ActualizarSchema = z.object({
  nombre: z.string().min(2).max(100).optional(),
  telefono: z.string().optional().nullable(),
  correo: z.string().email().optional().nullable().or(z.literal('')),
  origen: z.string().optional().nullable(),
  etapaEmbudo: z.string().optional(),
  valorEstimado: z.number().min(0).optional().nullable(),
  temperatura: z.enum(['CALIENTE', 'TIBIO', 'FRIO']).optional(),
  objecionPrincipal: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
  proximaAccion: z.string().optional().nullable(),
  proximaAccionFecha: z.string().optional().nullable(),
  vendedorId: z.string().optional().nullable(),
  estadoCartera: z.enum(['ACTIVO', 'GANADO', 'PERDIDO', 'ARCHIVADO']).optional(),
  motivoPerdida: z.string().optional().nullable(),
  empresa: z.string().optional().nullable(),
  responsableProyecto: z.string().optional().nullable(),
  zonaUbicacion: z.string().optional().nullable(),
  tipoObra: z.string().optional().nullable(),
  medidasProyecto: z.string().optional().nullable(),
  tipoCubierta: z.string().optional().nullable(),
  esArcotecho: z.boolean().optional().nullable(),
  esEstructuraMetalica: z.boolean().optional().nullable(),
  presupuestoEstimado: z.number().optional().nullable(),
  montoCotizado: z.number().optional().nullable(),
  etapaProyecto: z.string().optional().nullable(),
  empresaNombre: z.string().optional().nullable(),
  empresaGiro: z.string().optional().nullable(),
  empresaPuesto: z.string().optional().nullable(),
  empresaRfc: z.string().optional().nullable(),
  empresaSitioWeb: z.string().optional().nullable(),
  empresaDireccion: z.string().optional().nullable(),
  empresaTamano: z.string().optional().nullable(),
  empresaNotas: z.string().optional().nullable(),
  ultimoContacto: z.string().optional().nullable(),
})

async function verificarAcceso(id: string, session: { user: { id: string; rol: string } }) {
  const cliente = await prisma.cliente.findFirst({
    where: { id, eliminadoEn: null },
  })
  if (!cliente) return null
  if (session.user.rol !== 'ADMIN' && cliente.vendedorId !== session.user.id) return null
  return cliente
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const cliente = await verificarAcceso(params.id, session)
    if (!cliente) {
      return NextResponse.json({ ok: false, mensaje: 'No encontrado o sin acceso' }, { status: 404 })
    }

    const expediente = await prisma.cliente.findUnique({
      where: { id: params.id },
      include: {
        vendedor: { select: { id: true, nombre: true } },
        notas: {
          where: { eliminadoEn: null },
          include: { autor: { select: { id: true, nombre: true } } },
          orderBy: { creadoEn: 'desc' },
        },
        citas: {
          where: { eliminadoEn: null },
          include: { vendedor: { select: { id: true, nombre: true } } },
          orderBy: { fechaInicio: 'desc' },
        },
        pagos: {
          where: { eliminadoEn: null },
          orderBy: { creadoEn: 'desc' },
        },
        archivos: {
          where: { eliminadoEn: null },
          include: { subidoPor: { select: { id: true, nombre: true } } },
          orderBy: { creadoEn: 'desc' },
        },
        recordatorios: {
          where: { eliminadoEn: null },
          orderBy: { fechaVencimiento: 'asc' },
        },
        etiquetas: {
          include: { etiqueta: true },
        },
        favoritosDe: {
          where: { usuarioId: session.user.id },
          select: { usuarioId: true },
        },
      },
    })

    // Línea de tiempo combinada
    const timeline: Array<{
      tipo: string
      fecha: Date
      descripcion: string
      autor?: string
      datos?: unknown
    }> = []

    expediente?.notas.forEach((n) => {
      timeline.push({
        tipo: 'nota',
        fecha: n.creadoEn,
        descripcion: n.contenido,
        autor: n.autor.nombre,
        datos: n,
      })
    })

    expediente?.citas.forEach((c) => {
      timeline.push({
        tipo: 'cita',
        fecha: c.creadoEn,
        descripcion: `Cita: ${c.titulo}`,
        autor: c.vendedor?.nombre,
        datos: c,
      })
    })

    expediente?.pagos.forEach((p) => {
      timeline.push({
        tipo: 'pago',
        fecha: p.creadoEn,
        descripcion: `Pago: $${p.monto} — ${p.estatus}`,
        datos: p,
      })
    })

    expediente?.archivos.forEach((a) => {
      timeline.push({
        tipo: 'archivo',
        fecha: a.creadoEn,
        descripcion: `Archivo subido: ${a.nombre} (${a.etiqueta})`,
        autor: a.subidoPor.nombre,
        datos: { ...a, datos: undefined }, // No incluir datos binarios
      })
    })

    timeline.sort((a, b) => b.fecha.getTime() - a.fecha.getTime())

    // Totales de pagos
    const totalPagado = expediente?.pagos
      .filter((p) => p.estatus === 'PAGADO')
      .reduce((s, p) => s + Number(p.monto), 0) ?? 0

    const totalPendiente = expediente?.pagos
      .filter((p) => p.estatus === 'PENDIENTE' || p.estatus === 'VENCIDO')
      .reduce((s, p) => s + Number(p.monto), 0) ?? 0

    return NextResponse.json({
      ok: true,
      data: {
        ...expediente,
        archivos: expediente?.archivos.map((a) => ({
          ...a,
          datos: undefined, // No enviar binario en la lista
          tieneArchivo: !!a.datos,
        })),
        esFavorito: (expediente?.favoritosDe.length ?? 0) > 0,
        timeline,
        resumenPagos: {
          totalPagado,
          totalPendiente,
          totalValor: expediente?.valorEstimado ?? 0,
        },
      },
    })
  } catch (error) {
    return apiError(error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const clienteActual = await verificarAcceso(params.id, session)
    if (!clienteActual) {
      return NextResponse.json({ ok: false, mensaje: 'No encontrado o sin acceso' }, { status: 404 })
    }

    const body = await request.json()
    const datos = ActualizarSchema.parse(body)

    // Solo admin puede reasignar vendedor
    if (datos.vendedorId && session.user.rol !== 'ADMIN') {
      delete datos.vendedorId
    }

    const camposActualizar: Record<string, unknown> = { ...datos }

    // Manejar fechas
    if (datos.proximaAccionFecha !== undefined) {
      camposActualizar.proximaAccionFecha = datos.proximaAccionFecha
        ? new Date(datos.proximaAccionFecha)
        : null
    }
    if (datos.ultimoContacto !== undefined) {
      camposActualizar.ultimoContacto = datos.ultimoContacto
        ? new Date(datos.ultimoContacto)
        : null
    }

    // Manejar cambio de estado
    if (datos.estadoCartera === 'GANADO' && clienteActual.estadoCartera !== 'GANADO') {
      camposActualizar.ganandoEn = new Date()
    }
    if (datos.estadoCartera === 'PERDIDO' && clienteActual.estadoCartera !== 'PERDIDO') {
      camposActualizar.perdiendoEn = new Date()
    }

    const cliente = await prisma.$transaction(async (tx) => {
      const actualizado = await tx.cliente.update({
        where: { id: params.id },
        data: camposActualizar,
      })

      // Registrar cambio de etapa en notas
      if (datos.etapaEmbudo && datos.etapaEmbudo !== clienteActual.etapaEmbudo) {
        await tx.nota.create({
          data: {
            clienteId: params.id,
            autorId: session.user.id,
            contenido: `Etapa cambiada: ${clienteActual.etapaEmbudo} → ${datos.etapaEmbudo}`,
            tipo: 'cambio_etapa',
          },
        })
      }

      if (datos.estadoCartera && datos.estadoCartera !== clienteActual.estadoCartera) {
        await tx.nota.create({
          data: {
            clienteId: params.id,
            autorId: session.user.id,
            contenido: `Estado cambiado a: ${datos.estadoCartera}${datos.motivoPerdida ? ` — Motivo: ${datos.motivoPerdida}` : ''}`,
            tipo: 'cambio_estado',
          },
        })
      }

      await registrarAuditoria(tx, {
        usuarioId: session.user.id,
        accion: ACCIONES.EDITAR,
        entidad: 'Cliente',
        entidadId: params.id,
        descripcion: `Editó al cliente ${actualizado.nombre}`,
      })

      return actualizado
    })

    return NextResponse.json({ ok: true, data: cliente })
  } catch (error) {
    return apiError(error)
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const clienteActual = await verificarAcceso(params.id, session)
    if (!clienteActual) {
      return NextResponse.json({ ok: false, mensaje: 'No encontrado o sin acceso' }, { status: 404 })
    }

    // Soft delete
    await prisma.$transaction(async (tx) => {
      await tx.cliente.update({
        where: { id: params.id },
        data: { eliminadoEn: new Date() },
      })

      await registrarAuditoria(tx, {
        usuarioId: session.user.id,
        accion: ACCIONES.BORRAR,
        entidad: 'Cliente',
        entidadId: params.id,
        descripcion: `Movió a papelera al cliente ${clienteActual.nombre}`,
      })
    })

    return NextResponse.json({ ok: true, mensaje: 'Cliente movido a la papelera' })
  } catch (error) {
    return apiError(error)
  }
}
