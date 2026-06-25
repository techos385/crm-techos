import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/permisos'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const session = await requireAuth('ver_cliente')
    await prisma.usuario.update({
      where: { id: session.id },
      data: { onboardingCompletado: true },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, mensaje: 'Error interno' }, { status: 500 })
  }
}

export async function PATCH() {
  try {
    const session = await requireAuth('ver_cliente')
    await prisma.usuario.update({
      where: { id: session.id },
      data: { onboardingCompletado: true },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, mensaje: 'Error interno' }, { status: 500 })
  }
}