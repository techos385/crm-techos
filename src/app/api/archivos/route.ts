// src/app/api/archivos/route.ts
// Subida y descarga de archivos â€” guardados en base de datos

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, apiError } from '@/lib/permisos'
import { prisma } from '@/lib/prisma'
import { registrarAuditoria, ACCIONES } from '@/lib/auditoria'

const TIPOS_PERMITIDOS = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/jpg']
const TAMANO_MAXIMO = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth('ver_cliente')
    const formData = await request.formData()

    const archivo = formData.get('archivo') as File | null
    const clienteId = formData.get('clienteId') as string | null
    const etiqueta = formData.get('etiqueta') as string | null

    if (!archivo || !clienteId) {
      return NextResponse.json({ ok: false, mensaje: 'Falta el archivo o el cliente' }, { status: 400 })
    }

    // Validar tipo
    if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
      return NextResponse.json({
        ok: false,
        mensaje: 'Solo se permiten archivos PDF, JPG, PNG o WebP',
      }, { status: 400 })
    }

    // Validar tamaÃ±o
    if (archivo.size > TAMANO_MAXIMO) {
      return NextResponse.json({
        ok: false,
        mensaje: `El archivo es muy grande. MÃ¡ximo ${TAMANO_MAXIMO / 1024 / 1024}MB`,
      }, { status: 400 })
    }

    // Verificar acceso al cliente
    const cliente = await prisma.cliente.findFirst({
      where: { id: clienteId, eliminadoEn: null },
    })
    if (!cliente) {
      return NextResponse.json({ ok: false, mensaje: 'Cliente no encontrado' }, { status: 404 })
    }
    if (session.rol !== 'ADMIN' && cliente.vendedorId !== session.id) {
      return NextResponse.json({ ok: false, mensaje: 'Sin acceso' }, { status: 403 })
    }

    // Convertir a Buffer
    const buffer = Buffer.from(await archivo.arrayBuffer())

    const archivoGuardado = await prisma.$transaction(async (tx) => {
      const nuevo = await tx.archivo.create({
        data: {
          clienteId,
          subidoPorId: session.id,
          nombre: archivo.name,
          tipo: archivo.type,
          tamano: archivo.size,
          etiqueta: (etiqueta ?? 'Otro') as any,
          datos: buffer,
        },
      })

      

      return nuevo
    })

    return NextResponse.json({
      ok: true,
      data: {
        id: archivoGuardado.id,
        nombre: archivoGuardado.nombre,
        tipo: archivoGuardado.tipo,
        tamano: archivoGuardado.tamano,
        etiqueta: archivoGuardado.etiqueta,
        creadoEn: archivoGuardado.creadoEn,
      },
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ ok: false, mensaje: String(error) }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth('ver_cliente')
    const { searchParams } = new URL(request.url)
    const archivoId = searchParams.get('id')

    if (!archivoId) {
      return NextResponse.json({ ok: false, mensaje: 'Falta el ID del archivo' }, { status: 400 })
    }

    const archivo = await prisma.archivo.findFirst({
      where: { id: archivoId, eliminadoEn: null },
      include: { cliente: { select: { vendedorId: true } } },
    })

    if (!archivo) {
      return NextResponse.json({ ok: false, mensaje: 'Archivo no encontrado' }, { status: 404 })
    }

    // Verificar acceso
    if (session.rol !== 'ADMIN' && archivo.cliente.vendedorId !== session.id) {
      return NextResponse.json({ ok: false, mensaje: 'Sin acceso' }, { status: 403 })
    }

    if (!archivo.datos) {
      return NextResponse.json({ ok: false, mensaje: 'Archivo sin datos' }, { status: 404 })
    }

    return new NextResponse(archivo.datos as unknown as BodyInit, {
      headers: {
        'Content-Type': archivo.tipo,
        'Content-Disposition': `attachment; filename="${archivo.nombre}"`,
        'Content-Length': archivo.tamano.toString(),
      },
    })
  } catch (error) {
    return NextResponse.json({ ok: false, mensaje: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth('ver_cliente')
    const { searchParams } = new URL(request.url)
    const archivoId = searchParams.get('id')

    if (!archivoId) {
      return NextResponse.json({ ok: false, mensaje: 'Falta el ID' }, { status: 400 })
    }

    const archivo = await prisma.archivo.findFirst({
      where: { id: archivoId, eliminadoEn: null },
      include: { cliente: { select: { vendedorId: true } } },
    })

    if (!archivo) {
      return NextResponse.json({ ok: false, mensaje: 'No encontrado' }, { status: 404 })
    }

    if (session.rol !== 'ADMIN' && archivo.cliente.vendedorId !== session.id) {
      return NextResponse.json({ ok: false, mensaje: 'Sin acceso' }, { status: 403 })
    }

    await prisma.archivo.update({ where: { id: archivoId }, data: { eliminadoEn: new Date() } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ ok: false, mensaje: String(error) }, { status: 500 })
  }
}
