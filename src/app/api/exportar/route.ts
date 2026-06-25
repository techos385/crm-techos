// src/app/api/exportar/route.ts
// ExportaciÃ³n y respaldo â€” solo admin

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, apiError } from '@/lib/permisos'
import { prisma } from '@/lib/prisma'
import { registrarAuditoria, ACCIONES } from '@/lib/auditoria'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth('ver_cliente')
    if (session.rol !== 'ADMIN') {
      return NextResponse.json({ ok: false, mensaje: 'Solo administradores pueden exportar' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') ?? 'json' // json | csv_clientes | csv_pagos | csv_citas
    const filtroVendedorId = searchParams.get('vendedorId')

    const filtroBase: Record<string, unknown> = { eliminadoEn: null }
    if (filtroVendedorId) filtroBase.vendedorId = filtroVendedorId

    await registrarAuditoria({
      usuarioId: session.id,
      accion: ACCIONES.EXPORTAR,
      entidad: 'Sistema',
      entidadId: 'exportacion',
      descripcion: `ExportÃ³ datos en formato ${tipo}`,
    })

    if (tipo === 'json') {
      // Respaldo completo en JSON
      const [clientes, citas, pagos, notas, etiquetas, plantillas] = await Promise.all([
        prisma.cliente.findMany({
          where: filtroBase,
          include: {
            etiquetas: { include: { etiqueta: true } },
          },
        }),
        prisma.cita.findMany({ where: filtroBase }),
        prisma.pago.findMany({ where: filtroBase }),
        prisma.nota.findMany({ where: { eliminadoEn: null } }),
        prisma.etiqueta.findMany({ where: { eliminadoEn: null } }),
        prisma.plantilla.findMany({ where: { eliminadoEn: null } }),
      ])

      const usuarios = await prisma.usuario.findMany({
        where: { eliminadoEn: null },
        select: {
          id: true, nombre: true, correo: true, rol: true, activo: true,
          metaMensual: true, comision: true, slugAgenda: true, creadoEn: true,
          // NUNCA incluir contrasena
        },
      })

      const respaldo = {
        version: '1.0',
        fecha: new Date().toISOString(),
        negocio: 'Techos y Cubiertas',
        usuarios,
        clientes: clientes.map((c) => ({ ...c, archivos: undefined })), // Sin binarios
        citas,
        pagos,
        notas,
        etiquetas,
        plantillas,
      }

      return new NextResponse(JSON.stringify(respaldo, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="respaldo-techos-${new Date().toISOString().slice(0, 10)}.json"`,
        },
      })
    }

    if (tipo === 'csv_clientes') {
      const clientes = await prisma.cliente.findMany({
        where: filtroBase,
        include: { vendedor: { select: { nombre: true } } },
        orderBy: { creadoEn: 'desc' },
      })

      const encabezados = ['Nombre', 'TelÃ©fono', 'Correo', 'Empresa', 'Origen', 'Etapa', 'Estado', 'Temperatura', 'Valor Estimado', 'ObjeciÃ³n', 'Vendedor', 'PrÃ³xima AcciÃ³n', 'Fecha CreaciÃ³n']
      const filas = clientes.map((c) => [
        c.nombre,
        c.telefono ?? '',
        c.correo ?? '',
        c.empresa ?? c.empresaNombre ?? '',
        c.origen ?? '',
        c.etapa ?? '',
        c.estadoCartera,
        c.temperatura,
        c.valorEstimado ?? '',
        c.objecionPrincipal ?? '',
        c.vendedor?.nombre ?? '',
        c.proximaAccion ?? '',
        c.creadoEn.toLocaleDateString('es-MX'),
      ])

      const csv = [encabezados, ...filas]
        .map((fila) => fila.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
        .join('\n')

      return new NextResponse('\uFEFF' + csv, { // BOM para Excel
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="clientes-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      })
    }

    if (tipo === 'csv_pagos') {
      const pagos = await prisma.pago.findMany({
        where: filtroBase,
        include: {
          cliente: { select: { nombre: true } },
        },
        orderBy: { creadoEn: 'desc' },
      })

      const encabezados = ['Cliente', 'Monto', 'MÃ©todo', 'Estatus', 'Concepto', 'Fecha Pago', 'Fecha Vencimiento', 'Fecha Registro']
      const filas = pagos.map((p) => [
        p.cliente.nombre,
        p.monto,
        p.metodo,
        p.estatus,
        p.concepto ?? '',
        p.fechaPago ? new Date(p.fechaPago).toLocaleDateString('es-MX') : '',
        p.fechaVencimiento ? new Date(p.fechaVencimiento).toLocaleDateString('es-MX') : '',
        p.creadoEn.toLocaleDateString('es-MX'),
      ])

      const csv = [encabezados, ...filas]
        .map((fila) => fila.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
        .join('\n')

      return new NextResponse('\uFEFF' + csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="pagos-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      })
    }

    return NextResponse.json({ ok: false, mensaje: 'Tipo de exportaciÃ³n no vÃ¡lido' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ ok: false, mensaje: "Error interno" }, { status: 500 })
  }
}
