import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/permisos'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth('ver_equipo')
    const { searchParams } = new URL(request.url)
    if (searchParams.get('bitacora')) {
      const logs = await prisma.registroAuditoria.findMany({ include: { usuario: { select: { nombre: true } } }, orderBy: { creadoEn: 'desc' }, take: 100 })
      return NextResponse.json({ ok: true, data: logs })
    }
    const usuarios = await prisma.usuario.findMany({ orderBy: { creadoEn: 'asc' }, select: { id: true, nombre: true, correo: true, rol: true, activo: true, creadoEn: true } })
    return NextResponse.json({ ok: true, data: usuarios })
  } catch { return NextResponse.json({ ok: false, mensaje: 'Error interno' }, { status: 500 }) }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth('gestionar_usuarios')
    const { nombre, correo, password, rol } = await request.json()
    if (!nombre || !correo || !password) return NextResponse.json({ ok: false, mensaje: 'Faltan campos' }, { status: 400 })
    const hash = await bcrypt.hash(password, 12)
    const usuario = await prisma.usuario.create({ data: { nombre, correo, contrasenaHash: hash, rol } })
    return NextResponse.json({ ok: true, data: usuario }, { status: 201 })
  } catch { return NextResponse.json({ ok: false, mensaje: 'Error interno' }, { status: 500 }) }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAuth('gestionar_usuarios')
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ ok: false, mensaje: 'id requerido' }, { status: 400 })
    const body = await request.json()
    const usuario = await prisma.usuario.update({ where: { id }, data: body })
    return NextResponse.json({ ok: true, data: usuario })
  } catch { return NextResponse.json({ ok: false, mensaje: 'Error interno' }, { status: 500 }) }
}
