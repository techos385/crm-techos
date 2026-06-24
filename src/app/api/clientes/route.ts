// src/app/api/clientes/route.ts
// GET: lista con filtros/paginación | POST: crear cliente

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, puede, apiError } from '@/lib/permisos'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { registrarAuditoria, ACCIONES } from '@/lib/auditoria'

// Schema de validación para crear cliente
const ClienteSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  telefono: z.string().min(8).max(20).optional().nullable(),
  correo: z.string().email('Correo inválido').optional().nullable().or(z.literal('')),
  origen: z.string().optional().nullable(),
  etapaEmbudo: z.string().default('Nuevo Prospecto'),
  valorEstimado: z.number().min(0).optional().nullable(),
  temperatura: z.enum(['CALIENTE', 'TIBIO', 'FRIO']).default('TIBIO'),
  objecionPrincipal: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
  proximaAccion: z.string().optional().nullable(),
  proximaAccionFecha: z.string().optional().nullable(),
  vendedorId: z.string().optional().nullable(),
  // Campos extra del negocio
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
  // Bloque empresa
  empresaNombre: z.string().optional().nullable(),
  empresaGiro: z.string().optional().nullable(),
  empresaPuesto: z.string().optional().nullable(),
  empresaRfc: z.string().optional().nullable(),
  empresaSitioWeb: z.string().optional().nullable(),
  empresaDireccion: z.string().optional().nullable(),
  empresaTamano: z.string().optional().nullable(),
  empresaNotas: z.string().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const esAdmin = session.user.rol === 'ADMIN'
    const { searchParams } = new URL(request.url)

    const pagina = parseInt(searchParams.get('pagina') ?? '1')
    const porPagina = parseInt(searchParams.get('porPagina') ?? '25')
    const buscar = searchParams.get('buscar') ?? ''
    const etapa = searchParams.get('etapa')
    const temperatura = searchParams.get('temperatura')
    const estado = searchParams.get('estado')
    const origen = searchParams.get('origen')
    const vendedorId = searchParams.get('vendedorId')
    const etiqueta = searchParams.get('etiqueta')
    const conAccionVencida = searchParams.get('conAccionVencida') === 'true'
    const ordenar = searchParams.get('ordenar') ?? 'reciente'
    const favoritos = searchParams.get('favoritos') === 'true'

    // Filtro base: excluye eliminados y respeta rol
    const filtroBase: Record<string, unknown> = {
      eliminadoEn: null,
    }

    // Si no es admin, solo ve sus propios clientes
    if (!esAdmin) {
      filtroBase.vendedorId = session.user.id
    } else if (vendedorId) {
      filtroBase.vendedorId = vendedorId
    }

    if (etapa) filtroBase.etapaEmbudo = etapa
    if (temperatura) filtroBase.temperatura = temperatura
    if (estado) filtroBase.estadoCartera = estado
    if (origen) filtroBase.origen = origen

    if (conAccionVencida) {
      filtroBase.proximaAccionFecha = { lt: new Date() }
    }

    if (buscar) {
      filtroBase.OR = [
        { nombre: { contains: buscar, mode: 'insensitive' } },
        { telefono: { contains: buscar } },
        { correo: { contains: buscar, mode: 'insensitive' } },
        { empresa: { contains: buscar, mode: 'insensitive' } },
        { empresaNombre: { contains: buscar, mode: 'insensitive' } },
      ]
    }

    if (etiqueta) {
      filtroBase.etiquetas = {
        some: { etiquetaId: etiqueta },
      }
    }

    // Filtro de favoritos
    const incluyeFavoritos = favoritos ? {
      favoritosDe: {
        some: { usuarioId: session.user.id },
      },
    } : {}

    const where = { ...filtroBase, ...incluyeFavoritos }

    // Orden
    const orderBy: Record<string, string> = {}
    switch (ordenar) {
      case 'nombre': orderBy.nombre = 'asc'; break
      case 'valor': orderBy.valorEstimado = 'desc'; break
      case 'proxima': orderBy.proximaAccionFecha = 'asc'; break
      default: orderBy.creadoEn = 'desc'
    }

    const [total, clientes] = await Promise.all([
      prisma.cliente.count({ where }),
      prisma.cliente.findMany({
        where,
        orderBy,
        skip: (pagina - 1) * porPagina,
        take: porPagina,
        include: {
          vendedor: { select: { id: true, nombre: true } },
          etiquetas: {
            include: { etiqueta: true },
          },
          favoritosDe: {
            where: { usuarioId: session.user.id },
            select: { usuarioId: true },
          },
          _count: {
            select: { pagos: true, citas: true, archivos: true },
          },
        },
      }),
    ])

    return NextResponse.json({
      ok: true,
      data: {
        clientes: clientes.map((c) => ({
          ...c,
          esFavorito: c.favoritosDe.length > 0,
        })),
        total,
        pagina,
        porPagina,
        totalPaginas: Math.ceil(total / porPagina),
      },
    })
  } catch (error) {
    return apiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const datos = ClienteSchema.parse(body)

    // Verificar duplicados
    if (datos.telefono || datos.correo) {
      const existente = await prisma.cliente.findFirst({
        where: {
          eliminadoEn: null,
          OR: [
            datos.telefono ? { telefono: datos.telefono } : {},
            datos.correo ? { correo: datos.correo } : {},
          ].filter((o) => Object.keys(o).length > 0),
        },
        select: { id: true, nombre: true },
      })
      if (existente) {
        return NextResponse.json({
          ok: false,
          duplicado: true,
          clienteExistente: existente,
          mensaje: `Ya existe un cliente con ese teléfono o correo: ${existente.nombre}`,
        }, { status: 409 })
      }
    }

    // Asignar vendedor
    const vendedorId = session.user.rol === 'ADMIN' && datos.vendedorId
      ? datos.vendedorId
      : session.user.id

    const cliente = await prisma.$transaction(async (tx) => {
      const nuevo = await tx.cliente.create({
        data: {
          nombre: datos.nombre,
          telefono: datos.telefono,
          correo: datos.correo || null,
          origen: datos.origen,
          etapaEmbudo: datos.etapaEmbudo,
          valorEstimado: datos.valorEstimado,
          temperatura: datos.temperatura as 'CALIENTE' | 'TIBIO' | 'FRIO',
          objecionPrincipal: datos.objecionPrincipal,
          notas: datos.notas,
          proximaAccion: datos.proximaAccion,
          proximaAccionFecha: datos.proximaAccionFecha ? new Date(datos.proximaAccionFecha) : null,
          vendedorId,
          empresa: datos.empresa,
          responsableProyecto: datos.responsableProyecto,
          zonaUbicacion: datos.zonaUbicacion,
          tipoObra: datos.tipoObra,
          medidasProyecto: datos.medidasProyecto,
          tipoCubierta: datos.tipoCubierta,
          esArcotecho: datos.esArcotecho ?? false,
          esEstructuraMetalica: datos.esEstructuraMetalica ?? false,
          presupuestoEstimado: datos.presupuestoEstimado,
          montoCotizado: datos.montoCotizado,
          etapaProyecto: datos.etapaProyecto,
          empresaNombre: datos.empresaNombre,
          empresaGiro: datos.empresaGiro,
          empresaPuesto: datos.empresaPuesto,
          empresaRfc: datos.empresaRfc,
          empresaSitioWeb: datos.empresaSitioWeb,
          empresaDireccion: datos.empresaDireccion,
          empresaTamano: datos.empresaTamano,
          empresaNotas: datos.empresaNotas,
          estadoCartera: 'ACTIVO',
        },
      })

      // Nota inicial
      if (datos.notas) {
        await tx.nota.create({
          data: {
            clienteId: nuevo.id,
            autorId: session.user.id,
            contenido: `Nota inicial: ${datos.notas}`,
          },
        })
      }

      await registrarAuditoria(tx, {
        usuarioId: session.user.id,
        accion: ACCIONES.CREAR,
        entidad: 'Cliente',
        entidadId: nuevo.id,
        descripcion: `Creó al cliente ${nuevo.nombre}`,
      })

      return nuevo
    })

    return NextResponse.json({ ok: true, data: cliente }, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}
