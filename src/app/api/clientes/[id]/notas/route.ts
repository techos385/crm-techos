import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/permisos'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const NotaSchema = z.object({ contenido: z.string().min(1) })

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth('ver_cliente')
    const body = await request.json()
    const datos = NotaSchema.parse(body)
    const nota = await prisma.nota.create({
      data: { contenido: datos.contenido, clienteId: params.id, autorId: session.id },
    })
    return NextResponse.json({ ok: true, data: nota }, { status: 201 })
  } catch {
    return NextResponse.json({ ok: false, mensaje: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth('ver_cliente')
    const { searchParams } = new URL(request.url)
    const notaId = searchParams.get('notaId')
    if (!notaId) return NextResponse.json({ ok: false, mensaje: 'notaId requerido' }, { status: 400 })
    await prisma.nota.update({ where: { id: notaId }, data: { eliminadoEn: new Date() } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, mensaje: 'Error interno' }, { status: 500 })
  }
}
