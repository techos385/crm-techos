// src/app/api/usuarios/onboarding/route.ts
import { NextResponse } from 'next/server'
import { requireAuth, apiError } from '@/lib/permisos'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const session = await requireAuth()
    await prisma.usuario.update({
      where: { id: session.id },
      data: { onboardingCompletado: true },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ ok: false, mensaje: "Error interno" }, { status: 500 })
  }
}
